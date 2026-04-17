---
title: "Partitioning Strategies: Split Data to Scale"
date: "2026-04-17"
tags: ["system-design", "partitioning", "sharding", "scaling", "database"]
excerpt: "Learn how to split data across multiple storage nodes — by range, by hash, or by geography — so your database can handle datasets too large for one machine."
---

# Partitioning Strategies: Split Data to Scale

One database, one billion rows. Queries take 30 seconds. Indexes don't fit in memory. Backups take hours. The solution isn't a bigger database — it's splitting the data across multiple databases. That's partitioning.

## What is Partitioning?

**Partitioning** (also called **sharding**) splits a large dataset into smaller subsets distributed across multiple nodes. Each node stores and serves a fraction of the total data.

```text
No partitioning:
  1 billion users → 1 database → slow for everyone

Partitioned:
  Users 1-250M → Shard 1
  Users 251M-500M → Shard 2
  Users 501M-750M → Shard 3
  Users 751M-1B → Shard 4

  Each shard handles 1/4 of the queries → 4x faster
```

## Why Does It Matter?

❌ **Problem:** Your user table has 500 million rows. Simple queries take 10 seconds. Adding an index takes hours and locks the table. The database uses 2TB of disk. Backups take a full day. You can't vertically scale anymore — the machine is maxed out.

✅ **Solution:** Partitioning distributes data so each node handles a manageable subset. Queries run on smaller datasets. Indexes fit in memory. Backups complete in parallel. You scale by adding more partitions, not bigger machines.

## Partitioning Strategies

### Hash-Based Partitioning

Hash the partition key and assign to a shard by modulo.

```text
shard = hash(user_id) % num_shards

hash(42) % 4 = 2  → Shard 2
hash(99) % 4 = 3  → Shard 3
hash(15) % 4 = 3  → Shard 3

Pros: Even distribution, simple to implement
Cons: Adding shards requires rehashing all data
Fix: Use consistent hashing to minimize data movement
```

### Range-Based Partitioning

Assign ranges of keys to specific shards.

```text
Users A-F → Shard 1
Users G-M → Shard 2
Users N-S → Shard 3
Users T-Z → Shard 4

Pros: Efficient range queries, easy to understand
Cons: Uneven distribution (many names start with S, few with X)
```

### Directory-Based Partitioning

A lookup table maps each key to its shard.

```text
Lookup table:
  user_42 → Shard 3
  user_99 → Shard 1
  user_15 → Shard 2

Pros: Flexible — move data by updating the lookup table
Cons: Lookup table becomes a bottleneck and single point of failure
```

### Geography-Based Partitioning

Partition by geographic region.

```text
EU users → EU data center
US users → US data center
Asia users → Asia data center

Pros: Data residency compliance, lower latency
Cons: Uneven distribution (more users in some regions)
```

## Consistent Hashing

Adding or removing shards with traditional hashing requires redistributing almost all data. **Consistent hashing** minimizes this:

```text
Traditional:  hash(key) % 4 → adding a 5th shard changes 80% of assignments
Consistent:   Place keys and shards on a ring → adding a shard changes ~25%

Used by: Cassandra, DynamoDB, Memcached, Redis Cluster
```

## Challenges of Partitioning

| Challenge | What Goes Wrong | Solution |
|---|---|---|
| **Hot spots** | Uneven data distribution | Better hash function, consistent hashing |
| **Cross-shard queries** | Joins across partitions are expensive | Denormalize, use CQRS, avoid cross-shard joins |
| **Rebalancing** | Moving data when adding shards | Consistent hashing, plan capacity upfront |
| **Transactions** | ACID doesn't work across shards | Saga pattern, two-phase commit (expensive) |
| **Schema changes** | Must apply to all shards | Automated migration tools |

## When to Partition

```text
✅ Partition when:
  - Single database can't handle the data volume
  - Write throughput exceeds one machine's capacity
  - Data is too large to fit in memory or backup reasonably

❌ Don't partition when:
  - Data fits comfortably on one machine
  - Read-heavy workload (use caching and read replicas instead)
  - Queries frequently span all data (cross-partition queries are slow)
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Partitioning / Sharding** | Split data across multiple storage nodes |
| **Hash-based** | hash(key) % num_shards — even distribution |
| **Range-based** | Key ranges → shards — efficient range queries |
| **Directory-based** | Lookup table maps keys to shards — flexible |
| **Consistent hashing** | Minimizes data movement when adding/removing shards |
| **Hot spots** | Uneven distribution → some shards overloaded |
| **Cross-shard queries** | Expensive — denormalize to avoid them |

**Partitioning is the last scaling tool you should reach for — but when your data outgrows one machine, it's the only tool that works.**
