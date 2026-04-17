---
title: "What is Load Balancing?"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "fundamentals", "architecture"]
excerpt: "Learn the fundamentals of load balancing — how it distributes traffic across servers, prevents overloading, and provides the foundation for horizontal scaling."
---

# What is Load Balancing?

Your app has 10 servers. Users should never need to know which one they're hitting. The load balancer makes sure of that — standing at the front door, directing traffic so no server gets overwhelmed.

## What is a Load Balancer?

A **load balancer** distributes incoming network traffic across multiple backend servers. It sits between clients and servers, acting as a traffic coordinator — ensuring no single server bears too much load.

```text
Clients → Load Balancer → Server 1
                      → Server 2
                      → Server 3

The client only sees the load balancer.
Servers are invisible behind it.
```

## Why Does It Matter?

❌ **Problem:** One server handles all traffic. At peak, it maxes out at 100% CPU. Users experience timeouts and errors. You have two more servers sitting idle because there's no way to distribute requests to them. Adding more servers doesn't help if traffic can't reach them.

✅ **Solution:** A load balancer sits in front of all servers and distributes requests evenly. Each server handles a fraction of the total load. If one fails, traffic routes to the others automatically. Add more servers to handle more traffic — the load balancer includes them seamlessly.

## What a Load Balancer Does

| Function | How It Helps |
|---|---|
| **Traffic distribution** | Spreads requests evenly across servers |
| **Health checking** | Detects dead servers, stops routing to them |
| **SSL termination** | Handles HTTPS so servers don't have to |
| **Session persistence** | Optionally routes same user to same server |
| **Compression** | Compresses responses to save bandwidth |
| **Connection draining** | Lets in-flight requests finish before removing a server |

## Benefits

```text
Without load balancer:
  1 server → single point of failure
  Adding servers doesn't help (no way to distribute)
  No health checking (requests hit dead servers)

With load balancer:
  Multiple servers → redundancy (one fails, others handle it)
  Easy scaling (add servers, load balancer includes them)
  Automatic health checking (dead servers removed from rotation)
  Zero-downtime deployments (drain one, update, add back, repeat)
```

## Where Load Balancers Sit

```text
Layer 1: Between internet and your servers (public-facing)
  Users → [LB] → Web Servers

Layer 2: Between web servers and API servers (internal)
  Web Servers → [LB] → API Servers

Layer 3: Between API servers and databases (internal)
  API Servers → [LB] → Database Read Replicas
```

Multiple layers of load balancing at each tier of your architecture.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Load balancer** | Distributes traffic across multiple servers |
| **Traffic distribution** | Evenly spreads requests |
| **Health checking** | Detects and avoids dead servers |
| **SSL termination** | Handles encryption, servers stay fast |
| **Horizontal scaling enabler** | Adding servers is pointless without a way to distribute traffic |
| **Multiple layers** | LB at each tier: web, API, database |

**A load balancer is the traffic cop of your architecture — without it, adding more servers is like adding more lanes to a highway with only one on-ramp.**
