---
title: "Next.js Deployment — Shipping to Production"
date: "2025-01-01"
tags: ["nextjs", "react", "deployment", "production", "frontend"]
excerpt: "Learn how to deploy Next.js applications to production. Covers Vercel deployment, self-hosting with Docker, environment variables, and production best practices."
---

# Next.js Deployment

## Why Deployment Strategy Matters

How you deploy your Next.js application affects performance, cost, and complexity. Next.js supports multiple deployment targets, each with different trade-offs. Understanding your options helps you choose the right one for your project.

> **Interview Question:** _"How do you deploy a Next.js application?"_
> The easiest way is **Vercel** — connect your Git repository, and Vercel automatically builds and deploys on every push with zero configuration. For self-hosting, run `next build` then `next start` on a Node.js server. You can also use **Docker** with a multi-stage build (build stage compiles, production stage serves). Key deployment concern: ensure your hosting supports Node.js for SSR and API routes, or use `output: 'export'` for static hosting.

## Vercel — The Recommended Option

Vercel created Next.js and provides the most optimized hosting for it.

### Deploy from Git

1. Push your project to GitHub/GitLab/Bitbucket
2. Go to vercel.com and import your repository
3. Vercel auto-detects Next.js and configures everything
4. Every push to `main` triggers a production deployment
5. Every push to a branch creates a preview deployment (unique URL for testing)

### Deploy from CLI

```bash
npm install -g vercel
vercel
```

### What Vercel Provides

| Feature | What It Does |
|---------|-------------|
| **Edge Network** | Content served from 100+ global locations |
| **Automatic HTTPS** | SSL certificates managed for you |
| **Preview Deployments** | Every PR gets a unique URL for review |
| **Serverless Functions** | API routes run as serverless functions |
| **Image Optimization** | On-demand image processing at the edge |
| **Analytics** | Web Vitals monitoring |
| **Edge Runtime** | Middleware runs at the edge globally |
| **Instant Rollbacks** | One-click rollback to any previous deployment |

## Self-Hosting with Node.js

### Build and Start

```bash
# Build the production bundle
npm run build

# Start the production server
npm run start
```

The production server runs on port 3000 by default. Configure it:

```json
{
  "scripts": {
    "start": "next start -p 4000"
  }
}
```

### Process Management

Use a process manager for reliability:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start npm --name "my-nextjs-app" -- start

# Useful commands
pm2 list          # Show all processes
pm2 logs          # View logs
pm2 restart all   # Restart all processes
pm2 monit         # Monitor CPU/memory
```

## Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

Enable standalone output in `next.config.ts`:

```typescript
const nextConfig: NextConfig = {
  output: "standalone", // Creates a minimal server bundle
};
```

### Build and Run

```bash
docker build -t my-nextjs-app .
docker run -p 3000:3000 my-nextjs-app
```

## Static Export

If your application does not use SSR, API routes, or dynamic server features, you can export it as a fully static site:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: "export",
};
```

```bash
npm run build
# Generates static HTML in the `out/` directory
```

Deploy the `out/` folder to any static host: GitHub Pages, AWS S3, Netlify, or any web server.

**Limitations of static export:**
- No API Routes
- No Server Components with dynamic data
- No Middleware
- No ISR or on-demand revalidation
- No Image Optimization (unless using a third-party loader)

## Environment Variables in Production

```bash
# On Vercel — set in dashboard or CLI
vercel env add DATABASE_URL production

# On self-hosted — use .env.production or environment
DATABASE_URL=postgresql://prod-server:5432/mydb
NEXT_PUBLIC_APP_URL=https://myapp.com
```

**Remember:** `NEXT_PUBLIC_` variables are embedded at build time. Changing them requires a rebuild. Server-only variables can be changed without rebuilding (on self-hosted).

## Production Checklist

| Item | Done? |
|------|-------|
| `npm run build` succeeds with no errors | |
| Environment variables set correctly | |
| Images use `<Image>` component | |
| Fonts use `next/font` | |
| Protected routes have Middleware auth | |
| API routes validate input | |
| Error boundaries (`error.tsx`) in place | |
| 404 page (`not-found.tsx`) exists | |
| `robots.txt` and `sitemap.xml` configured | |
| HTTPS enabled | |
| Error monitoring (Sentry, etc.) configured | |
| Core Web Vitals acceptable (LCP < 2.5s, CLS < 0.1) | |

## Next.js Learning Journey Complete

You now have a comprehensive understanding of Next.js — from what it is and why it exists, through routing, data fetching, authentication, and all the way to deployment. The best way to solidify this knowledge is to build a real project.

Recommended next steps:
- **Build a full-stack blog** with Server Components, Server Actions, and a database
- **Learn tRPC** for end-to-end type safety with Next.js
- **Explore Vercel AI SDK** for building AI-powered applications
- **Study the Next.js repository** on GitHub for advanced patterns
