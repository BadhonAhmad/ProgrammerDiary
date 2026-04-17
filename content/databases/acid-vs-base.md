---
title: "ACID vs BASE: The Two Philosophies of Database Consistency"
date: "2026-04-17"
tags: ["databases", "acid", "base", "consistency", "transactions", "nosql"]
excerpt: "Learn the difference between ACID and BASE — the two opposing philosophies for database consistency — and when each one is the right choice for your application."
---

# ACID vs BASE: The Two Philosophies of Database Consistency

Your bank transfer must never lose money — that's ACID. Your social media feed can show a like count that's a few seconds old — that's BASE. Two different philosophies for two different problems. Understanding both is essential for choosing the right database for the right job.

## What are ACID and BASE?

**ACID** and **BASE** are two contrasting sets of properties that describe how databases handle consistency, especially during failures and concurrent operations.

```text
ACID (Relational databases — PostgreSQL, MySQL):
  Prioritize correctness and reliability
  "Every transaction must be perfect"

BASE (NoSQL databases — Cassandra, MongoDB, DynamoDB):
  Prioritize availability and performance
  "Good enough, fast, and always available"
```

## ACID Properties

### Atomicity — All or Nothing
```text
A transaction with 3 operations:
  1. Debit $500 from savings  ✅
  2. Credit $500 to checking  ❌ (fails)
  3. Log the transfer         (never reached)

Without atomicity:  Savings lost $500, checking never received it
With atomicity:    ALL operations rollback — savings unchanged

"Either all operations succeed, or none of them do"
```

### Consistency — Valid State to Valid State
```text
Database has a rule: balance must be >= 0

  Transaction: Transfer $500 from account with $300

Without consistency: Balance becomes -$200 (invalid state)
With consistency:   Transaction rejected (integrity constraint violated)

"Every transaction takes the database from one valid state to another"
```

### Isolation — Transactions Don't Interfere
```text
Two transactions running simultaneously:

  Transaction A: Read balance ($100) → Subtract $50
  Transaction B: Read balance ($100) → Subtract $30

Without isolation:
  A reads $100, B reads $100, A writes $50, B writes $70
  Balance should be $20, but it's $70 (A's subtraction lost)

With isolation:
  A completes fully before B starts (or proper locking)
  Balance correctly becomes $20

"Concurrent transactions behave as if executed sequentially"
```

### Durability — Committed Means Permanent
```text
Transaction commits → power goes out → server restarts

Without durability: All committed data lost
With durability:   All committed data survives (written to disk/WAL)

"Once committed, data survives crashes, power failures, and restarts"
```

## BASE Properties

### Basically Available
```text
The system always responds to requests — but the response might be stale.

  Write goes to one node → returns success immediately
  Other nodes update eventually

"Always get a response, even if it's not the latest data"
```

### Soft State
```text
The system's state can change without new writes — because of replication.

  Node A: x = 5
  Node B: x = 3 (hasn't received update yet)
  (No new writes, but state is changing due to replication catching up)

"State is not fixed — it's always converging"
```

### Eventual Consistency
```text
Given enough time without new writes, all replicas converge to the same value.

  Node A: x = 5 (latest write)
  Node B: x = 3 (stale)
  ... time passes ...
  Node B: x = 5 (caught up)

"The system will eventually be consistent — just not right now"
```

## ACID vs BASE Comparison

| Factor | ACID | BASE |
|---|---|---|
| **Priority** | Correctness | Availability |
| **Consistency** | Strong — always fresh | Eventual — converges over time |
| **Availability** | May block during failures | Always available |
| **Latency** | Higher (must coordinate) | Lower (respond immediately) |
| **Scaling** | Harder (coordination needed) | Easier (nodes independent) |
| **Transactions** | Full transaction support | Limited or no transactions |
| **Best for** | Financial, enterprise, critical data | Social media, IoT, real-time analytics |
| **Examples** | PostgreSQL, MySQL, Oracle | Cassandra, DynamoDB, Couchbase |

## When to Use Which

```text
Choose ACID when:
  - Money is involved (banking, payments, accounting)
  - Data integrity is non-negotiable (medical records, legal)
  - Transactions span multiple operations (order + payment + inventory)
  - Regulatory compliance requires audit trails
  - Business rules must never be violated (stock can't go negative)

Choose BASE when:
  - Massive scale is required (millions of writes/second)
  - Global distribution (multiple regions, 99.99% uptime)
  - Temporary inconsistency is acceptable (social feeds, likes)
  - Schema flexibility is needed (evolving data models)
  - High availability matters more than perfect consistency
```

## The Reality: It's Not Binary

```text
Most modern systems use BOTH:

PostgreSQL:
  ACID by default, but supports read replicas (some eventual consistency)
  Can tune isolation levels per transaction

MongoDB:
  Was BASE by default, now supports multi-document ACID transactions
  Configurable read/write concern per operation

DynamoDB:
  BASE by default, but supports ACID transactions for specific operations
  Choose strong or eventual consistency per read

The trend: databases are becoming configurable
  Choose ACID or BASE per operation, not per database
```

## ACID in Distributed Systems

```text
ACID across multiple databases is expensive:

  Two-Phase Commit (2PC):
    Phase 1: All participants prepare
    Phase 2: All participants commit (or all abort)

  Problems:
    - Slow (multiple round trips)
    - Blocks if coordinator fails
    - Doesn't scale across services

  Modern alternative: Saga pattern
    Break transaction into local steps
    Each step has a compensating action
    No global lock, but eventual consistency
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **ACID** | Atomicity, Consistency, Isolation, Durability — correctness first |
| **BASE** | Basically Available, Soft State, Eventual Consistency — availability first |
| **Atomicity** | All operations in a transaction succeed or all fail |
| **Consistency** | Database always moves between valid states |
| **Isolation** | Concurrent transactions don't interfere with each other |
| **Durability** | Committed data survives crashes |
| **Eventual consistency** | Replicas converge over time — temporary staleness |
| **Not binary** | Modern databases let you choose per operation |

**ACID is a contract — the database promises perfection. BASE is a handshake — the database promises it'll get there eventually. Pick the right contract for your data.**
