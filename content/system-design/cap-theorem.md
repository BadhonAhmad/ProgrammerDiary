---
title: "CAP Theorem: You Can't Have Everything"
date: "2026-04-17"
tags: ["system-design", "CAP-theorem", "fundamentals", "distributed-systems", "consistency"]
excerpt: "Learn the CAP theorem — the fundamental law that says in a distributed system, you can only guarantee two out of three: Consistency, Availability, and Partition Tolerance."
---

# CAP Theorem: You Can't Have Everything

You want your database to always respond (availability), always be correct (consistency), and survive network failures (partition tolerance). You can only pick two. This isn't an engineering limitation — it's a mathematical law.

## What is the CAP Theorem?

The **CAP theorem** states that a distributed system can provide at most **two of three** guarantees simultaneously:

- **Consistency (C):** Every read returns the most recent write or an error. All nodes see the same data at the same time.
- **Availability (A):** Every request receives a response (not an error), even if the data isn't the most recent.
- **Partition Tolerance (P):** The system continues operating despite network failures that prevent communication between nodes.

```text
The three combinations:

CP (Consistency + Partition Tolerance):
  Network splits → reject requests to maintain consistency
  "I'd rather be unavailable than serve wrong data"
  Examples: MongoDB (majority reads), HBase, Redis Cluster

AP (Availability + Partition Tolerance):
  Network splits → serve requests from any node, even if stale
  "I'd rather serve slightly old data than be unavailable"
  Examples: Cassandra, DynamoDB, CouchDB

CA (Consistency + Availability):
  Only possible on a single node (no network = no partitions)
  Not achievable in distributed systems
```

## Why Does It Matter?

❌ **Problem:** Your distributed database replicates data across 3 nodes. Network between Node A and Node B fails (partition). User writes to Node A. Another user reads from Node B. Does Node B return the old data (available but inconsistent) or an error (consistent but unavailable)?

You **must** choose. There is no option that gives you both.

✅ **Solution:** Understanding CAP helps you pick the right database and architecture for your use case. Banking? Choose CP — consistency is non-negotiable. Social media feed? Choose AP — availability and speed matter more than perfect consistency.

## How Partitions Force the Choice

```text
Normal operation (no partition):
  Node A ←sync→ Node B ←sync→ Node C
  All three have identical data
  Both C and A are satisfied

Network partition occurs:
  [Node A] ← ✗ NETWORK FAILURE ✗ → [Node B, Node C]

  User writes to Node A → data updated on A
  User reads from Node B → data NOT updated on B

  Choose:
    CP: Return error on Node B (unavailable, but consistent)
    AP: Return old data from Node B (available, but inconsistent)
```

## Consistency Models

The CAP theorem's "Consistency" is **strong consistency** (linearizability). In practice, there's a spectrum:

```text
Strong consistency (CP systems):
  - Every read returns the latest write
  - All nodes agree before responding
  - Slower (requires coordination)

Eventual consistency (AP systems):
  - Reads may return stale data temporarily
  - All nodes converge to the same state eventually
  - Faster (no coordination needed)

Causal consistency:
  - Related operations are seen in order
  - "User B sees user A's comment before replying to it"
  - Middle ground between strong and eventual
```

## Real-World Examples

| System | CAP Choice | Why |
|---|---|---|
| **Banking system** | CP | Incorrect balances are unacceptable |
| **Social media feed** | AP | Slightly stale posts are fine; downtime is not |
| **Shopping cart** | AP | Show last known cart state; sync later |
| **Inventory system** | CP | Can't oversell the last item |
| **DNS** | AP | Must always resolve; cached/stale records OK |
| **Medical records** | CP | Wrong dosage data could be fatal |

## PACELC: Beyond CAP

CAP only applies during network partitions. **PACELC** extends it to normal operation:

```text
If Partition (P):
  Choose Availability (A) or Consistency (C)
Else (no partition):
  Choose Latency (L) or Consistency (C)

Example: DynamoDB
  Partition → AP (available, eventually consistent)
  Normal   → EL (low latency, reads may be slightly stale)
```

This explains why many "AP" systems still offer strong consistency in normal conditions — they only relax it during partitions.

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **CAP theorem** | Distributed systems choose 2 of 3: Consistency, Availability, Partition Tolerance |
| **Consistency** | All nodes see the same data simultaneously |
| **Availability** | Every request gets a response (not an error) |
| **Partition tolerance** | System works despite network failures |
| **CP systems** | Consistent during partitions — may reject requests |
| **AP systems** | Available during partitions — may serve stale data |
| **Strong consistency** | Every read is up-to-date (slower, requires coordination) |
| **Eventual consistency** | Nodes converge over time (faster, no coordination) |
| **PACELC** | Extended CAP: normal operation = Latency vs Consistency trade-off |

**CAP isn't a choice you make once — it's a choice that shapes every database, every replication strategy, and every failure scenario in your system.**
