"use server";

// SERVER ACTIONS — create / update / delete products.
//
// Security model:
//   • EVERY action verifies the caller is an admin server-side (getAdminUser)
//     before touching the database. The UI never decides authorization.
//   • Writes use the service-role server client (server-only; the secret key is
//     never shipped to the browser).
//   • All input is re-validated with the same zod schema the form uses — the
//     client is never trusted.
//   • After a successful write we revalidate the storefront so changes appear on
//     the live site (which is otherwise statically cached).

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/admin";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/lib/sanitize";
import { adminProductSchema, type AdminProductInput } from "@/lib/validation";
import type { ProductInsert, ProductUpdate } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import {
  PRODUCT_IMAGES_BUCKET,
  productImagePaths,
  productImagePathFromUrl,
  isProductImageUrl,
} from "@/lib/storage/product-images";

export type ProductActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type DB = SupabaseClient<Database>;

/** Turn a product name into a URL-safe slug base. */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "product"
  );
}

/** Ensure the slug is unique, appending -2, -3, … if needed (excluding self). */
async function uniqueSlug(
  supabase: DB,
  base: string,
  excludeId?: string,
): Promise<string> {
  const { data } = await supabase
    .from("products")
    .select("*")
    .ilike("slug", `${base}%`);

  const taken = new Set(
    (data ?? []).filter((r) => r.id !== excludeId).map((r) => r.slug),
  );

  if (!taken.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}

/** Map validated form input → DB column values (shared by create + update). */
function buildDbFields(data: AdminProductInput) {
  // Images arrive as already-validated safe URLs (zod re-checked above). The
  // thumbnail must be one of them; fall back to the first image (or "" → the
  // storefront then shows its neutral placeholder).
  const images = data.images;
  const thumbnail = images.includes(data.thumbnail)
    ? data.thumbnail
    : (images[0] ?? "");

  // A variant's optional image is only kept if it still points at one of this
  // product's images (defends against a stale reference after an image removal).
  const keepImage = (url?: string) =>
    url && images.includes(url) ? { image: url } : {};

  const variants = [
    ...data.colors.map((v) => ({
      type: "color" as const,
      value: sanitizeText(v.value),
      colorHex: v.colorHex,
      ...keepImage(v.image),
    })),
    ...data.models.map((v) => ({
      type: "model" as const,
      value: sanitizeText(v.value),
      ...keepImage(v.image),
    })),
    ...data.sizes.map((v) => ({
      type: "size" as const,
      value: sanitizeText(v.value),
    })),
  ];

  return {
    name: sanitizeText(data.name),
    description: sanitizeText(data.description),
    category_id: data.categoryId,
    subcategory: data.subcategory ? sanitizeText(data.subcategory) : null,
    price_usd: Number(data.priceUSD),
    original_price_usd: data.originalPriceUSD === "" ? null : Number(data.originalPriceUSD),
    sku: sanitizeText(data.sku),
    in_stock: data.inStock,
    badge: data.badge === "" ? null : data.badge,
    hide_new_badge: data.hideNewBadge,
    variants,
    images,
    thumbnail,
  };
}

/**
 * Best-effort deletion of storage objects for the given public URLs, so removed
 * / orphaned images don't pile up in the bucket. Only files in OUR bucket are
 * touched (productImagePaths drops anything else, e.g. seeded picsum URLs).
 * Uses the service-role client and never throws — cleanup must not fail a write.
 */
async function deleteStorageImages(supabase: DB, urls: string[]): Promise<void> {
  const paths = productImagePaths(urls);
  if (paths.length === 0) return;
  try {
    const { error } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .remove(paths);
    if (error) console.error("[deleteStorageImages]", error.message);
  } catch (err) {
    console.error("[deleteStorageImages] unexpected", err);
  }
}

/**
 * Copy any bucket images that are ALREADY referenced by another product to
 * fresh storage objects, returning an old-URL → new-URL remap. Used on create
 * so a duplicated product gets its OWN image files — deleting the source
 * product later (which runs orphan cleanup) can never break this product's
 * images. Freshly-uploaded images (unique to this new product) match nothing
 * and are left untouched, so a normal "Add product" copies nothing.
 * Best-effort: on a copy failure we keep the original URL (still works, just
 * shared) rather than failing the whole create.
 */
async function copySharedImages(
  supabase: DB,
  images: string[],
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();
  const bucketUrls = images.filter((u) => isProductImageUrl(u));
  if (bucketUrls.length === 0) return remap;

  // Which of these URLs does some existing product already use?
  const { data: rows, error } = await supabase
    .from("products")
    .select("images")
    .overlaps("images", bucketUrls);
  if (error) {
    console.error("[copySharedImages] lookup", error.message);
    return remap;
  }

  const shared = new Set<string>();
  for (const r of rows ?? []) {
    for (const u of r.images ?? []) if (bucketUrls.includes(u)) shared.add(u);
  }

  for (const url of shared) {
    const fromPath = productImagePathFromUrl(url);
    if (!fromPath) continue;
    const ext = fromPath.split(".").pop() || "webp";
    const toPath = `${crypto.randomUUID()}.${ext}`;
    const { error: copyErr } = await supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .copy(fromPath, toPath);
    if (copyErr) {
      console.error("[copySharedImages] copy", copyErr.message);
      continue; // keep the original URL
    }
    const { data: pub } = supabase.storage
      .from(PRODUCT_IMAGES_BUCKET)
      .getPublicUrl(toPath);
    if (pub?.publicUrl) remap.set(url, pub.publicUrl);
  }
  return remap;
}

/** Apply an image-URL remap across all places a product stores image URLs. */
function applyImageRemap(
  data: AdminProductInput,
  remap: Map<string, string>,
): AdminProductInput {
  const map = (u?: string) => (u ? (remap.get(u) ?? u) : u);
  return {
    ...data,
    images: data.images.map((u) => map(u) as string),
    thumbnail: map(data.thumbnail) ?? "",
    colors: data.colors.map((c) => ({ ...c, image: map(c.image) })),
    models: data.models.map((m) => ({ ...m, image: map(m.image) })),
  };
}

/** Revalidate everything under the root layout so the storefront reflects the change. */
function revalidateStorefront() {
  revalidatePath("/", "layout");
}

export async function createProduct(
  input: AdminProductInput,
): Promise<ProductActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }

  const supabase = createServerClient();

  // If any images are already used by another product (i.e. this is a
  // duplicate), copy them to fresh storage objects and remap. Normal creates
  // (freshly-uploaded, unique images) copy nothing.
  const remap = await copySharedImages(supabase, parsed.data.images);
  const data = remap.size > 0 ? applyImageRemap(parsed.data, remap) : parsed.data;

  const slug = await uniqueSlug(supabase, slugify(data.name));

  // images + thumbnail come from buildDbFields (uploaded via Storage; empty is
  // fine — the storefront shows a neutral placeholder).
  const insert: ProductInsert = {
    ...buildDbFields(data),
    slug,
    is_featured: false,
    is_best_seller: false,
    stock_count: null,
    tags: [],
    // created_at defaults to now() in the DB, so New Arrivals + the NEW badge work.
  };

  const { data: row, error } = await supabase
    .from("products")
    .insert(insert)
    .select("*")
    .single();

  if (error || !row) {
    console.error("[createProduct]", error?.message);
    return { ok: false, error: "Could not create the product. Please try again." };
  }

  revalidateStorefront();
  return { ok: true, id: row.id };
}

export async function updateProduct(
  id: string,
  input: AdminProductInput,
): Promise<ProductActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  if (!id) return { ok: false, error: "Missing product id." };

  const parsed = adminProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Please check the form and try again." };
  }
  const data = parsed.data;

  const supabase = createServerClient();

  // The form now manages all three known variant types (color/model/size).
  // Preserve only any *unknown* future types so an edit never silently drops them.
  const KNOWN_VARIANT_TYPES = ["color", "model", "size"];
  const { data: existing } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const otherVariants = (existing?.variants ?? []).filter(
    (v) => !KNOWN_VARIANT_TYPES.includes(v.type),
  );

  const fields = buildDbFields(data);

  // Slug is intentionally left untouched on edit so existing links/SEO stay
  // stable. images/thumbnail ARE updated from the form (managed by the uploader).
  const update: ProductUpdate = {
    ...fields,
    variants: [...otherVariants, ...fields.variants],
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("products").update(update).eq("id", id);

  if (error) {
    console.error("[updateProduct]", error.message);
    return { ok: false, error: "Could not save changes. Please try again." };
  }

  // Orphan cleanup: delete bucket files the product no longer references.
  const previousImages = existing?.images ?? [];
  const removed = previousImages.filter((url) => !fields.images.includes(url));
  if (removed.length > 0) await deleteStorageImages(supabase, removed);

  revalidateStorefront();
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ProductActionResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  if (!id) return { ok: false, error: "Missing product id." };

  const supabase = createServerClient();

  // Grab the image URLs first so we can clean up storage after the row is gone.
  const { data: existing } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    console.error("[deleteProduct]", error.message);
    return { ok: false, error: "Could not delete the product. Please try again." };
  }

  // Orphan cleanup: remove this product's images from the bucket (best-effort).
  if (existing?.images?.length) {
    await deleteStorageImages(supabase, existing.images);
  }

  revalidateStorefront();
  return { ok: true, id };
}
