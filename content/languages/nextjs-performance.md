---
title: "Next.js Performance — Optimization Techniques"
date: "2025-01-01"
tags: ["nextjs", "react", "performance", "optimization", "frontend"]
excerpt: "Learn practical techniques to optimize Next.js application performance. Covers bundle analysis, code splitting, streaming, prefetching, and Core Web Vitals."
---

# Next.js Performance

## Why Performance is Built Into Next.js

Performance is not an afterthought in Next.js — it is a core design principle. Unlike React SPAs where performance optimization is entirely your responsibility, Next.js provides automatic optimizations out of the box: server rendering eliminates the blank-screen problem, automatic code splitting reduces bundle sizes, and the Image component handles lazy loading and format conversion. But as your application grows, you need to understand these optimizations and apply additional techniques.

> **Interview Question:** _"What performance optimizations does Next.js provide out of the box?"_
> (1) **Server-side rendering** — HTML is sent immediately, no blank screen; (2) **Automatic code splitting** — each page loads only its own JavaScript; (3) **Image optimization** — automatic compression, WebP/AVIF conversion, lazy loading via the Image component; (4) **Font optimization** — automatic font loading without layout shift; (5) **Script optimization** — the Script component controls loading strategy; (6) **Link prefetching** — links in the viewport are prefetched automatically; (7) **Static generation** — pages can be pre-rendered at build time for instant responses.

## Automatic Code Splitting

Next.js automatically splits your application. Each page only loads the JavaScript it needs:

```
User visits /about
    → Downloads: framework chunk + /about page chunk
    → Does NOT download: /dashboard chunk, /blog chunk, /settings chunk

User navigates to /blog
    → Downloads: /blog page chunk (on demand)
```

This happens automatically — you do not need to configure anything. Each route segment becomes a separate JavaScript file.

## Prefetching

Next.js automatically prefetches pages linked in the viewport:

```tsx
// Next.js prefetches /about and /blog when these links become visible
<Link href="/about">About</Link>
<Link href="/blog">Blog</Link>
```

When a `<Link>` enters the viewport, Next.js silently loads that page's code and data in the background. By the time the user clicks, the page is already loaded — navigation feels instant.

Disable prefetching for rarely-clicked links:

```tsx
<Link href="/terms" prefetch={false}>Terms of Service</Link>
```

## Streaming and Suspense

Next.js supports **streaming** — sending HTML to the browser in chunks as each section becomes ready. Instead of waiting for the entire page to load, users see content progressively:

```tsx
// app/dashboard/page.tsx
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <div>
      {/* This loads fast — shown immediately */}
      <h1>Dashboard</h1>

      {/* This loads slow — shows fallback while loading */}
      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsChart />
      </Suspense>

      <Suspense fallback={<div>Loading users...</div>}>
        <UserList />
      </Suspense>
    </div>
  );
}

async function AnalyticsChart() {
  const data = await fetchAnalytics(); // Slow query
  return <Chart data={data} />;
}

async function UserList() {
  const users = await fetchUsers(); // Different query
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
```

Each `<Suspense>` boundary streams independently. The fast sections appear immediately while slow sections show their fallback until ready.

## Font Optimization

Use `next/font` for automatic font optimization — no layout shift, no external network requests for fonts:

```tsx
// app/layout.tsx
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

Next.js downloads the font at build time and serves it from your own domain — no request to Google Fonts, no privacy concerns, no layout shift.

## Script Optimization

Control how third-party scripts load:

```tsx
import Script from "next/script";

export default function Layout({ children }) {
  return (
    <>
      {children}

      {/* Load after page becomes interactive */}
      <Script src="https://analytics.example.com/script.js" strategy="afterInteractive" />

      {/* Load when browser is idle */}
      <Script src="https://chat.example.com/widget.js" strategy="lazyOnload" />
    </>
  );
}
```

| Strategy | When It Loads |
|----------|-------------|
| `beforeInteractive` | Before page is interactive (critical scripts) |
| `afterInteractive` | After page is interactive (analytics) |
| `lazyOnload` | When browser is idle (chat widgets, low priority) |
| `worker` | In a web worker (off main thread) |

## Bundle Analysis

Analyze what is in your JavaScript bundles:

```bash
npm install @next/bundle-analyzer --save-dev
```

```typescript
// next.config.ts
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

export default withBundleAnalyzer({
  // ... config
});
```

```bash
ANALYZE=true npm run build
```

This opens two charts showing exactly what JavaScript each page loads.

## Core Web Vitals

Google measures page quality with Core Web Vitals. Next.js helps with all three:

| Metric | What It Measures | How Next.js Helps |
|--------|-----------------|-------------------|
| **LCP** (Largest Contentful Paint) | Loading speed | SSR sends HTML immediately, Image component optimizes hero images |
| **INP** (Interaction to Next Paint) | Responsiveness | Server Components reduce client JS, less work for the browser |
| **CLS** (Cumulative Layout Shift) | Visual stability | Image component requires dimensions, font optimization prevents shift |

## Performance Best Practices Checklist

| Practice | Impact |
|----------|--------|
| Use Server Components by default | Reduces client JS bundle |
| Use `"use client"` only when needed | Minimizes shipped JavaScript |
| Use `loading.tsx` for streaming | Users see content faster |
| Use `<Image>` instead of `<img>` | Automatic optimization |
| Use `next/font` instead of Google Fonts CDN | No layout shift |
| Use `priority` on above-the-fold images | Loads hero images faster |
| Set proper `sizes` on responsive images | Downloads correct size |
| Lazy load heavy Client Components | Reduces initial bundle |
| Use ISR instead of SSR when possible | Faster responses from CDN |
| Analyze bundle with bundle-analyzer | Find unnecessary bloat |

> **Viva Question:** _"What is streaming in Next.js?"_
> Streaming is the ability to send HTML to the browser in chunks as each part of the page becomes ready, rather than waiting for the entire page to complete. Next.js uses React Suspense boundaries to stream: fast sections render immediately while slow sections (like database queries) show a loading fallback. Each Suspense boundary streams independently. This means users see partial content almost instantly instead of waiting for everything to load.

## What's Next?

Finally, let's learn about deploying Next.js applications to production.

→ Next: [Next.js Deployment](/post/languages/nextjs-deployment)
