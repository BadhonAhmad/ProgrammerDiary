---
title: "SEO & Metadata — Optimizing for Search Engines"
date: "2025-01-01"
tags: ["nextjs", "react", "seo", "metadata", "frontend"]
excerpt: "Learn how to manage SEO in Next.js using the Metadata API. Set page titles, descriptions, Open Graph tags, structured data, and robots directives for optimal search engine visibility."
---

# SEO & Metadata

## Why SEO Matters for Next.js

One of the primary reasons developers choose Next.js over React SPAs is **search engine optimization**. React SPAs start with an empty `<div>` that only gets content after JavaScript executes. Next.js sends fully-rendered HTML to the browser — search engines can read this HTML immediately. But sending HTML is only half the job. You also need proper metadata: titles, descriptions, Open Graph tags for social sharing, and structured data for rich search results.

> **Interview Question:** _"How do you set metadata in Next.js?"_
> Export a `metadata` object (for static metadata) or a `generateMetadata` function (for dynamic metadata) from any `page.tsx` or `layout.tsx`. Next.js automatically inserts these into the `<head>` of the HTML. Child routes inherit parent metadata and can override specific fields. For dynamic routes, `generateMetadata` receives the route params and can fetch data to create page-specific titles and descriptions.

## Static Metadata

Export a `metadata` object from a page or layout:

```tsx
// app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — MyApp",
  description: "Learn about our company, mission, and team.",
};

export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### Complete Metadata Example

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  // Basic
  title: "MyApp — Build Something Amazing",
  description: "A platform for building modern web applications.",

  // Favicon and icons
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  // Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    title: "MyApp — Build Something Amazing",
    description: "A platform for building modern web applications.",
    url: "https://myapp.com",
    siteName: "MyApp",
    images: [
      {
        url: "https://myapp.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "MyApp Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter/X Card
  twitter: {
    card: "summary_large_image",
    title: "MyApp — Build Something Amazing",
    description: "A platform for building modern web applications.",
    images: ["https://myapp.com/og-image.png"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

## Dynamic Metadata

For pages where metadata depends on data (like blog posts):

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from "next";

type Props = {
  params: { slug: string };
};

// Dynamic metadata — runs on the server
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);

  return {
    title: `${post.title} — MyApp Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}
```

## Title Template

Set a title template in the root layout to avoid repeating the app name:

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: "%s — MyApp",   // Child pages fill in %s
    default: "MyApp",          // Fallback when no title is set
  },
};
```

Now child pages only set their specific part:

```tsx
// app/about/page.tsx
export const metadata: Metadata = {
  title: "About Us",  // Becomes "About Us — MyApp"
};

// app/blog/page.tsx
export const metadata: Metadata = {
  title: "Blog",  // Becomes "Blog — MyApp"
};
```

## Structured Data (JSON-LD)

Add rich structured data for better search results:

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: Props) {
  const post = await getPost(params.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author.name,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <h1>{post.title}</h1>
        <p>{post.content}</p>
      </article>
    </>
  );
}
```

## `robots.txt` and `sitemap.xml`

### robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://myapp.com/sitemap.xml

# Block private pages
User-agent: *
Disallow: /dashboard/
Disallow: /api/
```

### Dynamic Sitemap

```tsx
// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const blogEntries = posts.map((post) => ({
    url: `https://myapp.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://myapp.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://myapp.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    ...blogEntries,
  ];
}
```

> **Viva Question:** _"How does Next.js improve SEO compared to a React SPA?"_
> Three ways: (1) **Server-rendered HTML** — search engines receive fully-rendered content instead of an empty `<div>`; (2) **Metadata API** — built-in support for titles, descriptions, Open Graph, and Twitter cards via the `metadata` export; (3) **Built-in sitemap and robots.txt** generation. In a React SPA, you would need to configure all of this manually, and the initial empty HTML would still be a problem for crawlers.

## What's Next?

Let's explore Next.js's powerful Image component and optimization features.

→ Next: [Image Optimization](/post/languages/nextjs-image-optimization)
