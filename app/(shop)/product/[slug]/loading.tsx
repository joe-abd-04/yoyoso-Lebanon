export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-3 w-14 animate-pulse rounded bg-border/60" />
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_1fr] lg:gap-12">
        {/* Image gallery skeleton */}
        <div className="space-y-3">
          <div className="aspect-square animate-pulse rounded-card bg-border/60" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 w-16 animate-pulse rounded-[8px] bg-border/60" />
            ))}
          </div>
        </div>

        {/* Product info skeleton */}
        <div className="mt-6 space-y-4 lg:mt-0">
          <div className="h-4 w-24 animate-pulse rounded bg-border/60" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-border/60" />
          <div className="h-6 w-40 animate-pulse rounded bg-border/60" />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-border/60" />
            <div className="h-3 w-5/6 animate-pulse rounded bg-border/60" />
            <div className="h-3 w-4/6 animate-pulse rounded bg-border/60" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-8 animate-pulse rounded-full bg-border/60" />
            ))}
          </div>
          <div className="h-12 w-full animate-pulse rounded-button bg-border/60" />
          <div className="h-12 w-full animate-pulse rounded-button bg-border/60" />
        </div>
      </div>
    </div>
  );
}
