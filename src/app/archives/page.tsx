import { getAllPosts, getAllTags } from "@/lib/api";
import RightSidebar from "@/components/RightSidebar";
import Link from "next/link";
import type { PostMeta, Tag } from "@/lib/types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function ArchivesPage() {
  let posts: PostMeta[] = [];
  let tags: Tag[] = [];
  try {
    [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  } catch {
    posts = [];
    tags = [];
  }

  // Group by year
  const grouped: Record<string, typeof posts> = {};
  for (const post of posts) {
    const year = new Date(post.date).getFullYear().toString();
    if (!grouped[year]) grouped[year] = [];
    grouped[year].push(post);
  }

  return (
    <div className="flex gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="text-sm text-[var(--text-secondary)] mb-6">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span className="mx-2">›</span>
          <span>Archives</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-8">
          Archives
        </h1>

        {Object.keys(grouped)
          .sort((a, b) => Number(b) - Number(a))
          .map((year) => (
            <div key={year} className="mb-10">
              <h2 className="text-xl font-semibold text-primary mb-4">
                {year}
              </h2>
              <div className="space-y-3 border-l-2 border-[var(--border-color)] pl-6">
                {grouped[year].map((post) => (
                  <div
                    key={`${post.category}/${post.slug}`}
                    className="flex items-baseline gap-4"
                  >
                    <span className="text-xs text-[var(--text-secondary)] whitespace-nowrap w-20">
                      {formatDate(post.date)}
                    </span>
                    <Link
                      href={`/post/${post.category}/${post.slug}`}
                      className="text-sm text-[var(--text-primary)] hover:text-primary transition-colors"
                    >
                      {post.title}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      <RightSidebar recentPosts={posts.slice(0, 5)} trendingTags={tags} />
    </div>
  );
}
