import { Suspense } from "react";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import SearchView from "@/components/search/SearchView";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: ${q}` : "Search",
    description: q
      ? `Search results for "${q}" at YOYOSO`
      : "Search products at YOYOSO",
    path: "/search",
  });
}

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <Suspense fallback={null}>
        <SearchView />
      </Suspense>
    </div>
  );
}
