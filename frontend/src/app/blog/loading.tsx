export default function BlogLoading() {
  return (
    <main className="container-custom py-12 sm:py-16" aria-label="Loading articles">
      <div className="mx-auto mb-10 h-10 w-64 animate-pulse rounded-xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="aspect-[16/10] animate-pulse bg-gray-200" />
            <div className="space-y-4 p-6">
              <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
