import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getAdminProductById,
  getCategoryOptions,
} from "@/lib/data/admin-products";
import ProductForm from "@/components/admin/ProductForm";
import type { AdminProductInput } from "@/lib/validation";
import { toPaletteColor } from "@/lib/products/colors";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const [row, categories] = await Promise.all([
    getAdminProductById(id),
    getCategoryOptions(),
  ]);

  if (!row) notFound();

  const images = row.images ?? [];

  const initial: AdminProductInput = {
    name: row.name,
    description: row.description ?? "",
    priceUSD: String(row.price_usd),
    originalPriceUSD:
      row.original_price_usd != null ? String(row.original_price_usd) : "",
    categoryId: row.category_id,
    subcategory: row.subcategory ?? "",
    sku: row.sku ?? "",
    badge: (row.badge === "SALE" || row.badge === "HOT") ? row.badge : "",
    inStock: row.in_stock,
    hideNewBadge: row.hide_new_badge,
    // Split the stored variants jsonb back into the three editable groups.
    // Colors are normalised onto the fixed palette (legacy custom swatches map to
    // the nearest named color) and de-duplicated by name. A variant image is
    // only carried over if it's still one of the product's images.
    colors: dedupeByValue(
      (row.variants ?? [])
        .filter((v) => v.type === "color")
        .map((v) => {
          const c = toPaletteColor(v.value, v.colorHex);
          const image = v.image && images.includes(v.image) ? v.image : "";
          return { value: c.name, colorHex: c.hex, image };
        }),
    ),
    models: (row.variants ?? [])
      .filter((v) => v.type === "model")
      .map((v) => ({
        value: v.value,
        image: v.image && images.includes(v.image) ? v.image : "",
      })),
    sizes: (row.variants ?? [])
      .filter((v) => v.type === "size")
      .map((v) => ({ value: v.value })),
    // Existing uploaded images are preserved unless the admin changes them.
    images,
    thumbnail: row.thumbnail ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Back to products
      </Link>

      <h1 className="mb-1 mt-3 font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Edit Product
      </h1>
      <p className="mb-6 text-sm text-text-secondary">{row.name}</p>

      <ProductForm
        mode="edit"
        productId={row.id}
        categories={categories}
        initial={initial}
      />
    </div>
  );
}

/** Keep the first entry per color name (legacy swatches can collapse to one). */
function dedupeByValue<T extends { value: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((it) => {
    if (seen.has(it.value)) return false;
    seen.add(it.value);
    return true;
  });
}
