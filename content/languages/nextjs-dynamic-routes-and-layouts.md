---
title: "Dynamic Routes, Loading & Error Handling"
date: "2025-01-01"
tags: ["nextjs", "react", "dynamic-routes", "loading", "error", "frontend"]
excerpt: "Master dynamic routes with generateStaticParams, loading states with Suspense, error boundaries, parallel routes, and intercepting routes in Next.js."
---

# Dynamic Routes, Loading & Error Handling

## Why Loading and Error States Matter

When users navigate to a page, things can go wrong. The server might be slow. The database query might fail. The user might have no internet. Without proper loading and error states, the user sees either a blank screen or a broken layout. Next.js provides built-in conventions for handling both gracefully.

> **Interview Question:** _"How does Next.js handle loading states?"_
> Create a `loading.tsx` file in any route folder. Next.js automatically wraps the page in a React Suspense boundary with this component as the fallback. While the page's server data is being fetched, users see the loading component. Once data is ready, it seamlessly swaps to the actual content. This works with Server Components — no client-side JavaScript needed.

## Loading States with `loading.tsx`

### How It Works

When you create a `loading.tsx` file, Next.js automatically creates a **Suspense boundary** around your page. While the page content is loading (fetching data, rendering on the server), the loading component is shown:

```
app/
├── blog/
│   ├── page.tsx          ← Blog page (may take time to load)
│   └── loading.tsx       ← Shown while blog page loads
```

```tsx
// app/blog/loading.tsx
export default function BlogLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}
```

This creates a **skeleton loader** — a visual placeholder that matches the shape of the real content. It feels fast because the user sees immediate feedback.

### Why Suspense Matters

The key insight: `loading.tsx` is powered by React Suspense. Next.js wraps your page component in a Suspense boundary automatically. When the server is still working on the page, the loading fallback streams to the browser immediately. The user never stares at a blank screen.

```
User clicks /blog
    → Browser immediately shows loading.tsx
    → Server fetches data and renders page.tsx
    → Loading component swaps out for the real content
```

## Error Handling with `error.tsx`

### How It Works

Create an `error.tsx` file to catch runtime errors in your route:

```tsx
// app/blog/error.tsx
"use client"; // Error components MUST be client components

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

**Why error components must be client components:** They need access to the `error` object and the `reset` function, which are client-side features. They also need to be isolated from the server component tree that caused the error.

The `reset` function re-attempts rendering the page. If the error was temporary (network timeout, rate limit), this gives the user a way to retry without refreshing the entire page.

## 404 Pages with `not-found.tsx`

### Route-Level 404

```tsx
// app/blog/[slug]/not-found.tsx
export default function PostNotFound() {
  return (
    <div>
      <h2>Post Not Found</h2>
      <p>The blog post you are looking for does not exist.</p>
      <a href="/blog">Back to Blog</a>
    </div>
  );
}
```

Trigger it from your page:

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation";

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();  // Renders the closest not-found.tsx
  }

  return <article>{post.title}</article>;
}
```

### Global 404

```tsx
// app/not-found.tsx — catches all unmatched routes
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}
```

## Generating Static Params

For dynamic routes, you can tell Next.js which pages to pre-render at build time using `generateStaticParams`:

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  return <article>{post.title}</article>;
}
```

When you run `npm run build`, Next.js pre-renders every blog post into a static HTML file. Users get instant responses, and your server handles zero computation for these pages.

> **Viva Question:** _"What does `generateStaticParams` do?"_
> It tells Next.js which dynamic route values to pre-render at build time. For example, if you return `[{ slug: "hello" }, { slug: "world" }]`, Next.js generates static HTML for `/blog/hello` and `/blog/world` during the build process. This makes those pages load instantly from a CDN. Any slugs not listed will be rendered on-demand when first requested (and optionally cached with ISR).

## Parallel Routes

Parallel routes let you render **multiple pages simultaneously** in the same layout using named "slots":

```
app/
├── dashboard/
│   ├── layout.tsx
│   ├── @analytics/         ← Named slot "analytics"
│   │   └── page.tsx
│   ├── @team/              ← Named slot "team"
│   │   └── page.tsx
│   └── page.tsx
```

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="dashboard">
      {children}
      <div className="grid">
        <section>{analytics}</section>
        <section>{team}</section>
      </div>
    </div>
  );
}
```

Each slot can load independently with its own loading state and error boundary.

## Intercepting Routes

Intercepting routes let you show a modal or overlay for a route without leaving the current page. For example, clicking a photo in a gallery shows a modal overlay, but if you navigate directly to the photo URL, you see the full page:

```
app/
├── feed/
│   └── page.tsx              ← Gallery page
├── @modal/
│   ├── (.)photo/
│   │   └── [id]/
│   │       └── page.tsx      ← Modal version (intercepted)
│   └── default.tsx           ← Empty when no modal is open
└── photo/
    └── [id]/
        └── page.tsx          ← Full page version (direct URL)
```

Convention syntax:
- `(.)` — intercept same level (e.g., `(.)photo`)
- `(..)` — intercept one level up
- `(..)(..)` — intercept two levels up
- `(...)` — intercept from root

> **Interview Question:** _"What are Intercepting Routes in Next.js?"_
> Intercepting routes let you load a different version of a route when navigating from a specific context. The most common use case is a photo gallery: clicking a photo from the feed shows a modal overlay (intercepted route), but navigating directly to the photo URL shows the full standalone page. The `(.)` convention in the folder name tells Next.js to intercept a route at the same level.

## What's Next?

Now let's explore one of the most important concepts in Next.js — the difference between Server Components and Client Components.

→ Next: [Server vs Client Components](/post/languages/nextjs-server-vs-client-components)
