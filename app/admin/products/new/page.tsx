import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { getCategoryOptions } from "@/lib/data/admin-products";
import ProductForm from "@/components/admin/ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  const categories = await getCategoryOptions();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
      >
        <ChevronLeft size={16} />
        Back to products
      </Link>

      <h1 className="mb-6 mt-3 font-heading text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
        Add Product
      </h1>

      <ProductForm mode="create" categories={categories} />
    </div>
  );
}
