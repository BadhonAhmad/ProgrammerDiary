---
title: "Consensus Algorithms: Getting Distributed Nodes to Agree"
date: "2026-04-17"
tags: ["system-design", "consensus", "distributed-systems", "raft", "paxos", "algorithms"]
excerpt: "Learn how consensus algorithms like Raft and Paxos get distributed nodes to agree on a single value — the foundation of replicated databases, leader election, and distributed coordination."
---

# Consensus Algorithms: Getting Distributed Nodes to Agree

Three database replicas receive a write: "set balance to $100". Replica A gets it first, Replica B gets it 50ms later, Replica C gets it 200ms later. What's the current balance? It depends on which replica you ask. Consensus algorithms make sure all nodes agree — every time.

## What is Consensus?

**Consensus** is the process of getting multiple distributed nodes to agree on a single value or state, even when some nodes fail or messages are delayed. It's the foundation of replicated databases, distributed locks, and leader election.

```text
Without consensus:
  Node A: balance = $100
  Node B: balance = $200  (missed an update)
  Node C: balance = $50   (got updates out of order)
  Nobody agrees on the truth

With consensus:
  All nodes agree: balance = $100
  Even if Node C crashes during the process
  Even if network delays some messages
```

## Why Does It Matter?

❌ **Problem:** Your database has 3 replicas for high availability. Two replicas agree on a value, but the third missed the update due to a network blip. Now reads return different results depending on which replica handles them. Users see stale data. Transactions fail. Data integrity is compromised.

✅ **Solution:** A consensus algorithm ensures all nodes agree before committing. If a majority (2 of 3) agree, the value is committed. The third catches up when it reconnects. No split-brain, no conflicting states, no data loss.

## How Consensus Works

### The Core Problem

```text
Distributed nodes need to agree, but:
  - Messages can be delayed or lost
  - Nodes can crash and restart
  - Network can split (some nodes can't reach others)
  - There's no shared clock

Requirements:
  Agreement:  All non-faulty nodes decide on the same value
  Validity:   The decided value must have been proposed by some node
  Termination: All non-faulty nodes eventually decide
  Integrity:  No node decides twice
```

### Quorum (Majority Voting)

```text
With 5 nodes, you need 3 (majority) to agree = quorum

Why majority?
  - If the network splits, only ONE side can have a majority
  - The minority side stops making decisions
  - Prevents two groups from making conflicting decisions (split-brain)

Quorum = floor(N/2) + 1
  3 nodes → need 2
  5 nodes → need 3
  7 nodes → need 4
```

## Raft Algorithm

Raft is the most widely understood consensus algorithm, designed for clarity.

### Leader-Based Approach
```text
Phase 1: Leader Election
  - Nodes start as followers
  - If no heartbeat from leader, a node becomes candidate
  - Candidate requests votes from other nodes
  - Node with majority votes becomes leader

Phase 2: Log Replication
  - Client sends command to leader
  - Leader appends to its log
  - Leader sends log entries to followers
  - Once majority acknowledge → entry is COMMITTED
  - Leader notifies followers to apply the entry

Phase 3: Safety
  - If leader crashes, new election starts
  - New leader must have all committed entries
  - Guarantees: no committed entry is ever lost
```

### Leader Election in Detail
```text
States: Follower → Candidate → Leader

Timeout triggers election:
  Follower doesn't hear from leader → becomes candidate
  Increments term (election round number)
  Votes for itself
  Sends RequestVote to all other nodes

Winning:
  Candidate gets majority votes → becomes leader
  Starts sending heartbeats to maintain authority

Split vote (no majority):
  Multiple candidates split the votes
  Wait random timeout, start new election
  Random timeout prevents infinite split votes
```

## Paxos Algorithm

The original consensus algorithm — correct but notoriously hard to understand.

```text
Paxos roles:
  Proposer:  Proposes a value
  Acceptor:  Votes to accept or reject proposals
  Learner:   Learns the decided value

Basic Paxos (single value):
  Phase 1: Proposer asks acceptors to promise not to accept older proposals
  Phase 2: Proposer sends value, acceptors vote
  If majority accept → value is chosen

Multi-Paxos (log of values):
  Optimizes by electing a stable leader
  Leader skips Phase 1 for subsequent values
  This is what production systems actually use

Variants:
  Multi-Paxos:  For replicated logs (most common)
  Cheap Paxos:  Fewer messages, more fault-tolerant
  Fast Paxos:   Lower latency, more messages
```

## Raft vs Paxos

| Factor | Raft | Paxos |
|---|---|---|
| **Understandability** | Designed to be simple | Notoriously complex |
| **Leader** | Always has a strong leader | Leader is an optimization, not required |
| **Implementation** | Many clean implementations | Few correct implementations |
| **Performance** | Comparable to Multi-Paxos | Comparable to Raft |
| **Adoption** | etcd, Consul, CockroachDB | Google Chubby, spanner variants |

## Real-World Uses

```text
etcd (Raft):          Kubernetes configuration store
Consul (Raft):        Service discovery and configuration
Zookeeper (Zab):      Hadoop, Kafka coordination
CockroachDB (Raft):   Distributed SQL database
TiKV (Raft):          Distributed key-value store
Google Spanner (Paxos): Global database
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Consensus** | Getting distributed nodes to agree on a value |
| **Quorum** | Majority of nodes must agree (prevents split-brain) |
| **Raft** | Understandable consensus — leader election + log replication |
| **Paxos** | Original consensus algorithm — correct but complex |
| **Leader** | One node coordinates decisions for efficiency |
| **Term/epoch** | Logical time period for elections and proposals |
| **Split-brain** | Two leaders active simultaneously — consensus prevents this |
| **Committed entry** | Guaranteed to be in the final log, never lost |

**Consensus is how distributed systems agree on the truth — without it, every node lives in its own reality.**
