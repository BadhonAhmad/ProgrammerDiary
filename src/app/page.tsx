import { getAllPosts, getAllTags } from "@/lib/api";
import type { PostMeta, Tag } from "@/lib/types";
import PostCard from "@/components/PostCard";
import RightSidebar from "@/components/RightSidebar";

export default async function HomePage() {
  let posts: PostMeta[];
  let tags: Tag[];
  try {
    [posts, tags] = await Promise.all([getAllPosts(), getAllTags()]);
  } catch {
    posts = [];
    tags = [];
  }

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="flex gap-8 p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="text-sm text-[var(--text-secondary)] mb-6">Home</div>

        {/* Posts */}
        <div className="space-y-4">
          {posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={`${post.category}/${post.slug}`} post={post} />
            ))
          ) : (
            <div className="text-center py-20 text-[var(--text-secondary)]">
              <p className="text-lg mb-2">No posts yet</p>
              <p className="text-sm">
                Add markdown files to the{" "}
                <code className="px-1.5 py-0.5 rounded bg-[var(--bg-card)] text-primary text-xs">
                  content/
                </code>{" "}
                directory to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      <RightSidebar recentPosts={recentPosts} trendingTags={tags} />
    </div>
  );
}
