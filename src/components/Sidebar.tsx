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
  GraduationCap,
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
  type LucideIcon,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const categories = [
  { name: "Backend", slug: "backend", icon: Server },
  { name: "System Design", slug: "system-design", icon: LayoutDashboard },
  { name: "Algorithms", slug: "algorithms", icon: Brain },
  { name: "Databases", slug: "databases", icon: Database },
  { name: "Dev Tools", slug: "dev-tools", icon: Wrench },
  { name: "Debugging Stories", slug: "debugging-stories", icon: Bug },
  {
    name: "Interviews & Viva",
    slug: "interviews-and-viva",
    icon: GraduationCap,
  },
];

const categorySubmenuPosts: Record<string, { title: string; slug: string }[]> =
  {
    databases: [
      { title: "Prisma ORM", slug: "prisma-orm" },
    ],
    "interviews-and-viva": [
      { title: "Craftsmen", slug: "craftsmen-software-company" },
      { title: "CMED Health", slug: "cmed-health" },
      { title: "Giga Tech", slug: "giga-tech" },
      { title: "Bitopia", slug: "bitopia" },
      { title: "Fringe Core", slug: "fringe-core" },
    ],
  };

interface Subcategory {
  name: string;
  slug: string;
  posts: { title: string; slug: string }[];
}

interface LanguageFramework {
  name: string;
  slug: string;
  icon: LucideIcon;
  posts: { title: string; slug: string }[];
  subcategories: Subcategory[];
}

const languageFrameworks: LanguageFramework[] = [
  {
    name: "TypeScript",
    slug: "typescript",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is TypeScript?", slug: "what-is-typescript" },
          { title: "Why TypeScript?", slug: "why-typescript" },
          {
            title: "TS Compiler Pipeline",
            slug: "typescript-compiler-internals",
          },
        ],
      },
      {
        name: "Core Types",
        slug: "core-types",
        posts: [
          {
            title: "Type Inference & Annotation",
            slug: "type-inference-and-annotation",
          },
          { title: "Union Types & any", slug: "union-types-and-any" },
          { title: "any vs unknown", slug: "any-vs-unknown" },
          { title: "Type Assertion (as)", slug: "type-assertion" },
          { title: "The never Type", slug: "type-never" },
          { title: "Type Narrowing", slug: "type-narrowing" },
          { title: "Tuples & Enums", slug: "tuples-and-enums" },
        ],
      },
      {
        name: "Functions & Error Handling",
        slug: "functions",
        posts: [
          {
            title: "Functions in TypeScript",
            slug: "functions-in-typescript",
          },
          {
            title: "try-catch & Error Handling",
            slug: "try-catch-error-handling",
          },
        ],
      },
      {
        name: "Interfaces & Objects",
        slug: "interfaces-objects",
        posts: [
          { title: "Interfaces", slug: "interfaces" },
          {
            title: "Object Types & Utility Types",
            slug: "object-types-and-utility-types",
          },
        ],
      },
      {
        name: "Generics & OOP",
        slug: "generics-oop",
        posts: [
          {
            title: "Generics",
            slug: "typescript-generics",
          },
          {
            title: "Classes & OOP",
            slug: "typescript-classes-and-oop",
          },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          {
            title: "Mapped & Conditional Types",
            slug: "typescript-mapped-and-conditional-types",
          },
        ],
      },
    ],
  },
  {
    name: "Vue.js",
    slug: "vue",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is Vue.js?", slug: "what-is-vue" },
          { title: "Why Vue.js?", slug: "why-vue" },
          {
            title: "Installation & Setup",
            slug: "vue-installation-setup",
          },
          {
            title: "Directory Structure",
            slug: "vue-directory-structure",
          },
        ],
      },
      {
        name: "Core Concepts",
        slug: "core-concepts",
        posts: [
          {
            title: "Instance & Reactivity",
            slug: "vue-instance-and-reactivity",
          },
          {
            title: "Template Syntax & Directives",
            slug: "vue-template-syntax-and-directives",
          },
          {
            title: "Computed Properties & Watchers",
            slug: "vue-computed-properties-and-watchers",
          },
          {
            title: "Methods vs Computed vs Watchers",
            slug: "vue-methods-vs-computed-vs-watchers",
          },
          {
            title: "Lifecycle Hooks",
            slug: "vue-lifecycle-hooks",
          },
        ],
      },
      {
        name: "Components",
        slug: "components",
        posts: [
          {
            title: "Components Basics",
            slug: "vue-components-basics",
          },
          {
            title: "Props & Custom Events",
            slug: "vue-props-and-custom-events",
          },
          {
            title: "Slots",
            slug: "vue-slots",
          },
          {
            title: "Provide & Inject",
            slug: "vue-provide-and-inject",
          },
          {
            title: "Dynamic & Async Components",
            slug: "vue-dynamic-and-async-components",
          },
        ],
      },
      {
        name: "Forms & User Input",
        slug: "forms",
        posts: [
          {
            title: "Form Input Bindings",
            slug: "vue-form-input-bindings",
          },
        ],
      },
      {
        name: "Composition API",
        slug: "composition-api",
        posts: [
          {
            title: "Composition API & Setup",
            slug: "vue-composition-api-and-setup",
          },
          {
            title: "Reactive & Ref",
            slug: "vue-reactive-and-ref",
          },
          {
            title: "Composables",
            slug: "vue-composables",
          },
        ],
      },
      {
        name: "Routing & State",
        slug: "routing-state",
        posts: [
          { title: "Vue Router", slug: "vue-router" },
          {
            title: "Pinia State Management",
            slug: "vue-pinia",
          },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          {
            title: "Custom Directives",
            slug: "vue-custom-directives",
          },
          {
            title: "Transitions & Animations",
            slug: "vue-transitions-and-animations",
          },
          {
            title: "Vue with TypeScript",
            slug: "vue-with-typescript",
          },
          {
            title: "Performance Optimization",
            slug: "vue-performance-optimization",
          },
          { title: "Testing", slug: "vue-testing" },
          {
            title: "Deployment",
            slug: "vue-deployment",
          },
        ],
      },
    ],
  },
  {
    name: "Laravel",
    slug: "laravel",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is Laravel?", slug: "what-is-laravel" },
          {
            title: "Installation & Setup",
            slug: "laravel-installation-setup",
          },
          {
            title: "Directory Structure",
            slug: "laravel-directory-structure",
          },
        ],
      },
      {
        name: "Routing & Controllers",
        slug: "routing-controllers",
        posts: [
          { title: "Routing", slug: "laravel-routing" },
          { title: "Controllers", slug: "laravel-controllers" },
          { title: "Middleware", slug: "laravel-middleware" },
        ],
      },
      {
        name: "Views & Blade",
        slug: "views-blade",
        posts: [
          {
            title: "Blade Templates",
            slug: "laravel-blade-templates",
          },
          {
            title: "Views & Components",
            slug: "laravel-views-and-components",
          },
        ],
      },
      {
        name: "Database & Eloquent",
        slug: "database-eloquent",
        posts: [
          {
            title: "Database & Migrations",
            slug: "laravel-database-migrations",
          },
          { title: "Eloquent ORM", slug: "laravel-eloquent-orm" },
          {
            title: "Eloquent Relationships",
            slug: "laravel-eloquent-relationships",
          },
        ],
      },
      {
        name: "Forms & Validation",
        slug: "forms-validation",
        posts: [
          {
            title: "Forms & Validation",
            slug: "laravel-forms-and-validation",
          },
          {
            title: "File Uploads & Storage",
            slug: "laravel-file-uploads",
          },
        ],
      },
      {
        name: "Auth",
        slug: "auth",
        posts: [
          {
            title: "Authentication",
            slug: "laravel-authentication",
          },
          {
            title: "Authorization (Gates & Policies)",
            slug: "laravel-authorization",
          },
        ],
      },
      {
        name: "API Development",
        slug: "api-development",
        posts: [
          { title: "Building REST APIs", slug: "laravel-rest-api" },
          {
            title: "API Authentication",
            slug: "laravel-api-authentication",
          },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          {
            title: "Queues & Jobs",
            slug: "laravel-queues-and-jobs",
          },
          {
            title: "Events & Listeners",
            slug: "laravel-events-and-listeners",
          },
          { title: "Caching", slug: "laravel-caching" },
          { title: "Testing (PHPUnit & Pest)", slug: "laravel-testing" },
          {
            title: "Deployment & Best Practices",
            slug: "laravel-deployment",
          },
        ],
      },
    ],
  },
  {
    name: "Next.js",
    slug: "nextjs",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is Next.js?", slug: "what-is-nextjs" },
          { title: "Why Next.js?", slug: "why-nextjs" },
          {
            title: "Installation & Setup",
            slug: "nextjs-installation-setup",
          },
          {
            title: "Directory Structure",
            slug: "nextjs-directory-structure",
          },
        ],
      },
      {
        name: "Routing",
        slug: "routing",
        posts: [
          { title: "App Router", slug: "nextjs-app-router" },
          {
            title: "Dynamic Routes & Layouts",
            slug: "nextjs-dynamic-routes-and-layouts",
          },
        ],
      },
      {
        name: "Data & Components",
        slug: "data-components",
        posts: [
          {
            title: "Server vs Client Components",
            slug: "nextjs-server-vs-client-components",
          },
          {
            title: "Data Fetching & Caching",
            slug: "nextjs-data-fetching-and-caching",
          },
          {
            title: "Server Actions",
            slug: "nextjs-server-actions",
          },
        ],
      },
      {
        name: "API & Middleware",
        slug: "api-middleware",
        posts: [
          {
            title: "Route Handlers & API Routes",
            slug: "nextjs-route-handlers",
          },
          {
            title: "Middleware",
            slug: "nextjs-middleware",
          },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          {
            title: "SEO & Metadata",
            slug: "nextjs-seo-and-metadata",
          },
          {
            title: "Image Optimization",
            slug: "nextjs-image-optimization",
          },
          {
            title: "Authentication",
            slug: "nextjs-authentication",
          },
          {
            title: "Performance & Optimization",
            slug: "nextjs-performance",
          },
          {
            title: "Deployment",
            slug: "nextjs-deployment",
          },
        ],
      },
    ],
  },
  {
    name: "Node.js",
    slug: "nodejs",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is Node.js?", slug: "what-is-nodejs" },
          { title: "Why Node.js?", slug: "why-nodejs" },
          {
            title: "Installation & Setup",
            slug: "nodejs-installation-setup",
          },
        ],
      },
      {
        name: "Core Concepts",
        slug: "core-concepts",
        posts: [
          { title: "Event Loop", slug: "nodejs-event-loop" },
          { title: "Modules & Require", slug: "nodejs-modules-and-require" },
          {
            title: "npm & Package Management",
            slug: "nodejs-npm-and-package-management",
          },
        ],
      },
      {
        name: "Async Programming",
        slug: "async-programming",
        posts: [
          {
            title: "Callbacks, Promises & Async/Await",
            slug: "nodejs-callbacks-promises-async-await",
          },
          { title: "Streams & Buffers", slug: "nodejs-streams-and-buffers" },
        ],
      },
      {
        name: "File & Network",
        slug: "file-and-network",
        posts: [
          { title: "File System (fs)", slug: "nodejs-file-system" },
          { title: "HTTP Module", slug: "nodejs-http-module" },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          { title: "Error Handling", slug: "nodejs-error-handling" },
          {
            title: "Security Best Practices",
            slug: "nodejs-security-best-practices",
          },
        ],
      },
    ],
  },
  {
    name: "Express.js",
    slug: "expressjs",
    icon: FileCode2,
    posts: [],
    subcategories: [
      {
        name: "Getting Started",
        slug: "getting-started",
        posts: [
          { title: "What is Express.js?", slug: "what-is-expressjs" },
          {
            title: "Installation & Setup",
            slug: "expressjs-installation-setup",
          },
        ],
      },
      {
        name: "Core Concepts",
        slug: "core-concepts",
        posts: [
          { title: "Routing", slug: "expressjs-routing" },
          { title: "Middleware", slug: "expressjs-middleware" },
          {
            title: "Request & Response",
            slug: "expressjs-request-and-response",
          },
        ],
      },
      {
        name: "Building APIs",
        slug: "building-apis",
        posts: [
          { title: "REST API", slug: "expressjs-rest-api" },
          {
            title: "Authentication & Security",
            slug: "expressjs-authentication-security",
          },
          {
            title: "File Upload & Static Files",
            slug: "expressjs-file-upload-and-static-files",
          },
        ],
      },
      {
        name: "Advanced",
        slug: "advanced",
        posts: [
          { title: "Error Handling", slug: "expressjs-error-handling" },
          { title: "Template Engines", slug: "expressjs-template-engines" },
          {
            title: "Performance & Best Practices",
            slug: "expressjs-performance-and-best-practices",
          },
        ],
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [langSectionOpen, setLangSectionOpen] = useState(false);
  const [expandedLangs, setExpandedLangs] = useState<string[]>([]);
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
                  {(categorySubmenuPosts[slug] ?? []).map((post) => (
                    <Link
                      key={post.slug}
                      href={`/post/${slug}/${post.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className={`block py-1.5 text-xs transition-colors ${
                        pathname === `/post/${slug}/${post.slug}`
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
                  ({
                    name,
                    slug,
                    icon: LangIcon,
                    posts,
                    subcategories = [],
                  }) => {
                    const langPostSlugs = [
                      ...posts.map((post) => post.slug),
                      ...subcategories.flatMap((sub) =>
                        sub.posts.map((post) => post.slug),
                      ),
                    ];
                    const isLangActive = langPostSlugs.some(
                      (postSlug) => pathname === `/post/languages/${postSlug}`,
                    );

                    return (
                      <div key={slug}>
                        {/* Language item (e.g. TypeScript) */}
                        <button
                          onClick={() => toggleLang(slug)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                            isLangActive
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
                            {subcategories.map((sub) => {
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
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* Second Divider */}
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
