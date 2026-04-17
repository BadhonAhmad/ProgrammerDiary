---
title: "Read Replicas: Scale Reads Without Breaking the Bank"
date: "2026-04-17"
tags: ["databases", "read-replicas", "scaling", "replication", "performance"]
excerpt: "Learn how read replicas offload read queries from your primary database — how they work, how to handle replication lag, and when they're the right scaling solution."
---

# Read Replicas: Scale Reads Without Breaking the Bank

Your application does 100 writes per second but 10,000 reads. Every "view product", "search", "load profile", "check order" hits the same database. The read load is crushing your primary server. Read replicas let you copy your data to additional servers and send all those reads elsewhere.

## What are Read Replicas?

**Read replicas** are copies of a primary database that serve read-only queries. The primary database handles all writes and replicates changes to the replicas. Applications route read queries to replicas and write queries to the primary.

```text
Without read replicas:
  All reads + all writes → Primary database → overwhelmed

With read replicas:
  Writes → Primary
  Reads  → Replica 1 (30% of reads)
        → Replica 2 (30% of reads)
        → Replica 3 (40% of reads)
  Primary load drops dramatically
```

## Why Does It Matter?

❌ **Problem:** Your e-commerce site has 10,000 concurrent users browsing products. Each product page generates 5 database queries. That's 50,000 queries/second just for browsing. The primary database maxes out at 5,000 queries/second. Users see slow pages and timeouts.

✅ **Solution:** Add 10 read replicas. Each handles 5,000 read queries/second. The primary only handles writes (100/sec). Total read capacity: 50,000 queries/second. Users get fast pages, primary stays healthy.

## How Read Replicas Work

### Data Flow
```text
1. Application sends write → Primary database
2. Primary writes to its own storage
3. Primary sends change to replicas (via replication log)
4. Replicas apply the change to their copy
5. Application sends read → Replica → returns data

Write path: App → Primary → Replica (async)
Read path:  App → Replica (direct)
```

### Connection Routing
```text
Application or middleware routes queries:

  WRITE queries (INSERT, UPDATE, DELETE):
    → Route to primary (always)

  READ queries (SELECT):
    → Route to replica (default)
    → Route to primary (if fresh data required)

Implementation:
  - Application-level routing (check query type, pick connection)
  - Proxy/middleware (ProxySQL, PgBouncer, HAProxy)
  - ORM configuration (read/write splitting)
```

## Replication Lag

The biggest challenge with read replicas — they're slightly behind the primary.

```text
Timeline:
  t=0ms   Primary writes: user balance = $100
  t=5ms   Replica 1 receives update
  t=8ms   Replica 2 receives update
  t=12ms  Replica 3 receives update

Between t=0 and t=12:
  Replica 3 might still return balance = $50 (old value)

This is replication lag — typically milliseconds to seconds
```

### Handling Replication Lag

```text
Strategy 1: Read-after-write consistency
  If user just wrote data, route their next reads to primary
  Ensures they always see their own updates
  (Most important for user-facing features)

Strategy 2: Session stickiness
  Route all reads from a user's session to the same replica
  Reduces chance of seeing inconsistent state
  Doesn't help with read-after-write

Strategy 3: Accept staleness
  For analytics, search, feeds — slight staleness is fine
  Document the acceptable staleness window
  Monitor replication lag and alert if it grows

Strategy 4: Wait for replication
  After write, wait until all replicas catch up before confirming
  (Defeats the purpose — adds latency to writes)
```

## Use Cases

```text
Perfect for read replicas:
  ✅ Product catalogs (read-heavy, slight staleness OK)
  ✅ User profiles (read-heavy, read-after-write for owner)
  ✅ Search and filtering (compute-intensive reads)
  ✅ Analytics dashboards (aggregation queries)
  ✅ Reporting (offload from primary)
  ✅ Content management (CMS, blog posts)

Not suitable for:
  ❌ Real-time bidding (must see latest data always)
  ❌ Financial balances (strong consistency required)
  ❌ Inventory for limited items (overselling risk)
  ❌ Write-heavy workloads (replicas don't help writes)
```

## Read Replica Topologies

```text
Single primary, multiple replicas:
  Primary → Replica 1
         → Replica 2
         → Replica 3
  Simple, most common

Cascading replicas:
  Primary → Replica 1 → Replica 2 → Replica 3
  Reduces load on primary (only replicates to Replica 1)
  Higher lag for downstream replicas

Cross-region replicas:
  Primary (US-East) → Replica (EU-West)
                    → Replica (AP-South)
  Lower latency for global users
  Higher replication lag across regions
```

## Monitoring Read Replicas

```text
Key metrics to track:
  - Replication lag (seconds behind primary)
  - Replica query latency
  - Replica connection count
  - Error rate on replicas
  - Replica disk usage (should match primary)

Alert on:
  - Replication lag > threshold (e.g., 5 seconds)
  - Replica stopped replicating
  - Replica disk space low
  - Replica error rate spike
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Read replica** | Read-only copy of primary database for serving read queries |
| **Write → primary** | All writes go to the primary database only |
| **Read → replica** | Read queries distribute across replicas |
| **Replication lag** | Delay between primary write and replica update |
| **Read-after-write** | Route user's reads to primary after their own writes |
| **Cascading replicas** | Chain of replicas — reduces primary load, increases lag |
| **Cross-region** | Replicas in different regions — lower latency globally |
| **Monitor lag** | Alert when replicas fall too far behind |

**Read replicas are the easiest way to scale a database — if 90% of your load is reads, 10 replicas gives you 10x capacity with minimal architecture changes.**
