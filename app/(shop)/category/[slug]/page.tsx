import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/lib/data/categories";
import { buildMetadata, jsonLdScript, SITE_URL } from "@/lib/seo";
import CategoryView from "@/components/category/CategoryView";

// Virtual collections that aren't real categories in categories.ts.
const VIRTUAL: Record<string, { name: string; description: string }> = {
  sale: {
    name: "On Sale",
    description: "Shop discounted products and limited-time deals",
  },
  "best-sellers": {
    name: "Best Sellers",
    description: "Our most loved products, chosen by customers",
  },
};

async function resolveCategory(
  slug: string,
): Promise<{ name: string; description: string } | null> {
  const cat = await getCategoryBySlug(slug);
  if (cat) {
    return {
      name: cat.name,
      description: `Shop ${cat.name} products at YOYOSO`,
    };
  }
  return VIRTUAL[slug] ?? null;
}

export async function generateStaticParams() {
  const categories = await getCategories();
  return [
    ...categories.map((c) => ({ slug: c.slug })),
    { slug: "best-sellers" },
    { slug: "sale" }, // backward-compat alias for on-sale
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const info = await resolveCategory(slug);
  if (!info) return buildMetadata({ title: "Category Not Found" });
  return buildMetadata({
    title: info.name,
    description: info.description,
    path: `/category/${slug}`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const info = await resolveCategory(slug);
  if (!info) notFound();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: info.name,
        item: `${SITE_URL}/category/${slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <Suspense fallback={null}>
        <CategoryView slug={slug} categoryName={info.name} />
      </Suspense>
    </div>
  );
}
