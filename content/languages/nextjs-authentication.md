---
title: "Authentication in Next.js — Securing Your Application"
date: "2025-01-01"
tags: ["nextjs", "react", "authentication", "auth", "security", "frontend"]
excerpt: "Learn how to implement authentication in Next.js. Covers session-based auth, Auth.js (NextAuth), Middleware protection, and best practices for securing pages and API routes."
---

# Authentication in Next.js

## Why Authentication is Different in Next.js

Authentication in a Next.js application is fundamentally different from a React SPA because your code runs in **two places**: the server (Server Components, Route Handlers, Middleware) and the client (Client Components). You need to think about where authentication checks happen, how session data is shared between server and client, and how to protect both pages and API routes.

> **Interview Question:** _"How do you implement authentication in Next.js?"_
> The recommended approach is: (1) Use a library like **Auth.js (NextAuth)** or **Clerk** for session management; (2) Protect routes using **Middleware** — check for a session cookie before allowing access to protected pages; (3) Access session data in Server Components directly from cookies/headers; (4) For Client Components, pass session data as props from a Server Component. The key principle: authentication checks should happen on the server (Middleware or Server Component), not just on the client.

## Authentication Architecture

```
User requests /dashboard
    → Middleware checks for session cookie
    → No cookie: redirect to /login
    → Cookie exists: continue to page
    → Server Component reads session from cookie
    → Renders page with user-specific data
    → Client Components receive session as prop
```

## Using Auth.js (NextAuth)

Auth.js is the most popular authentication library for Next.js. It handles OAuth providers (Google, GitHub, etc.), credentials-based login, and session management.

### Setup

```bash
npm install next-auth@beta
```

### Auth Configuration

```typescript
// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Verify against your database
        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (user && user.password === hash(credentials.password)) {
          return user;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",     // Custom login page
    error: "/auth/error", // Custom error page
  },
});
```

### API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### Middleware Protection

```typescript
// middleware.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
```

### Accessing Session in Server Components

```tsx
// app/dashboard/page.tsx
import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
    </div>
  );
}
```

### Client Component Session Access

```tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session) {
    return <a href="/login">Sign In</a>;
  }

  return <span>{session.user.name}</span>;
}

// Wrap your app in SessionProvider (in layout)
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

## Common Authentication Patterns

### Protected Route HOC Pattern

```tsx
// components/auth-guard.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session) redirect("/login");
  return session;
}
```

```tsx
// app/admin/page.tsx
import { requireAuth } from "@/components/auth-guard";

export default async function AdminPage() {
  const session = await requireAuth();

  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return <h1>Admin Panel</h1>;
}
```

### Role-Based Access

```typescript
// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Admin-only routes
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Premium-only routes
  if (pathname.startsWith("/premium") && !req.auth?.user?.isPremium) {
    return NextResponse.redirect(new URL("/upgrade", req.url));
  }
});
```

> **Viva Question:** _"Where should authentication checks happen in Next.js?"_
> In **Middleware** for route protection (blocking access to pages before they load) and in **Server Components** for data-level authorization (checking permissions before fetching or displaying data). Never rely solely on client-side checks — a user can bypass JavaScript in the browser. Middleware runs on the server before the page loads, making it the most secure place for authentication gates.

## What's Next?

Let's explore performance optimization techniques for Next.js applications.

→ Next: [Performance & Optimization](/post/languages/nextjs-performance)
