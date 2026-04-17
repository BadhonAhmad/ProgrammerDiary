---
title: "Load Distribution: Spread Work Evenly"
date: "2026-04-17"
tags: ["system-design", "load-distribution", "scaling", "architecture"]
excerpt: "Learn how load distribution spreads work across multiple resources — from request-level to data-level to task-level — to prevent bottlenecks and maximize utilization."
---

# Load Distribution: Spread Work Evenly

10 servers sitting idle while 1 server handles all the traffic. That's a load distribution problem. It doesn't matter how many machines you have if the work isn't spread evenly across them.

## What is Load Distribution?

**Load distribution** is the practice of spreading work evenly across available resources — servers, databases, queues, CPU cores — so no single resource is overwhelmed while others sit idle.

```text
Poor distribution:
  Server A: 95% CPU    ████████████████████████
  Server B: 10% CPU    ██
  Server C: 5% CPU     █

Good distribution:
  Server A: 35% CPU    █████████
  Server B: 37% CPU    █████████
  Server C: 33% CPU    ████████
```

## Levels of Load Distribution

### Request-Level

Distribute incoming HTTP requests across web servers.

```text
Client requests → Load Balancer → Server 1, Server 2, Server 3

Techniques: Round robin, least connections, IP hash
```

### Data-Level

Distribute data across database shards.

```text
Users A-M → Database Shard 1
Users N-Z → Database Shard 2

Each shard handles a fraction of read/write load
```

### Task-Level

Distribute background jobs across worker processes.

```text
Job Queue → Worker 1, Worker 2, Worker 3

Each worker pulls the next available job
```

### Geographic

Distribute traffic to servers closest to the user.

```text
User in Europe → European server
User in Asia → Asian server

CDN and DNS-based routing handle this
```

## Common Patterns

| Pattern | How It Works | Best For |
|---|---|---|
| **Round robin** | Equal turns | Uniform request sizes |
| **Least connections** | Send to busiest-free server | Variable request durations |
| **Hash-based** | Hash key to assign server | Consistent routing needed |
| **Work stealing** | Idle workers pull from busy queues | Task queues with variable job sizes |
| **Consistent hashing** | Hash with minimal reassignment on changes | Distributed caches, databases |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Load distribution** | Spread work evenly across resources |
| **Request-level** | Load balancer across web servers |
| **Data-level** | Sharding across databases |
| **Task-level** | Job queue across workers |
| **Geographic** | CDN routing to nearest server |
| **Goal** | No single resource overwhelmed, none sitting idle |

**Adding more resources solves nothing if all the work goes to one of them. Distribution is as important as capacity.**
