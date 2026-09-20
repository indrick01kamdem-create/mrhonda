export function CatalogSkeleton({ count = 8 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden border-2 border-neutral-200 bg-white">
          <div className="aspect-square w-full animate-pulse bg-neutral-200" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-1/3 animate-pulse bg-neutral-200" />
            <div className="h-5 w-4/5 animate-pulse bg-neutral-200" />
            <div className="h-6 w-1/2 animate-pulse bg-neutral-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
