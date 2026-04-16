---
title: "Image Optimization — Fast, Responsive Images"
date: "2025-01-01"
tags: ["nextjs", "react", "image", "optimization", "performance", "frontend"]
excerpt: "Learn how to use Next.js's built-in Image component for automatic optimization, lazy loading, responsive images, and preventing Cumulative Layout Shift."
---

# Image Optimization

## Why Image Optimization Matters

Images are the **largest assets** on most web pages. Unoptimized images are the number one cause of slow websites. A typical user uploads a 5MB photo from their phone, and without optimization, that 5MB file gets sent directly to every visitor. Next.js's Image component solves this automatically — it compresses, resizes, converts to modern formats (WebP, AVIF), and serves responsive sizes.

> **Interview Question:** _"How does the Next.js Image component improve performance?"_
> It provides automatic image optimization: (1) **Automatic format conversion** — serves WebP or AVIF when supported; (2) **Responsive sizing** — generates multiple sizes and serves the right one based on the device; (3) **Lazy loading** — images load only when they scroll into view; (4) **Prevents layout shift** — requires width/height so the browser reserves space before the image loads; (5) **Blur placeholders** — shows a blurred preview while loading. Images are optimized on-demand and cached at the edge.

## The `Image` Component

```tsx
import Image from "next/image";

export default function HeroSection() {
  return (
    <Image
      src="/images/hero.jpg"
      alt="Hero image showing our product"
      width={1200}
      height={600}
      priority            // Load immediately (above-the-fold images)
    />
  );
}
```

**Why `width` and `height` are required:** The browser needs to know the aspect ratio before the image loads. Without it, the image starts at 0 height, then jumps to its full size when loaded — causing **Cumulative Layout Shift (CLS)**, a Core Web Vital that Google uses for ranking. By specifying dimensions, the browser reserves the correct space.

## Key Props

| Prop | What It Does |
|------|-------------|
| `src` | Image path (local in `/public` or external URL) |
| `alt` | Alt text for accessibility and SEO (required) |
| `width` / `height` | Dimensions in pixels (or use `fill`) |
| `fill` | Fills parent container (parent needs `position: relative`) |
| `priority` | Preloads the image (use for above-the-fold images) |
| `placeholder` | `"blur"` shows blurred preview while loading |
| `blurDataURL` | Custom blur placeholder image |
| `sizes` | Responsive sizes hint for image selection |
| `quality` | 1-100 (default: 75) |

## Remote Images

For images hosted on external domains, configure allowed domains in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "cdn.example.com",
        pathname: "/images/**",
      },
    ],
  },
};
```

Then use the external URL:

```tsx
<Image
  src="https://images.unsplash.com/photo-1234567890"
  alt="Beautiful landscape"
  width={800}
  height={600}
/>
```

## Fill Mode — Responsive Container

When you want an image to fill its container (like a hero background):

```tsx
<div className="relative w-full h-[400px]">
  <Image
    src="/images/hero.jpg"
    alt="Hero background"
    fill
    className="object-cover"
    priority
  />
  <div className="relative z-10">
    <h1>Welcome</h1>
  </div>
</div>
```

The parent must have `position: relative` and defined dimensions.

## Blur Placeholder

Show a blurred preview while the main image loads:

```tsx
// Static import — blurDataURL is auto-generated
import heroImage from "@/public/images/hero.jpg";

<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur"
/>

// For dynamic/remote images — provide a blurDataURL
<Image
  src={post.coverImage}
  alt={post.title}
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/png;base64,..."
/>
```

## Responsive Images with `sizes`

Tell Next.js what size the image will be at different breakpoints:

```tsx
<Image
  src="/images/product.jpg"
  alt="Product photo"
  width={800}
  height={600}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

This means: "On mobile, the image takes full width. On tablets, half width. On desktop, one-third width." Next.js generates srcsets with appropriate sizes so the browser downloads the smallest image that fills the space.

## What's Next?

Let's explore authentication patterns in Next.js.

→ Next: [Authentication in Next.js](/post/languages/nextjs-authentication)
