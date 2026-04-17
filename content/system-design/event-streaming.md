---
title: "Event Streaming: Continuous Flow of Events"
date: "2026-04-17"
tags: ["system-design", "event-streaming", "Kafka", "real-time", "architecture"]
excerpt: "Learn how event streaming treats every change as a permanent, ordered event log — enabling real-time processing, replay, and auditability at massive scale."
---

# Event Streaming: Continuous Flow of Events

A user clicks, a sensor reads, a payment processes. Every action is an event. What if you could capture every event, store it forever, and let any system process it in real-time or replay it years later? That's event streaming.

## What is Event Streaming?

**Event streaming** is the practice of capturing, storing, and processing events in real-time as a continuous flow. Events are recorded in an immutable, ordered log. Multiple consumers can read and process the same events independently, at their own pace, and replay them from any point.

```text
Traditional approach:
  Event happens → Process → Discard
  (One shot, gone forever)

Event streaming:
  Event happens → Append to log → Multiple consumers read independently
  (Permanent record, replayable, real-time or batch)
```

## Why Does It Matter?

❌ **Problem:** Your analytics team needs user activity data. Your fraud detection system needs the same data in real-time. Your ML pipeline needs it for training. Your compliance team needs it for auditing. Each system builds its own data pipeline, duplicating effort and creating inconsistent views of the same events.

✅ **Solution:** Event streaming centralizes all events into one immutable log. Every system reads from the same source of truth — analytics, fraud detection, ML, and compliance all consume the same events, each at its own pace, without affecting others.

## How Event Streaming Works

### The Event Log

An append-only, ordered sequence of events:

```text
Partition 0:
  Offset 0: { user: 42, action: "login", timestamp: "10:00:00" }
  Offset 1: { user: 42, action: "view_product", timestamp: "10:00:05" }
  Offset 2: { user: 42, action: "add_to_cart", timestamp: "10:01:30" }
  Offset 3: { user: 42, action: "checkout", timestamp: "10:02:15" }
  ...

Events are immutable — never modified, only appended
Each event has an offset (position in the log)
Consumers track their own offset — read at their own pace
```

### Key Concepts

```text
Event:     Something that happened (user clicked, order placed)
Stream:    Ordered sequence of events
Producer:  Writes events to the stream
Consumer:  Reads events from the stream
Partition: Subdivision of a stream for parallel processing
Offset:    Position of an event within a partition
Retention: How long events are kept (hours, days, forever)
```

### Multiple Consumer Groups

```text
Stream: "user_events"
  │
  ├── Consumer Group "Analytics"   → reads from offset 0 (batch processing)
  ├── Consumer Group "Fraud"       → reads latest events (real-time)
  ├── Consumer Group "ML Pipeline" → reads from offset 1000 (new model training)
  └── Consumer Group "Audit"       → reads everything (compliance)

Each group tracks its own offset independently
Adding a consumer group doesn't affect existing groups
```

## Event Streaming vs Message Queue

| Factor | Message Queue | Event Streaming |
|---|---|---|
| **Retention** | Deleted after consumed | Kept for configurable period |
| **Replay** | No — consumed = gone | Yes — read from any offset |
| **Consumers** | Competing (one per message) | Multiple independent groups |
| **Throughput** | ~50K-500K msg/sec | ~1M+ msg/sec |
| **Ordering** | Per queue | Per partition |
| **Use case** | Task distribution | Real-time processing, replay, audit |
| **Examples** | RabbitMQ, SQS | Kafka, Kinesis, Pulsar |

## Use Cases

```text
Real-time analytics:     Process clickstream data for live dashboards
Fraud detection:         Analyze transactions in real-time
Event sourcing:          Rebuild application state by replaying events
Log aggregation:         Centralize logs from all services
Change data capture:     Stream database changes to other systems
IoT data processing:     Process sensor data in real-time
Audit trail:             Permanent record of every action for compliance
ML feature pipelines:    Feed real-time features to ML models
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Event streaming** | Capture, store, and process events as a continuous flow |
| **Event log** | Append-only, ordered, immutable sequence of events |
| **Offset** | Position in the log — consumers track their own |
| **Partition** | Subdivision for parallel processing |
| **Replay** | Re-read events from any point in history |
| **Consumer groups** | Multiple independent consumers reading same stream |
| **High throughput** | Designed for millions of events per second |
| **Kafka** | The dominant event streaming platform |

**Message queues are for tasks you need done once. Event streams are for facts you need forever.**
