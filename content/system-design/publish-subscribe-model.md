---
title: "Publish–Subscribe Model: One Message, Many Listeners"
date: "2026-04-17"
tags: ["system-design", "pub-sub", "messaging", "event-driven", "architecture"]
excerpt: "Learn how the publish-subscribe model broadcasts events to multiple subscribers — enabling event-driven architectures where one event triggers reactions across many independent services."
---

# Publish–Subscribe Model: One Message, Many Listeners

An order is placed. The email service needs to know. So does inventory. And analytics. And the rewards service. Instead of the order service calling each one, it publishes one event. Everyone who cares subscribes and reacts. That's pub/sub.

## What is Publish-Subscribe?

**Publish-subscribe (pub/sub)** is a messaging pattern where senders (publishers) broadcast messages to a topic, and receivers (subscribers) listen to topics they care about. Publishers and subscribers never directly interact — the message broker handles routing.

```text
Point-to-point (queue):
  One message → One consumer processes it

Pub/sub:
  One message → ALL subscribers receive it
```

## Why Does It Matter?

❌ **Problem:** Your order service calls 5 downstream services directly via HTTP. When you add a 6th service (SMS notifications), you must modify the order service code, test everything, and redeploy. Adding consumers requires changing producers. This coupling makes the system fragile and slow to evolve.

✅ **Solution:** The order service publishes one event to a topic. Any service that needs to react subscribes to that topic. Adding a new consumer is zero change to the producer. Removing a consumer is zero change too. The system is extensible without modification.

## How Pub/Sub Works

```text
Publisher ──publish──> Topic: "order.placed"
                          │
                  ┌───────┼───────┬──────────┐
                  ▼       ▼       ▼          ▼
              Email    Inventory Analytics  Rewards
              Service  Service   Service    Service

Each subscriber gets a COPY of every message published to the topic.
Subscribers process independently at their own pace.
```

### Key Components

| Component | Role |
|---|---|
| **Publisher** | Sends messages to topics without knowing subscribers |
| **Subscriber** | Listens to topics and processes received messages |
| **Topic** | Named channel that routes messages from publishers to subscribers |
| **Broker** | Infrastructure that manages topics and message delivery |

## Pub/Sub vs Point-to-Point (Queue)

| Factor | Point-to-Point (Queue) | Pub/Sub (Topic) |
|---|---|---|
| **Consumers per message** | Exactly one | All subscribers |
| **Use case** | Task distribution | Event broadcasting |
| **Adding consumers** | Shares the workload | Gets its own copy |
| **Example** | Process order, send email | Notify all services about new order |

## Delivery Models

### Fan-out
Every subscriber gets every message. Simple, no filtering.

### Topic-based filtering
Subscribers choose which topics to subscribe to.

```text
Topics:
  "order.created"  → Email service, Inventory service
  "order.shipped"  → Email service, Analytics service, SMS service
  "order.cancelled"→ Inventory service, Refund service
```

### Content-based filtering
Subscribers receive only messages matching specific criteria.

```text
Subscriber rule: "Only orders where total > $100"
Publisher sends: { orderId: 42, total: 50 } → filtered out
Publisher sends: { orderId: 43, total: 200 } → delivered
```

## Advantages and Challenges

| ✅ Advantages | ❌ Challenges |
|---|---|
| Complete decoupling | Message ordering across subscribers |
| Easy to add/remove subscribers | No guarantee all subscribers process at same speed |
| Independent scaling per subscriber | Debugging distributed event flows |
| One event triggers many reactions | Subscriber must be idempotent (duplicate messages) |
| Extensible without producer changes | Eventual consistency across services |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Pub/sub** | Publisher broadcasts to topic, all subscribers receive |
| **Topic** | Named channel for routing messages |
| **Fan-out** | Every subscriber gets every message |
| **Decoupling** | Publishers don't know about subscribers |
| **Extensibility** | Add subscribers without changing publishers |
| **Point-to-point vs pub/sub** | One consumer vs all subscribers |
| **Idempotent subscribers** | Must handle duplicate messages safely |

**Pub/sub is how you build systems where adding a new feature doesn't require changing existing code — just subscribe a new service to existing events.**
