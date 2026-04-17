---
title: "Hexagonal Architecture: Ports and Adapters"
date: "2026-04-17"
tags: ["system-design", "hexagonal-architecture", "ports-adapters", "architecture"]
excerpt: "Learn how hexagonal architecture (ports and adapters) isolates your domain logic from the outside world — making it testable, replaceable, and framework-independent."
---

# Hexagonal Architecture: Ports and Adapters

Clean Architecture's cousin. Same goal — protect business logic — with a different mental model. Instead of concentric layers, think of a hexagon: business logic in the center, adapters on every side connecting it to the outside world.

## What is Hexagonal Architecture?

**Hexagonal Architecture** (Alistair Cockburn, 2005) isolates business logic from all external concerns using **ports** and **adapters**. The application core communicates only through ports (interfaces), and adapters connect those ports to external systems.

```text
              ┌─────────────────┐
  REST API ──>│   Adapter       │
              ├─────────────────┤
              │  ┌───────────┐  │
  Database ──>│  │           │  │──> Email Service
              │  │   CORE    │  │
  CLI     ──>│  │  BUSINESS  │  │──> Message Queue
              │  │   LOGIC    │  │
  Tests   ──>│  │           │  │──> External API
              │  └───────────┘  │
              ├─────────────────┤
         UI ──>│   Adapter       │
              └─────────────────┘

Ports = interfaces (what the core needs)
Adapters = implementations (how external systems fulfill those needs)
```

## Ports and Adapters

### Ports

Interfaces defined by the application core that describe **what it needs**.

```text
// Inbound port (driving port) — how the outside world talks TO the core
interface OrderService {
  createOrder(items: Item[], userId: string): Promise<Order>;
  getOrder(orderId: string): Promise<Order>;
}

// Outbound port (driven port) — how the core talks TO the outside world
interface OrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
}

interface PaymentGateway {
  charge(userId: string, amount: number): Promise<PaymentResult>;
}
```

### Adapters

Implementations that connect ports to real external systems.

```text
// Inbound adapter — REST controller
class RestOrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req, res) {
    const order = await this.orderService.createOrder(req.body.items, req.user.id);
    res.status(201).json(order);
  }
}

// Outbound adapter — PostgreSQL repository
class PostgresOrderRepository implements OrderRepository {
  async save(order) { /* SQL INSERT */ }
  async findById(id) { /* SQL SELECT */ }
}

// Outbound adapter — Stripe payment gateway
class StripePaymentGateway implements PaymentGateway {
  async charge(userId, amount) { /* Stripe API call */ }
}
```

## Why Does It Matter?

❌ **Problem:** Your domain logic directly calls Stripe's API. Now you want to switch to PayPal. You have to rewrite the payment logic scattered across the codebase. Or you want to test the order flow — but you can't without making real Stripe charges.

✅ **Solution:** The core defines a `PaymentGateway` port. In production, `StripePaymentGateway` implements it. In tests, `FakePaymentGateway` always succeeds. Switching to PayPal means writing one new adapter — the core never changes.

## Hexagonal vs Clean vs Layered

| Factor | Layered | Clean | Hexagonal |
|---|---|---|---|
| **Core idea** | Horizontal layers | Concentric circles | Ports and adapters |
| **Dependency direction** | Top → bottom | Outside → inside | Outside → center |
| **External connections** | Bottom layer only | Framework layer | Any side of hexagon |
| **Testability** | Mock layers | Mock at boundaries | Replace adapters |
| **Best for** | Simple CRUD apps | Complex domains | Systems with many external integrations |

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Hexagonal architecture** | Isolate business logic via ports and adapters |
| **Port** | Interface defining what the core needs |
| **Adapter** | Implementation connecting port to external system |
| **Inbound port** | How outside world calls into the core (e.g., REST controller) |
| **Outbound port** | How the core calls out to external systems (e.g., repository) |
| **Test adapters** | Replace real adapters with fakes for fast, isolated testing |
| **Swap freely** | Change database, payment provider, or framework — core stays the same |

**If you can't replace your database, payment gateway, and framework without touching business logic, your architecture isn't hexagonal — it's coupled.**
