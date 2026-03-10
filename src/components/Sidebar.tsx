"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Server,
  LayoutDashboard,
  Brain,
  Database,
  Wrench,
  Bug,
  Tag,
  Archive,
  ChevronDown,
  ChevronRight,
  Github,
  Twitter,
  Rss,
  Code2,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const categories = [
  { name: "Backend", slug: "backend", icon: Server },
  { name: "System Design", slug: "system-design", icon: LayoutDashboard },
  { name: "Algorithms", slug: "algorithms", icon: Brain },
  { name: "Databases", slug: "databases", icon: Database },
  { name: "Dev Tools", slug: "dev-tools", icon: Wrench },
  { name: "Debugging Stories", slug: "debugging-stories", icon: Bug },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)]">
          <Link href="/" className="block" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Code2 size={26} className="text-primary" />
              </div>
            </div>
            <h1 className="text-primary font-bold text-xl leading-tight">
              Programmer
              <br />
              Diary
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1 italic">
              Backend & System Design Journey
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {/* Home */}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-primary/10 text-primary"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
            }`}
          >
            <Home size={16} />
            <span className="uppercase text-xs tracking-wide">Home</span>
          </Link>

          {/* Section label */}
          <div className="mt-5 mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
            Categories
          </div>

          {/* Category items */}
          {categories.map(({ name, slug, icon: Icon }) => (
            <div key={slug}>
              <button
                onClick={() => toggleCategory(slug)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors ${
                  pathname.startsWith(`/category/${slug}`)
                    ? "bg-primary/10 text-primary"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
                }`}
              >
                <Icon size={16} />
                <span className="flex-1 text-left uppercase text-xs tracking-wide">
                  {name}
                </span>
                {expandedCategories.includes(slug) ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>

              {/* Expandable submenu */}
              {expandedCategories.includes(slug) && (
                <div className="ml-9 mb-2 border-l border-[var(--border-color)] pl-3">
                  <Link
                    href={`/category/${slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="block py-1.5 text-xs text-[var(--text-secondary)] hover:text-primary transition-colors"
                  >
                    View all posts →
                  </Link>
                </div>
              )}
            </div>
          ))}

          {/* Divider */}
          <div className="my-4 border-t border-[var(--border-color)]" />

          {/* Tags */}
          <Link
            href="/tags"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
              isActive("/tags")
                ? "bg-primary/10 text-primary"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
            }`}
          >
            <Tag size={16} />
            <span className="uppercase text-xs tracking-wide">Tags</span>
          </Link>

          {/* Archives */}
          <Link
            href="/archives"
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition-colors ${
              isActive("/archives")
                ? "bg-primary/10 text-primary"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
            }`}
          >
            <Archive size={16} />
            <span className="uppercase text-xs tracking-wide">Archives</span>
          </Link>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] flex items-center gap-1">
          <ThemeToggle />
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-zinc-500/20 transition-colors"
          >
            <Github size={16} className="text-[var(--text-secondary)]" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-full hover:bg-zinc-500/20 transition-colors"
          >
            <Twitter size={16} className="text-[var(--text-secondary)]" />
          </a>
          <a
            href="/rss"
            className="p-2 rounded-full hover:bg-zinc-500/20 transition-colors"
          >
            <Rss size={16} className="text-[var(--text-secondary)]" />
          </a>
        </div>
      </aside>
    </>
  );
}
