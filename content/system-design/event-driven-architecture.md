---
title: "Event-Driven Architecture: React to What Happens"
date: "2026-04-17"
tags: ["system-design", "event-driven", "architecture", "pub-sub", "async"]
excerpt: "Learn how event-driven architecture decouples services by broadcasting events — and why 'this happened' is more powerful than 'do this now.'"
---

# Event-Driven Architecture: React to What Happens

The order service doesn't call the email service. It doesn't call the analytics service. It doesn't call the inventory service. It just says "an order was placed." Every service that cares about orders reacts on its own. That's event-driven architecture.

## What is Event-Driven Architecture?

**Event-driven architecture (EDA)** is a pattern where services communicate by producing and consuming **events** — records of things that happened. Producers don't know or care who consumes their events. Consumers react independently.

```text
Traditional:
  Order Service ──calls──> Email Service
               ──calls──> Analytics Service
               ──calls──> Inventory Service
  (tightly coupled, cascading failures)

Event-Driven:
  Order Service ──publishes──> "order.placed"
  Email Service ──subscribes──> sends confirmation
  Analytics Service ──subscribes──> records metrics
  Inventory Service ──subscribes──> reserves stock
  (loosely coupled, independent failures)
```

## Why Does It Matter?

❌ **Problem:** Adding a new feature (SMS notifications) requires modifying the Order Service to call the SMS Service. Every new consumer requires producer changes. If any downstream service is slow, the order response is slow. If any service is down, orders fail.

✅ **Solution:** The Order Service publishes one event. New consumers subscribe without any producer changes. Slow consumers don't affect the producer. Down services catch up from the event queue when they recover.

## Core Patterns

### Event Notification
Simple "this happened" events. Consumers decide what to do.

### Event-Carried State Transfer
Events include full data so consumers don't need to call back.

### Event Sourcing
The event log IS the source of truth. Current state is derived by replaying events.

### CQRS
Separate write model (commands) from read model (queries). Events build read-optimized views.

## Topologies

```text
Mediator topology:
  Events → Event Mediator → Coordinates workflow → Routes to handlers
  (centralized orchestration)

Broker topology:
  Events → Message Broker (Kafka, RabbitMQ) → Consumers react independently
  (decentralized, no mediator)
```

## Trade-offs

| ✅ Benefits | ❌ Trade-offs |
|---|---|
| Loose coupling | Eventual consistency |
| Easy to add consumers | Harder debugging (distributed flow) |
| Resilient to failures | Event schema evolution challenges |
| Natural audit trail | Duplicate event handling (idempotency required) |
| Independent scaling | Ordering guarantees are complex |

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Event** | Immutable record of something that happened |
| **Producer** | Publishes events without knowing consumers |
| **Consumer** | Subscribes and reacts to events independently |
| **Event sourcing** | Event log is the source of truth |
| **CQRS** | Separate models for reads and writes |
| **Eventual consistency** | All services converge over time, not immediately |
| **Idempotent consumers** | Must handle duplicate events safely |

**Events say 'this happened.' Commands say 'do this.' Events decouple. Commands couple. Choose wisely.**
