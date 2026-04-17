---
title: "Database Sharding: Split Your Data to Scale Writes"
date: "2026-04-17"
tags: ["databases", "sharding", "scaling", "horizontal-scaling", "architecture"]
excerpt: "Learn how database sharding splits your data across multiple servers — when to shard, how to pick a shard key, and why it's the most powerful (and complex) scaling strategy."
---

# Database Sharding: Split Your Data to Scale Writes

Read replicas handle read-heavy workloads perfectly. But what if you have millions of writes per second? One primary database still handles all writes — and it's the bottleneck. Sharding splits the data itself across multiple independent databases, each handling its own reads and writes.

## What is Database Sharding?

**Database sharding** (also called horizontal partitioning) splits a large database into smaller, independent pieces called shards. Each shard holds a subset of the data and operates as its own database. Together, all shards contain the complete dataset.

```text
No sharding (one database):
  Users table: 100 million rows on one server
  All reads and writes go to this one server
  Server overwhelmed

With sharding (4 shards):
  Shard 1: Users with names A-F  (25M rows)
  Shard 2: Users with names G-M  (25M rows)
  Shard 3: Users with names N-S  (25M rows)
  Shard 4: Users with names T-Z  (25M rows)
  Each shard handles its own reads and writes independently
  4x write capacity, 4x read capacity
```

## Why Does It Matter?

❌ **Problem:** Your e-commerce platform has 200 million products. The products table is 500GB. Queries take 10 seconds. Writes are queuing up. The single database server can't keep up with both reads and writes. Read replicas only help with reads — writes still hit one server.

✅ **Solution:** Shard the products table across 10 servers. Each shard handles 20 million products. Queries are 10x faster (scanning less data). Writes distribute across 10 servers. The system scales linearly — add more shards as you grow.

## Shard Key: The Most Important Decision

The shard key determines how data is distributed. A bad shard key destroys performance.

### Criteria for a Good Shard Key

```text
✅ Even distribution: Data splits evenly across shards
   (No shard gets 80% of traffic)

✅ Query alignment: Most queries include the shard key
   (Queries hit one shard, not all of them)

✅ Write distribution: Writes spread across shards
   (No single hotspot)

✅ Sufficient cardinality: Many distinct values
   (Can split into many shards as you grow)
```

### Common Shard Key Strategies

```text
Hash-based:
  Shard = hash(user_id) % number_of_shards
  Even distribution guaranteed
  Can't do range queries on shard key
  Adding shards requires rehashing everything

Range-based:
  Shard 1: users 1-1,000,000
  Shard 2: users 1,000,001-2,000,000
  Good for range queries
  Risk of hotspots (recent users all on one shard)

Directory-based:
  Lookup table: user_id → shard_number
  Most flexible — move data between shards easily
  Lookup table becomes its own bottleneck
```

## Sharding Strategies

### Horizontal Partitioning (True Sharding)
```text
Each shard is a separate database server

  Shard 1 (server-1): rows 1-10M
  Shard 2 (server-2): rows 10M-20M
  Shard 3 (server-3): rows 20M-30M

Complete isolation per shard
Maximum scalability
Maximum operational complexity
```

### Vertical Partitioning
```text
Split by feature/table, not by row

  Server 1: Users table (frequently accessed)
  Server 2: Orders table (large, moderate access)
  Server 3: Audit logs (large, infrequent access)

Simpler than horizontal sharding
But doesn't help when one table is too large
```

## Challenges of Sharding

| Challenge | What Goes Wrong |
|---|---|
| **Cross-shard joins** | Can't JOIN data from two shards — must do it in application |
| **Distributed transactions** | Transaction across shards is complex (2PC or Saga) |
| **Resharding** | Adding/removing shards requires moving data — expensive and risky |
| **Hotspots** | Bad shard key = one shard gets all the traffic |
| **Schema changes** | Must apply to every shard — one failure = inconsistency |
| **Query routing** | Application or router must know which shard has the data |
| **Uneven data growth** | Some shards grow faster than others |

## When to Shard

```text
Shard when:
  - Single server can't handle write load
  - Dataset is too large for one machine's storage
  - Read replicas aren't enough (you need more write capacity)
  - Specific partitions have different performance requirements

Don't shard when:
  - Query optimization and indexing can solve the problem
  - Read replicas handle your read-heavy workload
  - Your dataset fits comfortably on one machine
  - Your team can't handle the operational complexity

Sharding is a last resort.
Try everything else first:
  1. Optimize queries and add indexes
  2. Add caching (Redis)
  3. Add read replicas
  4. Then consider sharding
```

## Sharding in Practice

```text
MongoDB:   Built-in sharding with mongos router
           Auto-balancing of chunks across shards
           Shard key choice is critical and immutable

PostgreSQL:  No built-in sharding (use Citus extension)
             Manual sharding via application logic
             Foreign data wrappers for cross-shard queries

MySQL:     Built-in sharding via MySQL Cluster (NDB)
           Manual sharding more common
           Vitess (used by YouTube) for large-scale MySQL sharding

Cassandra: Built-in partitioning (token ranges)
           Consistent hashing for distribution
           Adding nodes triggers automatic rebalancing
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Sharding** | Split data across multiple independent database servers |
| **Shard key** | Determines which shard holds each row — most critical decision |
| **Hash sharding** | Even distribution via hash function — no range queries |
| **Range sharding** | Split by value ranges — good for range queries, risk of hotspots |
| **Cross-shard joins** | Can't JOIN across shards — major limitation |
| **Resharding** | Moving data when adding/removing shards — complex and risky |
| **Hotspot** | One shard getting disproportionate traffic — caused by bad shard key |
| **Shard last** | Try optimization, caching, and replicas before sharding |

**Sharding is like splitting a restaurant into 10 smaller restaurants — each handles its own customers, but coordinating a party across all 10 is a nightmare.**
