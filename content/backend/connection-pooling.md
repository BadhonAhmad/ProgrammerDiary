---
title: "Database Connection Pooling: Stop Opening a New Connection for Every Request"
date: "2026-04-17"
tags: ["backend", "database", "connection-pooling", "performance", "PostgreSQL", "Node.js", "Prisma"]
excerpt: "Learn why creating a new database connection per request kills performance, and how connection pooling reuses connections to handle thousands of concurrent requests efficiently."
---

# Database Connection Pooling: Stop Opening a New Connection for Every Request

Each database connection takes 50-100ms to establish, uses memory on both sides, and requires a TCP handshake, authentication, and session setup. Do that 1,000 times per second, and your app spends more time connecting than querying.

## What is Connection Pooling?

**Connection pooling** maintains a set of reusable database connections that stay open and are shared across requests. Instead of opening a new connection for each query and closing it after, the app borrows a connection from the pool, uses it, and returns it.

```text
Without Pooling:
  Request 1 → Open connection → Query → Close connection  (100ms overhead)
  Request 2 → Open connection → Query → Close connection  (100ms overhead)
  Request 3 → Open connection → Query → Close connection  (100ms overhead)

With Pooling:
  App startup → Create pool of 10 connections (open once)
  Request 1 → Borrow from pool → Query → Return to pool  (0ms overhead)
  Request 2 → Borrow from pool → Query → Return to pool  (0ms overhead)
  Request 3 → Borrow from pool → Query → Return to pool  (0ms overhead)
```

## Why Does It Matter?

❌ **Problem:** Imagine a restaurant where every customer walks in, the chef unpacks their knives, preheats the oven, sets up their station, cooks the meal, then tears everything down. Next customer — repeat from scratch. Absurd, right? That's what opening a new database connection per request looks like.

Each PostgreSQL connection forks a new process (or thread) consuming ~10MB of memory. If you have 500 concurrent requests, that's 500 connections × 10MB = 5GB of database memory — just for connection overhead, not even running queries. PostgreSQL starts struggling past ~100-200 active connections.

✅ **Solution:** A pool of 20 connections can serve hundreds of concurrent requests efficiently. Requests borrow a connection, run their query, and return it. The database handles 20 connections (manageable) instead of 500 (overwhelming).

## How Connection Pooling Works

### The Pool Lifecycle

```text
1. App starts → Pool creates min connections (e.g., 5)
2. Request arrives → Borrow a connection from pool
3. Execute query → Return connection to pool
4. More requests than connections? → Request waits (queue)
5. Connection sits idle too long? → Pool closes it
6. Pool running low? → Pool creates more (up to max)
```

### Pool Configuration

```text
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "myapp",
  user: "admin",
  password: "secret",

  // Pool sizing
  min: 5,                // Keep 5 connections always open
  max: 20,               // Never exceed 20 connections

  // Timeouts
  idleTimeoutMillis: 30000,    // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Wait max 5s for available connection

  // Lifecycle
  maxUses: 1000,         // Recycle connection after 1000 queries
});
```

### How Requests Use the Pool

```text
// pg (node-postgres) — automatic checkout/checkin
const result = await pool.query("SELECT * FROM users WHERE id = $1", [42]);

// Or manual checkout for transactions
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("UPDATE accounts SET balance = balance - $1 WHERE id = $2", [100, 1]);
  await client.query("UPDATE accounts SET balance = balance + $1 WHERE id = $2", [100, 2]);
  await client.query("COMMIT");
} catch (err) {
  await client.query("ROLLBACK");
  throw err;
} finally {
  client.release();  // Return to pool — ALWAYS do this
}
```

## Pool Sizing

### How Many Connections Do You Need?

The formula is not "one connection per user." It's based on concurrent queries:

```text
Connections needed = (concurrent queries) × (average query time in seconds) + small buffer

Example:
  100 concurrent requests
  Average query time: 50ms (0.05s)
  Connections = 100 × 0.05 + 5 = 10

That's it. 10 connections can serve 100 concurrent requests.
```

Most applications need **10-30 connections** for the app server pool. The database can support this easily.

### The PostgreSQL Connection Limit

PostgreSQL has a `max_connections` setting (default: 100). Each connection uses ~10MB. More connections means more memory and more context switching.

```text
# postgresql.conf
max_connections = 100

# If you have 5 app servers, each with pool of 20 connections:
# 5 × 20 = 100 connections → You've hit the database limit
# Better: use 10-15 per app server → 5 × 15 = 75 (leaves room)
```

### Max Pool Size Guidelines

| Scenario | Pool Size per App Instance |
|---|---|
| Small app (< 100 concurrent) | 5-10 |
| Medium app (100-500 concurrent) | 10-20 |
| Large app (500+ concurrent) | 20-50 |
| With external pooler (PgBouncer) | Can go higher |

## Connection Pooling in Practice

### With Prisma ORM

Prisma has a built-in connection pool. Configure it in the connection URL:

```text
// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env
// connection_limit = max pool size
// pool_timeout = how long to wait for a connection
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp?connection_limit=20&pool_timeout=10"
```

Prisma manages the pool automatically — no manual checkout/checkin needed.

### With node-postgres (pg)

```text
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool.query for simple queries
app.get("/api/users", async (req, res) => {
  const result = await pool.query("SELECT * FROM users LIMIT 20");
  res.json(result.rows);
});

// Use pool.connect for transactions
app.post("/api/transfer", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // ... transaction queries
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }
});
```

### With MySQL (mysql2)

```text
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "myapp",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,         // Unlimited queue
});

const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [42]);
```

## External Connection Poolers: PgBouncer

When you have many app instances or serverless functions, each maintaining its own pool can overwhelm the database. An **external pooler** sits between your app and PostgreSQL:

```text
Without PgBouncer (5 app servers):
  App 1 (pool: 20) ─┐
  App 2 (pool: 20) ──┤
  App 3 (pool: 20) ──┤→ PostgreSQL (100 connections)
  App 4 (pool: 20) ──┤
  App 5 (pool: 20) ─┘

With PgBouncer:
  App 1 (pool: 20) ─┐
  App 2 (pool: 20) ──┤
  App 3 (pool: 20) ──┤→ PgBouncer → PostgreSQL (25 connections)
  App 4 (pool: 20) ──┤   (multiplexes)
  App 5 (pool: 20) ─┘
```

**PgBouncer** uses **transaction-level pooling** — it assigns a real database connection only for the duration of a transaction, then reassigns it. This lets thousands of app connections share a small number of database connections.

### PgBouncer Modes

| Mode | How It Works | Trade-off |
|---|---|---|
| **Session pooling** | One DB connection per client session | Most compatible, least efficient |
| **Transaction pooling** | Connection assigned per transaction | Best balance, most common |
| **Statement pooling** | Connection assigned per SQL statement | Most efficient, breaks transactions |

Transaction pooling is the sweet spot for most apps.

## Serverless and Connection Pooling

Serverless functions (AWS Lambda, Vercel Functions) create a new process for each invocation. Each process might create its own pool. With many concurrent invocations, you get **connection explosion**:

```text
100 concurrent Lambda functions × 10 connections each = 1,000 connections
PostgreSQL default max = 100 → 💥 Connection refused
```

Solutions:
- Use an external pooler (PgBouncer, Supavisor)
- Keep pool size very small per function (1-2)
- Use HTTP-based database access (PostgREST, Supabase)
- Use serverless-friendly databases (PlanetScale, Neon)

## Common Mistakes

### ❌ Not Releasing Connections

Forgetting to call `client.release()` leaks connections. The pool runs out, and all new requests hang.

```text
// Dangerous — no finally block
const client = await pool.connect();
await client.query("UPDATE users SET name = $1", [name]);
// If this throws, client.release() is never called
client.release();

// Safe — always use try/finally
const client = await pool.connect();
try {
  await client.query("UPDATE users SET name = $1", [name]);
} finally {
  client.release();
}
```

### ❌ Setting Pool Size Too High

More connections ≠ better performance. Past ~100 connections, PostgreSQL spends more time managing them than running queries.

### ❌ No Connection Timeout

Without a timeout, requests hang forever if the pool is exhausted:

```text
const pool = new Pool({
  connectionTimeoutMillis: 5000,  // Fail fast if no connection available
});
```

### ❌ Creating Multiple Pools

Each pool opens its own set of connections. Multiple pools in the same app waste database resources. Use **one pool per database** and share it.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Connection pool** | Reuses database connections instead of creating new ones |
| **min / max** | Minimum always-open and maximum allowed connections |
| **Checkout / release** | Borrow from pool, return when done |
| **Pool sizing** | Most apps need 10-30 connections, not hundreds |
| **PgBouncer** | External pooler — multiplexes many app connections into fewer DB connections |
| **Transaction pooling** | Assigns DB connection per transaction — best balance |
| **Serverless challenge** | Each function = potential pool = connection explosion |
| **Always release** | Leaked connections exhaust the pool |
| **Connection timeout** | Fail fast when pool is empty instead of hanging |

**Opening a database connection is expensive. Reusing one is practically free. Pool your connections.**
