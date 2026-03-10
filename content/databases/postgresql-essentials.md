---
title: "PostgreSQL Essentials: Beyond Basic CRUD"
date: "2026-02-10"
tags: ["databases", "PostgreSQL", "SQL"]
excerpt: "Level up your PostgreSQL skills with CTEs, window functions, JSON operations, and performance tips that will make you a more effective backend developer."
---

# PostgreSQL Essentials: Beyond Basic CRUD

PostgreSQL is the most advanced open-source relational database. Here are features that go beyond simple SELECT/INSERT.

## Common Table Expressions (CTEs)

CTEs make complex queries readable:

```sql
WITH active_users AS (
  SELECT id, name, email
  FROM users
  WHERE last_login > NOW() - INTERVAL '30 days'
),
user_post_counts AS (
  SELECT user_id, COUNT(*) as post_count
  FROM posts
  GROUP BY user_id
)
SELECT au.name, au.email, COALESCE(upc.post_count, 0) as posts
FROM active_users au
LEFT JOIN user_post_counts upc ON au.id = upc.user_id
ORDER BY posts DESC;
```

## Window Functions

Perform calculations across rows without collapsing them:

```sql
-- Rank users by post count within each department
SELECT
  name,
  department,
  post_count,
  RANK() OVER (PARTITION BY department ORDER BY post_count DESC) as rank
FROM users;
```

## JSON Support

PostgreSQL has first-class JSON support:

```sql
-- Store and query JSON data
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL
);

INSERT INTO events (data) VALUES ('{"type": "click", "page": "/home", "duration": 3.5}');

-- Query JSON fields
SELECT data->>'type' as event_type, data->>'page' as page
FROM events
WHERE data->>'type' = 'click';

-- Index JSON fields
CREATE INDEX idx_events_type ON events ((data->>'type'));
```

## Full-Text Search

```sql
-- Add a tsvector column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

UPDATE posts SET search_vector = to_tsvector('english', title || ' ' || content);

CREATE INDEX idx_posts_search ON posts USING gin(search_vector);

-- Search
SELECT title, ts_rank(search_vector, query) as rank
FROM posts, to_tsquery('english', 'typescript & backend') query
WHERE search_vector @@ query
ORDER BY rank DESC;
```

## Performance Tips

1. **Use EXPLAIN ANALYZE** to understand query plans
2. **Partial indexes** for frequently filtered subsets
3. **Connection pooling** with PgBouncer
4. **VACUUM** regularly (or configure autovacuum)
5. **Use appropriate data types** (don't store everything as TEXT)
