---
title: "Load Balancing: One Server Can't Handle It All"
date: "2026-04-17"
tags: ["backend", "load-balancing", "scalability", "infrastructure", "networking"]
excerpt: "Learn how load balancers distribute traffic across multiple servers to keep your app fast, available, and fault-tolerant under heavy load."
---

# Load Balancing: One Server Can't Handle It All

10,000 users hit your single server at once. CPU hits 100%. Memory fills up. The app crashes. Everyone sees "502 Bad Gateway." If only there were more servers to share the load...

## What is Load Balancing?

**Load balancing** is the process of distributing incoming network traffic across multiple servers. A **load balancer** sits between clients and your servers, acting like a traffic cop — routing each request to the best available server.

```text
Without Load Balancer:
┌────────┐          ┌──────────┐
│ Client │─────────>│  Server  │  ← Overwhelmed
└────────┘          └──────────┘

With Load Balancer:
┌────────┐     ┌──────────────┐     ┌──────────┐
│ Client │────>│ Load Balancer│───>│  Server 1 │
└────────┘     │              │───>│  Server 2 │
               └──────────────┘     └──────────┘
```

No single server bears the full brunt of traffic. If one server goes down, the load balancer routes to the others. Users never notice.

## Why Does It Matter?

❌ **Problem:** Your app runs on one server. A product launch sends traffic 10x higher than normal. The server can't keep up — requests timeout, the app becomes unresponsive, and users see errors. You can't just upgrade the hardware fast enough, and even if you could, one server is a single point of failure. It dies, your app dies.

✅ **Solution:** A load balancer distributes requests across multiple servers. Each server handles a fraction of the traffic. If one fails, others take over. You can add more servers as traffic grows — **horizontally scaling** without downtime.

## How Load Balancing Works

### The Request Flow

```text
1. Client sends request to your app (e.g., myapp.com)
2. DNS resolves to the load balancer's IP
3. Load balancer receives the request
4. Load balancer picks a backend server based on algorithm
5. Forwards the request to that server
6. Server processes and responds to the load balancer
7. Load balancer forwards response back to client
```

The client never talks directly to the backend servers. The load balancer is the public-facing entry point.

### Layer 4 vs Layer 7 Load Balancing

| Aspect | Layer 4 (Transport) | Layer 7 (Application) |
|---|---|---|
| **Operates at** | TCP/UDP level | HTTP/HTTPS level |
| **Decision based on** | IP address, port | URL path, headers, cookies |
| **Can inspect** | Network info only | Full HTTP content |
| **Performance** | Faster (less processing) | Slightly slower (more inspection) |
| **Flexibility** | Lower | Higher (path-based routing) |
| **Examples** | AWS NLB, HAProxy (TCP mode) | Nginx, AWS ALB, HAProxy (HTTP mode) |

Layer 7 is more common for web apps because it can route based on URL paths:

```text
/api/*      → API servers
/images/*   → Image optimization servers
/admin/*    → Admin panel servers
/*          → Web frontend servers
```

## Load Balancing Algorithms

### Round Robin

Requests go to each server in turn.

```text
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A   ← cycles back
```

Simple, fair distribution. Works well when all servers have similar capacity.

### Weighted Round Robin

Assign weights based on server capacity. More powerful servers get more requests.

```text
Server A (weight 3)  → 3 requests
Server B (weight 2)  → 2 requests
Server C (weight 1)  → 1 request
```

Useful when servers have different hardware specs.

### Least Connections

Send each request to the server with the fewest active connections.

```text
Server A: 45 connections
Server B: 23 connections  ← gets next request
Server C: 67 connections
```

Better than round robin when requests have varying processing times.

### IP Hash

Hash the client's IP address to deterministically assign them to a server.

```text
Client IP 192.168.1.10 → always goes to Server A
Client IP 192.168.1.20 → always goes to Server B
```

Ensures a client always hits the same server — useful for **session affinity** (sticky sessions).

### Least Response Time

Send requests to the server with the fewest active connections AND the lowest average response time. The most "intelligent" basic algorithm.

## Health Checks

A load balancer is only as good as its ability to detect broken servers. **Health checks** monitor backend servers and stop sending traffic to unhealthy ones.

```text
Health Check Types:

HTTP Check:
  GET /health every 10 seconds
  Server responds 200 OK → healthy ✅
  Server responds 500 or times out → unhealthy ❌

TCP Check:
  Try to open TCP connection on port 8080
  Connection succeeds → healthy ✅
  Connection fails → unhealthy ❌

Custom Check:
  GET /health/deep
  Checks database connection, cache, external APIs
  All good → healthy ✅
  Any failure → unhealthy ❌
```

```text
// Express health check endpoint
app.get("/health", async (req, res) => {
  const checks = {
    database: await db.ping(),
    redis: await redis.ping(),
    uptime: process.uptime(),
  };

  const healthy = Object.values(checks).every(Boolean);

  res.status(healthy ? 200 : 503).json({
    status: healthy ? "healthy" : "degraded",
    checks,
  });
});
```

When a server fails a health check, the load balancer automatically routes traffic to healthy servers. When it recovers, traffic resumes.

## Session Affinity (Sticky Sessions)

Some apps store session data locally on a server. If the user's next request goes to a different server, the session is lost.

**Sticky sessions** solve this by ensuring a client always hits the same server:

```text
Methods:
  1. IP Hash — client IP determines the server
  2. Cookie-based — load balancer sets a cookie with server ID
  3. URL parameter — server ID embedded in URL (rare)
```

❌ **Problem with sticky sessions:** If the sticky server dies, the session is lost. Uneven load distribution (some servers get more "sticky" users).

✅ **Better approach:** Store sessions externally (Redis, database) so any server can handle any request. No stickiness needed.

## Load Balancing with Nginx

```text
http {
  upstream backend {
    # Round robin (default)
    server 10.0.0.1:3000;
    server 10.0.0.2:3000;
    server 10.0.0.3:3000;

    # Or: weighted round robin
    # server 10.0.0.1:3000 weight=3;
    # server 10.0.0.2:3000 weight=1;

    # Or: least connections
    # least_conn;

    # Or: IP hash (sticky sessions)
    # ip_hash;
  }

  server {
    listen 80;

    location / {
      proxy_pass http://backend;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }
  }
}
```

## SSL/TLS Termination

The load balancer can handle HTTPS so backend servers only deal with HTTP:

```text
Client ← HTTPS → Load Balancer ← HTTP → Backend Servers

Benefits:
  - Centralized certificate management
  - Backend servers don't waste CPU on encryption
  - Easier to renew/manage certs in one place
```

## Common Load Balancing Mistakes

### ❌ No Health Checks

Without health checks, the load balancer keeps sending traffic to dead servers. Users see errors.

### ❌ Ignoring Header Forwarding

Backend servers need to know the real client IP, not the load balancer's IP. Always forward headers:

```text
X-Forwarded-For: client IP chain
X-Forwarded-Proto: original protocol (https)
X-Real-IP: actual client IP
```

### ❌ Sticky Sessions with No Failover

If sessions are sticky to one server and it dies, all those users lose their sessions. Use external session storage instead.

### ❌ Single Load Balancer as SPOF

The load balancer itself is a single point of failure. Use **multiple load balancers** with a floating IP or DNS-based failover.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Load balancer** | Distributes traffic across multiple servers |
| **Layer 4** | Balances at TCP/UDP level — fast, less flexible |
| **Layer 7** | Balances at HTTP level — path-based routing |
| **Round robin** | Equal turn-based distribution |
| **Least connections** | Routes to server with fewest active connections |
| **IP hash** | Same client always hits same server |
| **Health checks** | Detects broken servers, stops routing to them |
| **Sticky sessions** | Keeps user on same server (avoid if possible) |
| **SSL termination** | Load balancer handles HTTPS, backends use HTTP |
| **Nginx** | Popular open-source load balancer for web apps |

**One server is a single point of failure. A load balancer turns one server into a resilient system.**
