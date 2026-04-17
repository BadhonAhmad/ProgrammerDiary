---
title: "Database Replication: Copy Data for Speed and Safety"
date: "2026-04-17"
tags: ["databases", "replication", "high-availability", "distributed-systems"]
excerpt: "Learn how database replication works — synchronous vs asynchronous, single-leader vs multi-leader — and why copying your data to multiple servers is essential for reliability and performance."
---

# Database Replication: Copy Data for Speed and Safety

Your database server catches fire. Literally. Every piece of data — user accounts, orders, payments — gone. Unless you have copies. Replication keeps multiple copies of your data across different servers, so one failure doesn't take everything down.

## What is Database Replication?

**Database replication** is the process of copying and maintaining database data across multiple servers. Changes made on one server (the source) are propagated to other servers (replicas) so they all contain the same data.

```text
Without replication:
  One server → one copy of data → one failure = data loss

With replication:
  Server A: full copy of data
  Server B: full copy of data
  Server C: full copy of data
  Any one can fail → system keeps running
```

## Why Does It Matter?

❌ **Problem:** Your only database server goes down at 2 AM. The entire application is offline. Users can't log in, can't place orders, can't do anything. Recovery takes hours. Every minute of downtime costs thousands.

✅ **Solution:** Replication keeps multiple copies of your data. If one server fails, another takes over immediately. Users never notice. The system stays available even during hardware failures, maintenance, or disasters.

## Why Replicate?

```text
High availability:
  If one server crashes, another serves requests
  No single point of failure

Read scalability:
  Distribute read queries across replicas
  10 replicas = 10x read capacity (roughly)

Geographic distribution:
  Place replicas closer to users
  Users in US → US replica, Users in EU → EU replica
  Lower latency for everyone

Disaster recovery:
  Replicate to a different data center (or cloud region)
  Entire data center goes down → failover to replica

Maintenance:
  Take one server down for upgrades
  Others continue serving traffic
```

## Replication Methods

### Statement-Based Replication
```text
Primary executes: UPDATE users SET status = 'active' WHERE id > 1000
Replica receives and replays the same SQL statement

Pros:  Small log size, one statement instead of many row changes
Cons:  Non-deterministic functions (NOW(), RAND()) produce different results
       Statements with side effects (triggers, stored procedures) can diverge
```

### Row-Based Replication
```text
Primary executes: UPDATE users SET status = 'active' WHERE id > 1000
Replica receives the actual row changes:
  Row 1001: status 'inactive' → 'active'
  Row 1002: status 'inactive' → 'active'
  ... (all affected rows)

Pros:  Deterministic — exact same data on every replica
Cons:  Large log for bulk updates (millions of rows = millions of log entries)
```

### Logical Replication
```text
Streams logical changes (insert/update/delete) at the row level
Decoupled from storage engine details

Pros:  Works across different database versions or even different DBMS
Cons:  Higher overhead, may not replicate DDL changes (schema changes)
```

## Synchronous vs Asynchronous Replication

### Synchronous
```text
Primary writes → waits for replica to confirm → returns success to client

  Client → Primary → Replica → ACK → Primary → Client ("success")

Pros:  Zero data loss (replica always has latest data)
Cons:  Higher write latency (waits for replica)
       If replica is slow, writes are slow
       Reduced availability (replica down = writes blocked)

Use when: Financial data, critical transactions where data loss is unacceptable
```

### Asynchronous
```text
Primary writes → returns success to client → replicates in background

  Client → Primary → Client ("success")
             ↓ (later)
            Replica (catches up eventually)

Pros:  Fast writes (no waiting for replicas)
       Primary works even if replicas are down
Cons:  Potential data loss if primary crashes before replication completes
       Replication lag — replicas can be slightly behind

Use when: Social media, content sites — slight staleness is acceptable
```

### Semi-Synchronous
```text
Primary writes → waits for AT LEAST ONE replica → returns success

  Balance between synchronous and asynchronous:
  Faster than full synchronous
  More durable than pure asynchronous

Use when: You want durability guarantees but can't tolerate full sync latency
```

## Common Replication Topologies

```text
Single-Leader (Primary-Replica):
  All writes → Primary → replicates to replicas
  Reads → Primary or any replica
  Most common setup

Multi-Leader:
  Multiple primaries accept writes
  Primaries replicate to each other
  Complex conflict resolution needed

Leaderless:
  Any node accepts writes
  Clients or coordinators handle consistency
  Used by Cassandra, DynamoDB
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Replication** | Copying database data across multiple servers |
| **Synchronous** | Wait for replica confirmation — zero data loss, higher latency |
| **Asynchronous** | Replicate in background — fast writes, potential data loss |
| **Semi-synchronous** | Wait for at least one replica — balanced approach |
| **Statement-based** | Replicate SQL statements — small logs, non-deterministic risks |
| **Row-based** | Replicate actual row changes — deterministic, larger logs |
| **Replication lag** | Delay between primary write and replica update |
| **High availability** | System stays up when individual servers fail |

**Replication is insurance for your data — you hope you never need it, but when a server dies, you're grateful you have copies.**
