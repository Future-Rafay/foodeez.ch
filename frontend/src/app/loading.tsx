export default function Loading() {
  return (
    <main className="container-custom min-h-[50vh] py-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <div className="animate-pulse space-y-6" aria-hidden="true">
        <div className="h-9 w-2/3 max-w-md rounded bg-gray-200" />
        <div className="h-5 w-full max-w-2xl rounded bg-gray-100" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-56 rounded-xl bg-gray-100" />
          ))}
        </div>
      </div>
    </main>
  );
}
