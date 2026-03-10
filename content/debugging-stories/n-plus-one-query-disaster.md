---
title: "My First Production Bug: The N+1 Query Disaster"
date: "2026-03-06"
tags: ["debugging-stories", "databases", "performance", "backend"]
excerpt: "How a seemingly innocent code change brought our API to its knees. The story of discovering and fixing the dreaded N+1 query problem in production."
---

# My First Production Bug: The N+1 Query Disaster

It was a Friday afternoon (of course), and our monitoring dashboard lit up like a Christmas tree. API response times went from 200ms to 15 seconds. This is the story of what happened.

## The Innocent Change

I had shipped a "simple" feature — adding author information to the blog posts listing endpoint. My code looked perfectly reasonable:

```typescript
async function getPosts() {
  const posts = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 20');

  // For each post, fetch the author
  const enrichedPosts = await Promise.all(
    posts.map(async (post) => {
      const author = await db.query('SELECT name, avatar FROM users WHERE id = $1', [post.user_id]);
      return { ...post, author: author[0] };
    })
  );

  return enrichedPosts;
}
```

Can you spot the problem?

## The N+1 Query Problem

For 20 posts, this code executes:
- 1 query to get all posts
- **20 queries** to get each author

That's **21 queries** instead of what should be 1 or 2. Now imagine this with 100 posts, or nested relationships.

## The Investigation

When the alerts fired, I checked:

1. **Application logs**: Response times spiking
2. **Database metrics**: Connection pool exhausted, query count through the roof
3. **Slow query log**: Thousands of `SELECT * FROM users WHERE id = ?`

The pattern was clear — our database was drowning in tiny queries.

## The Fix

### Solution 1: JOIN (Best for this case)

```sql
SELECT p.*, u.name as author_name, u.avatar as author_avatar
FROM posts p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 20;
```

One query. Done.

### Solution 2: Batch Loading

```typescript
async function getPosts() {
  const posts = await db.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 20');

  // Get all unique author IDs
  const authorIds = [...new Set(posts.map(p => p.user_id))];

  // Single query for all authors
  const authors = await db.query(
    'SELECT id, name, avatar FROM users WHERE id = ANY($1)',
    [authorIds]
  );

  const authorMap = new Map(authors.map(a => [a.id, a]));

  return posts.map(post => ({
    ...post,
    author: authorMap.get(post.user_id),
  }));
}
```

Two queries total, regardless of post count.

## Lessons Learned

1. **Always check query count**, not just query speed
2. **ORMs can hide N+1 problems** — use query logging in development
3. **Load test before deploying** — this would have been caught
4. **Monitor your database** — connection pool exhaustion is a red flag
5. **Never deploy on Fridays** (just kidding... kind of)

## Prevention

- Use `EXPLAIN ANALYZE` on your queries
- Enable query logging in development
- Set up alerting for unusual query patterns
- Code review with an eye for data access patterns
