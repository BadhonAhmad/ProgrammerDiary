---
title: "Event-Driven Architecture: React, Don't Call"
date: "2026-04-17"
tags: ["backend", "event-driven", "architecture", "microservices", "pub-sub"]
excerpt: "Learn how event-driven architecture decouples services by broadcasting what happened — not telling each service what to do — and why this makes your system more resilient and extensible."
---

# Event-Driven Architecture: React, Don't Call

Your order service directly calls the payment service, email service, inventory service, and analytics service. If the email service is slow, the order response is slow. If analytics is down, orders fail. Every new service requires changing the order service code. Event-driven architecture inverts this completely.

## What is Event-Driven Architecture?

**Event-driven architecture (EDA)** is a design pattern where services communicate by **producing and consuming events** — records of things that happened. Instead of Service A calling Service B directly, Service A publishes an event ("order placed"), and any interested service reacts to it.

```text
Traditional (synchronous, coupled):
  Order Service ──HTTP call──> Payment Service
               ──HTTP call──> Email Service
               ──HTTP call──> Inventory Service
               ──HTTP call──> Analytics Service

  If any service is slow or down → Order fails

Event-Driven (asynchronous, decoupled):
  Order Service ──publish──> "order.placed" event
  Payment Service ──subscribes──> charges payment
  Email Service ──subscribes──> sends confirmation
  Inventory Service ──subscribes──> reserves stock
  Analytics Service ──subscribes──> records metrics

  Order succeeds regardless of other services
```

## Why Does It Matter?

❌ **Problem:** Adding a new feature — SMS notifications on order — means modifying the Order Service code to call the SMS Service. Then you need to test the entire order flow again. Then the SMS service goes down, and orders start failing. Every new consumer requires changes to the producer. This is **temporal coupling** — services must be available at the same time.

✅ **Solution:** EDA decouples services in time and space. The Order Service publishes an event and moves on. The SMS Service (added later, without touching the Order Service) subscribes to `order.placed` and does its job. If SMS is down, events queue up. Nothing breaks. Adding new consumers = zero changes to producers.

## Core Concepts

### Events

An **event** is a record of something that happened in the past. Events are immutable — they state a fact, not a command.

```text
Event (fact — something happened):
  { type: "order.placed", orderId: "ord_123", total: 99.99, items: [...] }

Command (instruction — do something):
  { action: "chargePayment", orderId: "ord_123", amount: 99.99 }
```

Events are past tense. Commands are imperative. EDA favors events.

### Event Structure

```text
{
  "eventId": "evt_abc123",           // Unique ID for idempotency
  "eventType": "order.placed",       // What happened
  "timestamp": "2024-03-15T10:30:00Z",
  "version": "1.0",                  // Schema version
  "source": "order-service",         // Who produced it
  "correlationId": "corr_xyz",       // Trace across services
  "data": {                          // Event payload
    "orderId": "ord_123",
    "customerId": "cust_456",
    "total": 99.99,
    "items": [...]
  }
}
```

### Event Broker

The central nervous system that routes events between producers and consumers.

```text
┌───────────┐     ┌──────────────┐     ┌───────────┐
│ Order     │────>│              │────>│ Email     │
│ Service   │     │  Event       │     │ Service   │
└───────────┘     │  Broker      │     └───────────┘
                  │  (Kafka /    │     ┌───────────┐
┌───────────┐     │   RabbitMQ / │────>│ Payment   │
│ User      │────>│   Redis)     │     │ Service   │
│ Service   │     │              │     └───────────┘
└───────────┘     └──────────────┘     ┌───────────┐
                                       │ Analytics │
                                       │ Service   │
                                       └───────────┘
```

## Event-Driven Patterns

### Pattern 1: Event Notification

Simple notification — "something happened." Consumers react however they want.

```text
Producer: "user.created" → { userId: 42, email: "alice@dev.io" }

Consumer 1: Send welcome email
Consumer 2: Create default settings
Consumer 3: Add to analytics
```

### Pattern 2: Event-Carried State Transfer

The event includes enough data that consumers don't need to call back.

```text
Producer: "order.placed" → { orderId, customerName, email, items, total }

Email Service has everything it needs in the event — no callback to Order Service.
```

This eliminates the chatty inter-service calls that plague microservice architectures.

### Pattern 3: Event Sourcing

The event log **is** the source of truth. Instead of storing current state, you store every event that led to the current state. Current state is derived by replaying events.

```text
Traditional: Store current balance → { accountId: 1, balance: 500 }

Event-sourced: Store all transactions →
  { type: "account.opened", balance: 0 }
  { type: "deposit", amount: 1000 }
  { type: "withdrawal", amount: 300 }
  { type: "deposit", amount: 200 }

  Current balance = replay events → 0 + 1000 - 300 + 200 = 900

Wait, traditional showed 500 but events show 900?
→ Events never lie. Traditional state might be stale or corrupted.
```

### Pattern 4: CQRS (Command Query Responsibility Segregation)

Separate the write model (commands) from the read model (queries).

```text
Write side:
  Commands → validated → produce events → stored in event log

Read side:
  Events → projected into read-optimized views (materialized views)

Example:
  Write: { orderId, items, status } → normalized, optimized for writes
  Read:  { orderSummary, customerName, totalFormatted } → denormalized, optimized for queries
```

CQRS pairs naturally with event sourcing — events build both write and read models.

## Benefits and Trade-offs

### ✅ Benefits

| Benefit | How It Helps |
|---|---|
| **Loose coupling** | Producers don't know or care about consumers |
| **Extensibility** | Add new consumers without changing producers |
| **Resilience** | Consumers can be down; events queue up |
| **Scalability** | Consumers scale independently |
| **Audit trail** | Event log = complete history of everything that happened |
| **Temporal decoupling** | Producer and consumer don't need to be online simultaneously |

### ❌ Trade-offs

| Trade-off | Why It's Hard |
|---|---|
| **Complexity** | Event flows are harder to trace than synchronous calls |
| **Eventual consistency** | Systems are eventually consistent, not immediately |
| **Debugging** | Distributed tracing across async flows is harder |
| **Event schema evolution** | Changing event format requires careful versioning |
| **Duplicate events** | Consumers must be idempotent |
| **Ordering** | Events may arrive out of order |

## Event-Driven vs Request-Driven

| Factor | Request-Driven (REST) | Event-Driven (EDA) |
|---|---|---|
| **Coupling** | Tight (caller knows callee) | Loose (producer knows nothing) |
| **Consistency** | Strong | Eventual |
| **Latency** | Lower (synchronous) | Higher (async processing) |
| **Failure mode** | Cascading failures | Isolated failures |
| **Adding features** | Change producer code | Add new consumer |
| **Debugging** | Straightforward call chain | Requires distributed tracing |
| **Use for** | Queries, real-time needs | Side effects, async workflows |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Event-driven architecture** | Services communicate by producing/consuming events |
| **Event** | Immutable record of something that happened |
| **Event broker** | Routes events between producers and consumers |
| **Event notification** | Simple "this happened" — consumers decide what to do |
| **Event-carried state** | Event includes full data — no callbacks needed |
| **Event sourcing** | Event log is the source of truth — replay to derive state |
| **CQRS** | Separate write and read models |
| **Eventual consistency** | All services converge eventually, not immediately |
| **Idempotent consumers** | Same event processed twice = same result |

**In request-driven systems, services ask 'do this.' In event-driven systems, services say 'this happened' — and let others decide what to do about it.**
