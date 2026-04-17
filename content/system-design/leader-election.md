---
title: "Leader Election: Who's in Charge When the Boss Goes Down?"
date: "2026-04-17"
tags: ["system-design", "leader-election", "distributed-systems", "raft", "coordination"]
excerpt: "Learn how distributed systems elect a leader to coordinate decisions — from database primaries to Kafka controllers — and what happens when the leader fails."
---

# Leader Election: Who's in Charge When the Boss Goes Down?

Your database has 5 replicas. Writes must go to one primary to maintain consistency. The primary crashes. Now what? Five nodes need to decide — without a human — who takes over. That's leader election.

## What is Leader Election?

**Leader election** is the process by which nodes in a distributed system choose one node to act as the coordinator (leader). The leader handles specific duties — processing writes, coordinating replication, assigning partitions. If the leader fails, remaining nodes automatically elect a new one.

```text
Without leader:
  All nodes try to coordinate → conflicts, duplicate work, split-brain

With leader:
  One node coordinates → clear authority, consistent decisions
  Leader fails → automatic election → new leader takes over
```

## Why Does It Matter?

❌ **Problem:** Your primary database goes down at 3 AM. Without automatic leader election, all writes fail until a human manually promotes a replica. Minutes or hours of downtime. Every minute costs revenue.

✅ **Solution:** The remaining replicas detect the failure, run an election, and promote a new primary within seconds. Writes resume automatically. The system heals itself without human intervention.

## How Leader Election Works

### Basic Process

```text
1. Detection:  Followers detect leader is unresponsive (missed heartbeats)
2. Candidacy:  A follower becomes a candidate and starts an election
3. Voting:     Each node votes for at most one candidate per term
4. Victory:    Candidate with majority votes becomes new leader
5. Authority:  New leader sends heartbeats to establish and maintain authority
```

### States

```text
Every node is in one of three states:

  Follower:  Receives and applies instructions from leader
             If no heartbeat from leader → transition to candidate

  Candidate: Campaigns for leadership
             Requests votes from other nodes
             If majority vote → become leader
             If discover higher term → step down to follower

  Leader:    Sends heartbeats to followers
             Processes all client requests
             Appends entries to replicated log
```

### Election Timeout

```text
Randomized election timeouts prevent split votes:

  Node A timeout: 150ms
  Node B timeout: 200ms
  Node C timeout: 175ms

  Node A times out first → becomes candidate → requests votes
  If Node A gets majority before B and C time out → Node A wins

  Without randomization:
  All nodes time out simultaneously → all become candidates → split vote
  → another election → another split → infinite loop
```

## Common Algorithms

### Raft Election
```text
Term-based elections:
  Each election has an incrementing term number
  If a node sees a higher term, it immediately steps down

Safety guarantee:
  New leader must have ALL committed entries
  = No committed data is ever lost during leadership transition
```

### Bully Algorithm
```text
Node with highest ID wins (the "bully"):
  Node 5 detects leader failed
  Node 5 sends election message to nodes 6, 7 (higher IDs)
  If no response → Node 5 becomes leader
  If Node 7 responds → Node 7 becomes leader (highest alive)

Simple but causes unnecessary elections when lower-ID nodes fail
```

### Ring Election
```text
Nodes arranged in a logical ring:
  Each node knows its successor
  Election message travels around the ring
  Node with highest ID in the message becomes leader
  Announcement travels around the ring to inform all

Works well for small, stable clusters
```

## Real-World Examples

| System | What Gets Elected | Algorithm |
|---|---|---|
| **PostgreSQL** | Primary (writer) replica | Custom with etcd/Consul |
| **Kafka** | Controller broker | ZooKeeper-based / KRaft |
| **MongoDB** | Primary in replica set | Raft-like |
| **Redis Sentinel** | Master Redis instance | Raft-based |
| **etcd** | Leader for write processing | Raft |
| **Cassandra** | No single leader (peer-to-peer) | Gossip-based |

## Split Brain Prevention

```text
Split brain: Two nodes both believe they are leader

Causes:
  - Network partition separates nodes
  - Old leader didn't know it was deposed

Prevention:
  Quorum: Only majority can elect a leader
          Split network → only one side has majority → one leader
  Leases: Leader holds a time-limited lease
          If lease expires, leader steps down
  Fencing: Old leader's requests are rejected using fencing tokens
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Leader election** | Nodes automatically choose one coordinator |
| **Follower/Candidate/Leader** | Three states a node transitions between |
| **Election timeout** | Randomized delay to prevent split votes |
| **Quorum** | Majority of nodes must agree on the new leader |
| **Term** | Monotonically increasing election round number |
| **Heartbeat** | Leader periodically signals it's alive |
| **Split-brain** | Two leaders active simultaneously — prevented by quorum |
| **Raft** | Most common algorithm — simple, proven, widely used |

**Leader election is democracy for computers — nodes vote, majority wins, and if the leader dies, a new election runs automatically in seconds.**
