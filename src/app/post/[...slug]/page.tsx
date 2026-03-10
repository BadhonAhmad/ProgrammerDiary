import { getPostBySlug, getAllPosts, getAllTags } from "@/lib/api";
import RightSidebar from "@/components/RightSidebar";
import Link from "next/link";
import { Calendar, FolderOpen } from "lucide-react";
import { notFound } from "next/navigation";

function categoryLabel(category: string): string {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  if (slug.length < 2) notFound();

  const [category, postSlug] = slug;

  let post;
  try {
    post = await getPostBySlug(category, postSlug);
  } catch {
    notFound();
  }

  let allPosts, tags;
  try {
    [allPosts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  } catch {
    allPosts = [];
    tags = [];
  }

  return (
    <div className="flex gap-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="text-sm text-[var(--text-secondary)] mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <Link
            href={`/category/${category}`}
            className="hover:text-primary transition-colors"
          >
            {categoryLabel(category)}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-[var(--text-primary)]">{post.title}</span>
        </div>

        {/* Post */}
        <article>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)] mb-6">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <FolderOpen size={14} />
              {categoryLabel(post.category)}
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/tags?tag=${tag}`}
                  className="px-3 py-1 text-xs rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Rendered markdown content */}
          <div
            className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary prose-code:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>

      <RightSidebar recentPosts={allPosts.slice(0, 5)} trendingTags={tags} />
    </div>
  );
}
