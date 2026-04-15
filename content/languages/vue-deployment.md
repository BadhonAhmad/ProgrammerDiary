---
title: "Vue Deployment — Shipping to Production"
date: "2025-01-01"
tags: ["vue", "javascript", "deployment", "production", "frontend"]
excerpt: "Learn how to build and deploy Vue.js applications. Covers production builds, hosting on Vercel/Netlify, Docker, Nginx configuration, and environment-specific settings."
---

# Vue Deployment

## Why Deployment Matters

Writing a Vue application is only half the job. Getting it into users' hands requires building optimized production bundles, configuring servers, and ensuring your SPA works correctly in production. A misconfigured deployment means broken routes, slow loading, or missing assets.

> **Interview Question:** _"How do you deploy a Vue application?"_
> Run `npm run build` to create an optimized production bundle in the `dist/` folder. Then deploy this folder to any static hosting service (Vercel, Netlify, AWS S3, GitHub Pages). The key configuration is ensuring the server redirects all routes to `index.html` for SPA routing to work. Environment variables use the `VITE_` prefix and are baked in at build time.

## Building for Production

### The Build Command

```bash
npm run build
```

This runs `vite build`, which:
1. **Compiles** all `.vue` files into JavaScript
2. **Tree-shakes** unused code
3. **Minifies** JavaScript and CSS
4. **Hashes** file names for cache busting (`assets/index-a3b2c1.js`)
5. **Splits** code into optimal chunks
6. Outputs everything to the `dist/` folder

### The `dist/` Folder

```
dist/
├── index.html                 # Entry HTML
├── favicon.ico
└── assets/
    ├── index-a3b2c1.js        # Main application code (hashed)
    ├── index-d4e5f6.css       # Styles (hashed)
    ├── vendor-g7h8i9.js       # Third-party libraries
    ├── DashboardView-j2k3l4.js  # Lazy-loaded route (separate chunk)
    └── logo-m5n6o7.svg        # Static assets (hashed)
```

Hashed filenames mean you can set aggressive cache headers (`Cache-Control: max-age=31536000`) — when files change, the hash changes, and browsers download the new version automatically.

### Preview the Build Locally

```bash
npm run preview
```

This starts a local server with the production build, letting you verify everything works before deploying.

## Environment Variables

```bash
# .env.development (used during npm run dev)
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=MyApp (Dev)

# .env.production (used during npm run build)
VITE_API_URL=https://api.myapp.com
VITE_APP_TITLE=MyApp
```

```javascript
// Access in code
const apiUrl = import.meta.env.VITE_API_URL
const appTitle = import.meta.env.VITE_APP_TITLE
```

> **Viva Question:** _"When are environment variables resolved in a Vue app?"_
> At **build time**, not runtime. Vite replaces `import.meta.env.VITE_*` with their actual values during the build process. This means you need to rebuild your app for each environment (dev, staging, production). They are baked into the JavaScript bundle and cannot be changed after building.

## Deployment Options

### Vercel (Recommended)

Vercel is the easiest deployment option for Vue projects:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments on every push.

Vercel automatically:
- Detects Vite projects
- Runs `npm run build`
- Configures SPA routing
- Serves the `dist/` folder
- Provides HTTPS, CDN, and preview deployments

### Netlify

Create a `netlify.toml` in your project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The `redirects` section is crucial — it ensures all routes are served `index.html` so Vue Router can handle them.

### GitHub Pages

```javascript
// vite.config.js
export default defineConfig({
  base: '/your-repo-name/',  // Required for GitHub Pages
  plugins: [vue()]
})
```

Use the `gh-pages` package:

```bash
npm install -D gh-pages
```

```json
{
  "scripts": {
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
```

### Docker

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name myapp.com;
    root /usr/share/nginx/html;
    index index.html;

    # SPA routing — serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
```

## SPA Routing on the Server

The most common deployment issue: refreshing the page on `/dashboard` returns a 404. This happens because the server looks for a file called `/dashboard` which doesn't exist — it's a client-side route.

**The fix:** Configure the server to serve `index.html` for all routes.

| Platform | Configuration |
|----------|--------------|
| **Vercel** | Automatic |
| **Netlify** | `[[redirects]] from = "/*" to = "/index.html" status = 200` |
| **Nginx** | `try_files $uri $uri/ /index.html;` |
| **Apache** | `.htaccess` with `FallbackResource /index.html` |
| **Firebase** | `"rewrites": [{ "source": "**", "destination": "/index.html" }]` |

## Production Checklist

| Item | Done? |
|------|-------|
| `npm run build` succeeds with no errors | |
| Environment variables set correctly | |
| SPA routing works (refresh on any route) | |
| 404 page works for invalid routes | |
| HTTPS enabled | |
| Assets cached with proper headers | |
| Gzip/Brotli compression enabled | |
| Console errors checked in production | |
| Lighthouse score > 90 | |
| Error tracking (Sentry, etc.) configured | |

## Analyzing Production Bundle

```bash
npm install -D rollup-plugin-visualizer
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true, filename: 'bundle-stats.html' })
  ]
})
```

Run `npm run build` to see a visual breakdown of what's in your bundle.

## What's Next?

Congratulations! You now have a comprehensive understanding of Vue.js — from its core reactivity system to deployment. The best way to solidify this knowledge is to build something.

For more advanced topics, explore:
- **Nuxt.js** — Full-stack Vue framework with SSR/SSG
- **VueUse** — Essential composition utilities
- **Vuetify / PrimeVue** — Production-ready component libraries
