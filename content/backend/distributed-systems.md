---
title: "Distributed Systems Basics: One Computer Is Never Enough"
date: "2026-04-17"
tags: ["backend", "distributed-systems", "architecture", "CAP-theorem", "consistency"]
excerpt: "Learn the fundamental concepts of distributed systems — from CAP theorem to consensus, partition tolerance, and why distributed doesn't always mean better."
---

# Distributed Systems Basics: One Computer Is Never Enough

Netflix runs on thousands of servers across multiple continents. Your single-server app crashes when one process uses too much memory. The gap between "works on my machine" and "works at planetary scale" is the entire field of distributed systems.

## What is a Distributed System?

A **distributed system** is a collection of independent computers that work together as a single coherent system. Users interact with it as if it's one application, but behind the scenes, multiple machines coordinate over a network.

```text
What you see:
  myapp.com → one application

What actually exists:
  Load Balancer → Web Server 1, Web Server 2, Web Server 3
                → API Server 1, API Server 2
                → Cache (Redis Cluster)
                → Database (Primary + 2 Replicas)
                → Message Queue (3 Broker Nodes)
                → Search Cluster (5 Nodes)
```

Any system that runs on more than one machine and needs coordination is distributed. If you have a web server and a separate database server — that's a distributed system.

## Why Does It Matter?

❌ **Problem:** Your single-server app goes down — everything stops. Users can't log in, data can't be saved, background jobs don't run. There's no redundancy, no failover, no recovery plan. A single hardware failure = total outage.

At a larger scale: you have 10 services, each on one server. Server 7 dies. Every feature depending on Service 7 breaks. Other services waiting on Service 7 hang or fail. Cascading failure.

✅ **Solution:** Distributed systems provide **redundancy**, **fault tolerance**, and **scalability**. If one machine fails, others take over. If traffic doubles, you add machines. But distributed systems introduce their own challenges — network failures, data consistency, and coordination complexity.

## The CAP Theorem

The fundamental law governing distributed systems. You can only have **two out of three**:

```text
┌─────────────────────────────────────────────┐
│                CAP Theorem                   │
│                                              │
│         Consistency                          │
│            /  \                              │
│           /    \                             │
│          /      \                            │
│   Partition   Availability                  │
│   Tolerance      \                          │
│                    \                         │
│              Pick any TWO                    │
└─────────────────────────────────────────────┘
```

| Property | What It Means | Example |
|---|---|---|
| **Consistency** | Every read returns the most recent write | Bank balance is always accurate |
| **Availability** | Every request gets a response (not an error) | System never goes down |
| **Partition Tolerance** | System works despite network failures | Nodes can't talk but both keep running |

### The Reality

Network partitions **will** happen — you can't prevent them. So the real choice is:

```text
CP (Consistency + Partition Tolerance):
  During network split → reject some requests to maintain consistency
  Examples: MongoDB (with majority reads), HBase, Redis Cluster

AP (Availability + Partition Tolerance):
  During network split → serve requests from any node, even if stale
  Examples: Cassandra, DynamoDB, CouchDB

CA (Consistency + Availability):
  Not possible in distributed systems (requires no network partitions)
  Only works on a single node
```

**No distributed system can guarantee all three simultaneously.** Every architecture decision involves choosing trade-offs.

## Distributed System Challenges

### Network Failures

Networks are unreliable. Messages get lost, delayed, duplicated, or arrive out of order.

```text
What can go wrong:
  - Message never arrives (packet loss)
  - Message arrives twice (retransmission)
  - Messages arrive out of order
  - Message takes 30 seconds instead of 3ms
  - You don't know if it arrived or not (ambiguous failure)
```

### Clock Synchronization

Different machines have different clocks. They drift. You can't rely on timestamps for ordering.

```text
Server A: "Event happened at 10:30:00.100"
Server B: "Event happened at 10:30:00.050"

Which happened first? You can't tell — clocks might be 200ms apart.

Solution: Use logical clocks (Lamport timestamps) or sequence numbers, not wall clocks.
```

### Consensus

How do distributed nodes agree on a value when any node can fail?

```text
Problem: Three nodes need to agree on who is the leader
  Node A votes for itself
  Node B votes for itself
  Node C's network is split

  Who wins? This requires a consensus algorithm.

Solutions:
  Raft — elects a leader, leader replicates to followers
  Paxos — the original (complex, academic)
  ZooKeeper — coordination service using consensus
```

### Split Brain

A network partition causes two groups of nodes to each believe they're the primary:

```text
Before partition:
  Primary (Node A) ←→ Replica (Node B) ←→ Replica (Node C)

Network splits:
  Group 1: [Node A] ← thinks it's primary
  Group 2: [Node B, Node C] ← elects Node B as primary

  Now TWO primaries → data divergence → disaster

Solutions:
  - Require majority quorum (Raft: need 2 of 3 nodes to agree)
  - Fencing tokens (old primary's requests get rejected)
  - STONITH (Shoot The Other Node In The Head)
```

## Key Patterns

### Replication

Copy data across multiple nodes for availability and read scalability.

| Type | How It Works | Trade-off |
|---|---|---|
| **Synchronous** | Write to all replicas before acknowledging | Strong consistency, slower writes |
| **Asynchronous** | Write to primary, replicate later | Fast writes, eventual consistency |
| **Semi-synchronous** | Write to primary + 1 replica, rest async | Balance of both |

### Sharding (Partitioning)

Distribute data across nodes by key. Each node owns a subset of data.

```text
Sharding by user ID (modulo):
  Node 1: users 1, 4, 7, 10, ...
  Node 2: users 2, 5, 8, 11, ...
  Node 3: users 3, 6, 9, 12, ...

Sharding by range:
  Node 1: users A-M
  Node 2: users N-Z

Sharding by hash:
  hash(userID) % numNodes → determines which node
```

### Consistent Hashing

When you add or remove a node, consistent hashing minimizes data movement:

```text
Regular hashing (hash % 3):
  Add a 4th node → Almost ALL data needs to move

Consistent hashing:
  Add a 4th node → Only ~25% of data moves
```

### Leader Election

One node acts as the primary (leader). Others are followers. If the leader fails, a new one is elected.

```text
Raft consensus:
  1. Nodes send heartbeat
  2. Leader fails → followers detect missing heartbeat
  3. Followers become candidates, request votes
  4. Node with majority votes becomes new leader
  5. All writes go through leader, replicated to followers
```

## Fallacies of Distributed Computing

Every new distributed systems engineer believes these — all are wrong:

| Fallacy | Reality |
|---|---|
| The network is reliable | Networks fail constantly |
| Latency is zero | Latency exists and varies wildly |
| Bandwidth is infinite | Bandwidth is finite and shared |
| The network is secure | Networks are hostile |
| Topology doesn't change | Servers join and leave constantly |
| There is one administrator | Many teams manage many services |
| Transport cost is zero | Serialization, encryption, and routing cost CPU |
| The network is homogeneous | Different hardware, OS, and network configs |

## When Distribution Helps vs Hurts

### ✅ Distribution Helps

- High availability (99.99% uptime)
- Global latency optimization
- Handling traffic beyond one machine
- Fault tolerance and disaster recovery

### ❌ Distribution Hurts

- Simple applications with low traffic
- When strong consistency is critical (financial transactions)
- Small teams that can't manage operational complexity
- When debugging and tracing become harder than the business logic

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Distributed system** | Multiple machines coordinating over a network |
| **CAP theorem** | Choose 2 of 3: Consistency, Availability, Partition Tolerance |
| **Replication** | Copy data across nodes for redundancy |
| **Sharding** | Distribute data by key for horizontal scaling |
| **Consistent hashing** | Minimize data movement when nodes change |
| **Leader election** | One primary node coordinates writes (Raft, Paxos) |
| **Split brain** | Two nodes think they're primary — requires quorum |
| **Eventual consistency** | All nodes converge to same state over time |
| **Fallacies** | Network is unreliable, latency exists, topology changes |

**A distributed system is one where the failure of a computer you didn't even know existed can render your own computer unusable. — Leslie Lamport**
