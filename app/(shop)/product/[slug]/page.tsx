import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProducts, getProductBySlug } from "@/lib/data/products";
import { getCategoryBySlug } from "@/lib/data/categories";
import { buildMetadata, buildProductJsonLd, jsonLdScript, SITE_URL } from "@/lib/seo";
import ProductDetailView from "@/components/product/ProductDetailView";
import RelatedProducts from "@/components/product/RelatedProducts";
import RecentlyViewed from "@/components/product/RecentlyViewed";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return buildMetadata({ title: "Product Not Found" });

  return buildMetadata({
    title: product.name,
    description: (product.description ?? "").slice(0, 150) || undefined,
    path: `/product/${slug}`,
    images: [product.thumbnail],
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategoryBySlug(product.category);
  const categoryName = category?.name ?? product.category;

  // Overlay badge for the gallery: prefer SALE, then auto-NEW (14 days).
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const isAutoNew =
    Date.now() - new Date(product.createdAt).getTime() <= FOURTEEN_DAYS_MS &&
    !product.hideNewBadge;
  const overlayBadge =
    product.discountPercent || product.badge === "SALE"
      ? "SALE"
      : isAutoNew
        ? "NEW"
        : null;

  const productJsonLd = buildProductJsonLd(product);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${SITE_URL}/category/${product.category}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${SITE_URL}/product/${product.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-text-secondary">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li>
            <Link
              href={`/category/${product.category}`}
              className="transition-colors hover:text-primary"
            >
              {categoryName}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li className="font-medium text-text-primary">{product.name}</li>
        </ol>
      </nav>

      {/* Main: gallery + info (client wrapper so variant images switch the photo) */}
      <ProductDetailView product={product} badge={overlayBadge} />

      {/* Related + Recently viewed */}
      <RelatedProducts
        category={product.category}
        currentSlug={product.slug}
      />
      <RecentlyViewed currentSlug={product.slug} />
    </div>
  );
}
