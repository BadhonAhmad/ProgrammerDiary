import { getAllTags, getPostsByTag, getAllPosts } from '@/lib/api';
import PostCard from '@/components/PostCard';
import RightSidebar from '@/components/RightSidebar';
import Link from 'next/link';

export default async function TagsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string }>;
}) {
  const { tag } = await searchParams;

  let tags, allPosts;
  try {
    [tags, allPosts] = await Promise.all([getAllTags(), getAllPosts()]);
  } catch {
    tags = [];
    allPosts = [];
  }

  let filteredPosts = allPosts;
  if (tag) {
    try {
      filteredPosts = await getPostsByTag(tag);
    } catch {
      filteredPosts = [];
    }
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
          <span>Tags</span>
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
          {tag ? `Posts tagged "${tag}"` : 'All Tags'}
        </h1>

        {/* All tags grid */}
        {!tag && (
          <div className="flex flex-wrap gap-3 mb-8">
            {tags.map(t => (
              <Link
                key={t.name}
                href={`/tags?tag=${t.name}`}
                className="px-4 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] text-sm text-[var(--text-secondary)] hover:text-primary hover:border-primary/50 transition-colors"
              >
                {t.name}
                <span className="ml-2 text-xs opacity-60">({t.count})</span>
              </Link>
            ))}
          </div>
        )}

        {/* Filtered posts */}
        {tag && (
          <div className="space-y-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <PostCard key={`${post.category}/${post.slug}`} post={post} />
              ))
            ) : (
              <p className="text-[var(--text-secondary)]">No posts with this tag.</p>
            )}
          </div>
        )}
      </div>

      <RightSidebar recentPosts={allPosts.slice(0, 5)} trendingTags={tags} />
    </div>
  );
}
