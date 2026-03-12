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
  BookOpen,
  FileCode2,
  Route,
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

const languageFrameworks = [
  {
    name: "TypeScript",
    slug: "typescript",
    icon: FileCode2,
    posts: [
      { title: "What is TypeScript", slug: "what-is-typescript" },
      { title: "Why TypeScript", slug: "why-typescript" },
      { title: "TS Compiler Pipeline", slug: "typescript-compiler-internals" },
      { title: "Type Assertion (as)", slug: "type-assertion" },
      { title: "any vs unknown", slug: "any-vs-unknown" },
      { title: "The never Type", slug: "type-never" },
      { title: "try-catch & Error Handling", slug: "try-catch-error-handling" },
    ],
    subcategories: [
      {
        name: "Types",
        slug: "types",
        posts: [
          {
            title: "Type Inference vs Annotation",
            slug: "type-inference-and-annotation",
          },
          { title: "Union Types & any", slug: "union-types-and-any" },
          { title: "Type Narrowing", slug: "type-narrowing" },
          { title: "Interfaces & implements", slug: "interfaces" },
          { title: "Object Types & Utility Types", slug: "object-types-and-utility-types" },
          { title: "Tuples & Enums", slug: "tuples-and-enums" },
        ],
      },
      {
        name: "Functions",
        slug: "functions",
        posts: [
          { title: "Functions in TypeScript", slug: "functions-in-typescript" },
        ],
      },
    ],
  },
];

const roadmapItems = [
  {
    name: "Backend",
    slug: "backend",
    icon: Server,
    posts: [
      { title: "Backend Engineer Roadmap", slug: "backend-engineer-roadmap" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [langSectionOpen, setLangSectionOpen] = useState(false);
  const [expandedLangs, setExpandedLangs] = useState<string[]>([]);
  const [roadmapSectionOpen, setRoadmapSectionOpen] = useState(false);
  const [expandedRoadmaps, setExpandedRoadmaps] = useState<string[]>([]);
  const [expandedSubcategories, setExpandedSubcategories] = useState<string[]>(
    [],
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCategory = (slug: string) => {
    setExpandedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleLang = (slug: string) => {
    setExpandedLangs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleRoadmap = (slug: string) => {
    setExpandedRoadmaps((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleSubcategory = (key: string) => {
    setExpandedSubcategories((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
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

          {/* Language & Frameworks Section */}
          <div className="mt-1 mb-2">
            <button
              onClick={() => setLangSectionOpen((p) => !p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
            >
              <BookOpen size={16} />
              <span className="flex-1 text-left uppercase text-xs tracking-wide">
                Language &amp; Frameworks
              </span>
              {langSectionOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            {langSectionOpen && (
              <div className="ml-4 border-l border-[var(--border-color)] pl-2">
                {languageFrameworks.map(
                  ({ name, slug, icon: LangIcon, posts }) => (
                    <div key={slug}>
                      {/* Language item (e.g. TypeScript) */}
                      <button
                        onClick={() => toggleLang(slug)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                          pathname.startsWith(`/post/languages/`)
                            ? "text-primary"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
                        }`}
                      >
                        <LangIcon size={14} />
                        <span className="flex-1 text-left text-xs font-medium uppercase tracking-wide">
                          {name}
                        </span>
                        {expandedLangs.includes(slug) ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </button>

                      {/* Posts and subcategories under this language */}
                      {expandedLangs.includes(slug) && (
                        <div className="ml-5 border-l border-[var(--border-color)] pl-3 mb-1">
                          {posts.map((post) => (
                            <Link
                              key={post.slug}
                              href={`/post/languages/${post.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className={`block py-1.5 text-xs transition-colors ${
                                pathname === `/post/languages/${post.slug}`
                                  ? "text-primary font-medium"
                                  : "text-[var(--text-secondary)] hover:text-primary"
                              }`}
                            >
                              {post.title}
                            </Link>
                          ))}
                          {/* Subcategories (e.g. Types) */}
                          {(
                            languageFrameworks.find((l) => l.slug === slug)
                              ?.subcategories ?? []
                          ).map((sub) => {
                            const subKey = `${slug}-${sub.slug}`;
                            return (
                              <div key={sub.slug}>
                                <button
                                  onClick={() => toggleSubcategory(subKey)}
                                  className="w-full flex items-center gap-1.5 py-1.5 text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] hover:text-primary transition-colors"
                                >
                                  {expandedSubcategories.includes(subKey) ? (
                                    <ChevronDown size={11} />
                                  ) : (
                                    <ChevronRight size={11} />
                                  )}
                                  {sub.name}
                                </button>
                                {expandedSubcategories.includes(subKey) && (
                                  <div className="ml-3 border-l border-[var(--border-color)] pl-3 mb-1">
                                    {sub.posts.map((post) => (
                                      <Link
                                        key={post.slug}
                                        href={`/post/languages/${post.slug}`}
                                        onClick={() => setMobileOpen(false)}
                                        className={`block py-1.5 text-xs transition-colors ${
                                          pathname ===
                                          `/post/languages/${post.slug}`
                                            ? "text-primary font-medium"
                                            : "text-[var(--text-secondary)] hover:text-primary"
                                        }`}
                                      >
                                        {post.title}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Second Divider */}
          <div className="my-4 border-t border-[var(--border-color)]" />

          {/* Roadmap Section */}
          <div className="mt-1 mb-2">
            <button
              onClick={() => setRoadmapSectionOpen((p) => !p)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
            >
              <Route size={16} />
              <span className="flex-1 text-left uppercase text-xs tracking-wide">
                Roadmap
              </span>
              {roadmapSectionOpen ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>

            {roadmapSectionOpen && (
              <div className="ml-4 border-l border-[var(--border-color)] pl-2">
                {roadmapItems.map(
                  ({ name, slug, icon: RoadmapIcon, posts }) => (
                    <div key={slug}>
                      <button
                        onClick={() => toggleRoadmap(slug)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                          pathname.startsWith(`/post/roadmap/`)
                            ? "text-primary"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-zinc-500/10"
                        }`}
                      >
                        <RoadmapIcon size={14} />
                        <span className="flex-1 text-left text-xs font-medium uppercase tracking-wide">
                          {name}
                        </span>
                        {expandedRoadmaps.includes(slug) ? (
                          <ChevronDown size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </button>

                      {expandedRoadmaps.includes(slug) && (
                        <div className="ml-5 border-l border-[var(--border-color)] pl-3 mb-1">
                          {posts.map((post) => (
                            <Link
                              key={post.slug}
                              href={`/post/roadmap/${post.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className={`block py-1.5 text-xs transition-colors ${
                                pathname === `/post/roadmap/${post.slug}`
                                  ? "text-primary font-medium"
                                  : "text-[var(--text-secondary)] hover:text-primary"
                              }`}
                            >
                              {post.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Third Divider */}
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
