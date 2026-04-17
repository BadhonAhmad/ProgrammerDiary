---
title: "CDN in Backend Systems: Serve Content from Next Door"
date: "2026-04-17"
tags: ["backend", "cdn", "performance", "scalability", "infrastructure", "caching"]
excerpt: "Learn how Content Delivery Networks reduce latency by serving content from servers closest to your users — and why your backend needs one."
---

# CDN in Backend Systems: Serve Content from Next Door

Your server is in New York. Your user is in Tokyo. Data travels 10,000 km at the speed of light. That's 100ms of latency — before the server even processes the request. Multiply that by every image, script, and stylesheet on the page. Now multiply by millions of users worldwide. You need servers closer to your users.

## What is a CDN?

A **CDN** (Content Delivery Network) is a globally distributed network of servers — called **edge servers** or **Points of Presence (PoPs)** — that cache and serve content from locations geographically close to users.

Instead of every user hitting your origin server in one location, they hit the nearest CDN edge server:

```text
Without CDN:
  User in Tokyo ──────────────────────── Origin in New York
                 (10,000 km, ~150ms)

With CDN:
  User in Tokyo ──── CDN Edge in Tokyo ──── Origin in New York
                (local, ~10ms)    (only on cache miss)
```

A CDN typically has hundreds of edge locations worldwide. Cloudflare alone has 300+ PoPs in 100+ countries.

## Why Does It Matter?

❌ **Problem:** Your SaaS app serves a 2MB dashboard bundle from a single server in Virginia. Users in Singapore wait 3 seconds just for the download. Meanwhile, your server handles millions of identical requests for the same static files, burning bandwidth and CPU that could serve actual API requests.

During a traffic spike (product launch, viral content), your single server becomes the bottleneck. Every static file request competes with API calls for server resources.

✅ **Solution:** A CDN caches your static assets at edge servers worldwide. A user in Singapore downloads from the Singapore edge (50ms instead of 3 seconds). Your origin server handles only cache misses and API calls. Bandwidth costs drop. Latency drops. Users are happy.

## How a CDN Works

### The Request Flow

```text
1. User in London requests yoursite.com/logo.png
2. DNS resolves to the nearest CDN edge server (London)
3. CDN edge checks: do I have logo.png cached?
   YES → Return immediately (cache HIT) ✅
   NO  → Fetch from origin server (cache MISS)
        → Origin returns the file
        → CDN caches it at the London edge
        → Return to user
4. Next user in London requests logo.png → cache HIT ✅
```

### Cache Lifecycle

```text
First request (cache MISS):
  User → CDN Edge → Origin Server → CDN Edge → User
  CDN stores a copy locally

Subsequent requests (cache HIT):
  User → CDN Edge → User
  Origin server never sees the request

Cache expiration (TTL reached):
  CDN fetches fresh copy from origin
  New TTL timer starts
```

## What to Serve Through a CDN

### ✅ Perfect for CDN

| Content Type | Why | TTL |
|---|---|---|
| Images, videos | Large, rarely change | Days to months |
| CSS, JavaScript bundles | Change only on deploy | Long + cache busting |
| Fonts | Never change | Months |
| Static HTML pages | Blog posts, docs | Hours to days |
| API responses (public, cacheable) | Same for all users | Minutes to hours |
| File downloads | Installers, PDFs | Days |

### ❌ Not for CDN

| Content Type | Why |
|---|---|
| User-specific API responses | Different for each user |
| Real-time data | Stale data = wrong data |
| Authentication endpoints | Must hit origin |
| POST/PUT/DELETE requests | Mutations must go to origin |
| Small admin-only assets | Not worth caching |

## CDN Strategies for Backend APIs

### Static Content Delivery

The most common CDN use case. Serve all static files through the CDN.

```text
# Before: Static files from origin
https://api.myapp.com/static/logo.png → Origin server

# After: CDN URL for static files
https://cdn.myapp.com/static/logo.png → CDN edge server
```

### API Response Caching

CDNs can cache API responses too — for public, cacheable endpoints.

```text
# Product listing (same for all users)
GET /api/products

Response headers:
  Cache-Control: public, max-age=300, s-maxage=300
  CDN caches this for 5 minutes
```

```text
// Express — set cache headers for public endpoints
app.get("/api/products", async (req, res) => {
  const products = await getProducts();

  res.set({
    "Cache-Control": "public, max-age=300, s-maxage=300",
    "CDN-Cache-Control": "public, max-age=300",
  });

  res.json(products);
});
```

Key headers:

| Header | Who It Controls |
|---|---|
| `Cache-Control: max-age=300` | Browser cache |
| `Cache-Control: s-maxage=300` | CDN cache |
| `CDN-Cache-Control` | CDN-specific override (Cloudflare) |

### Cache Busting for Deployed Assets

When you deploy new code, you need users to get the fresh version — not the cached old one.

```text
# Versioned filenames
/bundle.v1.2.3.js    → Old version (cached, fine)
/bundle.v1.2.4.js    → New version (different URL, fresh fetch)

# Hash-based (better)
/bundle.a3f8b2c.js   → Changes when content changes
```

The filename itself changes with each deploy, so the CDN treats it as a new resource.

### Dynamic Content with Edge Computing

Modern CDNs (Cloudflare Workers, AWS Lambda@Edge) let you run code at the edge:

```text
// Cloudflare Worker — modify response at the edge
export default {
  async fetch(request) {
    const response = await fetch(request);

    // Add security headers at the edge
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");

    return response;
  }
};
```

You can do A/B testing, redirects, personalization, and authentication checks at the edge — without hitting your origin server.

## Setting Up a CDN

### With Cloudflare (Most Popular)

```text
1. Sign up at cloudflare.com
2. Add your domain
3. Update nameservers to Cloudflare's
4. Configure caching rules:
   - Static assets: Cache Everything, TTL 1 month
   - API routes: Bypass cache
   - HTML: Respect Existing Headers
5. Enable Auto Minify (CSS, JS, HTML)
6. Enable Brotli compression
7. Enable HTTP/2 or HTTP/3
```

### With AWS CloudFront

```text
1. Create a CloudFront distribution
2. Set origin = your server (or S3 bucket)
3. Configure behaviors:
   - /api/* → Forward to origin, no caching
   - /static/* → Cache, TTL 86400
   - /* → Cache with shorter TTL
4. Set up custom domain with SSL
5. Use Signed URLs for private content
```

## CDN Performance Metrics

| Metric | Without CDN | With CDN |
|---|---|---|
| Static file latency (local user) | 50ms | 10ms |
| Static file latency (global user) | 300ms+ | 20-50ms |
| Origin server load | 100% | 5-20% |
| Bandwidth cost | High (origin pays) | Lower (CDN absorbs) |
| DDoS protection | On your server | CDN absorbs attack |
| Availability | Single server risk | Global redundancy |

## CDN as a Security Layer

CDNs provide more than speed:

- **DDoS protection** — CDN absorbs volumetric attacks (they see the traffic, not your server)
- **WAF (Web Application Firewall)** — Block SQL injection, XSS, known attack patterns at the edge
- **SSL/TLS** — CDN handles HTTPS termination
- **Bot protection** — Identify and block malicious bots before they reach your server
- **Rate limiting** — CDN enforces rate limits at the edge

## Common CDN Mistakes

### ❌ Caching User-Specific Content

```text
// Dangerous — caches personalized data for ALL users
app.get("/api/user/profile", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600");  // Wrong!
  res.json(req.user);
});

// Correct — don't cache user-specific responses
app.get("/api/user/profile", (req, res) => {
  res.set("Cache-Control", "private, no-cache");
  res.json(req.user);
});
```

### ❌ Not Handling Cache Invalidation

When data changes, the CDN still serves stale content until TTL expires. For critical updates, manually purge the cache:

```text
// Cloudflare API — purge specific URL
POST /zones/{zone_id}/purge_cache
{ "files": ["https://cdn.myapp.com/api/products"] }

// Or purge everything
POST /zones/{zone_id}/purge_cache
{ "purge_everything": true }
```

### ❌ Ignoring CDN Cache Headers

`Cache-Control` and `Expires` headers tell the CDN how long to cache. Without them, the CDN guesses — often incorrectly.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **CDN** | Distributed servers that cache content close to users |
| **Edge server** | CDN node in a specific geographic location |
| **Cache HIT/MISS** | Found in CDN / need to fetch from origin |
| **TTL** | How long CDN keeps content before re-fetching |
| **Cache busting** | Versioned filenames to force fresh downloads |
| **s-maxage** | Cache-Control directive specifically for CDNs |
| **Edge computing** | Run code at CDN edge (Cloudflare Workers) |
| **DDoS protection** | CDN absorbs attack traffic before it reaches you |
| **Purge** | Manually clear CDN cache after updates |

**A CDN moves your content closer to your users — and your users closer to a fast experience.**
