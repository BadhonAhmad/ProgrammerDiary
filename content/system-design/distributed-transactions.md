---
title: "Distributed Transactions: Coordinating Changes Across Services"
date: "2026-04-17"
tags: ["system-design", "distributed-transactions", "saga", "two-phase-commit", "distributed-systems"]
excerpt: "Learn how to maintain data consistency across multiple services — from Two-Phase Commit to the Saga pattern — and why distributed transactions are fundamentally different from local ones."
---

# Distributed Transactions: Coordinating Changes Across Services

An order service creates an order, the payment service charges the card, and the inventory service reserves stock. All three must succeed or all three must roll back. In a monolith, this is one database transaction. In microservices, it's three separate databases — three separate transactions that must be coordinated. That's a distributed transaction.

## What is a Distributed Transaction?

A **distributed transaction** is a transaction that spans multiple services or databases. It ensures that all participants either commit their changes or all roll back, maintaining data consistency across system boundaries.

```text
Local transaction (one database):
  BEGIN
    INSERT order
    UPDATE inventory
    INSERT payment
  COMMIT
  (All or nothing, guaranteed by the database)

Distributed transaction (multiple services):
  Order Service:   INSERT order
  Payment Service:  CHARGE card
  Inventory Service: RESERVE stock

  All must succeed → or all must undo
  No single database can guarantee this
```

## Why Does It Matter?

❌ **Problem:** Order is created and payment is charged, but inventory service is down. Stock isn't reserved. You have a paid order with no inventory. The customer is charged but can't get the product. Data is inconsistent across services.

✅ **Solution:** A distributed transaction protocol ensures all services commit or all roll back. If inventory fails, the payment is refunded and the order is cancelled. No partial states, no orphaned data.

## Two-Phase Commit (2PC)

The classic approach to distributed transactions.

### How It Works
```text
Coordinator orchestrates the transaction across all participants.

Phase 1: PREPARE
  Coordinator → "Can you commit?" → Participant A: "Yes"
                                 → Participant B: "Yes"
                                 → Participant C: "Yes"

Phase 2: COMMIT (or ABORT)
  If all participants said "Yes":
    Coordinator → "COMMIT" → All participants commit
  If any participant said "No":
    Coordinator → "ABORT" → All participants rollback

All or nothing.
```

### Problems with 2PC
```text
Blocking:
  If coordinator crashes after Phase 1, participants are locked
  They can't commit or abort — they're stuck waiting

Slow:
  Every participant must respond before proceeding
  One slow node blocks the entire transaction

Tight coupling:
  All participants must be available
  Can't proceed if any participant is down

Not suitable for microservices:
  Requires low-latency, reliable connections
  Doesn't work well across organizational boundaries
```

## Saga Pattern

The modern approach for microservices.

### How It Works
```text
Instead of one big transaction, break it into a sequence of local transactions.

Each step:
  1. Performs its local transaction
  2. Publishes an event
  3. Triggers the next step

If any step fails:
  Run compensating transactions in reverse to undo previous steps
```

### Example: E-Commerce Order
```text
Step 1: Order Service → Create order (PENDING)
  Success → trigger Step 2

Step 2: Payment Service → Charge card
  Success → trigger Step 3
  Failure → Compensate: Order Service cancels order

Step 3: Inventory Service → Reserve stock
  Success → trigger Step 4
  Failure → Compensate: Payment refunds, Order cancels

Step 4: Shipping Service → Schedule delivery
  Success → Order confirmed
  Failure → Compensate: Inventory releases, Payment refunds, Order cancels

Each compensation undoes the previous step's effects
```

### Choreography vs Orchestration

| Factor | Choreography | Orchestration |
|---|---|---|
| **How** | Each service emits events, next service reacts | Central coordinator tells each service what to do |
| **Coupling** | Loose — services don't know the full flow | Tighter — coordinator knows the full flow |
| **Visibility** | Hard to see the full flow | Clear — coordinator has the complete picture |
| **Complexity** | Simple for 2-3 steps | Better for many steps |
| **Debugging** | Harder — distributed event flow | Easier — central point of control |
| **Example** | Event-driven microservices | AWS Step Functions, Camunda |

## Saga vs 2PC

| Factor | Two-Phase Commit | Saga Pattern |
|---|---|---|
| **Locking** | Holds locks across all participants | No long-lived locks |
| **Failure** | Blocks until coordinator recovers | Compensating transactions undo work |
| **Performance** | Slow — waits for all participants | Faster — each step independent |
| **Isolation** | Full ACID isolation | No global isolation — intermediate states visible |
| **Complexity** | Simple concept, hard to make fast | Complex compensating logic, but performant |
| **Use case** | Same datacenter, low latency | Microservices, cross-service flows |

## Design Considerations

```text
Make operations idempotent:
  Compensation might be called multiple times
  Must be safe to retry

Handle partial failures gracefully:
  What if compensation also fails?
  Log and alert for manual intervention

Design compensating actions carefully:
  Cancel order → simple
  Refund payment → needs financial accuracy
  Unsend email → impossible (compensate differently)

Monitor saga execution:
  Track which steps completed
  Alert on stuck or failed sagas
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Distributed transaction** | Transaction spanning multiple services or databases |
| **Two-Phase Commit** | Coordinator asks all participants to prepare, then commit or abort |
| **Saga pattern** | Sequence of local transactions with compensating actions on failure |
| **Compensating transaction** | Undoes the effect of a previous step (reverse operation) |
| **Choreography** | Event-driven — each service triggers the next via events |
| **Orchestration** | Central coordinator manages the entire saga flow |
| **Idempotency** | Safe to retry — essential for compensation logic |
| **No global isolation** | Intermediate states are visible in sagas |

**Two-Phase Commit is a distributed transaction in theory. The Saga pattern is a distributed transaction that actually works in practice.**
