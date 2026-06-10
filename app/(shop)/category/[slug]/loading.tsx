import ProductCardSkeleton from "@/components/product/ProductCardSkeleton";

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2">
        <div className="h-3 w-10 animate-pulse rounded bg-border/60" />
        <div className="h-3 w-2 animate-pulse rounded bg-border/60" />
        <div className="h-3 w-28 animate-pulse rounded bg-border/60" />
      </div>
      {/* Title */}
      <div className="mb-2 h-8 w-48 animate-pulse rounded bg-border/60" />
      <div className="mb-6 h-4 w-64 animate-pulse rounded bg-border/60" />

      <div className="flex gap-6">
        {/* Sidebar — desktop only */}
        <div className="hidden w-56 shrink-0 space-y-3 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-5 w-full animate-pulse rounded bg-border/60" />
          ))}
        </div>
        {/* Product grid */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
