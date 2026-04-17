---
title: "Layer 4 vs Layer 7 Load Balancing"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "layer-4", "layer-7", "OSI"]
excerpt: "Learn the difference between Layer 4 (transport-level) and Layer 7 (application-level) load balancing — and why Layer 7 gives you more control but costs more performance."
---

# Layer 4 vs Layer 7 Load Balancing

A load balancer that only sees IP addresses and ports makes fast decisions. One that inspects HTTP headers, URLs, and cookies makes smart decisions. The trade-off is speed vs intelligence — Layer 4 vs Layer 7.

## What's the Difference?

| Aspect | Layer 4 (Transport) | Layer 7 (Application) |
|---|---|---|
| **OSI layer** | Transport (TCP/UDP) | Application (HTTP/HTTPS) |
| **Sees** | IP, port, protocol | Full HTTP content (URL, headers, cookies) |
| **Routing based on** | IP + port | URL path, headers, cookies, query params |
| **Performance** | Faster (less inspection) | Slightly slower (deep inspection) |
| **Flexibility** | Lower | Higher |
| **SSL termination** | Limited | Full support |
| **Example** | AWS NLB, HAProxy (TCP) | AWS ALB, Nginx, HAProxy (HTTP) |

## Layer 4: Fast and Simple

Routes based on network information — IP address and port. Doesn't look at the HTTP content.

```text
Incoming request:
  Source IP: 203.0.113.5
  Destination: port 443

Layer 4 decision:
  "Traffic on port 443 → send to backend pool A"
  Cannot see URL path, headers, or body

Use cases:
  - TCP/UDP services (databases, message queues)
  - Extremely high throughput needs
  - Simple routing (all traffic to same backend)
```

## Layer 7: Smart and Flexible

Routes based on HTTP content — URL paths, headers, cookies, query parameters.

```text
Incoming request:
  GET /api/users/42
  Host: api.myapp.com
  Cookie: session=abc123

Layer 7 decision:
  "/api/* → API servers"
  "/images/* → CDN origin"
  "/admin/* → Admin servers"
  Cookie session → route to specific server (sticky session)

Use cases:
  - Path-based routing to different services
  - Content-based routing
  - A/B testing (route based on headers)
  - Sticky sessions (route based on cookies)
```

## When to Use Which

```text
Choose Layer 4 when:
  - Maximum raw throughput is critical
  - Routing TCP/UDP (not HTTP) traffic
  - Simple distribution with no content-based routing
  - Database or cache connections

Choose Layer 7 when:
  - Path-based routing (/api → API, /admin → admin)
  - Content-based routing (headers, cookies)
  - SSL termination needed
  - Web applications and APIs
```

## Key Points Cheat Sheet

| Concept | Layer 4 | Layer 7 |
|---|---|---|
| **Decides based on** | IP + port | URL, headers, cookies |
| **Speed** | Faster | Slightly slower |
| **Routing** | Simple (one pool) | Smart (path/content-based) |
| **Best for** | TCP services, raw throughput | Web apps, APIs, microservices |

**Layer 4 is fast. Layer 7 is smart. Most web applications need Layer 7 — the performance difference is negligible, but the routing flexibility is invaluable.**
