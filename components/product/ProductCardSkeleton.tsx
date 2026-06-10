export default function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="aspect-square animate-pulse bg-border/60" />
      <div className="space-y-2 p-3">
        <div className="h-2 w-1/3 animate-pulse rounded bg-border/60" />
        <div className="h-3 w-3/4 animate-pulse rounded bg-border/60" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-border/60" />
        <div className="h-9 w-full animate-pulse rounded bg-border/60" />
      </div>
    </div>
  );
}
