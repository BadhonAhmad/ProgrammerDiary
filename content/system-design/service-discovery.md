---
title: "Service Discovery in System Design"
date: "2026-04-17"
tags: ["system-design", "service-discovery", "microservices", "architecture"]
excerpt: "Learn how services find each other in dynamic environments where instances constantly start, stop, and move — from DNS to service registries like Consul."
---

# Service Discovery in System Design

Your order service needs to call the payment service. Hardcoded IP? That changes every deploy. Hardcoded hostname? That breaks when the service scales to 3 instances. Service discovery gives services a dynamic way to find each other.

## What is Service Discovery?

**Service discovery** is how services locate each other at runtime in a dynamic environment. Instead of hardcoded addresses, services register themselves and look up others through a discovery mechanism.

```text
Static world:
  Order Service → hardcoded → http://10.0.1.5:3000
  When 10.0.1.5 changes → connection fails

Dynamic world:
  Order Service → "Where is payment-service?" → Registry
  Registry → "http://10.0.1.5:3000, http://10.0.1.6:3000"
  Order Service → calls one of them
```

## Approaches

### DNS-Based

Use hostnames resolved by DNS.

```text
Call http://payment-service:3000
DNS resolves to current IP address

Pros: Zero config in Docker Compose and Kubernetes
Cons: DNS caching can serve stale addresses
```

### Client-Side Discovery

The client queries a registry and picks a server.

```text
Client → Service Registry (Consul, Eureka) → Gets list of healthy instances
Client → Picks one (round robin, random) → Calls directly

Pros: Client has full control
Cons: Client needs discovery logic
```

### Server-Side Discovery

A load balancer or proxy handles discovery for the client.

```text
Client → Calls one URL (load balancer)
Load Balancer → Queries registry → Routes to healthy instance

Pros: Client is simple (one URL)
Cons: Extra hop through load balancer
```

## Service Registry

The central database of all service instances and their locations.

```text
Registration flow:
  1. Service starts → registers with registry (name, IP, port)
  2. Service sends heartbeat periodically
  3. Service stops → deregisters

Discovery flow:
  1. Client queries registry for "payment-service"
  2. Registry returns list of healthy instances
  3. Client picks one and calls it

Health checking:
  Registry tracks health via HTTP checks or heartbeats
  Unhealthy instances excluded from query results
```

## Tools

| Tool | Type | Best For |
|---|---|---|
| **Kubernetes DNS** | DNS-based | K8s deployments (built-in) |
| **Consul** | Full registry | Multi-environment, on-prem |
| **Eureka** | Client-side | Spring Cloud / Java |
| **etcd** | Key-value store | Simple registries, Kubernetes internals |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Service discovery** | Services find each other dynamically at runtime |
| **DNS-based** | Simple — resolve hostnames |
| **Client-side** | Client queries registry, picks instance |
| **Server-side** | Load balancer queries registry for client |
| **Service registry** | Database of live service instances |
| **Health checking** | Only return healthy instances |
| **Auto-registration** | Services register/deregister on start/stop |

**In a world where servers start, stop, and move constantly, hardcoded addresses are a liability. Service discovery makes your architecture dynamic by design.**
