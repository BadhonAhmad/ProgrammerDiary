---
title: "Data Consistency: Keeping Distributed Data in Sync"
date: "2026-04-17"
tags: ["system-design", "consistency", "distributed-systems", "cap-theorem", "eventual-consistency"]
excerpt: "Learn why keeping data consistent across distributed nodes is fundamentally hard — from strong consistency to eventual consistency, and how to choose the right model for your use case."
---

# Data Consistency: Keeping Distributed Data in Sync

You update your profile picture on your phone. You switch to your laptop and still see the old one. Was the update lost? No — the data just hasn't propagated yet. In a distributed system, making sure every node sees the same data at the same time is one of the hardest problems in computer science.

## What is Data Consistency?

**Data consistency** means ensuring that all nodes in a distributed system see and return the same data. When data is replicated across multiple machines, keeping them in sync — despite network delays, failures, and concurrent updates — requires deliberate trade-offs.

```text
Single database:
  Read after write → always sees latest data
  Consistency is guaranteed by the database

Distributed system:
  Write to Node A → replicate to Node B, Node C
  Read from Node B before replication completes → stale data
  Consistency requires coordination and trade-offs
```

## Why Does It Matter?

❌ **Problem:** User transfers $500 from savings to checking. The transfer completes on the primary database, but the read replica hasn't caught up. User checks checking balance — shows old amount. User thinks the transfer failed, tries again. Double transfer. Money lost.

✅ **Solution:** Understanding consistency models lets you pick the right guarantee. For financial operations, you need strong consistency — reads always return latest writes. For social media feeds, eventual consistency is fine — a slight delay is acceptable.

## Consistency Models (Strongest to Weakest)

### Strong Consistency (Linearizable)
```text
Guarantee: After a write completes, ALL subsequent reads return that value
           (or a newer one). No stale reads possible.

Trade-off: Higher latency (must coordinate across replicas)
           Lower availability (must contact majority)

Use cases:
  Financial transactions (bank balances)
  Inventory management (prevent overselling)
  Authentication (login status)
  Auction systems (highest bid)
```

### Sequential Consistency
```text
Guarantee: All nodes see operations in the same order
           (but not necessarily in real-time order)

Trade-off: Less coordination needed than strong consistency
           Operations may appear delayed

Example:
  Node A writes X=1, then X=2
  Node B reads X=1, then later reads X=2
  (Ordered, but Node B saw the old value briefly)
```

### Causal Consistency
```text
Guarantee: Causally related operations are seen in order by all nodes
           Concurrent operations may be seen in different orders

Trade-off: Better performance than sequential consistency
           Preserves cause-and-effect relationships

Example:
  User posts a comment (cause)
  User replies to that comment (effect)
  All nodes see: comment BEFORE reply (causal order preserved)
  Unrelated posts may appear in different orders on different nodes
```

### Eventual Consistency
```text
Guarantee: If no new writes, all replicas eventually converge to the same value
           But at any moment, different replicas may return different values

Trade-off: Highest availability and lowest latency
           Temporary inconsistency is possible

Example:
  DNS: Update a record → takes minutes to hours to propagate globally
  Social media: Like a post → your friend may not see it immediately
  Shopping cart: Add item → may not appear on another device for seconds

Staleness window: typically milliseconds to seconds (varies by system)
```

## CAP Theorem and Consistency

```text
When a network partition occurs, you must choose:

CP (Consistency + Partition Tolerance):
  - Reject some requests to maintain consistency
  - Example: HBase, MongoDB (default), ZooKeeper
  - Use when: stale data is worse than unavailable data

AP (Availability + Partition Tolerance):
  - Always respond, even with potentially stale data
  - Example: Cassandra (default), DynamoDB (eventual reads), CouchDB
  - Use when: downtime is worse than stale data
```

## PACELC Theorem (Extended CAP)

```text
CAP only addresses partition scenarios. PACELC covers normal operation too:

If Partition (P):
  Choose Availability (A) or Consistency (C)

Else (no partition, normal operation):
  Choose Latency (L) or Consistency (C)

This explains why systems behave differently even when everything is working:
  MongoDB:  P → C, else → C (favors consistency)
  Cassandra: P → A, else → L (favors availability and speed)
  DynamoDB:  Configurable per request
```

## Consistency Patterns

### Read-After-Write Consistency
```text
Problem:  User uploads photo → refreshes → doesn't see it
Solution: Route the user who wrote to the primary for subsequent reads

  User A writes → goes to primary
  User A reads  → goes to primary (sees own write)
  User B reads  → goes to replica (may be slightly stale)
```

### Sticky Sessions
```text
Route the same user to the same node consistently

Ensures a user always sees their own writes
Simple but limits load balancing flexibility
```

### Versioning / Vector Clocks
```text
Each update increments a version number

Node A: { value: "Alice", version: [A:2, B:1] }
Node B: { value: "Bob",   version: [A:1, B:2] }

Conflict detected when versions diverge
Application resolves conflict (last-write-wins, merge, or ask user)
```

## Choosing a Consistency Model

```text
Strong consistency when:
  - Data correctness is critical (money, inventory, auth)
  - Stale reads cause real problems
  - You can tolerate slightly higher latency

Eventual consistency when:
  - High availability matters more than instant accuracy
  - Temporary inconsistency is acceptable
  - You need the lowest possible latency
  - Scale matters more than precision (social feeds, analytics)

Configurable when:
  - DynamoDB: strong or eventual per read request
  - Cassandra: consistency level per query (ONE, QUORUM, ALL)
  - MongoDB: read concern and write concern per operation
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Strong consistency** | Every read returns the latest write — no stale data |
| **Eventual consistency** | Replicas converge over time — temporary staleness allowed |
| **CAP theorem** | During partition: choose consistency or availability |
| **PACELC** | Even without partitions: choose latency or consistency |
| **Read-after-write** | User always sees their own writes immediately |
| **Vector clocks** | Track causality and detect conflicts across nodes |
| **Quorum reads/writes** | Read/write from majority for stronger consistency |
| **Trade-off** | Strong = slow but correct. Eventual = fast but stale |

**Strong consistency is a promise — every read is fresh. Eventual consistency is a bet — it'll be right soon, and most of the time that's good enough.**
