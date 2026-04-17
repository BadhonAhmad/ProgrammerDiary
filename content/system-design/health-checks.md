---
title: "Health Checks in Load Balancing"
date: "2026-04-17"
tags: ["system-design", "health-checks", "load-balancing", "monitoring"]
excerpt: "Learn how health checks detect broken servers and automatically remove them from the load balancer rotation — preventing users from ever hitting a dead server."
---

# Health Checks in Load Balancing

A server just crashed, but the load balancer doesn't know. It keeps sending users to the dead server. Users see errors. Health checks are the load balancer's way of asking: "Are you still alive?" before sending traffic.

## What are Health Checks?

**Health checks** are periodic requests the load balancer sends to each backend server to verify it's functioning correctly. If a server fails its health check, the load balancer stops sending it traffic until it recovers.

```text
Every 10 seconds:
  Load Balancer → Server A: GET /health → 200 OK ✅
  Load Balancer → Server B: GET /health → Timeout ❌
  Load Balancer → Server C: GET /health → 200 OK ✅

Result: Traffic goes to A and C only. B is removed from rotation.
```

## Types of Health Checks

### Active Health Checks

The load balancer actively probes each server.

```text
HTTP check:
  GET /health every 10 seconds
  200 OK → healthy
  500 or timeout → unhealthy

TCP check:
  Try to connect on port 8080
  Connection succeeds → healthy
  Connection fails → unhealthy

Custom check:
  GET /health/deep
  Checks database + cache + external APIs
  All green → healthy, any red → unhealthy
```

### Passive Health Checks

Monitor real traffic for failures instead of sending probes.

```text
If 5 consecutive requests to Server A fail:
  → Mark Server A as unhealthy
  → Stop sending traffic to it

If Server A then serves 1 successful request:
  → Mark as healthy again
  → Resume sending traffic
```

## Health Check Configuration

```text
Parameters:
  Interval:        How often to check (e.g., every 10 seconds)
  Timeout:         Max wait for response (e.g., 3 seconds)
  Healthy threshold:  Consecutive passes to mark healthy (e.g., 2)
  Unhealthy threshold: Consecutive fails to mark unhealthy (e.g., 3)

Example:
  Check every 10s, timeout 3s
  Server fails 3 checks in a row → removed from rotation
  Server passes 2 checks in a row → added back to rotation
```

## Best Practices

```text
✅ Keep health check endpoint lightweight (no heavy DB queries)
✅ Check real dependencies (DB, cache) in deep health checks
✅ Set appropriate thresholds (too aggressive = false positives)
✅ Use different checks for different purposes:
   /health (liveness) → Is the process running?
   /ready (readiness) → Can it handle requests?
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Health check** | Periodic verification that a server is functional |
| **Active check** | Load balancer probes servers directly |
| **Passive check** | Monitor real traffic for failures |
| **Thresholds** | Consecutive pass/fail count before changing status |
| **Auto-removal** | Dead servers removed from rotation automatically |
| **Auto-recovery** | Recovered servers added back automatically |

**Without health checks, a load balancer is just a round-robin router that sends traffic to corpses. Health checks make it intelligent.**
