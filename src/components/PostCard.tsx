import Link from "next/link";
import { Calendar, FolderOpen } from "lucide-react";
import { PostMeta } from "@/lib/types";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function categoryLabel(category: string): string {
  return category
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function PostCard({ post }: { post: PostMeta }) {
  return (
    <Link href={`/post/${post.category}/${post.slug}`}>
      <article className="group p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-primary transition-colors mb-3">
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-sm text-[var(--text-secondary)] mb-4 line-clamp-2">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <FolderOpen size={13} />
            {post.tags.length > 0
              ? post.tags.join(", ")
              : categoryLabel(post.category)}
          </span>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 text-[11px] rounded-full bg-primary/10 text-primary font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </Link>
  );
}
