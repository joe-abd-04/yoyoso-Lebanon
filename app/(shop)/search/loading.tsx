import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <div className="mb-2 h-8 w-32 animate-pulse rounded bg-border/60" />
      <div className="mb-6 h-4 w-52 animate-pulse rounded bg-border/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
