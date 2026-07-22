"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error", error);
  }, [error]);

  return (
    <main className="container-custom flex min-h-[50vh] items-center justify-center py-12 text-center">
      <div className="max-w-lg rounded-xl border bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="mt-3 text-gray-600">We could not load this page. Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
