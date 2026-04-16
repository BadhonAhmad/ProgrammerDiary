---
title: "Next.js App Router — File-Based Routing"
date: "2025-01-01"
tags: ["nextjs", "react", "routing", "app-router", "frontend"]
excerpt: "Master the Next.js App Router — the file-based routing system built on React Server Components. Learn how folders become routes, layouts nest, and navigation works."
---

# Next.js App Router

## What is the App Router?

The App Router is Next.js's routing system introduced in version 13. It uses the **filesystem as the router** — every folder inside `app/` becomes a route segment, and every `page.tsx` file becomes a publicly accessible page. There is no routing configuration file. You create folders and files, and Next.js figures out the routes automatically.

This is fundamentally different from React Router (where you manually define routes in code) or Vue Router (where you configure routes in a JavaScript file). In Next.js, the filesystem IS the configuration.

> **Interview Question:** _"How does routing work in Next.js?"_
> Next.js uses filesystem-based routing. Inside the `app/` directory, each folder represents a route segment, and each `page.tsx` file makes that route publicly accessible. For example, `app/blog/page.tsx` maps to `/blog`, and `app/blog/[slug]/page.tsx` maps to `/blog/my-post`. Layouts defined in `layout.tsx` wrap their child routes and persist across navigation. The App Router also supports nested layouts, loading states, error boundaries, and parallel routes — all through file conventions.

## How Routes Map to URLs

```
Filesystem                                URL
─────────────────────────────────────────────────
app/page.tsx                          →  /
app/about/page.tsx                    →  /about
app/blog/page.tsx                     →  /blog
app/blog/[slug]/page.tsx              →  /blog/hello-world
app/dashboard/page.tsx                →  /dashboard
app/dashboard/settings/page.tsx       →  /dashboard/settings
app/shop/[category]/[id]/page.tsx     →  /shop/electronics/42
```

**Key rule:** A folder only becomes a route if it contains a `page.tsx` (or `page.js`) file. Folders without a `page.tsx` file are just organizational — they do not create a URL.

## Page Files

A page is a UI that is unique to a route. It is always the "leaf" of the route tree:

```tsx
// app/blog/page.tsx
export default function BlogPage() {
  return (
    <div>
      <h1>Blog</h1>
      <p>Welcome to our blog</p>
    </div>
  );
}
```

Pages are **React Server Components by default** — they run on the server, render to HTML, and send zero client-side JavaScript. This makes them fast and SEO-friendly.

## Layout Files

A layout is UI that is **shared** between multiple routes. Layouts wrap their child routes and **persist** across navigation (they do not re-render when the user navigates between child routes):

```tsx
// app/blog/layout.tsx
export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="blog-layout">
      <aside>
        <nav>
          <a href="/blog">All Posts</a>
          <a href="/blog/tutorials">Tutorials</a>
          <a href="/blog/news">News</a>
        </nav>
      </aside>
      <section>
        {children}
      </section>
    </div>
  );
}
```

### Nested Layouts

Layouts nest automatically. When a user visits `/dashboard/settings`, Next.js renders:

```
Root Layout (app/layout.tsx)
  └── Dashboard Layout (app/dashboard/layout.tsx)
      └── Settings Page (app/dashboard/settings/page.tsx)
```

The `{children}` prop in each layout receives the next level down. The root layout wraps the dashboard layout, which wraps the page.

### The Root Layout is Special

The root layout (`app/layout.tsx`) is **required** and must include `<html>` and `<body>` tags:

```tsx
// app/layout.tsx — REQUIRED
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Dynamic Routes

Dynamic routes use square brackets `[param]` to match URL segments:

### Single Dynamic Segment

```
app/blog/[slug]/page.tsx  →  /blog/hello-world  →  slug = "hello-world"
                             /blog/my-post       →  slug = "my-post"
```

Access the parameter using the `params` prop:

```tsx
// app/blog/[slug]/page.tsx
export default function BlogPost({ params }: { params: { slug: string } }) {
  return <h1>Reading post: {params.slug}</h1>;
}
```

### Multiple Dynamic Segments

```
app/shop/[category]/[id]/page.tsx  →  /shop/electronics/42
                                      category = "electronics"
                                      id = "42"
```

```tsx
// app/shop/[category]/[id]/page.tsx
export default function ProductPage({
  params,
}: {
  params: { category: string; id: string };
}) {
  return (
    <div>
      <p>Category: {params.category}</p>
      <p>Product ID: {params.id}</p>
    </div>
  );
}
```

### Catch-All Segments

Use `[...slug]` to match multiple segments:

```
app/docs/[...slug]/page.tsx  →  /docs/getting-started       →  slug = ["getting-started"]
                                /docs/api/reference/users    →  slug = ["api", "reference", "users"]
```

### Optional Catch-All

Use `[[...slug]]` to also match the route without any segment:

```
app/docs/[[...slug]]/page.tsx  →  /docs              →  slug = undefined or []
                                  /docs/getting-started → slug = ["getting-started"]
```

> **Viva Question:** _"What is the difference between `[slug]`, `[...slug]`, and `[[...slug]]` in Next.js?"_
> `[slug]` matches exactly one dynamic segment (`/blog/hello` → slug = "hello"). `[...slug]` (catch-all) matches one or more segments (`/docs/a/b` → slug = ["a", "b"]) but requires at least one. `[[...slug]]` (optional catch-all) matches zero or more segments — it also matches the route without any segment (`/docs` → slug = undefined).

## Navigation with `<Link>`

Use Next.js's `<Link>` component for client-side navigation between routes:

```tsx
import Link from "next/link";

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/blog/hello-world">Blog Post</Link>

      {/* Dynamic link */}
      <Link href={`/blog/${post.slug}`}>Read More</Link>

      {/* With query parameters */}
      <Link href="/search?q=nextjs">Search</Link>
    </nav>
  );
}
```

**Why use `<Link>` instead of `<a>`?**
- `<Link>` does client-side navigation — no full page reload
- It prefetches the linked page in the background (when visible in viewport)
- It preserves scroll position and shared layout state
- It shows active state via CSS classes

## Programmatic Navigation

For navigation triggered by code (after form submission, login, etc.):

```tsx
"use client";

import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();

  async function handleLogin() {
    // ... login logic
    router.push("/dashboard");  // Navigate to dashboard
    router.refresh();            // Refresh current route's server data
  }

  return <button onClick={handleLogin}>Login</button>;
}
```

**Important:** `useRouter` from `next/navigation` requires `"use client"` — navigation hooks are client-side only.

> **Interview Question:** _"When do you use `<Link>` vs `useRouter` for navigation?"_
> Use `<Link>` for declarative navigation — links in your navigation bar, breadcrumbs, or within content. It prefetches pages and handles client-side routing automatically. Use `useRouter().push()` for programmatic navigation — after a form submission, login success, or any asynchronous action where you need to redirect based on a result.

## What's Next?

Let's explore dynamic routes in more depth, along with loading states, error handling, and parallel routes.

→ Next: [Dynamic Routes & Layouts](/post/languages/nextjs-dynamic-routes-and-layouts)
