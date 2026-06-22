export default function BlogPostLoading() {
  return (
    <main className="bg-background-DEFAULT py-8 sm:py-12" aria-label="Loading article">
      <article className="mx-auto max-w-7xl animate-pulse px-4 sm:px-6 lg:px-8">
        <div className="mb-6 h-5 w-40 rounded bg-gray-200" />

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="aspect-[16/7] min-h-64 w-full bg-gray-200" />

          <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            <div className="mb-5 flex gap-2">
              <div className="h-7 w-24 rounded-full bg-orange-100" />
              <div className="h-7 w-32 rounded-full bg-orange-100" />
            </div>

            <div className="h-10 w-full max-w-4xl rounded-lg bg-gray-200 sm:h-12" />
            <div className="mt-3 h-10 w-3/5 max-w-2xl rounded-lg bg-gray-200 sm:h-12" />

            <div className="mt-6 flex flex-wrap gap-5 border-b border-gray-200 pb-7">
              <div className="h-5 w-44 rounded bg-gray-200" />
              <div className="h-5 w-36 rounded bg-gray-200" />
            </div>

            <div className="mt-9 space-y-4">
              <div className="h-5 w-full rounded bg-gray-200" />
              <div className="h-5 w-full rounded bg-gray-200" />
              <div className="h-5 w-11/12 rounded bg-gray-200" />
              <div className="h-5 w-4/5 rounded bg-gray-200" />

              <div className="pt-5">
                <div className="h-8 w-2/5 rounded bg-gray-200" />
              </div>
              <div className="h-5 w-full rounded bg-gray-200" />
              <div className="h-5 w-11/12 rounded bg-gray-200" />
              <div className="h-5 w-3/4 rounded bg-gray-200" />
            </div>

            <div className="mt-12 rounded-3xl bg-orange-100 p-6 sm:p-8 lg:p-10">
              <div className="h-7 w-40 rounded-full bg-orange-200" />
              <div className="mt-5 h-8 w-3/4 rounded bg-orange-200" />
              <div className="mt-3 h-5 w-full max-w-2xl rounded bg-orange-200" />
              <div className="mt-2 h-5 w-4/5 max-w-xl rounded bg-orange-200" />
              <div className="mt-7 h-12 w-48 rounded-full bg-orange-200" />
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}
