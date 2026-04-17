---
title: "Distributed Locking: Only One at a Time Across Machines"
date: "2026-04-17"
tags: ["system-design", "distributed-locking", "distributed-systems", "coordination", "redis"]
excerpt: "Learn how distributed locks ensure only one node performs a critical operation at a time — and why getting it right is harder than it sounds."
---

# Distributed Locking: Only One at a Time Across Machines

Two servers try to withdraw from the same bank account simultaneously. Both read the balance ($100), both decide $50 is available, both deduct $50. Balance goes from $100 to $50 instead of $0. A lock on a single machine prevents this — but these are different machines. You need a distributed lock.

## What is a Distributed Lock?

A **distributed lock** is a synchronization mechanism that ensures only one node in a distributed system can access a resource or perform an operation at a time. It works across multiple machines, unlike traditional mutexes which only work within a single process.

```text
Single machine lock:
  Thread A acquires mutex → processes → releases
  Thread B waits until released
  (Operating system handles it)

Distributed lock:
  Node A acquires lock → processes → releases
  Node B waits (or fails fast) until released
  (A coordination service handles it — Redis, ZooKeeper, etc.)
```

## Why Does It Matter?

❌ **Problem:** Your cron job runs on 3 servers for redundancy. At midnight, all 3 try to generate the daily report simultaneously. You get 3 duplicate reports emailed to 10,000 users. Or worse, two nodes try to debit the same account concurrently, creating inconsistent balances.

✅ **Solution:** Before running the critical operation, each node tries to acquire a distributed lock. Only one succeeds. The others skip or wait. One report generated, one account debited — regardless of how many nodes are running.

## How Distributed Locks Work

### Basic Acquire-Release
```text
1. Acquire:  Node tries to create a lock entry in coordination service
2. Success:  Only one node succeeds → proceeds with operation
3. Failure:  Other nodes wait, retry, or give up
4. Release:  Lock holder finishes → deletes lock entry
5. Next:     Waiting node acquires lock on next attempt
```

### Fencing Tokens
```text
Problem: Lock holder crashes, lock expires, Node B acquires lock
         Node A (crashed) recovers and continues processing
         Now two nodes think they hold the lock

Solution: Fencing tokens (monotonically increasing)
  Node A acquires lock → token = 1
  Node A crashes → lock expires
  Node B acquires lock → token = 2
  Node A recovers, tries to write with token = 1
  Storage rejects token 1 because it has seen token 2
```

## Implementation Approaches

### Redis (Redlock)
```text
SET resource_name unique_value NX PX 30000

NX: Only set if not exists (acquire lock)
PX 30000: Auto-expire after 30 seconds (prevent deadlocks)
unique_value: UUID to identify the lock holder

Release (Lua script for atomicity):
  if redis.get(key) == my_uuid then
    redis.del(key)
  end

Redlock algorithm (for multiple Redis instances):
  1. Try to acquire lock on N/2+1 Redis instances
  2. Must acquire majority within a time window
  3. If majority acquired → lock held
  4. Otherwise → release all and retry
```

### ZooKeeper
```text
Create ephemeral node: /locks/resource-name/lock-xxxxxx
Ephemeral = auto-deleted if session dies (crash safety)

If created as lowest sequence number → lock acquired
If not → watch the node before yours
When previous node deleted → you get notified → acquire lock

Advantages:
  - Strong guarantees (Zab consensus)
  - Automatic cleanup on session failure
  - Fair queuing (FIFO order)
```

### Database-Based
```text
INSERT INTO locks (resource, holder, expires_at)
VALUES ('report-generation', 'node-A', NOW() + 30s)
ON CONFLICT (resource) DO NOTHING

If insert succeeds → lock acquired
If conflict → someone else holds it

Simple but doesn't scale well under contention
```

## Challenges and Pitfalls

| Challenge | What Can Go Wrong |
|---|---|
| **Crash while holding lock** | Lock never released → deadlock. Fix: TTL/auto-expire |
| **Network partition** | Two nodes in different partitions both think they hold lock. Fix: quorum (Redlock) |
| **Clock drift** | TTL-based expiry depends on clocks. Fix: use monotonic timers |
| **Long-running operations** | Operation outlives lock TTL. Fix: lock renewal (watchdog) |
| **Thundering herd** | Many nodes retry simultaneously when lock released. Fix: exponential backoff + jitter |

## When to Use Distributed Locks

```text
Use when:
  - Preventing duplicate work across nodes (cron jobs, report generation)
  - Serializing access to a shared resource (bank account, inventory)
  - Ensuring only one node performs a migration or initialization
  - Coordinating exclusive operations in a cluster

Don't use when:
  - You can use idempotent operations instead
  - A database transaction is sufficient (single database)
  - The operation is fast enough for optimistic concurrency
  - You can redesign to avoid the shared resource entirely
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Distributed lock** | Only one node can access a resource at a time across machines |
| **Fencing token** | Monotonically increasing ID to reject stale lock holders |
| **TTL/expiry** | Auto-release lock after timeout to prevent deadlocks |
| **Redlock** | Redis-based distributed lock using quorum across instances |
| **ZooKeeper** | Coordination service with ephemeral nodes for locks |
| **Thundering herd** | Many nodes competing simultaneously when lock released |
| **Idempotency** | If operations are idempotent, you may not need locks |
| **Optimistic concurrency** | Alternative: version-based conflict detection instead of locks |

**Distributed locks are necessary when multiple nodes must not do the same thing — but always ask first: can I redesign this to avoid needing the lock entirely?**
