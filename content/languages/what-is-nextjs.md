---
title: "What is Next.js? — A Complete Introduction"
date: "2025-01-01"
tags: ["nextjs", "react", "framework", "fullstack", "frontend"]
excerpt: "An introduction to Next.js — the React framework for production. Learn why Next.js exists, what problems it solves, and how it transforms React into a full-stack framework."
---

# What is Next.js?

## The World Before Next.js

To understand why Next.js exists, you need to understand the fundamental problem with plain React applications. React is a **library**, not a framework. It handles one thing brilliantly — rendering UI components. But building a production-ready web application requires much more than rendering UI.

When you create a React app with tools like Create React App or Vite, you get a **Single Page Application (SPA)**. The browser downloads a nearly empty HTML file and a large JavaScript bundle. Then JavaScript runs in the browser to render everything — the content, the layout, the data fetching, all of it. This creates several serious problems:

**Problem 1: Poor SEO.** Search engines like Google send crawlers to read your HTML. But your SPA starts with an empty `<div id="root"></div>`. The actual content only appears after JavaScript executes. While Google's crawler has improved at running JavaScript, it is still slower and less reliable than reading plain HTML. Your beautifully built React application may not appear in search results at all.

**Problem 2: Slow initial load.** The user stares at a blank white screen while the browser downloads, parses, and executes your entire JavaScript bundle before showing anything. On a slow mobile network, this can take several seconds. Studies show that 53% of users abandon a site that takes longer than 3 seconds to load.

**Problem 3: No built-in routing.** React does not include a router. You have to choose, install, and configure one yourself (React Router, TanStack Router, etc.). Every team makes different choices, and there is no standard way to structure pages.

**Problem 4: No built-in data fetching.** React gives you `useEffect` and `useState`, but no standard pattern for fetching data from an API. Should you use `useEffect`? A library like React Query? SWR? Should you fetch on the server or the client? Every project answers these questions differently.

**Problem 5: No image optimization.** Large, unoptimized images are the number one cause of slow websites. React does nothing to help you here — you need to manually compress, resize, and serve responsive images.

Next.js was created by **Vercel** (founded by Guillermo Rauch) in 2016 to solve all of these problems. It takes React — which is excellent at building UIs — and wraps it in a complete framework that handles everything a production application needs.

> **Interview Question:** _"What is Next.js and why does it exist?"_
> Next.js is a full-stack React framework created by Vercel that solves the core problems of plain React SPAs: poor SEO (Next.js renders pages on the server so HTML is sent to the browser), slow initial load (pages are pre-rendered or streamed), and missing features (it provides built-in routing, data fetching, image optimization, API routes, and more). It exists because React is a library, not a framework — it handles UI rendering but leaves everything else to the developer.

## What Next.js Actually Gives You

Think of Next.js as a complete workshop that includes React as one of its tools. React handles the UI components, and Next.js handles everything else:

| Feature | What It Does |
|---------|-------------|
| **Server-Side Rendering (SSR)** | Renders React on the server, sends HTML to the browser |
| **Static Site Generation (SSG)** | Pre-renders pages at build time for maximum performance |
| **App Router** | File-based routing system using the filesystem |
| **Server Components** | React components that run only on the server (zero client JS) |
| **Client Components** | Traditional React components that run in the browser |
| **Server Actions** | Call server-side code directly from components |
| **API Routes** | Build backend API endpoints inside your Next.js project |
| **Image Optimization** | Automatic image compression, resizing, and lazy loading |
| **Font Optimization** | Automatic font loading without layout shift |
| **Middleware** | Run code before a request completes (auth, redirects, etc.) |
| **Built-in CSS Support** | CSS Modules, Tailwind CSS, and CSS-in-JS |
| **SEO & Metadata** | Built-in `<head>` management and Open Graph support |

## How Next.js Works Under the Hood

### Rendering Strategies

Next.js provides multiple rendering strategies, and you can choose a different one for each page:

**Server-Side Rendering (SSR):** When a user requests a page, the server renders the React components into HTML and sends the fully-formed HTML to the browser. The user sees content immediately. Then JavaScript "hydrates" the page — attaching event listeners and making it interactive.

```
User requests /dashboard → Server renders React → HTML sent to browser → User sees content → JS hydrates → Page becomes interactive
```

**Static Site Generation (SSG):** Pages are rendered at build time (when you run `npm run build`). The HTML files are pre-generated and served from a CDN. This is the fastest option because there is zero server computation at request time.

```
Build time: Render React → Generate HTML files → Deploy to CDN
Request time: CDN serves pre-built HTML → Instant response
```

**Incremental Static Regeneration (ISR):** Like SSG, but pages can be updated in the background after a specified time. You get the speed of static pages with the freshness of dynamic content.

```
First request: Serve static HTML from CDN
Background: After 60 seconds, re-render the page and update the CDN
Next request: Serve the freshly regenerated HTML
```

**Streaming SSR:** Instead of waiting for the entire page to render, Next.js can stream HTML to the browser in chunks. The user sees parts of the page as they become ready, rather than waiting for everything.

### The App Router Architecture

Next.js 13 introduced the **App Router** (`app/` directory), which is fundamentally different from the old Pages Router (`pages/` directory). The App Router is built on top of **React Server Components (RSC)** — a paradigm shift where components default to running on the server, and you explicitly opt into client-side rendering when needed.

```
app/
├── layout.tsx          → Wraps all pages (persistent across navigation)
├── page.tsx            → The "/" page
├── loading.tsx         → Loading state for "/"
├── error.tsx           → Error state for "/"
├── about/
│   └── page.tsx        → The "/about" page
├── blog/
│   ├── page.tsx        → The "/blog" page
│   └── [slug]/
│       └── page.tsx    → The "/blog/my-post" page (dynamic route)
└── api/
    └── users/
        └── route.ts    → API endpoint at "/api/users"
```

> **Viva Question:** _"What is the difference between the Pages Router and the App Router in Next.js?"_
> The Pages Router (`pages/` directory) is the original routing system where each file is a route. The App Router (`app/` directory) is the modern system built on React Server Components. Key differences: (1) App Router supports nested layouts that persist across navigation; (2) Server Components are the default — no JavaScript is sent for server components; (3) Built-in loading and error states via special files; (4) Streaming SSR support. The App Router is recommended for all new projects.

## Next.js vs React SPA

| Feature | React SPA (Vite/CRA) | Next.js |
|---------|---------------------|---------|
| **Rendering** | Client-side only | Server + Client (your choice) |
| **SEO** | Poor (empty HTML) | Excellent (server-rendered HTML) |
| **Initial Load** | Slow (waits for JS) | Fast (HTML sent immediately) |
| **Routing** | Third-party library | Built-in (file-based) |
| **Data Fetching** | Manual setup | Built-in patterns |
| **API Backend** | Separate server needed | Built-in API routes |
| **Image Optimization** | Manual | Automatic |
| **Deployment** | Any static host | Vercel (optimized) or any Node server |

## The Next.js Ecosystem

Next.js is part of a larger ecosystem maintained by Vercel and the community:

- **Vercel** — Hosting platform optimized for Next.js (free tier available)
- **Next.js AI SDK** — Build AI-powered applications
- **SWR** — Data fetching library (by Vercel)
- **Turbo** — Rust-based bundler for faster builds
- **Tailwind CSS** — Works perfectly with Next.js
- **Prisma / Drizzle** — Database ORMs that pair well with Next.js
- **Auth.js (NextAuth)** — Authentication library for Next.js
- **tRPC** — End-to-end typesafe APIs with Next.js

## What's Next?

Now that you understand what Next.js is, let's explore why you should choose it over alternatives — and when it might not be the right choice.

→ Next: [Why Next.js?](/post/languages/why-nextjs)
