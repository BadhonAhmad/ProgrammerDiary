---
title: "Round Robin Load Balancing"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "round-robin", "algorithms"]
excerpt: "Learn how round robin load balancing works — the simplest algorithm that cycles through servers in order, and when it's the right choice."
---

# Round Robin Load Balancing

The simplest load balancing algorithm. Take turns. Server A, then Server B, then Server C, then back to A. No thinking required — and for many workloads, that's exactly enough.

## How It Works

```text
3 servers: A, B, C

Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A
Request 5 → Server B
Request 6 → Server C
...
```

The load balancer maintains a counter and cycles through servers in order.

## When Round Robin Works

```text
✅ All servers have identical hardware
✅ Requests have similar processing time
✅ You want the simplest possible distribution
✅ No need for session affinity

Example: 5 identical API servers behind a load balancer
→ Round robin gives each server ~20% of traffic
```

## When Round Robin Fails

```text
❌ Servers have different specs (powerful server gets same load as weak one)
❌ Requests vary in complexity (some take 10ms, others take 10s)
❌ Need session persistence (user must hit same server)
❌ Some servers are geographically closer (no awareness of latency)
```

## Weighted Round Robin

Assign weights to handle servers with different capacities:

```text
Server A (8 cores): weight 4
Server B (4 cores): weight 2
Server C (2 cores): weight 1

Distribution: A, A, A, A, B, B, C
Server A gets 4/7 of traffic, B gets 2/7, C gets 1/7
```

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Round robin** | Cycle through servers in turn-based order |
| **Simple** | No state tracking, minimal overhead |
| **Even distribution** | Works when all servers and requests are similar |
| **Weighted variant** | Assign weights for servers with different capacities |
| **Limitation** | Doesn't account for current server load or request complexity |

**Round robin is the default for a reason — it's simple, predictable, and works well when all servers are equal.**
