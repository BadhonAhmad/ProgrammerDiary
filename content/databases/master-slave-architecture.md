---
title: "Master-Slave Architecture: One Writer, Many Readers"
date: "2026-04-17"
tags: ["databases", "master-slave", "replication", "architecture", "primary-replica"]
excerpt: "Learn how master-slave (primary-replica) architecture works — one node handles writes while replicas serve reads — and how automatic failover keeps the system alive when the master dies."
---

# Master-Slave Architecture: One Writer, Many Readers

One server accepts all writes. Multiple servers copy the data and handle reads. It's the most common database replication setup in production — used by PostgreSQL, MySQL, MongoDB, and almost every relational database at scale.

## What is Master-Slave Architecture?

**Master-slave architecture** (modern term: **primary-replica**) is a database setup where one node (the master/primary) handles all write operations and propagates changes to one or more read-only replicas (slaves). All writes go through the master; reads can be distributed across replicas.

```text
Master-Slave setup:

  Client (write) → Master → Replicates to → Slave 1
                                  → Slave 2
                                  → Slave 3

  Client (read)  → Slave 1 or Slave 2 or Slave 3

  Master: Accepts writes, serves as source of truth
  Slaves: Read-only copies, serve read queries
```

## Why Does It Matter?

❌ **Problem:** Your single database handles 10,000 reads/second and 500 writes/second. It's maxing out. You could upgrade the server, but that's expensive and has limits. You need a way to handle more reads without making writes more complex.

✅ **Solution:** Master-slave architecture. The master handles 500 writes/second — no problem. Add 5 slaves, each handling 2,000 reads/second. Total read capacity: 10,000 reads/second. The master's load drops to just writes. Simple, proven, and effective.

## How It Works

### Write Flow
```text
1. Client sends INSERT/UPDATE/DELETE → Master
2. Master writes to its own storage (WAL/transaction log)
3. Master sends replication event to slaves
4. Slaves apply the change to their local copy
5. Master returns success to client

Client doesn't wait for slaves (async replication)
Or client waits for at least one slave (semi-sync)
```

### Read Flow
```text
1. Client sends SELECT query → Router/Load Balancer
2. Router sends query to one of the slaves
3. Slave reads from its local copy → returns result

Reads are distributed across slaves (round-robin or least-connections)
Some reads may go to master (when fresh data is required)
```

### Replication Process
```text
Master maintains a replication log (binary log / WAL):

  Master: "Row 42 changed: name='Alice' → name='Bob'"
  Slave reads this log entry
  Slave applies: UPDATE users SET name='Bob' WHERE id=42
  Slave advances its replication position

If slave disconnects:
  It remembers its last position
  Reconnects and resumes from where it left off
```

## Failover: When the Master Dies

The most critical part of master-slave architecture.

### Manual Failover
```text
1. Detect master is down (monitoring alerts)
2. DBA promotes the most up-to-date slave to master
3. Reconfigure other slaves to replicate from new master
4. Update application to point to new master
5. Resume operations

Downtime: Minutes to hours (depends on team response)
```

### Automatic Failover
```text
1. Monitoring detects master is unreachable
2. Failover tool (e.g., Patroni, Orchestrator, MHA) triggers election
3. Most up-to-date slave is promoted to master
4. Other slaves re-pointed to new master
5. Application reconnects (via VIP or DNS update)

Downtime: Seconds to minutes (automated)

Tools:
  PostgreSQL: Patroni, repmgr
  MySQL:      Orchestrator, MHA, MySQL InnoDB Cluster
  MongoDB:    Replica set with automatic election
```

## Advantages and Limitations

| ✅ Advantages | ❌ Limitations |
|---|---|
| Simple to understand and implement | Master is a single point of failure for writes |
| Scales reads linearly with replicas | Doesn't scale writes (still one master) |
| Read replicas can be in different regions | Replication lag causes stale reads |
| Master handles only writes → less loaded | Failover is complex and risky |
| Well-supported by all major databases | Promoted slave might be missing recent writes |

## Common Configurations

```text
1 Master + 2 Slaves:
  Small applications, basic HA
  One slave can fail without losing read capacity

1 Master + 5 Slaves:
  Medium applications, read-heavy
  Distribute reads across 5 replicas

1 Master + 1 Slave + 1 Delayed Slave:
  Delayed slave intentionally lagging (e.g., 1 hour behind)
  Protection against accidental DROP TABLE
  Recover from human errors by reading from delayed slave

Cascading Replication:
  Master → Slave A → Slave B → Slave C
  Reduces replication load on master
  Higher lag for downstream slaves
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Master (primary)** | Single node that handles all writes |
| **Slave (replica)** | Read-only copy that serves read queries |
| **Replication log** | Master records all changes for slaves to replay |
| **Failover** | Promoting a slave to master when master fails |
| **Automatic failover** | Tools like Patroni, Orchestrator promote slaves automatically |
| **Replication lag** | Time delay between master write and slave update |
| **Write bottleneck** | Only one master = limited write capacity |
| **Read scaling** | Add replicas = more read capacity |

**Master-slave is the workhorse of database scaling — simple, proven, and it solves the most common problem: too many reads for one server.**
