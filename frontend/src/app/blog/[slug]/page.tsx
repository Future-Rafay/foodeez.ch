import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  MessageCircle,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getBlogPost } from "@/lib/wordpress";

type SingleBlogPostPageProps = {
  params: { slug: string };
};

export default async function SingleBlogPostPage({ params }: SingleBlogPostPageProps) {
  const blog = await getBlogPost(params.slug);

  if (!blog) notFound();

  return (
    <main className="bg-background-DEFAULT py-8 sm:py-12">
      <article className="">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all articles
        </Link>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          {blog.coverImageUrl && (
            <div className="relative aspect-[16/7] min-h-64 w-full overflow-hidden bg-gray-100">
              <Image
                src={blog.coverImageUrl}
                alt={blog.coverImageAlt || blog.title}
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                priority
                className="object-cover"
              />
            </div>
          )}

          <div className="px-5 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12">
            {blog.categories.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {blog.categories.map((category) => (
                  <span
                    key={category.id}
                    className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}

            <h1 className="max-w-5xl text-3xl font-extrabold leading-tight text-text-main sm:text-4xl lg:text-5xl">
              {blog.title}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-gray-200 pb-7 text-sm text-text-muted">
              {blog.publishedAt && (
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
                  Published {formatDate(blog.publishedAt)}
                </span>
              )}
              {blog.authorName && (
                <span className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                  By {blog.authorName}
                </span>
              )}
            </div>

            <div
              className="prose prose-lg mt-8 max-w-none text-text-main prose-headings:text-text-main prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:mx-auto prose-img:rounded-xl"
              dangerouslySetInnerHTML={{ __html: blog.contentHtml }}
            />

            {blog.sourceUrl && (
              <aside className="relative mt-12 overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-light to-secondary p-6 text-white shadow-lg sm:p-8 lg:p-10">
                <div
                  className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-white/10"
                  aria-hidden="true"
                />
                <div
                  className="absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-white/10"
                  aria-hidden="true"
                />

                <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-3xl">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Join the conversation
                    </span>
                    <h2 className="text-2xl font-bold leading-tight sm:text-3xl">
                      Want to follow this article or share your thoughts?
                    </h2>
                    <p className="mt-3 max-w-2xl leading-7 text-white/90">
                      Visit the official blog page to follow the discussion, leave a
                      comment, and read what other readers have shared.
                    </p>
                  </div>

                  <a
                    href={blog.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 font-semibold text-primary shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-orange-50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
                  >
                    Visit official blog
                    <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
                  </a>
                </div>
              </aside>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
