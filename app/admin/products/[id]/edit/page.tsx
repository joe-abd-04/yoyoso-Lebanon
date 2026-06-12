import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import {
  getAdminProductById,
  getCategoryOptions,
  productRowToFormInput,
} from "@/lib/data/admin-products";
import ProductForm from "@/components/admin/ProductForm";

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

  const initial = productRowToFormInput(row);

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
