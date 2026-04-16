---
title: "Server vs Client Components — The Core Paradigm"
date: "2025-01-01"
tags: ["nextjs", "react", "server-components", "client-components", "frontend"]
excerpt: "Understand the fundamental difference between Server Components and Client Components in Next.js. Learn when each is appropriate and how they interact."
---

# Server vs Client Components

## Why This Distinction Exists

This is the single most important concept in modern Next.js. In traditional React, every component runs in the browser — it downloads JavaScript, renders in the browser, and handles interactivity. Next.js 13+ changes this completely with **React Server Components (RSC)**. Now, components default to running on the **server**, and you explicitly opt into client-side rendering only when needed.

This is not a minor feature — it is a fundamental architectural shift that changes how you think about building React applications.

> **Interview Question:** _"What is the difference between Server Components and Client Components in Next.js?"_
> **Server Components** (default) run only on the server. They can access databases, read files, use server-only APIs, and send zero JavaScript to the browser. They cannot use useState, useEffect, or event handlers. **Client Components** (marked with `"use client"`) run on both server (for initial HTML) and client (for interactivity). They can use hooks, event handlers, and browser APIs. Server Components can import and render Client Components, but Client Components cannot import Server Components.

## Server Components — The Default

Every component in the `app/` directory is a **Server Component** by default. No special directive needed.

### What Server Components Can Do

- Access databases directly
- Read files from the filesystem
- Use server-only APIs (crypto, fs, etc.)
- Keep secrets secure (API keys never reach the browser)
- Render other Server Components and Client Components
- Be async (use `await` directly in the component)

### What Server Components Cannot Do

- Use `useState`, `useEffect`, or any React hooks
- Listen to browser events (onClick, onChange)
- Access browser APIs (window, document, localStorage)
- Use custom hooks that depend on state or effects

### A Server Component Example

```tsx
// app/blog/page.tsx — Server Component (default)
import { db } from "@/lib/db";

// This is an ASYNC component — something impossible in client-side React
export default async function BlogPage() {
  // Direct database access — no API needed!
  const posts = await db.post.findMany();

  return (
    <div>
      <h1>Blog</h1>
      {posts.map((post) => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </div>
  );
}
```

Notice what happens here: the component queries the database directly. There is no `useEffect`, no `useState`, no fetch call to an API. The database query happens on the server during rendering, and the resulting HTML is sent to the browser. The browser receives zero JavaScript for this component.

## Client Components — Explicit Opt-In

When you need interactivity (click handlers, form inputs, state), you must explicitly mark a component as a Client Component using the `"use client"` directive at the top of the file:

```tsx
"use client"; // This directive MUST be the first line

import { useState } from "react";

export default function LikeButton() {
  const [liked, setLiked] = useState(false);

  return (
    <button onClick={() => setLiked(!liked)}>
      {liked ? "Liked!" : "Like"}
    </button>
  );
}
```

### What Client Components Can Do

- Use all React hooks (useState, useEffect, useContext, etc.)
- Listen to browser events (onClick, onChange, onSubmit)
- Access browser APIs (window, document, localStorage)
- Use custom hooks

### What Client Components Cannot Do

- Import Server Components directly
- Access databases or filesystem
- Use server-only APIs

## The Boundary Rules

Understanding how Server and Client Components interact is crucial:

```
Server Component
├── Can import and render Server Components  ✅
├── Can import and render Client Components  ✅
├── Can pass props to children               ✅
└── Can be async                             ✅

Client Component
├── Can import and render Client Components  ✅
├── Can import Server Components as children ✅ (via props/slots)
├── Cannot import Server Components directly ❌
└── Cannot be async at top level             ❌
```

### Passing Server Components as Props

A Client Component cannot directly import a Server Component. But a Server Component can **pass** a Server Component to a Client Component as a prop (typically via `children`):

```tsx
// app/page.tsx — Server Component
import InteractiveWrapper from "./interactive-wrapper";
import ServerContent from "./server-content";

export default function Page() {
  return (
    <InteractiveWrapper>
      {/* This Server Component is passed as children to a Client Component */}
      <ServerContent />
    </InteractiveWrapper>
  );
}
```

```tsx
// interactive-wrapper.tsx — Client Component
"use client";

import { useState } from "react";

export default function InteractiveWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle</button>
      {isOpen && children}
    </div>
  );
}
```

## When to Use Which

| Use Server Components When | Use Client Components When |
|---------------------------|---------------------------|
| Fetching data from databases/APIs | Adding interactivity (onClick, onChange) |
| Accessing backend resources | Using state (useState, useReducer) |
| Keeping sensitive info on the server | Using effects (useEffect) |
| Reducing client-side JavaScript | Using browser-only APIs |
| The component has no interactivity | The component needs custom hooks |

### The Decision Flowchart

```
Does the component need interactivity? (onClick, onChange, etc.)
├── NO → Use Server Component (default)
└── YES → Does it need to fetch data?
    ├── YES → Split: Server Component fetches data, passes to Client Component for UI
    └── NO → Use Client Component with "use client"
```

## Practical Pattern: Data Fetching + Interactivity

The most common real-world pattern is splitting data fetching (server) from interactivity (client):

```tsx
// app/dashboard/page.tsx — Server Component
import { db } from "@/lib/db";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  // Server: fetch data
  const stats = await db.stats.findMany();
  const users = await db.user.findMany();

  // Pass data to Client Component for interactivity
  return <DashboardClient stats={stats} users={users} />;
}
```

```tsx
// dashboard-client.tsx — Client Component
"use client";

import { useState } from "react";

export default function DashboardClient({
  stats,
  users,
}: {
  stats: any[];
  users: any[];
}) {
  const [filter, setFilter] = useState("all");

  // Client: handle interactivity
  const filteredUsers = users.filter((u) =>
    filter === "all" ? true : u.role === filter
  );

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Users</option>
        <option value="admin">Admins</option>
      </select>

      <ul>
        {filteredUsers.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

> **Viva Question:** _"Can a Client Component import a Server Component?"_
> Not directly, no. But a Server Component can pass a Server Component to a Client Component as a prop (typically `children`). This pattern lets you keep data fetching in Server Components while adding interactivity via Client Components. The Server Component does the heavy lifting (database queries, file reads), and the Client Component handles user interaction.

## What's Next?

Now let's explore data fetching and caching in Next.js — how to efficiently load data on the server.

→ Next: [Data Fetching & Caching](/post/languages/nextjs-data-fetching-and-caching)
