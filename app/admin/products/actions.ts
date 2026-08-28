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

import { z } from "zod";
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

/**
 * Parse the comma-separated "Search keywords" field into a clean tag list:
 * trimmed, de-duplicated (case-insensitive), empties dropped, and capped. Stored
 * in products.tags, which the site search (Fuse.js) already indexes.
 */
function parseKeywords(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const k = part.trim().slice(0, 50);
    if (!k) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= 40) break;
  }
  return out;
}

/** Round a money value to exactly 2 decimals (Math.round — no truncation). */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

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
    // Primary + any additional categories, de-duplicated (primary always first).
    category_ids: [...new Set([data.categoryId, ...data.extraCategoryIds])],
    subcategory: data.subcategory ? sanitizeText(data.subcategory) : null,
    // Round cleanly to 2 decimals (Math.round, never floor) so a typed "10"
    // stores as 10.00 and no floating-point drift can sneak in.
    price_usd: round2(Number(data.priceUSD)),
    original_price_usd:
      data.originalPriceUSD === "" ? null : round2(Number(data.originalPriceUSD)),
    sku: sanitizeText(data.sku),
    in_stock: data.inStock,
    badge: data.badge === "" ? null : data.badge,
    hide_new_badge: data.hideNewBadge,
    variants,
    images,
    thumbnail,
    // Manual search keywords → tags column (indexed by the site search).
    tags: parseKeywords(data.searchKeywords),
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
    // tags come from buildDbFields (parsed search keywords).
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

// ── Bulk delete (products list) ──────────────────────────────────────────────
// Mirrors the orders bulk delete + single deleteProduct's image cleanup.

export type ProductBulkResult =
  | { ok: true; count: number }
  | { ok: false; error: string };

const MAX_BULK = 500;

/** Validate + de-duplicate the selected id list. */
function cleanIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id === "string" && id) out.add(id);
    if (out.size >= MAX_BULK) break;
  }
  return [...out];
}

/** Permanently delete many products at once (admin-verified, service-role). */
export async function bulkDeleteProducts(
  ids: string[],
): Promise<ProductBulkResult> {
  const admin = await getAdminUser();
  if (!admin) return { ok: false, error: "You are not authorized to do that." };

  const list = cleanIds(ids);
  if (list.length === 0) return { ok: false, error: "No products selected." };

  const supabase = createServerClient();

  // Grab image URLs first so we can clean up storage after the rows are gone.
  const { data: rows, error: readErr } = await supabase
    .from("products")
    .select("images")
    .in("id", list);
  if (readErr) {
    console.error("[bulkDeleteProducts] read", readErr.message);
    return {
      ok: false,
      error: "Could not delete the selected products. Please try again.",
    };
  }

  const { error } = await supabase.from("products").delete().in("id", list);
  if (error) {
    console.error("[bulkDeleteProducts]", error.message);
    return {
      ok: false,
      error: "Could not delete the selected products. Please try again.",
    };
  }

  // Orphan cleanup: remove the deleted products' images from the bucket
  // (best-effort, same as single delete).
  const allImages = (rows ?? []).flatMap((r) => r.images ?? []);
  if (allImages.length > 0) await deleteStorageImages(supabase, allImages);

  revalidateStorefront();
  return { ok: true, count: list.length };
}

// ── AI keyword suggestions (Groq) ────────────────────────────────────────────
// Optional helper for the product form's "Search keywords" field. Sends only the
// product NAME + DESCRIPTION (no image, nothing sensitive) to Groq's
// OpenAI-compatible chat API and parses back a short list of lowercase search
// keywords. Admin-only, zod-validated, fails soft (the manual field always works).

// Groq retires model names regularly — the previous model here
// ("llama-3.1-8b-instant") was removed from their catalog and every call started
// returning HTTP 404 `model_not_found`, which is what silently broke this button.
//
// If it breaks again with the "no longer available" message below, list the
// current models with:
//   curl https://api.groq.com/openai/v1/models -H "Authorization: Bearer $GROQ_API_KEY"
// and put a current chat model here.
const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// Groq's current chat models are REASONING models: they spend tokens thinking
// before answering. Two consequences we have to design around —
//  1. The token cap must cover the reasoning too. The old 120-token budget got
//     eaten by reasoning and came back with `finish_reason: "length"` and an
//     EMPTY answer, so a bare model swap would still have looked broken.
//  2. `max_tokens` is deprecated for these models; `max_completion_tokens` is
//     the supported field.
// `reasoning_effort: "low"` keeps this ~400ms — it's a keyword list, not a maths
// problem. gpt-oss also returns its thinking in a separate `reasoning` field, so
// it can never contaminate the answer we parse.
const GROQ_MAX_COMPLETION_TOKENS = 512;
const GROQ_REASONING_EFFORT = "low";
const GROQ_TIMEOUT_MS = 15000;

export type SuggestKeywordsResult =
  | { ok: true; keywords: string[] }
  | { ok: false; error: string };

const suggestSchema = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(5000),
});

/** Robustly pull a clean SINGLE-WORD keyword list out of the model's reply
 *  (JSON array or comma/newline list, possibly wrapped in markdown / numbering /
 *  quotes). Safety net: any multi-word entry is split into individual words so
 *  phrases like "funny socks" become "funny" + "socks". Lowercased + de-duped. */
function parseAIKeywords(raw: string): string[] {
  if (!raw) return [];
  const text = raw
    // Reasoning models can inline their thinking in <think>…</think> instead of
    // the separate `reasoning` field. Drop it (both a closed block and an
    // unterminated one) so it never leaks into the keywords.
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  let parts: string[] = [];
  const arr = text.match(/\[[\s\S]*\]/);
  if (arr) {
    try {
      const json = JSON.parse(arr[0]);
      if (Array.isArray(json)) parts = json.map((v) => String(v));
    } catch {
      // not valid JSON — fall through to delimiter splitting
    }
  }
  if (parts.length === 0) parts = text.split(/[,\n]/);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    // Split every entry on whitespace → single words only (no phrases).
    for (const rawWord of part.split(/\s+/)) {
      const w = rawWord
        .toLowerCase()
        .replace(/^[^a-z0-9]+/, "") // strip leading punctuation/bullets/numbering
        .replace(/[^a-z0-9]+$/, "") // strip trailing punctuation
        .slice(0, 40);
      if (w.length < 2) continue;
      if (seen.has(w)) continue;
      seen.add(w);
      out.push(w);
      if (out.length >= 10) break;
    }
    if (out.length >= 10) break;
  }
  return out;
}

export async function suggestKeywords(input: {
  name: string;
  description: string;
}): Promise<SuggestKeywordsResult> {
  if (!(await getAdminUser())) {
    return { ok: false, error: "You are not authorized to do that." };
  }

  const parsed = suggestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Add a product name first, then try again." };
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    // Expected on a local machine where GROQ_API_KEY isn't in .env.local (it is
    // set in Vercel for production). Say so plainly instead of looking broken.
    console.warn(
      "[suggestKeywords] GROQ_API_KEY is not set — AI suggestions disabled. " +
        "Add it to .env.local (it is configured in Vercel for production).",
    );
    return {
      ok: false,
      error:
        "AI suggestions aren't set up on this environment (no API key). Type keywords manually — everything else works.",
    };
  }

  const { name, description } = parsed.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.3,
        max_completion_tokens: GROQ_MAX_COMPLETION_TOKENS,
        reasoning_effort: GROQ_REASONING_EFFORT,
        messages: [
          {
            role: "system",
            content:
              "You generate concise e-commerce search keywords. Reply with ONLY a comma-separated list of 5-10 SINGLE-WORD lowercase keywords or synonyms a shopper might type to find the product. Each keyword MUST be exactly one word — no spaces, no multi-word phrases (e.g. use \"socks\" and \"funny\" separately, never \"funny socks\"). No explanations, no numbering, no hashtags.",
          },
          {
            role: "user",
            content: `Product name: ${name}\nDescription: ${
              description || "(none provided)"
            }\n\nGive 5-10 single-word lowercase search keywords for this product. One word each — no phrases.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      // Log the REAL error server-side (status + Groq's own message/code) so a
      // future breakage is one glance at the Vercel logs, not a guess.
      const bodyText = await res.text().catch(() => "");
      let apiCode = "";
      let apiMessage = "";
      try {
        const parsedErr = JSON.parse(bodyText) as {
          error?: { code?: string; message?: string };
        };
        apiCode = parsedErr.error?.code ?? "";
        apiMessage = parsedErr.error?.message ?? "";
      } catch {
        // non-JSON error body — the raw text is logged below
      }
      console.error(
        `[suggestKeywords] Groq HTTP ${res.status} model=${GROQ_MODEL} ` +
          `code=${apiCode || "n/a"} message=${apiMessage || bodyText.slice(0, 300) || "n/a"}`,
      );

      // Distinct, actionable message per failure mode.
      if (res.status === 401 || res.status === 403) {
        return {
          ok: false,
          error:
            "The AI key was rejected (invalid or expired GROQ_API_KEY). Keywords still work manually.",
        };
      }
      if (apiCode === "model_not_found" || res.status === 404) {
        return {
          ok: false,
          error: `The AI model "${GROQ_MODEL}" is no longer available on Groq, so it needs updating in the code (GROQ_MODEL in app/admin/products/actions.ts). Type keywords manually for now.`,
        };
      }
      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        return {
          ok: false,
          error: retryAfter
            ? `AI rate limit reached — try again in about ${retryAfter}s.`
            : "AI rate limit reached — try again in a moment.",
        };
      }
      if (res.status >= 500) {
        return {
          ok: false,
          error: "Groq's AI service is temporarily unavailable. Try again shortly.",
        };
      }
      if (res.status === 400) {
        return {
          ok: false,
          error: `The AI request was rejected${apiMessage ? ` (${apiMessage.slice(0, 120)})` : ""}. Type keywords manually.`,
        };
      }
      return {
        ok: false,
        error: `Couldn't get suggestions (error ${res.status}). Please try again.`,
      };
    }

    const data = (await res.json()) as {
      choices?: {
        finish_reason?: string;
        message?: { content?: string };
      }[];
    };
    const choice = data.choices?.[0];
    const content = choice?.message?.content ?? "";
    const keywords = parseAIKeywords(content);

    if (keywords.length === 0) {
      // Most likely cause: the reasoning ate the token budget, so the answer came
      // back empty/truncated. Log enough to tell that apart from a vague model.
      console.error(
        `[suggestKeywords] No keywords parsed. model=${GROQ_MODEL} ` +
          `finish_reason=${choice?.finish_reason ?? "n/a"} contentLength=${content.length}`,
      );
      if (choice?.finish_reason === "length") {
        return {
          ok: false,
          error:
            "The AI ran out of room before answering. Try again, or add keywords manually.",
        };
      }
      return {
        ok: false,
        error: "No suggestions came back. Add more detail, or type keywords manually.",
      };
    }
    return { ok: true, keywords };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    console.error(
      `[suggestKeywords] ${aborted ? "timeout" : "network/parse error"} ` +
        `after ${GROQ_TIMEOUT_MS}ms model=${GROQ_MODEL}:`,
      err,
    );
    return {
      ok: false,
      error: aborted
        ? `The AI took longer than ${GROQ_TIMEOUT_MS / 1000}s to respond. Please try again.`
        : "Couldn't reach the AI service (network error). Check your connection and try again.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
