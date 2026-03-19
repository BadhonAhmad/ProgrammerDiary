import { getPostsByCategory, getAllTags, getAllPosts } from "@/lib/api";
import type { PostMeta, Tag } from "@/lib/types";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";
import Link from "next/link";

function categoryLabel(category: string): string {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;

  let posts: PostMeta[];
  let tags: Tag[];
  let allPosts: PostMeta[];
  try {
    [posts, tags, allPosts] = await Promise.all([
      getPostsByCategory(category),
      getAllTags(),
      getAllPosts(),
    ]);
  } catch {
    posts = [];
    tags = [];
    allPosts = [];
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
          <span>{categoryLabel(category)}</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          {categoryLabel(category)}
        </h1>

        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => <PostCard key={post.slug} post={post} />)
          ) : (
            <p className="text-[var(--text-secondary)]">
              No posts in this category yet.
            </p>
          )}
        </div>
      </div>

      <RightSidebar recentPosts={allPosts.slice(0, 5)} trendingTags={tags} />
    </div>
  );
}
