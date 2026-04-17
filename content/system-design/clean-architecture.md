---
title: "Clean Architecture: Depend on Nothing but the Business"
date: "2026-04-17"
tags: ["system-design", "clean-architecture", "architecture", "SOLID", "domain"]
excerpt: "Learn how Clean Architecture puts business logic at the center and makes everything else — databases, frameworks, UI — a plug-in detail that can be swapped."
---

# Clean Architecture: Depend on Nothing but the Business

Your business rules don't care whether you use PostgreSQL or MongoDB. They don't care about Express or Fastify. Clean Architecture makes this explicit — the business logic knows nothing about the outside world, and everything else is an implementation detail.

## What is Clean Architecture?

**Clean Architecture** (Robert C. Martin) organizes code into concentric layers where **dependencies point inward**. The innermost layer contains business rules. Outer layers contain frameworks, databases, and UI. The rule: **inner layers never depend on outer layers.**

```text
┌──────────────────────────────────────────┐
│  Frameworks & Drivers                    │
│  (Web, Database, External APIs)          │
│  ┌────────────────────────────────────┐  │
│  │  Interface Adapters                │  │
│  │  (Controllers, Gateways, Presenters)│  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  Application Business Rules  │  │  │
│  │  │  (Use Cases)                 │  │  │
│  │  │  ┌────────────────────────┐  │  │  │
│  │  │  │ Enterprise Business    │  │  │  │
│  │  │  │ Rules (Entities)       │  │  │  │
│  │  │  └────────────────────────┘  │  │  │
│  │  └──────────────────────────────┘  │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘

Dependency rule: → arrows always point inward
```

## The Layers

### Entities (Enterprise Business Rules)

Core business objects and rules. Pure logic, no dependencies.

```text
// Pure business entity — no framework, no database
class User {
  constructor(id, email, role) {
    this.id = id;
    this.email = email;
    this.role = role;
  }

  canAccessAdmin() {
    return this.role === "admin";
  }
}
```

### Use Cases (Application Business Rules)

Orchestrate business rules for specific operations.

```text
class CreateOrderUseCase {
  constructor(orderRepository, paymentService) {
    this.orderRepository = orderRepository;
    this.paymentService = paymentService;
  }

  async execute(items, userId) {
    const total = items.reduce((sum, item) => sum + item.price, 0);
    if (total <= 0) throw new Error("Invalid order total");

    await this.paymentService.charge(userId, total);
    return this.orderRepository.save({ items, userId, total });
  }
}
```

### Interface Adapters

Translate between use cases and external systems.

```text
// Controller (Web adapter) — translates HTTP to use case
class OrderController {
  constructor(createOrderUseCase) {
    this.createOrder = createOrderUseCase;
  }

  async handle(req, res) {
    try {
      const order = await this.createOrder.execute(req.body.items, req.user.id);
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}
```

### Frameworks & Drivers

External tools: Express, PostgreSQL, Redis, AWS. The outermost, most disposable layer.

## The Dependency Inversion

The key trick: inner layers define **interfaces** that outer layers implement.

```text
// Inner layer defines what it needs (interface)
interface OrderRepository {
  save(order): Promise<Order>;
  findById(id): Promise<Order>;
}

// Outer layer implements it (PostgreSQL)
class PostgresOrderRepository implements OrderRepository {
  async save(order) { /* SQL INSERT */ }
  async findById(id) { /* SQL SELECT */ }
}

// Use case depends on the interface, not the implementation
// Swap PostgreSQL → MongoDB? Just write a new repository implementation.
```

## Why Does It Matter?

❌ **Problem:** Your business logic is sprinkled with SQL queries, Express middleware calls, and Redis client code. Changing the database means rewriting business rules. Switching from Express to Fastify means touching every route handler. Testing a business rule requires spinning up a database.

✅ **Solution:** Clean Architecture isolates business logic from infrastructure. Swap databases, frameworks, or external services without touching business rules. Test use cases with mock repositories — no database, no HTTP server, pure logic.

## Trade-offs

| ✅ Benefits | ❌ Costs |
|---|---|
| Business logic is independent and testable | More files and boilerplate |
| Easy to swap databases and frameworks | Steeper learning curve |
| Clear separation of concerns | Can be over-engineering for simple apps |
| Long-term maintainability | More abstraction layers to navigate |

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Clean Architecture** | Dependencies point inward — business rules depend on nothing |
| **Entities** | Core business objects and rules |
| **Use cases** | Application-specific business logic |
| **Interface adapters** | Translate between layers (controllers, repositories) |
| **Dependency inversion** | Inner layers define interfaces, outer layers implement them |
| **Testability** | Business logic tested without any external dependencies |
| **Swappability** | Change database or framework without touching business rules |

**Clean Architecture costs more upfront but pays dividends every time you change a database, framework, or external service without touching business logic.**
