---
title: "Monolithic vs Microservices: Two Ways to Build a Backend"
date: "2026-04-17"
tags: ["backend", "fundamentals", "architecture", "microservices", "monolith"]
excerpt: "Understand the two dominant backend architectures — monolithic and microservices — when each makes sense, and why most startups should start with a monolith."
---

# Monolithic vs Microservices: Two Ways to Build a Backend

Every backend architecture decision eventually leads to one question: should everything live in one codebase, or should we split it into separate services? The answer has real consequences for how fast you ship, how you scale, and how much operational pain you sign up for.

## What Are Monoliths and Microservices?

### Monolithic Architecture

A **monolith** is a single, unified application where all the code — authentication, user management, payments, notifications, API — lives in one codebase and runs as one process.

```text
┌────────────────────────────────────────┐
│            Monolith                    │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │   Auth   │ │ Payments │ │ Users  │ │
│  └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │  Orders  │ │   Email  │ │ Search │ │
│  └──────────┘ └──────────┘ └────────┘ │
│            One codebase                │
│            One deployment              │
│            One database                │
└────────────────────────────────────────┘
```

### Microservices Architecture

**Microservices** split the application into small, independent services. Each service owns its own data, runs its own process, and communicates with other services over the network (typically via APIs or message queues).

```text
┌──────────┐  ┌──────────┐  ┌──────────┐
│   Auth   │  │ Payments │  │  Users   │
│ Service  │  │ Service  │  │ Service  │
│  (DB)    │  │  (DB)    │  │  (DB)    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    ↓
             API Gateway
                    ↓
               Client
```

Each service is independently deployable, independently scalable, and independently maintainable.

## Why It Matters

### ❌ Problem: Picking the Wrong Architecture Early

Choose microservices too early and you spend months building infrastructure (service discovery, load balancing, distributed tracing, inter-service communication) instead of building your product. Choose a monolith and ignore scaling concerns, and you eventually end up with a tangled codebase that no team can move fast in.

### ✅ Solution: Match Architecture to Your Stage

Start monolithic, extract services when a specific bottleneck justifies it. This is not a compromise — it is how most successful companies actually evolved.

## Monolith: Deep Dive

### Advantages

- **Simple to develop** — one codebase, one IDE project, one `git clone`
- **Simple to deploy** — one build, one deployment, one process to monitor
- **Easy to refactor** — change a function signature? Your compiler catches every call site across the entire app
- **Simple to test** — integration tests run against the whole system locally
- **Low operational overhead** — one server, one database, one set of logs
- **Fast to start** — zero infrastructure decisions needed on day one

### Disadvantages

- **Scaling is all-or-nothing** — if the search feature is slow, you scale the entire app, even though only search needs more resources
- **Deployment risk** — one bad deploy takes down everything
- **Team bottlenecks** — 20 developers merging into one codebase creates merge conflicts and coordination overhead
- **Technology lock-in** — the entire app uses one language and framework

### Variations

- **Modular monolith** — structurally separated modules within one deployment. Each module has its own domain logic, but they share the same runtime. Gives you clean boundaries without the operational cost of separate services. Many teams consider this the sweet spot.

## Microservices: Deep Dive

### Advantages

- **Independent scaling** — scale the payment service to 10 instances while the auth service runs on 2
- **Independent deployment** — deploy the email service without touching anything else
- **Technology diversity** — write the ML service in Python, the API gateway in Go, the real-time service in Elixir
- **Team ownership** — each team owns their service end-to-end (code, deployment, monitoring, incidents)
- **Fault isolation** — if the notification service crashes, payments and auth keep working

### Disadvantages

- **Network complexity** — services communicate over the network, which is slower and less reliable than in-process function calls
- **Distributed data** — each service has its own database. Queries that span services require API calls or event-driven synchronization. There is no single source of truth anymore.
- **Debugging is hard** — a user's request might flow through five services. Tracing the failure requires distributed tracing tools (Jaeger, Zipkin)
- **Deployment complexity** — 10 services means 10 build pipelines, 10 deployment processes, 10 sets of environment variables
- **Data consistency** — no more ACID transactions across services. You eventually need to embrace **eventual consistency** and patterns like **saga** or **outbox**
- **Operational overhead** — service discovery, load balancing, health checks, circuit breakers, retry logic, API gateways, centralized logging

### What You Need Before Microservices

Microservices do not save you from complexity — they move it from the codebase to the infrastructure. Before adopting them, you need:

- **CI/CD pipelines** — automated build, test, and deploy for every service
- **Container orchestration** — Docker + Kubernetes or equivalent
- **Centralized logging** — all services log to one place (ELK, Datadog)
- **Distributed tracing** — trace a request across service boundaries
- **API gateway** — single entry point that routes to the correct service
- **Service discovery** — services find each other dynamically
- **Monitoring and alerting** — know immediately when a service is down

## The Decision Framework

| Factor | Monolith | Microservices |
|--------|----------|---------------|
| Team size | 1-8 developers | 10+ developers |
| Project stage | MVP, early product | Mature product with clear bottlenecks |
| Deployment frequency | Weekly/daily | Multiple times per day per service |
| Scaling needs | Uniform load | Specific features need disproportionate resources |
| Operational expertise | Basic DevOps | Dedicated DevOps/SRE team |
| Time to market | Fast (less infrastructure) | Slow (more infrastructure) |
| Fault tolerance requirement | Acceptable downtime | Individual service failures must not cascade |

### The Pragmatic Path

Most successful companies did not start with microservices. They started with a monolith, identified specific components that needed independent scaling or independent deployment, and extracted those into services one at a time.

```text
Year 1:  Monolith — ship fast, learn what matters
Year 2:  Modular monolith — clean boundaries within one app
Year 3:  Extract the first microservice — the one with a real scaling problem
Year 4:  Gradually extract more services as bottlenecks emerge
```

Extracting a service from a well-structured modular monolith is straightforward. Extracting services from a tangled monolith is a nightmare. So structure your monolith well from the start.

## Key Points Cheat Sheet

| Concept | What to Remember |
|---------|-----------------|
| **Monolith** | One codebase, one deployment, one database. Simple to build, simple to operate. |
| **Microservices** | Many services, many deployments, many databases. Flexible but operationally expensive. |
| **Modular monolith** | Clean module boundaries inside one app — best of both worlds for most teams. |
| **Start monolithic** | Ship your product. Extract services when you have a specific reason to. |
| **Scaling** | Monolith scales as a whole. Microservices scale per feature. |
| **Complexity trade-off** | Monolith: code complexity. Microservices: infrastructure complexity. |
| **Prerequisites** | Microservices need CI/CD, containers, centralized logging, distributed tracing. |

There is no universally correct architecture — only the right architecture for your current stage, team size, and problem. Start simple, measure where the real bottlenecks are, and split only when the data tells you to.
