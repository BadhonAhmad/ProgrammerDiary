"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { PostMeta, Tag } from "@/lib/types";

interface RightSidebarProps {
  recentPosts: PostMeta[];
  trendingTags: Tag[];
}

export default function RightSidebar({
  recentPosts,
  trendingTags,
}: RightSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PostMeta[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(
          `${API_URL}/posts/search?q=${encodeURIComponent(searchQuery)}`,
        );
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div className="sticky top-8 space-y-8">
        {/* Search */}
        <div className="relative">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            <Search
              size={15}
              className="text-[var(--text-secondary)] shrink-0"
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X size={14} className="text-[var(--text-secondary)]" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-sm text-[var(--text-secondary)]">
                  Searching...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <Link
                    key={`${post.category}/${post.slug}`}
                    href={`/post/${post.category}/${post.slug}`}
                    className="block px-3 py-2.5 text-sm text-[var(--text-primary)] hover:bg-primary/10 transition-colors border-b border-[var(--border-color)] last:border-0"
                    onClick={() => setSearchQuery("")}
                  >
                    {post.title}
                  </Link>
                ))
              ) : (
                <div className="p-3 text-sm text-[var(--text-secondary)]">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recently Updated */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Recently Updated
          </h3>
          <div className="space-y-2.5">
            {recentPosts.map((post) => (
              <Link
                key={`${post.category}/${post.slug}`}
                href={`/post/${post.category}/${post.slug}`}
                className="block text-sm text-[var(--text-secondary)] hover:text-primary transition-colors truncate"
              >
                {post.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Tags */}
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wide">
            Trending Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag.name}
                href={`/tags?tag=${tag.name}`}
                className="px-3 py-1.5 text-xs rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-primary hover:border-primary/50 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
