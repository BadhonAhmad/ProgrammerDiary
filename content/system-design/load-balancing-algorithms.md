---
title: "Load Balancing Algorithms"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "algorithms", "round-robin", "distribution"]
excerpt: "Learn the algorithms load balancers use to decide which server gets each request — from simple round robin to weighted and least-connection approaches."
---

# Load Balancing Algorithms

The load balancer receives a request. Now it must decide: which server should handle this? The algorithm it uses determines how evenly traffic is distributed and how well the system handles varying request types.

## Common Algorithms

### Round Robin

Take turns. Server 1, Server 2, Server 3, Server 1, Server 2...

```text
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A

Best for: Servers with similar specs and request types
```

### Weighted Round Robin

Assign weights based on server capacity. More powerful servers get more requests.

```text
Server A (weight 3): requests 1, 2, 3
Server B (weight 2): requests 4, 5
Server C (weight 1): request 6

Best for: Servers with different hardware specs
```

### Least Connections

Send to the server with fewest active connections.

```text
Server A: 50 connections
Server B: 23 connections  ← gets next request
Server C: 67 connections

Best for: Requests with varying processing times
```

### IP Hash

Hash the client IP to deterministically route to the same server.

```text
hash(192.168.1.10) → always Server A
hash(192.168.1.20) → always Server B

Best for: Session affinity (sticky sessions)
```

### Least Response Time

Send to the server with fewest connections AND lowest average response time.

```text
Best for: Heterogeneous environments where some servers are faster
```

### Random

Pick a random server. Surprisingly effective at large scale.

```text
Best for: Very large server pools where other algorithms add overhead
```

## Comparison

| Algorithm | Distribution | Session Affinity | Server Awareness | Complexity |
|---|---|---|---|---|
| **Round Robin** | Even | ❌ | ❌ | Low |
| **Weighted Round Robin** | Weighted | ❌ | Partial | Low |
| **Least Connections** | Dynamic | ❌ | ✅ | Medium |
| **IP Hash** | Even-ish | ✅ | ❌ | Low |
| **Least Response Time** | Dynamic | ❌ | ✅ | Medium |

## Key Points Cheat Sheet

| Algorithm | Best When |
|---|---|
| **Round Robin** | Uniform servers, uniform requests |
| **Weighted Round Robin** | Mixed server capacities |
| **Least Connections** | Variable request durations |
| **IP Hash** | Need sticky sessions |
| **Least Response Time** | Mixed server performance |

**No algorithm is perfect for every case. Match the algorithm to your traffic pattern and server configuration.**
