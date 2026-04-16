---
title: "Next.js Directory Structure — Understanding Your Project"
date: "2025-01-01"
tags: ["nextjs", "react", "project-structure", "frontend"]
excerpt: "Understand every file and folder in a Next.js App Router project. Learn what goes where, the special file conventions, and how the filesystem maps to routes."
---

# Next.js Directory Structure

## Why Understanding Structure Matters

Next.js uses a **filesystem-based routing** system. The way you organize files and folders directly determines your application's routes, layouts, and behavior. This is fundamentally different from React SPAs where you manually configure a router. In Next.js, the filesystem IS the router.

> **Interview Question:** _"Explain the directory structure of a Next.js App Router project."_
> The `app/` directory is the heart of a Next.js project. Each folder represents a route segment, and special files inside define behavior: `page.tsx` is the UI for that route, `layout.tsx` wraps child routes, `loading.tsx` shows a loading state, `error.tsx` handles errors, and `route.ts` defines API endpoints. The `public/` folder holds static assets. Server-only code goes in files without `"use client"`. The structure maps directly to URLs — `app/about/page.tsx` becomes `/about`.

## The Complete Structure

```
my-nextjs-app/
├── public/                     # Static assets (served as-is)
│   ├── images/
│   │   ├── hero.jpg
│   │   └── logo.svg
│   ├── fonts/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout (wraps everything)
│   │   ├── page.tsx            # Home page (/)
│   │   ├── loading.tsx         # Loading state for /
│   │   ├── not-found.tsx       # 404 page
│   │   ├── error.tsx           # Error boundary for /
│   │   ├── about/
│   │   │   └── page.tsx        # /about page
│   │   ├── blog/
│   │   │   ├── page.tsx        # /blog page
│   │   │   ├── loading.tsx     # Loading state for /blog
│   │   │   └── [slug]/
│   │   │       └── page.tsx    # /blog/my-post (dynamic route)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Dashboard-specific layout
│   │   │   ├── page.tsx        # /dashboard page
│   │   │   ├── settings/
│   │   │   │   └── page.tsx    # /dashboard/settings
│   │   │   └── profile/
│   │   │       └── page.tsx    # /dashboard/profile
│   │   └── api/
│   │       ├── users/
│   │       │   └── route.ts    # /api/users endpoint
│   │       └── auth/
│   │           └── route.ts    # /api/auth endpoint
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   └── input.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── sidebar.tsx
│   ├── lib/
│   │   ├── db.ts               # Database connection
│   │   ├── utils.ts            # Utility functions
│   │   └── validations.ts      # Input validation schemas
│   ├── hooks/                  # Custom React hooks
│   │   └── use-auth.ts
│   └── types/                  # TypeScript type definitions
│       └── index.ts
├── .env.local                  # Environment variables (not committed)
├── .env                        # Default environment variables (committed)
├── .eslintrc.json              # ESLint configuration
├── .gitignore
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Special Files in the `app/` Directory

Next.js uses **file convention names** — files with specific names are treated specially:

| File | Purpose | Required? |
|------|---------|-----------|
| `page.tsx` | The UI for a route (makes the folder publicly accessible) | Yes (for a route to exist) |
| `layout.tsx` | Shared layout that wraps child routes | Only root layout is required |
| `loading.tsx` | Loading UI (React Suspense boundary) | No |
| `error.tsx` | Error UI (React Error Boundary) | No |
| `not-found.tsx` | 404 UI when nothing matches | No |
| `route.ts` | API endpoint (no UI, just request/response) | No |
| `template.tsx` | Like layout but re-renders on navigation | No |
| `default.tsx` | Fallback for Parallel Routes | No |

### How They Work Together

When a user visits `/dashboard/settings`, Next.js composes these files from the top down:

```
app/layout.tsx              ← Root layout (always present)
  └── app/dashboard/layout.tsx  ← Dashboard layout
      └── app/dashboard/settings/page.tsx  ← Settings page content
```

Each layout wraps its children, creating nested layouts. The root layout persists across ALL navigation — it is where you define `<html>` and `<body>` tags.

> **Viva Question:** _"What is the difference between `layout.tsx` and `template.tsx` in Next.js?"_
> Both wrap child routes, but `layout.tsx` **persists** across navigation — it renders once and stays mounted, making it ideal for shared navigation and state. `template.tsx` **re-creates** on every navigation — a new instance is mounted each time the user visits a route. Use layouts for persistent UI (nav bars, sidebars), use templates when you need fresh state on each visit (page enter animations, scroll reset).

## The Root Layout

Every Next.js project MUST have a root layout at `app/layout.tsx`:

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/blog">Blog</a>
        </nav>
        <main>{children}</main>
        <footer>&copy; 2025 My App</footer>
      </body>
    </html>
  );
}
```

This is the only place where `<html>` and `<body>` tags should appear. Everything in your app renders inside `{children}`.

## Route Groups

Folders wrapped in parentheses `(folderName)` create **route groups** — they organize code without affecting the URL:

```
app/
├── (marketing)/
│   ├── layout.tsx           ← Marketing-specific layout
│   ├── page.tsx             → /
│   ├── about/
│   │   └── page.tsx         → /about
│   └── pricing/
│       └── page.tsx         → /pricing
└── (dashboard)/
    ├── layout.tsx           ← Dashboard-specific layout
    ├── dashboard/
    │   └── page.tsx         → /dashboard
    └── settings/
        └── page.tsx         → /settings
```

The `(marketing)` and `(dashboard)` folders do NOT appear in the URL. They exist purely to share different layouts between groups of routes.

> **Interview Question:** _"What are Route Groups in Next.js?"_
> Route Groups are folders wrapped in parentheses like `(admin)` that organize routes without affecting the URL. They let you share layouts, error boundaries, and loading states between specific groups of routes without creating extra URL segments. For example, `(marketing)/about/page.tsx` maps to `/about`, not `/(marketing)/about`.

## Private Folders

Folders prefixed with an underscore `_folderName` are **private** — they are completely ignored by the routing system:

```
app/
├── _components/              ← Not a route, just organization
│   ├── header.tsx
│   └── footer.tsx
├── page.tsx                  → /
└── about/
    └── page.tsx              → /about
```

Use private folders to keep components, utilities, and other non-route files alongside the routes they belong to, without them being treated as routes.

## The `public/` Directory

Files in `public/` are served statically without any processing:

- Images, fonts, and other static assets
- `robots.txt` for search engines
- `manifest.json` for PWA
- Files referenced with absolute paths: `/images/hero.jpg`

Unlike `src/assets/` in Vue, Next.js's `public/` files are not processed by a bundler.

## Colocation — Putting Components Near Their Routes

Next.js encourages **colocating** components, tests, and utilities alongside the routes that use them:

```
app/
├── dashboard/
│   ├── components/       ← Components used only by dashboard routes
│   │   ├── stats-card.tsx
│   │   └── chart.tsx
│   ├── _lib/             ← Utilities for dashboard
│   │   └── calculations.ts
│   ├── page.tsx          → /dashboard
│   └── settings/
│       └── page.tsx      → /dashboard/settings
```

This keeps related code together, making it easier to find and maintain. Components in `src/components/` are shared across the entire app.

## What's Next?

Now that you understand the project structure, let's dive into the App Router — Next.js's routing system.

→ Next: [Next.js App Router](/post/languages/nextjs-app-router)
