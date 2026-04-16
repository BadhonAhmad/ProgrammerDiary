---
title: "Next.js Middleware — Code Before Every Request"
date: "2025-01-01"
tags: ["nextjs", "react", "middleware", "authentication", "frontend"]
excerpt: "Learn how to use Next.js Middleware to run code before requests complete. Handle authentication, redirects, URL rewriting, and request inspection at the edge."
---

# Next.js Middleware

## What is Middleware?

Middleware is code that runs **before** a request is completed — it sits between the user's request and the page or API that handles it. Think of it as a security checkpoint at the entrance of a building: every visitor passes through it, and it can let them through, redirect them, or block them.

In Next.js, Middleware runs on the **Edge Runtime** (a lightweight JavaScript environment similar to Cloudflare Workers), which means it executes extremely fast at locations close to the user. It is the perfect place for authentication checks, redirects, A/B testing, and request logging.

> **Interview Question:** _"What is Middleware in Next.js and when would you use it?"_
> Middleware is a function that runs before every request reaches your page or API route. It runs on the Edge Runtime (fast, globally distributed). Common uses: (1) **Authentication** — check if a user is logged in before showing protected pages; (2) **Redirects** — send users to different pages based on conditions; (3) **Feature flags** — A/B testing; (4) **Localization** — redirect based on user's language; (5) **Rate limiting** — prevent abuse. It is defined in `middleware.ts` at the project root.

## Creating Middleware

Create a `middleware.ts` (or `.js`) file in your project root (or `src/` if using a src directory):

```typescript
// middleware.ts (or src/middleware.ts)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // This runs before every matched request
  console.log(`Request: ${request.nextUrl.pathname}`);

  // Continue to the page/API as normal
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
```

**Key points:**
- The file must be named `middleware.ts` — Next.js looks for this exact name
- The function must be exported as `middleware`
- The `config.matcher` controls which routes trigger the middleware (without it, middleware runs on every request)

## Authentication Middleware

The most common use case — protecting routes based on authentication:

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Check for an authentication token in cookies
  const sessionToken = request.cookies.get("session-token")?.value;

  // If no token, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists — let the request continue
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

When an unauthenticated user tries to visit `/dashboard`, they are redirected to `/login?callbackUrl=/dashboard`. After logging in, you can redirect them back to where they wanted to go.

## Redirect Examples

```typescript
export function middleware(request: NextRequest) {
  // Simple redirect
  if (request.nextUrl.pathname === "/old-page") {
    return NextResponse.redirect(new URL("/new-page", request.url));
  }

  // Rewrite (URL stays the same, but different content is shown)
  if (request.nextUrl.pathname.startsWith("/blog/2024")) {
    return NextResponse.rewrite(new URL("/archive" + request.nextUrl.pathname, request.url));
  }

  // Continue normally
  return NextResponse.next();
}
```

**Redirect vs Rewrite:**
- **Redirect** — The browser URL changes to the new URL
- **Rewrite** — The browser URL stays the same, but Next.js serves content from a different route

## Setting Headers in Middleware

Pass information from middleware to your pages:

```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Set a custom header that pages can read
  response.headers.set("x-user-id", "12345");
  response.headers.set("x-path", request.nextUrl.pathname);

  return response;
}
```

Read these headers in your page:

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const headersList = headers();
  const userId = headersList.get("x-user-id");

  return <p>User ID from middleware: {userId}</p>;
}
```

## Localization Example

Redirect users to their language-specific version:

```typescript
export function middleware(request: NextRequest) {
  // Check Accept-Language header
  const locale = request.headers
    .get("accept-language")
    ?.split(",")[0]
    ?.split("-")[0] || "en";

  const supportedLocales = ["en", "bn", "es", "fr"];
  const preferredLocale = supportedLocales.includes(locale) ? locale : "en";

  // Redirect to locale-specific path
  if (!request.nextUrl.pathname.startsWith(`/${preferredLocale}`)) {
    return NextResponse.redirect(
      new URL(`/${preferredLocale}${request.nextUrl.pathname}`, request.url)
    );
  }

  return NextResponse.next();
}
```

## Matcher Configuration

The matcher determines which routes trigger the middleware:

```typescript
export const config = {
  matcher: [
    // Match specific paths
    "/dashboard/:path*",

    // Match all paths except API and static files
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

Pattern syntax:
- `:path*` — matches any path segment (zero or more)
- `:path+` — matches one or more segments
- `(.*)` — regex pattern

## Middleware Limitations

Since Middleware runs on the Edge Runtime, it has some restrictions:

- **No access to Node.js APIs** — no `fs`, `crypto` (use Web Crypto instead), or `path`
- **No database access** — you cannot import Prisma or connect to a database
- **Bundle size limit** — middleware should be small and fast
- **No environment variables without prefix** — only standard env vars are available

> **Viva Question:** _"What runtime does Next.js Middleware execute on?"_
> The Edge Runtime. This is a lightweight JavaScript environment based on Web Standards APIs (similar to Cloudflare Workers or Deno). It executes quickly at globally distributed edge locations close to the user. However, it has limitations: no Node.js APIs (no `fs`, no `path`), no direct database access, and strict bundle size limits. This is by design — middleware should be fast and lightweight.

## What's Next?

Let's explore SEO and metadata management in Next.js.

→ Next: [SEO & Metadata](/post/languages/nextjs-seo-and-metadata)
