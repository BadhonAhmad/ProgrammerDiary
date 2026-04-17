---
title: "Kafka Basics: The Distributed Event Streaming Platform"
date: "2026-04-17"
tags: ["system-design", "kafka", "event-streaming", "distributed-systems", "messaging"]
excerpt: "Learn how Apache Kafka works — topics, partitions, consumer groups, and why it handles millions of events per second while letting consumers replay from any point in history."
---

# Kafka Basics: The Distributed Event Streaming Platform

Your application generates 100,000 events per second. You need to process them in real-time, replay them for auditing, and feed them to five different teams — each reading at their own pace. Traditional databases choke. Message queues delete after consumption. You need Kafka.

## What is Kafka?

**Apache Kafka** is a distributed event streaming platform that stores events in a durable, ordered log and lets multiple consumers read them independently. It acts as a central nervous system for your data — producers write events, Kafka stores them durably, and consumers read them at their own pace.

```text
Traditional message queue:
  Producer → Queue → Consumer → Message deleted
  (One shot, gone forever)

Kafka:
  Producer → Topic (durable log) → Consumer Group A reads from offset 0
                                → Consumer Group B reads from offset 5000
                                → Consumer Group C reads latest
  (Events persist, replayable, multiple independent consumers)
```

## Why Does It Matter?

❌ **Problem:** Your monolithic database is the bottleneck. Analytics queries slow down the app. Different teams need the same data at different times — real-time dashboards, batch ML training, compliance auditing — each building separate pipelines to the same source.

✅ **Solution:** Kafka becomes the single source of truth for all events. Every service writes to Kafka. Every team reads from Kafka at their own pace. Analytics processes in real-time. ML reprocesses historical data. Compliance audits the full log. One system, multiple independent consumers.

## Core Architecture

### Topics and Partitions

```text
Topic: "order_events" (divided into partitions for parallelism)

  Partition 0: [event@0] [event@1] [event@2] [event@3] ...
  Partition 1: [event@0] [event@1] [event@2] [event@3] ...
  Partition 2: [event@0] [event@1] [event@2] [event@3] ...

Each partition is an ordered, append-only log
Events within a partition are strictly ordered
Partition count = max parallelism for a consumer group
More partitions = more throughput, but more overhead
```

### Producers

```text
Producer decides which partition to write to:
  - By key: Same key → same partition → guaranteed ordering
    (orderId: 42 always goes to partition 1)
  - Round-robin: Even distribution, no ordering guarantee
  - Custom: Use a partitioner for business logic

Producer acknowledgments:
  acks=0    → Fire and forget (fastest, can lose data)
  acks=1    → Leader acknowledges (default, good balance)
  acks=all  → All replicas acknowledge (strongest durability)
```

### Consumer Groups

```text
Topic "order_events" (3 partitions):

  Consumer Group "Analytics":
    Consumer 1 → reads Partition 0
    Consumer 2 → reads Partition 1
    Consumer 3 → reads Partition 2

  Consumer Group "Fraud Detection":
    Consumer 4 → reads Partition 0, 1, 2 (only one consumer)

Rules:
  Each partition is consumed by exactly ONE consumer within a group
  Adding consumers beyond partition count = idle consumers
  Different groups read independently at their own offset
```

### Brokers and Replication

```text
Kafka cluster = multiple brokers (servers)

Topic "order_events" with replication factor = 3:

  Partition 0:  Leader=Broker-1, Replicas=[Broker-2, Broker-3]
  Partition 1:  Leader=Broker-2, Replicas=[Broker-1, Broker-3]
  Partition 2:  Leader=Broker-3, Replicas=[Broker-1, Broker-2]

Leader handles all reads/writes for a partition
Followers replicate passively
If leader dies, a follower becomes the new leader
```

## Key Configuration Decisions

| Decision | Options | Trade-off |
|---|---|---|
| **Partition count** | 3, 10, 100+ | More = higher throughput, but more file handles and rebalances |
| **Replication factor** | 1, 3 (typical) | Higher = more durable, more storage overhead |
| **Retention** | 7 days, 30 days, forever | Longer = more storage, but more replay capability |
| **acks** | 0, 1, all | Stronger = slower but safer |
| **Consumer offset** | Auto-commit, manual | Auto = simpler, manual = more control |

## When to Use Kafka

```text
Use Kafka when you need:
  - High throughput (millions of events/second)
  - Event replay (read from any point in history)
  - Multiple independent consumers
  - Durable event storage
  - Event sourcing or audit trail
  - Real-time stream processing

Don't use Kafka for:
  - Simple task queues (use RabbitMQ)
  - Request-reply patterns
  - Low-throughput systems (overkill)
  - When you need complex routing logic
```

## Kafka vs RabbitMQ

| Factor | Kafka | RabbitMQ |
|---|---|---|
| **Model** | Event streaming (log) | Message queue (broker) |
| **Retention** | Configurable (hours to forever) | Deleted after consumed |
| **Replay** | Yes, from any offset | No |
| **Throughput** | Millions/sec | Hundreds of thousands/sec |
| **Routing** | Topic-based only | Flexible (topic, header, content) |
| **Ordering** | Per partition | Per queue |
| **Consumer model** | Pull-based | Push-based |
| **Best for** | Event streaming, replay, audit | Task queues, complex routing |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Kafka** | Distributed event streaming platform with durable log storage |
| **Topic** | Category/feed name where events are published |
| **Partition** | Ordered, append-only log within a topic |
| **Offset** | Position of an event within a partition |
| **Consumer group** | Set of consumers that divide partitions among themselves |
| **Broker** | A Kafka server that stores partitions |
| **Replication** | Copies of a partition across multiple brokers for durability |
| **Retention** | How long events are kept before deleted |
| **acks=all** | Strongest durability — all replicas must acknowledge |

**Kafka is not a queue that deletes messages after consumption — it's a commit log that remembers everything.**
