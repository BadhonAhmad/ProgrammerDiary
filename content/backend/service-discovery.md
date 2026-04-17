---
title: "Service Discovery: How Services Find Each Other"
date: "2026-04-17"
tags: ["backend", "service-discovery", "microservices", "DNS", "Consul", "architecture"]
excerpt: "Learn how services locate each other in a dynamic environment where instances start, stop, and move constantly — from DNS to service registries like Consul."
---

# Service Discovery: How Services Find Each Other

Your order service needs to call the payment service. You hardcode `http://payment-service:3000`. Then the payment service moves to port 3001. Then it scales to 3 instances. Then one instance crashes. Your hardcoded URL is wrong three times over. Service discovery solves this.

## What is Service Discovery?

**Service discovery** is how services find and communicate with each other in a dynamic environment. Instead of hardcoding addresses, services register themselves and look up other services at runtime.

```text
Without service discovery:
  Order Service → hardcoded → http://payment-service:3000
  Payment service moves/crashes/scales → connection fails

With service discovery:
  Order Service → "Where is payment-service?" → Registry → "http://10.0.1.5:3000, http://10.0.1.6:3000"
  Order Service → calls http://10.0.1.5:3000
  If that instance dies → next lookup returns only healthy instances
```

## Why Does It Matter?

❌ **Problem:** You have 15 microservices. Each one has a config file listing the addresses of every service it talks to. When a service moves, scales, or crashes, you manually update config files across all dependent services and redeploy. In a containerized environment (Docker, Kubernetes), services start and stop constantly — IPs change every deployment. Manual configuration becomes impossible.

✅ **Solution:** Services self-register with a discovery mechanism when they start and deregister when they stop. Other services query the registry to find live instances dynamically. No hardcoded addresses, no manual updates.

## Service Discovery Approaches

### Approach 1: DNS-Based Discovery

The simplest form. Use DNS names instead of IP addresses.

```text
Instead of: http://10.0.1.5:3000
Use:        http://payment-service:3000

DNS resolves "payment-service" to the current IP.
```

**Docker Compose example:**

```text
# docker-compose.yml
services:
  order-service:
    build: ./order-service
    environment:
      - PAYMENT_URL=http://payment-service:3000

  payment-service:
    build: ./payment-service
    # Docker DNS resolves "payment-service" to this container's IP
```

**Kubernetes example:**

```text
# Kubernetes creates DNS entries automatically
# Service name: payment-service.namespace.svc.cluster.local

apiVersion: v1
kind: Service
metadata:
  name: payment-service
spec:
  selector:
    app: payment
  ports:
    - port: 80
      targetPort: 3000
```

Other pods call `http://payment-service` and Kubernetes DNS resolves it.

| Pros | Cons |
|---|---|
| Zero setup in Docker/K8s | DNS caching can serve stale addresses |
| Simple, well-understood | No health checking (built-in) |
| Language agnostic | Limited load balancing options |

### Approach 2: Client-Side Discovery

The client queries a **service registry** and chooses an instance itself.

```text
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Client   │────>│  Service     │     │ Payment   │
│  (Order   │     │  Registry    │     │ Service 1 │
│  Service) │     │  (Consul)    │     │ Payment   │
│           │<────│              │     │ Service 2 │
│           │     └──────────────┘     └───────────┘
│           │────> Payment Service 1
└──────────┘     (client chooses which instance)
```

```text
// Register on startup
await consul.agent.service.register({
  name: "payment-service",
  id: "payment-1",
  address: "10.0.1.5",
  port: 3000,
  check: {
    http: "http://10.0.1.5:3000/health",
    interval: "10s",
  },
});

// Discover on demand
const services = await consul.health.service({
  service: "payment-service",
  passing: true,  // Only healthy instances
});

// services[0].Service.Address → "10.0.1.5"
// services[1].Service.Address → "10.0.1.6"
// Client picks one (round-robin, random, etc.)
```

| Pros | Cons |
|---|---|
| Client has full control over selection | Client must implement load balancing |
| Health-aware (only gets healthy instances) | Client coupled to discovery library |
| Works outside Kubernetes | More client code |

### Approach 3: Server-Side Discovery (Load Balancer / Sidecar)

A load balancer or sidecar proxy handles discovery. The client calls the balancer, which routes to a healthy instance.

```text
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Client   │────>│ Load Balancer│────>│ Payment   │
│  (Order   │     │ / Sidecar    │     │ Service 1 │
│  Service) │     │ (queries     │     │ Payment   │
│           │     │  registry)   │────>│ Service 2 │
└──────────┘     └──────────────┘     └───────────┘

Client calls one URL → balancer routes to healthy instance
```

This is how **Kubernetes Services** and **AWS ALB** work — the client doesn't know about individual instances.

| Pros | Cons |
|---|---|
| Client is simple (one URL) | Extra hop through balancer |
| Centralized health checking | Balancer is another component to manage |
| Client doesn't need discovery code | Less client control over routing |

## Service Registry Tools

| Tool | How It Works | Best For |
|---|---|---|
| **Kubernetes DNS** | Built-in DNS for K8s services | Any Kubernetes deployment |
| **Consul** | Distributed key-value store + health checks | Multi-environment, on-prem, hybrid |
| **Eureka** | Netflix's service registry (Java-centric) | Spring Cloud / Java ecosystems |
| **etcd** | Distributed key-value store | Kubernetes internals, simple registries |
| **ZooKeeper** | Distributed coordination service | Hadoop, Kafka, legacy systems |

### Consul Example

```text
// Install Consul
docker run -d --name consul -p 8500:8500 consul agent -dev

// Register a service (on startup)
await fetch("http://localhost:8500/v1/agent/service/register", {
  method: "PUT",
  body: JSON.stringify({
    ID: "order-service-1",
    Name: "order-service",
    Address: "10.0.1.10",
    Port: 3000,
    Check: {
      HTTP: "http://10.0.1.10:3000/health",
      Interval: "10s",
      Timeout: "3s",
    },
  }),
});

// Discover services (on demand)
const response = await fetch(
  "http://localhost:8500/v1/health/service/order-service?passing"
);
const services = await response.json();

// Consul UI available at http://localhost:8500
// Shows all registered services, health status, addresses
```

## Health Checking Integration

Service discovery without health checking is dangerous — you'll route to dead instances.

```text
Types of health checks:

HTTP:  GET /health → 200 OK = healthy
TCP:   Can connect to port = healthy
TTL:   Service must periodically say "I'm alive" or be marked unhealthy
Script: Run a script, exit 0 = healthy

Consul health check flow:
  1. Service registers with HTTP health check
  2. Consul hits /health every 10 seconds
  3. 3 consecutive failures → service marked unhealthy
  4. Discovery queries with ?passing=true → unhealthy excluded
  5. Service recovers → health check passes → back in rotation
```

## Service Discovery in Different Environments

| Environment | Discovery Method | How It Works |
|---|---|---|
| **Docker Compose** | Docker DNS | Container names resolve to IPs |
| **Kubernetes** | K8s DNS + Services | Automatic DNS + label-based routing |
| **AWS (EC2)** | AWS Cloud Map / ALB | Register instances with Cloud Map |
| **On-premises** | Consul / etcd | Self-hosted registry |
| **Serverless** | Not needed | Services call each other by function URL |

## Common Patterns

### Pattern: Self-Registration

```text
// On service startup
async function start() {
  const server = app.listen(3000);

  // Register with discovery
  await registry.register({
    name: "order-service",
    address: getMyIP(),
    port: server.address().port,
    healthCheck: "/health",
  });

  // Deregister on shutdown
  process.on("SIGTERM", async () => {
    await registry.deregister("order-service");
    server.close();
    process.exit(0);
  });
}
```

### Pattern: Third-Party Registration

An external agent (like Consul's sidecar or Kubernetes kubelet) registers the service — the service itself doesn't need discovery code.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Service discovery** | Services find each other dynamically at runtime |
| **Service registry** | Database of service instances and their addresses |
| **DNS-based** | Simple — use hostnames, DNS resolves to IPs |
| **Client-side** | Client queries registry, chooses instance |
| **Server-side** | Load balancer/sidecar queries registry, routes for client |
| **Health checking** | Only route to healthy instances |
| **Consul** | Popular registry with health checks and UI |
| **Kubernetes DNS** | Built-in discovery for K8s services |
| **Self-registration** | Service registers itself on startup |
| **Deregistration** | Service removes itself on shutdown |

**Hardcoded addresses assume nothing ever changes. Service discovery assumes everything changes — and handles it automatically.**
