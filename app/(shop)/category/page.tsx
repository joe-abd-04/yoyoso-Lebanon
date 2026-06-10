import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import CategoryGrid from "@/components/homepage/CategoryGrid";

export const metadata: Metadata = buildMetadata({
  title: "All Categories",
  description: "Browse all product categories at YOYOSO",
  path: "/category",
});

export default function AllCategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1 text-sm text-text-secondary">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li className="font-medium text-text-primary">All Categories</li>
        </ol>
      </nav>

      <CategoryGrid />
    </div>
  );
}
