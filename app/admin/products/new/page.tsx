import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getCategoryOptions,
  getAdminProductById,
  productRowToFormInput,
} from "@/lib/data/admin-products";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage({
  searchParams,
}: {
  // `from` = duplicate an existing product: pre-fill the Add form with its data.
  searchParams: Promise<{ from?: string }>;
}) {
  await requireAdmin();
  const { from } = await searchParams;

  const [categories, source] = await Promise.all([
    getCategoryOptions(),
    from ? getAdminProductById(from) : Promise.resolve(null),
  ]);

  // When duplicating, pre-fill everything but blank the SKU (required + unique,
  // so the admin must set a new one). Saving creates a brand-new product; the
  // original is untouched, and its images are copied to fresh storage objects
  // server-side on save (see createProduct).
  const isDuplicate = Boolean(source);
  const initial = source
    ? productRowToFormInput(source, { blankSku: true })
    : undefined;

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
        {isDuplicate ? "Duplicate Product" : "Add Product"}
      </h1>
      {isDuplicate && (
        <p className="mb-6 text-sm text-text-secondary">
          Pre-filled from “{source!.name}”. Set a new <strong>SKU</strong>, tweak
          anything you like, then save as a new product.
        </p>
      )}

      <ProductForm
        mode="create"
        categories={categories}
        initial={initial}
      />
    </div>
  );
}
