---
title: "Database Indexing: Why Your Queries Are Slow"
date: "2026-02-20"
tags: ["system-design", "databases", "performance"]
excerpt: "Understanding database indexing and how it dramatically improves query performance. B-tree indexes, composite indexes, and when not to index."
---

# Database Indexing: Why Your Queries Are Slow

If you've ever wondered why a simple SELECT query takes seconds on a large table, the answer is usually: you're missing an index.

## What is an Index?

Think of a database index like a book's index. Instead of reading every page to find a topic, you look it up in the index and jump directly to the right page.

Without an index, the database performs a **full table scan** — checking every single row.

## How B-Tree Indexes Work

Most databases use B-tree (balanced tree) indexes:

```
                    [50]
                   /    \
              [25]        [75]
             /    \      /    \
          [10,20] [30,40] [60,70] [80,90]
```

- **Lookup**: O(log n) instead of O(n)
- **1 million rows**: ~20 comparisons instead of 1,000,000

## Creating Indexes

```sql
-- Single column index
CREATE INDEX idx_users_email ON users(email);

-- Composite index (order matters!)
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- Unique index
CREATE UNIQUE INDEX idx_users_username ON users(username);
```

## When to Index

✅ Columns used in WHERE clauses frequently
✅ Columns used in JOIN conditions
✅ Columns used in ORDER BY
✅ Foreign key columns

## When NOT to Index

❌ Small tables (full scan is fast enough)
❌ Columns with low cardinality (e.g., boolean, status with 3 values)
❌ Tables with heavy write operations (indexes slow down writes)
❌ Columns rarely used in queries

## The Composite Index Trap

```sql
-- This index: (user_id, created_at)
-- ✅ Works for: WHERE user_id = 1
-- ✅ Works for: WHERE user_id = 1 AND created_at > '2026-01-01'
-- ❌ Does NOT work for: WHERE created_at > '2026-01-01' (leftmost prefix rule)
```

## Monitoring Index Usage

```sql
-- PostgreSQL: check if indexes are being used
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
```

Look for "Index Scan" (good) vs "Seq Scan" (bad).

## Key Takeaway

Indexes are the single most impactful optimization for database performance. Learn to use them wisely.
