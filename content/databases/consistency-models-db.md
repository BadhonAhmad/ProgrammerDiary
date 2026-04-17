---
title: "Consistency Models: How Fresh Is Your Data?"
date: "2026-04-17"
tags: ["databases", "consistency", "distributed-systems", "cap-theorem"]
excerpt: "Learn the different consistency models in databases — from strict serializability to eventual consistency — and how to choose the right one for your use case."
---

# Consistency Models: How Fresh Is Your Data?

You write a comment on a post, refresh the page, and it's gone. Did the write fail? No — your read hit a replica that hasn't caught up yet. The "freshness" of your data depends on the consistency model your database uses. Understanding these models is the key to building systems that behave the way users expect.

## What is a Consistency Model?

A **consistency model** defines the rules and guarantees about when and how updates to data become visible to readers. It's a contract between the database and your application — specifying what you can expect when you read data after a write.

```text
Different guarantees for different needs:

  "I need to see my own writes immediately"  → Read-after-write consistency
  "I need to see everyone's latest writes"    → Strong consistency
  "I'm OK seeing slightly old data"           → Eventual consistency
  "I need transactions to be isolated"        → Serializable isolation
```

## Why Does It Matter?

❌ **Problem:** Your bank app shows $1,000 balance. You transfer $500. The next page still shows $1,000. You panic and transfer again. Now $1,000 is gone. The database used eventual consistency — the read hit a replica before the transfer was replicated.

✅ **Solution:** Choose the right consistency model. For financial operations, use strong consistency — every read returns the latest committed write. For social media feeds, eventual consistency is fine — a slight delay is acceptable and the performance gain is massive.

## Consistency Models Spectrum

### Strong Consistency (Linearizability)
```text
Guarantee: After a write completes, ALL subsequent reads return that value.

  Thread 1: WRITE x = 5  → success
  Thread 2: READ x       → MUST return 5 (never 3, never 4)

How it works:
  Every read must contact the master (or quorum)
  Writes block until all replicas acknowledge

Trade-off:
  ✅ Always fresh data
  ❌ Higher latency (must coordinate)
  ❌ Lower availability (replica down = read fails)

Use: Financial systems, inventory, authentication
```

### Sequential Consistency
```text
Guarantee: All nodes see all operations in the same total order.
           (But the order may not match real-time order)

  Node A: WRITE x=1, then WRITE x=2
  Node B: READ x → could return 1 or 2 (as long as order is consistent)

Less strict than linearizability:
  Operations appear in a consistent order
  But that order might lag behind real time

Use: Distributed logging, collaborative editing
```

### Causal Consistency
```text
Guarantee: Causally related operations seen in order by all nodes.
           Unrelated operations can be seen in any order.

  User posts comment (cause)
  User edits comment (effect of seeing it)
  → ALL nodes see: post before edit (causal order preserved)

  User A posts comment on thread 1
  User B posts comment on thread 2
  → Order between these two doesn't matter (no causal relationship)

Use: Social media, messaging apps, collaborative tools
```

### Eventual Consistency
```text
Guarantee: If no new writes, all replicas eventually converge to same value.
           But at any moment, different replicas may return different values.

  Node A: WRITE x=5
  Node B: READ x → returns 3 (stale, but eventually will return 5)

Convergence time: milliseconds to seconds (depends on system)

Trade-off:
  ✅ Highest availability and lowest latency
  ❌ Reads may return stale data
  ❌ Temporary inconsistencies visible to users

Use: DNS, social feeds, product catalogs, caching
```

### Read-After-Write Consistency
```text
Guarantee: A user always sees their own writes.

  User updates profile picture → refreshes → sees new picture
  (Even if other users see old picture for a few seconds)

Implementation:
  Route user's reads to master after they write
  Or use session stickiness to same replica

Important for: User profiles, settings, content management
```

## Database Isolation Levels

Within a single database, consistency also depends on transaction isolation:

| Isolation Level | Prevents | Anomaly Possible |
|---|---|---|
| **Read Uncommitted** | Nothing | Dirty reads, non-repeatable reads, phantom reads |
| **Read Committed** | Dirty reads | Non-repeatable reads, phantom reads |
| **Repeatable Read** | Dirty + non-repeatable reads | Phantom reads |
| **Serializable** | All anomalies | None — perfect isolation |

```text
Dirty read:         Read uncommitted data from another transaction
Non-repeatable read: Same query returns different results within transaction
Phantom read:       New rows appear in repeated range queries
```

## Choosing a Consistency Model

```text
Ask these questions:

1. Can the user tolerate seeing stale data?
   Yes → eventual consistency (fast, available)
   No  → strong consistency (slower, less available)

2. Must the user see their own writes immediately?
   Yes → read-after-write consistency (route to primary after writes)

3. Do related operations need ordering?
   Yes → causal consistency (preserve cause-and-effect)

4. Are you doing financial or inventory operations?
   Yes → strong consistency + serializable isolation

5. Is your system globally distributed?
   Yes → you MUST accept eventual consistency for some operations
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Strong consistency** | Every read returns the latest write — no stale data |
| **Eventual consistency** | Replicas converge over time — temporary staleness |
| **Causal consistency** | Cause-and-effect ordering preserved |
| **Read-after-write** | User always sees their own writes immediately |
| **Isolation levels** | Transaction consistency within a single database |
| **Serializable** | Perfect isolation — no anomalies possible |
| **Trade-off** | Stronger consistency = higher latency and lower availability |

**Consistency is a spectrum, not a binary — the art is picking the weakest model your users can tolerate, because weaker means faster and more available.**
