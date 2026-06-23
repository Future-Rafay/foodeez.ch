"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import type { BlogPostSummary } from "@/lib/wordpress/types";

type LatestBlogResponse = {
  posts?: BlogPostSummary[];
};

const BLOG_LIMIT = 4;

export default function RecentBlogs() {
  const [blogs, setBlogs] = useState<BlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadBlogs() {
      try {
        const response = await fetch("/api/blog/latest", {
          headers: { Accept: "application/json" },
        });

        if (!response.ok) throw new Error("Latest blogs request failed");

        const data = (await response.json()) as LatestBlogResponse;
        if (mounted) setBlogs((data.posts ?? []).slice(0, BLOG_LIMIT));
      } catch (error) {
        console.error("Failed to fetch latest blogs:", error);
        if (mounted) setBlogs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBlogs();

    return () => {
      mounted = false;
    };
  }, []);

  if (!loading && blogs.length === 0) return null;

  return (
    <section className="w-full text-center py-10">
      <div className="px-4 lg:px-0 mb-10 space-y-4">
        <h2 className="sub-heading">
          Latest from the <b>Foodeez Blog</b>
        </h2>
        <p className="sub-heading-description">
          Read fresh food guides, tips, and inspiration from SweetNSavour.
        </p>
      </div>

      <div className="w-full">
        {loading ? (
          <RecentBlogSkeleton />
        ) : (
          <div className="px-4 lg:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 my-6 text-left">
            {blogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} />
            ))}
          </div>
        )}

        <div className="px-4 lg:px-0 text-center">
          <div className="my-12 inline-flex items-center justify-center gap-4">
            <Link href="/blog" passHref target="_blank">
              <button className="btn-primary">
                More Blogs
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogCard({ blog }: { blog: BlogPostSummary }) {
  return (
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
            Read Blog
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        </div>
      </article>
    </Link>
  );
}

function RecentBlogSkeleton() {
  return (
    <div className="px-4 lg:px-0 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 my-6 text-left">
      {Array.from({ length: BLOG_LIMIT }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-accent bg-white shadow-lg p-5"
        >
          <div className="mb-4 aspect-[16/10] animate-pulse rounded-xl bg-gray-100" />
          <div className="space-y-4">
            <div className="h-4 w-28 animate-pulse rounded-full bg-gray-100" />
            <div className="space-y-2">
              <div className="h-5 w-full animate-pulse rounded-full bg-gray-100" />
              <div className="h-5 w-3/4 animate-pulse rounded-full bg-gray-100" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-gray-100" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
