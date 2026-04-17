---
title: "Least Connections Load Balancing"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "least-connections", "algorithms"]
excerpt: "Learn how least connections routing sends requests to the server with the lightest load — and why it outperforms round robin when request times vary."
---

# Least Connections Load Balancing

Round robin gives each server equal turns. But what if Server A's requests take 1 second and Server B's take 10 milliseconds? Server A falls behind while Server B sits idle. Least connections fixes this by routing to the least busy server.

## How It Works

The load balancer tracks active connections per server and sends each new request to the server with the fewest current connections.

```text
Current state:
  Server A: 45 active connections
  Server B: 23 active connections  ← least busy, gets next request
  Server C: 67 active connections

After sending to B:
  Server A: 45
  Server B: 24  (23 + 1 new)
  Server C: 67

Next request goes to whoever is least busy NOW
```

## Why It Beats Round Robin

```text
Scenario: Mixed request durations
  Some requests: 10ms (simple queries)
  Other requests: 5000ms (heavy reports)

Round Robin:
  Each server gets equal requests
  Server that got 3 heavy requests: 15,000ms of work piled up
  Server that got 3 light requests: 30ms of work, sitting idle

Least Connections:
  Server with piled-up work has many active connections
  New requests go to the idle server instead
  Load stays balanced despite varying request complexity
```

## Weighted Least Connections

Factor in server capacity alongside connection count:

```text
Adjusted connections = active connections / weight

Server A (weight 3): 30 connections → 30/3 = 10 adjusted
Server B (weight 1): 8 connections  → 8/1 = 8 adjusted  ← gets next request
Server C (weight 2): 12 connections → 12/2 = 6 adjusted ← actually this one

Best of both worlds: capacity-aware + load-aware
```

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Least connections** | Route to server with fewest active connections |
| **Better than round robin** | Handles variable request durations |
| **Dynamic** | Adjusts in real-time based on actual load |
| **Weighted variant** | Accounts for different server capacities |
| **Best for** | APIs with mixed request complexity |

**Round robin treats all requests equally. Least connections treats all servers fairly — there's a difference.**
