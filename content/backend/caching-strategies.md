---
title: "Caching Strategies: Stop Asking the Database for the Same Thing"
date: "2026-04-17"
tags: ["backend", "caching", "performance", "scalability", "Redis", "Node.js"]
excerpt: "Learn how caching strategies eliminate redundant work — from simple in-memory caches to distributed systems that handle millions of requests per second."
---

# Caching Strategies: Stop Asking the Database for the Same Thing

You query the database for the top 10 products. It takes 200ms. You query again. Same 200ms. Same result. You query again. Same 200ms. Same result. What if you could just remember the answer?

## What is Caching?

**Caching** is storing the result of an expensive operation so that future requests for the same data can be served faster. Instead of computing or fetching data every time, you keep a copy in a faster, closer storage layer.

Think of it like keeping a textbook on your desk instead of walking to the library every time you need to look something up. The library (database) has everything, but the book on your desk (cache) is right there.

## Why Does It Matter?

❌ **Problem:** Your product listing page gets 1,000 requests per second. Every request hits the database. The database does a full-table scan with joins. Each query takes 150ms. At peak traffic, requests queue up, timeouts happen, and the entire app slows down — even though 99% of these requests want the **exact same data**.

✅ **Solution:** Cache the product listing. The first request hits the database (150ms). The result gets stored in cache. The next 999 requests read from cache (1-5ms). Database load drops by 99.9%. Response time drops from 150ms to 2ms. Everyone wins.

## The Cache Hierarchy

Data can be cached at multiple layers, each progressively faster but smaller:

```text
┌───────────────────────────────────────────────────┐
│  Browser Cache          (~0ms, KBs)               │
│  Static assets, HTTP responses                     │
├───────────────────────────────────────────────────┤
│  CDN Cache              (~10ms, GBs)              │
│  Static files, images, API responses at edge       │
├───────────────────────────────────────────────────┤
│  Application Cache       (~1ms, MBs)              │
│  In-memory (Node.js process)                       │
├───────────────────────────────────────────────────┤
│  Distributed Cache      (~2-5ms, GBs-TBs)         │
│  Redis, Memcached (shared across servers)          │
├───────────────────────────────────────────────────┤
│  Database              (~10-200ms, TBs)            │
│  The actual source of truth                        │
└───────────────────────────────────────────────────┘
```

## Caching Strategies

### 1. Cache-Aside (Lazy Loading)

The most common pattern. The application is responsible for loading data into the cache.

```text
Request comes in
  → Check cache
    → Cache HIT?  Return cached data ✅
    → Cache MISS?  Query database
      → Store result in cache
      → Return data
```

```text
async function getUser(userId) {
  // Check cache first
  const cached = await redis.get(`user:${userId}`);
  if (cached) {
    return JSON.parse(cached);   // Cache HIT
  }

  // Cache MISS — go to database
  const user = await db.user.findById(userId);

  // Store in cache for future requests
  await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);

  return user;
}
```

**Pros:** Simple. Only caches what's actually requested. Resilient — if cache fails, app still works (just slower).

**Cons:** First request is always a cache miss (cold start). Stale data if database changes.

### 2. Write-Through

Every write to the database also writes to the cache. The cache always stays in sync.

```text
Write request
  → Write to cache
  → Write to database
  → Return success
```

```text
async function updateUser(userId, data) {
  // Update database
  const user = await db.user.update(userId, data);

  // Update cache simultaneously
  await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 3600);

  return user;
}
```

**Pros:** Cache never goes stale. Reads are always fast.

**Cons:** Writes are slower (two writes instead of one). Cache stores everything, even data that's rarely read.

### 3. Write-Behind (Write-Back)

Writes go to the cache first. The cache asynchronously writes to the database later.

```text
Write request
  → Write to cache
  → Return success immediately
  → Background: flush to database (batched or delayed)
```

**Pros:** Extremely fast writes. Database writes can be batched.

**Cons:** Risk of data loss if cache crashes before flushing. Complex to implement. Consistency challenges.

### 4. Refresh-Ahead

The cache automatically refreshes popular items **before** they expire.

```text
Cache TTL: 60 minutes
Refresh triggered at: 50 minutes (before expiry)

If the item is accessed between 50-60 min mark:
  → Return stale data immediately
  → Refresh in background
  → Update cache with fresh data
```

**Pros:** Users never see cache misses for popular items. Smooth experience.

**Cons:** Wastes resources refreshing items that might not be accessed again. Complex to predict which items to refresh.

## Cache Invalidation

The hardest problem in caching. When the source data changes, the cache becomes **stale**. You need a strategy to handle this.

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

### Time-Based Expiration (TTL)

Set a **Time-To-Live** on every cache entry. After the TTL expires, the entry is deleted and the next request fetches fresh data.

```text
// Cache for 5 minutes
await redis.set("products:featured", JSON.stringify(products), "EX", 300);
```

**Pros:** Simple. Automatic cleanup.

**Cons:** Data can be stale for up to TTL duration. Short TTL = more database hits. Long TTL = more staleness.

### Event-Based Invalidation

When the database changes, actively delete or update the related cache entry.

```text
async function updateProduct(productId, data) {
  // Update database
  const product = await db.product.update(productId, data);

  // Invalidate cache
  await redis.del(`product:${productId}`);
  await redis.del("products:featured");   // Also invalidate lists

  return product;
}
```

**Pros:** Data stays fresh. No stale reads.

**Cons:** Must track all cache keys related to a resource. Easy to miss a key.

### Cache Busting with Versioned Keys

Include a version number in the cache key. When data changes, increment the version.

```text
// Cache key: user:42:v3
// When user 42 is updated, bump to v4
// Old key expires naturally or gets evicted
```

## What to Cache and What Not to Cache

### ✅ Cache These

| Data Type | Why | TTL |
|---|---|---|
| Product listings | Same for all users, rarely changes | 5-60 min |
| User profiles | Frequently accessed, rarely changes | 10-30 min |
| Config/settings | Changes very infrequently | 1-24 hours |
| Computed aggregates | Expensive to calculate | 5-15 min |
| Static content | Never changes | Days |
| API responses (public) | Identical for all users | 1-60 min |

### ❌ Don't Cache These

| Data Type | Why |
|---|---|
| User-specific real-time data | Changes constantly, stale = bugs |
| Financial transactions | Stale data = wrong balances |
| Authentication tokens | Security risk if cached incorrectly |
| One-time data (password reset) | Used once, then useless |
| Rapidly changing data | Cache would always be stale |

## Cache Eviction Policies

When the cache is full, what gets removed?

| Policy | How It Works | Best For |
|---|---|---|
| **LRU** (Least Recently Used) | Removes the item unused for longest time | General purpose |
| **LFU** (Least Frequently Used) | Removes the item accessed least often | Hot data patterns |
| **FIFO** (First In First Out) | Removes the oldest item | Simple use cases |
| **TTL** | Removes items past their expiration | Time-sensitive data |
| **Random** | Removes a random item | Simple, low overhead |

LRU is the default in most caching systems and works well for most cases.

## Common Caching Mistakes

### ❌ Caching Everything

Not all data benefits from caching. If data is unique per request or changes constantly, caching adds complexity without value.

### ❌ No TTL on Cache Entries

Cache entries without expiration live forever, consuming memory and serving stale data.

### ❌ Cache Thundering Herd

When a popular cache entry expires, hundreds of requests simultaneously hit the database to refresh it.

**Fix:** Use a lock. Only one request fetches from the database; others wait.

```text
async function getUserWithLock(userId) {
  const cached = await redis.get(`user:${userId}`);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const lockAcquired = await redis.set(
    `lock:user:${userId}`, "1", "NX", "EX", 10
  );

  if (lockAcquired) {
    const user = await db.user.findById(userId);
    await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 300);
    await redis.del(`lock:user:${userId}`);
    return user;
  }

  // Another request is fetching — wait and retry
  await sleep(100);
  return getUserWithLock(userId);
}
```

### ❌ Inconsistent Cache Keys

Using different key formats across the codebase leads to duplicate cache entries and missed invalidations.

**Fix:** Centralize key generation.

```text
const cacheKeys = {
  user: (id) => `user:${id}`,
  productList: (filters) => `products:${JSON.stringify(filters)}`,
  featuredProducts: () => "products:featured",
};
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Cache-Aside** | Check cache → miss → fetch from DB → store in cache |
| **Write-Through** | Every DB write also updates cache |
| **Write-Behind** | Write to cache first, async flush to DB |
| **TTL** | Auto-expire cache entries after a time limit |
| **Event-based invalidation** | Delete cache when source data changes |
| **LRU eviction** | Remove least recently used items when cache is full |
| **Thundering herd** | Many requests hit DB simultaneously on cache miss |
| **Cache hierarchy** | Browser → CDN → App → Redis → Database |

**The best database query is the one you never have to make. Cache aggressively, invalidate carefully.**
