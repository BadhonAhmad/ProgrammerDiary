---
title: "Message Brokers: The Middleware That Routes Everything"
date: "2026-04-17"
tags: ["system-design", "message-brokers", "middleware", "Kafka", "RabbitMQ"]
excerpt: "Learn what message brokers are, how they differ from simple queues, and how to choose between Kafka, RabbitMQ, and other brokers for your architecture."
---

# Message Brokers: The Middleware That Routes Everything

Your services need to talk, but HTTP is too fragile. One service goes down and everything breaks. A message broker sits in the middle, routing messages reliably between services — ensuring nothing gets lost even when parts of the system fail.

## What is a Message Broker?

A **message broker** is middleware that translates and routes messages between senders and receivers. It accepts messages from producers, optionally transforms them, and delivers them to the right consumers based on routing rules.

```text
Without broker:
  Service A ──HTTP──> Service B ──HTTP──> Service C
  Any failure cascades through the chain

With broker:
  Service A ──publish──> Broker ──route──> Service B
                                  ──route──> Service C
  Services don't know about each other
  Broker handles routing, retries, persistence
```

## Core Functions

| Function | What It Does |
|---|---|
| **Routing** | Direct messages to the right destination based on rules |
| **Transformation** | Convert message formats (XML → JSON, protocol translation) |
| **Persistence** | Store messages until consumed (survives broker restart) |
| **Reliability** | Guarantee delivery despite failures |
| **Ordering** | Deliver messages in order |
| **Filtering** | Route based on message content |

## Broker Models

### Queue Model (Point-to-Point)
```text
Producer → Queue → One Consumer processes the message

Use case: Task distribution (one worker processes each job)
```

### Topic Model (Pub/Sub)
```text
Producer → Topic → All Subscribers receive the message

Use case: Event broadcasting (all interested services react)
```

### Hybrid
Most modern brokers support both models simultaneously.

## Choosing a Message Broker

| Broker | Best For | Strengths | Weaknesses |
|---|---|---|---|
| **Kafka** | Event streaming, high throughput | 1M+ msg/sec, replay, retention | Complex to operate, overkill for simple queues |
| **RabbitMQ** | Task queues, routing, work distribution | Flexible routing, easy to use, management UI | Lower throughput, messages deleted after consumed |
| **Amazon SQS/SNS** | AWS-native, managed | No ops, auto-scaling | Vendor lock-in, higher latency |
| **Apache Pulsar** | Multi-tenant, geo-replication | Combines queue + streaming, multi-tenant | Newer ecosystem, steeper learning curve |
| **Redis Streams** | Lightweight, already using Redis | Simple, fast, no new infrastructure | Limited features, not for critical persistence |

## Selection Criteria

```text
Choose Kafka when:
  - Need 1M+ messages/second
  - Need to replay events (event sourcing, audit)
  - Long-term event retention
  - Multiple independent consumer groups

Choose RabbitMQ when:
  - Complex routing logic (topic exchanges, header matching)
  - Task queues with acknowledgments
  - Moderate throughput (up to ~500K msg/sec)
  - Need a management UI and simple setup

Choose SQS/SNS when:
  - You're already on AWS
  - Don't want to manage infrastructure
  - Simple queue/pub-sub needs

Choose Redis Streams when:
  - Already using Redis
  - Lightweight streaming needs
  - Don't need guaranteed persistence
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Message broker** | Middleware that routes, transforms, and delivers messages |
| **Routing** | Direct messages based on topic, content, or headers |
| **Queue model** | One consumer per message |
| **Topic model** | All subscribers receive the message |
| **Kafka** | High-throughput event streaming with replay |
| **RabbitMQ** | Flexible routing and task queues |
| **Persistence** | Messages survive broker restarts |
| **Choose by use case** | Streaming → Kafka. Queues → RabbitMQ. Managed → SQS/SNS |

**A message broker is the post office of your distributed system — it doesn't write the letters, but it makes sure every one reaches the right mailbox.**
