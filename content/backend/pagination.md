---
title: "Pagination: Stop Loading 100,000 Rows at Once"
date: "2026-04-17"
tags: ["backend", "pagination", "performance", "API", "database", "Node.js"]
excerpt: "Learn why loading all data at once kills your app, and how pagination breaks results into manageable chunks using offset, cursor, and keyset strategies."
---

# Pagination: Stop Loading 100,000 Rows at Once

Your API returns 100,000 users. The frontend tries to render them all. The browser freezes. The database crawls. The user sees nothing. This is why pagination exists.

## What is Pagination?

**Pagination** is the practice of dividing a large dataset into smaller, fixed-size chunks (pages) and returning one chunk at a time. Instead of `SELECT * FROM users`, you return 20 users at a time with a way to request the next 20.

Every time you scroll through a Facebook feed, a Twitter timeline, or a product listing on Amazon — you're seeing pagination in action. The app loads a batch, and when you scroll down, it fetches the next batch.

## Why Does It Matter?

❌ **Problem:** You build a user management dashboard. The admin clicks "Users." Your API does `SELECT * FROM users` — all 2 million rows. The database takes 12 seconds. The response is 500 MB. The frontend crashes trying to render a table with 2 million rows. The admin only wanted to see the first 20.

Even at smaller scales, loading everything at once wastes memory, bandwidth, and CPU on every layer — database, server, and browser.

✅ **Solution:** Pagination returns a controlled slice of results. The database works less, the response is smaller, and the frontend renders instantly. The user gets what they need — fast.

## How Pagination Works

### The Core Idea

```text
Client requests:  GET /api/users?page=2&limit=20
Server returns:   20 users (items 21-40)
                  + metadata (total count, hasMore, totalPages)
```

### Response Format

```text
{
  "data": [
    { "id": 21, "name": "Alice" },
    { "id": 22, "name": "Bob" },
    ...
  ],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 2000,
    "totalPages": 100,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Pagination Strategies

### 1. Offset-Based Pagination

The simplest and most common. Skip N rows, take M rows.

```text
-- Page 1 (items 1-20)
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 0;

-- Page 2 (items 21-40)
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 20;

-- Page 5 (items 81-100)
SELECT * FROM users ORDER BY id LIMIT 20 OFFSET 80;
```

```text
// Express + Prisma
app.get("/api/users", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { id: "asc" },
    }),
    prisma.user.count(),
  ]);

  res.json({
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});
```

**Pros:** Simple. Supports jumping to any page. Easy to implement.

**Cons:** Slow for deep pages. `OFFSET 1000000` means the database still scans 1,000,000 rows then discards them. Adding/removing rows between requests causes items to be skipped or duplicated.

### 2. Cursor-Based Pagination

Instead of page numbers, use a **cursor** — a pointer to the last item fetched. The next query starts from that point.

```text
-- First page (no cursor)
SELECT * FROM users ORDER BY id LIMIT 20;

-- Returns items with id 1-20. Cursor = 20.

-- Next page (use last id as cursor)
SELECT * FROM users WHERE id > 20 ORDER BY id LIMIT 20;

-- Returns items 21-40. Cursor = 40.
```

```text
// Express + Prisma
app.get("/api/users", async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const cursor = req.query.cursor
    ? { id: parseInt(req.query.cursor) }
    : undefined;

  const users = await prisma.user.findMany({
    take: limit,
    skip: cursor ? 1 : 0,       // Skip the cursor itself
    cursor: cursor || undefined,
    orderBy: { id: "asc" },
  });

  const nextCursor = users.length > 0
    ? users[users.length - 1].id
    : null;

  res.json({
    data: users,
    pagination: {
      nextCursor,
      hasNext: users.length === limit,
    },
  });
});
```

**Pros:** Consistent results — no skipped/duplicate items when data changes. Fast even for deep pages (database uses index, not scanning). Perfect for infinite scroll.

**Cons:** Can't jump to arbitrary pages. No "page 5 of 10" display. Harder to go backwards.

### 3. Keyset Pagination

Similar to cursor but uses the actual column values as the boundary.

```text
-- First page
SELECT * FROM posts ORDER BY created_at DESC, id DESC LIMIT 20;

-- Next page: use the last item's timestamp and id
SELECT * FROM posts
WHERE created_at < '2024-03-15 10:30:00'
   OR (created_at = '2024-03-15 10:30:00' AND id < 42)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Pros:** Most performant for ordered data. Database uses index directly. No offset scanning.

**Cons:** Complex query construction. Must sort by a unique, indexed column. No random page access.

## Offset vs Cursor: When to Use Which

| Factor | Offset | Cursor |
|---|---|---|
| **Random page access** | ✅ Yes — jump to page 5 | ❌ No — sequential only |
| **Deep pages** | ❌ Slow (scans all previous) | ✅ Fast (indexed lookup) |
| **Consistent results** | ❌ Items may shift on changes | ✅ Stable, no duplicates |
| **Total count** | ✅ Easy to show "Page 3 of 50" | ❌ Needs extra count query |
| **Infinite scroll** | ❌ Awkward fit | ✅ Perfect fit |
| **Implementation** | ✅ Simple | Moderate complexity |

**Rule of thumb:** Use offset for admin dashboards with page numbers. Use cursor for user-facing feeds and infinite scroll.

## Pagination with Filters and Sorting

Pagination gets tricky when combined with filters:

```text
GET /api/users?role=admin&sort=created_at&order=desc&page=2&limit=20
```

```text
// Express + Prisma with filters
app.get("/api/users", async (req, res) => {
  const { role, sort = "id", order = "asc", page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});
```

## Pagination Anti-Patterns

### ❌ Returning Everything and Slicing on the Frontend

```text
// Server: returns ALL users
const users = await prisma.user.findMany();
res.json(users);

// Frontend: slices the array
const page = allUsers.slice(0, 20);
```

The database still queries and transfers every row. The server holds everything in memory. Pagination must happen at the **database level**.

### ❌ No LIMIT on Queries

Without `LIMIT`, a query that returns 10 rows today might return 10 million tomorrow. Always cap results.

```text
// Dangerous — no upper bound
app.get("/api/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

// Safe — enforce limits
app.get("/api/users", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
  const users = await prisma.user.findMany({ take: limit });
  res.json(users);
});
```

### ❌ Ignoring Total Count Performance

`COUNT(*)` on large tables is slow. If you don't need "Page 3 of 500," skip the count query and just check `hasNext` by fetching `limit + 1` rows.

```text
const users = await prisma.user.findMany({ take: limit + 1 });
const hasNext = users.length > limit;
if (hasNext) users.pop(); // Remove the extra item
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Pagination** | Split large results into small, fetchable chunks |
| **Offset-based** | `LIMIT + OFFSET` — simple, supports page jumping, slow on deep pages |
| **Cursor-based** | Uses last item's ID as pointer — fast, consistent, no random access |
| **Keyset** | Uses column values as boundary — most performant for ordered data |
| **Limit clamp** | Always set a maximum limit (e.g., 100) to prevent abuse |
| **Database-level** | Paginate in the query, not in application code |
| **hasNext trick** | Fetch `limit + 1` to check if more pages exist without COUNT |
| **Frontend** | Infinite scroll → cursor. Page numbers → offset |

**If your API returns an unbounded list, it's not a feature — it's a performance bomb waiting to explode.**
