---
title: "Multi-Master Architecture: Write From Anywhere"
date: "2026-04-17"
tags: ["databases", "multi-master", "replication", "conflict-resolution", "distributed-systems"]
excerpt: "Learn how multi-master replication lets any node accept writes — how conflicts arise, how to resolve them, and why this architecture trades simplicity for availability."
---

# Multi-Master Architecture: Write From Anywhere

Your application serves users in New York and Tokyo. Writes go to the closest master — New York users write to the US master, Tokyo users write to the Japan master. Both masters replicate to each other. But what happens when two users update the same record on different masters at the same time?

## What is Multi-Master Architecture?

**Multi-master architecture** is a database replication setup where multiple nodes accept both reads and writes. Changes made on any master are replicated to all other masters. This enables write scaling and geographic write availability — but introduces the problem of conflicting writes.

```text
Single-master:
  All writes → one master → replicates to read-only slaves

Multi-master:
  Master A (US) accepts writes ←→ replicates ←→ Master B (EU) accepts writes
                                  ↕                          ↕
                              Slave A                     Slave B

Both masters accept reads AND writes
Changes replicate bidirectionally
```

## Why Does It Matter?

❌ **Problem:** Your single master database in Virginia handles writes from users worldwide. Users in Singapore experience 200ms latency just to reach the database. If the Virginia master goes down, no one can write anything — globally.

✅ **Solution:** Place masters in Virginia, Frankfurt, and Singapore. Each user writes to their closest master. Latency drops to 20ms for everyone. If one master fails, the others continue accepting writes. But now you must handle the case where two masters receive conflicting writes for the same data.

## How Multi-Master Works

### Write Flow
```text
1. User in EU updates profile name to "Alice" → Master EU
2. User in US updates same profile name to "Bob" → Master US
3. Both masters replicate to each other
4. CONFLICT: Same record, different values

This is the fundamental challenge of multi-master.
```

### Replication
```text
Master A writes → records change in replication log
                → sends to Master B
Master B writes → records change in replication log
                → sends to Master A

Bidirectional: both send and receive changes
Changes can loop: A → B → A (must detect and stop)
  Solution: Use timestamps, version vectors, or GTIDs to track origin
```

## Conflict Resolution

The hardest part of multi-master replication.

### Last Write Wins (LWW)
```text
Each write has a timestamp
Later timestamp overwrites earlier one

Master EU: name = "Alice" at 10:00:01
Master US: name = "Bob"   at 10:00:02
Result:    name = "Bob" (later timestamp wins)

Problem: Clocks aren't perfectly synchronized
  EU server clock: 10:00:01.000
  US server clock: 10:00:00.997 (3ms behind)
  EU write happened FIRST but timestamp looks LATER on US server
  Result depends on which clock you trust
```

### Application-Level Resolution
```text
Application receives both conflicting versions
Application decides which one to keep (or merges)

Examples:
  Shopping cart: merge both versions (union of items)
  Profile update: let the user pick which one
  Counter: add both changes (increment by 2, not overwrite)
```

### Custom Conflict Handlers
```text
Define rules per table or column:

  Column "name":       last write wins
  Column "email":      conflict → keep both, flag for review
  Column "like_count": merge (sum both increments)
  Column "status":     priority-based (active overrides inactive)
```

### CRDTs (Conflict-Free Replicated Data Types)
```text
Data structures designed to merge without conflicts:

  Counter (G-Counter):  Each master increments its own counter
                        Merge = sum of all masters' counters
                        Always correct, no coordination needed

  Set (OR-Set):         Track additions and removals separately
                        Merge = union of operations
                        Deterministic result regardless of order

Used by: Riak, Redis CRDT, Apple Notes (offline sync)
```

## Advantages and Challenges

| ✅ Advantages | ❌ Challenges |
|---|---|
| Write from any location | Conflict resolution is hard |
| No single point of failure for writes | Data can be temporarily inconsistent |
| Lower write latency globally | Debugging conflicts is complex |
| Survives network partitions (AP system) | Replication loops must be detected |
| Online maintenance on any master | Schema changes must coordinate across masters |
| Better geographic write performance | Application must handle conflict resolution |

## Multi-Master vs Single-Master

| Factor | Single-Master | Multi-Master |
|---|---|---|
| **Write capacity** | Limited to one server | Scales with number of masters |
| **Write latency** | Depends on distance to master | Write to nearest master |
| **Conflict resolution** | None (one writer) | Required and complex |
| **Consistency** | Strong (one source of truth) | Eventual (convergence over time) |
| **Failure handling** | Master failover required | Other masters continue |
| **Complexity** | Low | High |
| **Use case** | Most applications | Global, write-heavy, HA-critical |

## When to Use Multi-Master

```text
Use multi-master when:
  - Users in multiple geographic regions need low-latency writes
  - Write availability is critical (can't tolerate master failover delay)
  - Application can handle eventual consistency
  - Conflicts are rare or resolvable (append-only logs, counters)

Don't use multi-master when:
  - Strong consistency is required (financial, inventory)
  - Single-master handles your write load fine
  - Your team can't manage conflict resolution complexity
  - Conflicts are frequent and hard to resolve
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Multi-master** | Multiple nodes accept both reads and writes |
| **Bidirectional replication** | Changes propagate both ways between masters |
| **Conflict resolution** | Strategy for handling simultaneous writes to same data |
| **Last write wins** | Latest timestamp overwrites — simple but clock-dependent |
| **CRDT** | Data structure that merges without conflicts |
| **Eventual consistency** | All masters converge to same state over time |
| **Write scaling** | Multiple masters = multiple write endpoints |
| **Complex trade-off** | Higher availability in exchange for consistency complexity |

**Multi-master gives you the power to write from anywhere — but with great power comes great responsibility for handling conflicts.**
