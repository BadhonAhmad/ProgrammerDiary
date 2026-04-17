---
title: "Layered Architecture: The Classic Organization"
date: "2026-04-17"
tags: ["system-design", "layered-architecture", "architecture", "patterns"]
excerpt: "Learn how layered architecture organizes code into horizontal layers — presentation, business, data — and why it's still the default for most applications."
---

# Layered Architecture: The Classic Organization

Most web apps follow the same pattern: routes call services, services call the database. This instinctive separation into layers is the oldest and most widely used architecture pattern — and it works for good reason.

## What is Layered Architecture?

**Layered architecture** (also called n-tier architecture) organizes a system into horizontal layers, each with a specific responsibility. Each layer only communicates with the layer directly above or below it.

```text
┌─────────────────────────────┐
│    Presentation Layer        │  Routes, controllers, HTTP handling
├─────────────────────────────┤
│    Business Logic Layer      │  Services, rules, validation
├─────────────────────────────┤
│    Data Access Layer         │  Database queries, ORM, repositories
├─────────────────────────────┤
│    Database                  │  PostgreSQL, MongoDB, etc.
└─────────────────────────────┘

Request flows DOWN: Presentation → Business → Data Access → Database
Response flows UP:  Database → Data Access → Business → Presentation
```

## Why Does It Matter?

❌ **Problem:** Without layers, a route handler directly writes SQL queries, contains business logic, and formats HTML responses. Changing the database means rewriting route handlers. Adding a mobile API means duplicating all the logic. Testing requires running the entire HTTP stack.

✅ **Solution:** Layers separate concerns. Change the database → only data access layer affected. Add a mobile API → reuse business and data layers. Test business logic → no HTTP or database needed.

## The Standard Layers

| Layer | Responsibility | Example |
|---|---|---|
| **Presentation** | Handle HTTP, parse input, format output | Express routes, controllers |
| **Business** | Core rules, validation, orchestration | Service classes, domain logic |
| **Data Access** | Database queries, data mapping | Repository classes, Prisma queries |
| **Database** | Persistent storage | PostgreSQL, MongoDB |

### Communication Rules

```text
✅ Allowed:
  Presentation → Business → Data Access → Database
  Each layer only knows the layer directly below

❌ Not allowed:
  Presentation → Data Access (skipping business layer)
  Business → Presentation (depending on HTTP details)
  Data Access → Business (reverse dependency)
```

## Pros and Cons

| ✅ Pros | ❌ Cons |
|---|---|
| Easy to understand | Can become "sinkhole" (layers just pass through) |
| Clear separation of concerns | Tends toward monolith (all layers in one deploy) |
| Testable (mock layers independently) | Hard to scale individual layers |
| Works for 90% of applications | Can add unnecessary abstraction for simple apps |

## When to Use

```text
✅ Most CRUD web applications
✅ APIs with straightforward business logic
✅ When the team is small and needs a simple, well-understood structure
✅ Applications where testability and maintainability matter more than scale

❌ Highly complex domains (consider Clean/Hexagonal)
❌ Systems needing independent scaling of layers (consider microservices)
```

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Layered architecture** | Horizontal layers with specific responsibilities |
| **Presentation layer** | HTTP handling, input/output formatting |
| **Business layer** | Core logic, rules, validation |
| **Data access layer** | Database queries, repositories |
| **Dependency direction** | Always downward — upper layers depend on lower, never reverse |
| **Separation of concerns** | Each layer handles one aspect of the application |

**Layered architecture is the default for a reason — it's simple, it works, and every developer understands it. Don't overthink it for simple apps.**
