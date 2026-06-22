import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from "lucide-react";
import Banner from "@/components/core/Banner";
import { listBlogPosts } from "@/lib/wordpress";
import type { BlogListResult } from "@/lib/wordpress/types";

const POSTS_PER_PAGE = 12;

type BlogPageProps = {
  searchParams?: {
    page?: string | string[];
  };
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = parsePage(searchParams?.page);
  let result: BlogListResult | null = null;
  let failed = false;

  try {
    result = await listBlogPosts({ page: currentPage, perPage: POSTS_PER_PAGE });
  } catch (error) {
    failed = true;
    console.error("Failed to fetch WordPress blogs:", error);
  }

  const blogs = result?.posts ?? [];

  return (
    <main className="pb-16 sm:pb-20">
      <Banner
        desktopSrc="/images/banners/banner1.jpeg"
        mobileSrc="/images/bannerForMobile/banner1.jpeg"
        alt="Explore Foodeez articles and food guides"
      />

      <section className=" pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-4 inline-flex rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary">
            Stories, guides & inspiration
          </span>
          <h1 className="main-heading">Foodeez Blogs</h1>
          <p className="main-heading-description">
            Fresh ideas, practical guides, and delicious inspiration from the Foodeez
            community.
          </p>
        </div>

        {result && result.total > 0 && (
          <div className="mt-10 flex flex-col gap-2 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-text-muted" aria-live="polite">
              Showing {(result.page - 1) * result.perPage + 1}–
              {Math.min(result.page * result.perPage, result.total)} of {result.total} articles
            </p>
            <p className="text-sm text-text-muted">
              Page {result.page} of {result.totalPages}
            </p>
          </div>
        )}

        {failed ? (
          <BlogMessage
            title="We couldn't load the articles"
            message="The WordPress service is temporarily unavailable. Please refresh the page or try again shortly."
          />
        ) : blogs.length === 0 ? (
          <BlogMessage
            title="No articles found"
            message="There are no published SweetNSavour articles on this page yet."
          />
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-4">
              {blogs.map((blog) => (
                <Link
                  href={`/blog/${blog.slug}`}
                  key={blog.id}
                  className="group rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                >
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
                      {blog.coverImageUrl ? (
                        <Image
                          src={blog.coverImageUrl}
                          alt={blog.coverImageAlt || blog.title}
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-8 text-center text-lg font-bold text-primary/70">
                          Foodeez
                        </div>
                      )}
                      {blog.categories[0] && (
                        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                          {blog.categories[0].name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-5 sm:p-6">
                      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted">
                        {blog.publishedAt && (
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                            {formatDate(blog.publishedAt)}
                          </span>
                        )}
                        {blog.authorName && (
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                            {blog.authorName}
                          </span>
                        )}
                      </div>

                      <h2 className="line-clamp-2 text-xl font-bold leading-snug text-text-main transition-colors group-hover:text-primary">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-text-muted">
                          {blog.excerpt}
                        </p>
                      )}

                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                        Read article
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {result && (
              <BlogPagination currentPage={result.page} totalPages={result.totalPages} />
            )}
          </>
        )}
      </section>
    </main>
  );
}

function BlogPagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = getVisiblePages(currentPage, totalPages);

  return (
    <nav className="mt-12 flex justify-center" aria-label="Blog pagination">
      <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        <PaginationLink
          page={currentPage - 1}
          disabled={currentPage === 1}
          label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          <span className="hidden sm:inline">Previous</span>
        </PaginationLink>

        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-8 items-center justify-center text-text-muted"
              aria-hidden="true"
            >
              …
            </span>
          ) : (
            <Link
              key={page}
              href={blogPageHref(page)}
              scroll
              aria-label={`Go to page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition-colors ${
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-main hover:bg-primary/10 hover:text-primary"
              }`}
            >
              {page}
            </Link>
          ),
        )}

        <PaginationLink
          page={currentPage + 1}
          disabled={currentPage === totalPages}
          label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </PaginationLink>
      </div>
    </nav>
  );
}

function PaginationLink({
  page,
  disabled,
  label,
  children,
}: {
  page: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes =
    "flex h-10 items-center justify-center gap-1 rounded-xl px-3 text-sm font-semibold transition-colors";

  if (disabled) {
    return (
      <span className={`${classes} cursor-not-allowed text-gray-300`} aria-disabled="true">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={blogPageHref(page)}
      scroll
      aria-label={label}
      className={`${classes} text-text-main hover:bg-primary/10 hover:text-primary`}
    >
      {children}
    </Link>
  );
}

function BlogMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto my-16 max-w-xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-xl font-bold text-text-main">{title}</h2>
      <p className="mt-2 leading-7 text-text-muted">{message}</p>
      <Link href="/blog" className="btn-primary mt-6">
        Refresh articles
      </Link>
    </div>
  );
}

function parsePage(value?: string | string[]) {
  const parsed = Number.parseInt(Array.isArray(value) ? value[0] : value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function blogPageHref(page: number) {
  return page <= 1 ? "/blog" : `/blog?page=${page}`;
}

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];
  const candidates = new Set([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const visible = Array.from(candidates)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  visible.forEach((page, index) => {
    if (index > 0 && page - visible[index - 1] > 1) pages.push("ellipsis");
    pages.push(page);
  });

  return pages;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
