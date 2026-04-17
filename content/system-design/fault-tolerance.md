---
title: "Fault Tolerance: Keep Running When Things Break"
date: "2026-04-17"
tags: ["system-design", "fault-tolerance", "fundamentals", "resilience", "redundancy"]
excerpt: "Learn how fault-tolerant systems keep working when individual components fail — from redundancy and retries to circuit breakers and bulkheads."
---

# Fault Tolerance: Keep Running When Things Break

Your primary database goes down. If your entire application goes down with it, you have zero fault tolerance. If your app switches to a read-only mode using a replica while the primary recovers — that's fault tolerance.

## What is Fault Tolerance?

**Fault tolerance** is a system's ability to continue operating — possibly at reduced capacity — when one or more of its components fail. The system detects failures and compensates for them without total disruption.

```text
Non-fault-tolerant:
  Database dies → Application dies → Users see errors

Fault-tolerant:
  Database dies → Application detects failure → Switches to replica
  → Users experience slower reads but can still use the app
  → Primary recovers → Application switches back seamlessly
```

## Why Does It Matter?

❌ **Problem:** A data center loses power. Your only server is in that data center. Your entire application is offline. Every minute of downtime costs thousands of dollars. Your SLA promised 99.9% availability. This single outage used your entire annual downtime budget.

✅ **Solution:** Fault-tolerant systems assume failure is inevitable and design for it. Redundant components, automatic failover, and graceful degradation ensure the system keeps working — maybe slower, maybe with fewer features — but never completely dead.

## Fault Tolerance Patterns

### 1. Redundancy

Run multiple copies of critical components.

```text
Single database → dies → everything stops
Primary + 2 replicas → primary dies → replica takes over → users don't notice

Rule: If you can't afford for it to fail, run at least 2.
```

### 2. Failover

Automatically switch to a backup when the primary fails.

```text
Active-passive failover:
  Primary: handles all traffic
  Standby: watches, ready to take over
  Primary fails → Standby promotes → Traffic redirects

Active-active failover:
  Both instances handle traffic simultaneously
  One fails → Other absorbs all traffic (at reduced capacity)
```

### 3. Circuit Breaker

Stop calling a failing service to prevent cascading failures.

```text
Service B is down:
  Without circuit breaker: Service A keeps calling B → all threads blocked → A dies too
  With circuit breaker: A detects B is failing → stops calling → returns fallback → A stays healthy
```

### 4. Bulkhead

Isolate components so failure in one doesn't take down everything.

```text
Named after ship bulkheads — if one compartment floods, the ship stays afloat.

Implementation:
  - Separate thread pools per downstream service
  - Separate connection pools per dependency
  - Separate resources for critical vs non-critical features

If the recommendation service crashes → product listings still work
If the email service is slow → checkout still works
```

### 5. Retry with Exponential Backoff

Try again when a transient failure occurs, with increasing delays.

```text
Attempt 1: fails → wait 1 second
Attempt 2: fails → wait 2 seconds
Attempt 3: fails → wait 4 seconds
Attempt 4: fails → wait 8 seconds
Attempt 5: success ✅

Prevents overwhelming a recovering service with instant retries.
```

### 6. Timeout

Don't wait forever for a response.

```text
Without timeout: Request to slow service waits indefinitely → thread stuck
With timeout:    Request fails after 5 seconds → thread freed → fallback response

Always set timeouts on:
  - Database queries
  - HTTP calls to external services
  - Message queue operations
```

### 7. Graceful Degradation

Disable non-essential features under load to preserve core functionality.

```text
Normal mode:
  Search ✅  Browse ✅  Cart ✅  Checkout ✅  Recommendations ✅  Reviews ✅

Degraded mode (database under heavy load):
  Search ✅  Browse ✅  Cart ✅  Checkout ✅  Recommendations ❌  Reviews ❌

Core revenue-generating features stay up. Nice-to-haves return later.
```

### 8. Rate Limiting and Load Shedding

When the system is overwhelmed, reject some requests to save the rest.

```text
System at 90% capacity → Start rejecting low-priority requests
System at 95% capacity → Only accept critical requests
System at 100% → Return 503 with retry-after header

Better to serve 90% of users well than 100% of users poorly.
```

## Designing for Failure

The key mindset shift: **assume everything will fail.**

```text
Questions to ask during design:
  - What if the database goes down?
  - What if a message queue loses messages?
  - What if a network partition splits the system?
  - What if a deploy introduces a critical bug?
  - What if traffic suddenly 10x's?
  - What if an entire data center goes offline?

If you have answers for all of these, your system is fault-tolerant.
```

## Chaos Engineering

Proactively test your fault tolerance by deliberately causing failures.

```text
Netflix Chaos Monkey:
  - Randomly kills production instances during business hours
  - If the system handles it → fault tolerance confirmed
  - If users notice → you found a gap, fix it before a real failure does it

Start small:
  - Kill one non-critical service in staging
  - Simulate high latency to the database
  - Fill up a disk
  - Disconnect from external API
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Fault tolerance** | System continues operating despite component failures |
| **Redundancy** | Multiple copies of critical components |
| **Failover** | Auto-switch from failed primary to backup |
| **Circuit breaker** | Stop calling failing services |
| **Bulkhead** | Isolate failures — one component can't sink the whole system |
| **Retry + backoff** | Retry transient failures with increasing delays |
| **Timeout** | Don't wait forever — fail fast |
| **Graceful degradation** | Core features stay up, non-essential disabled |
| **Chaos engineering** | Deliberately break things to find weaknesses |

**The question isn't 'will something fail?' — it's 'what happens when it does?' Your answer defines your system's resilience.**
