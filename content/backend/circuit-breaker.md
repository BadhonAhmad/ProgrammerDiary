---
title: "Circuit Breaker Pattern: Stop Knocking on a Broken Door"
date: "2026-04-17"
tags: ["backend", "circuit-breaker", "resilience", "microservices", "patterns"]
excerpt: "Learn how the circuit breaker pattern detects failing services, stops calling them, and recovers gracefully — preventing cascading failures across your entire system."
---

# Circuit Breaker Pattern: Stop Knocking on a Broken Door

The payment service is down. Your order service keeps calling it. Every call waits 30 seconds before timing out. Meanwhile, 1,000 other orders pile up behind each timed-out request. Your entire system freezes because one service is broken. The circuit breaker pattern prevents this.

## What is the Circuit Breaker Pattern?

A **circuit breaker** is a design pattern that detects when a downstream service is failing, stops calling it (opens the circuit), and periodically checks if it's recovered (half-open). It's modeled after electrical circuit breakers that cut power when there's a surge to prevent fires.

```text
How an electrical breaker works:
  Normal → Current flows → Everything works
  Surge  → Breaker trips → Current stops → Wires protected
  Fix    → Reset breaker → Current flows again

How a software circuit breaker works:
  Normal → Requests flow → Everything works
  Failures → Breaker opens → Requests stop → Your service protected
  Recovery → Breaker half-opens → Test request → If OK, close breaker
```

## Why Does It Matter?

❌ **Problem:** Imagine a restaurant where the kitchen is on fire, but the waiters keep bringing in orders. Each order sits unanswered for 10 minutes while the kitchen burns. The dining room fills up with waiting customers. Nobody gets served. Even drinks and appetizers (that don't need the kitchen) can't be served because all the waiters are stuck waiting at the kitchen door.

In software: Service A calls Service B. Service B is down. Service A's threads/connections are all stuck waiting for timeouts. Service A can't serve any requests — even ones that don't need Service B. Service C calls Service A — now C is stuck too. **Cascading failure** spreads through the entire system.

✅ **Solution:** The circuit breaker detects repeated failures to Service B and **stops calling it**. Instead of waiting for a timeout, Service A immediately returns a fallback response. Its threads stay free. Other features keep working. When Service B recovers, the circuit breaker detects it and resumes normal calls.

## Circuit Breaker States

```text
                ┌──────────────┐
          failures ──>│   CLOSED     │<── success
                     │  (normal)    │
                     │ Requests go  │
                     │ through      │
                     └──────┬───────┘
                            │ Failure threshold reached
                            │ (e.g., 5 failures in 10 seconds)
                            ▼
                     ┌──────────────┐
                     │    OPEN      │
                     │  (blocked)   │
                     │ Requests are │
                     │ rejected     │
                     │ immediately  │
                     └──────┬───────┘
                            │ After timeout period
                            │ (e.g., 30 seconds)
                            ▼
                     ┌──────────────┐
                     │  HALF-OPEN   │
                     │  (testing)   │
                     │ Allow ONE    │
                     │ test request │
                     └──┬───────┬───┘
                        │       │
                  success│      │failure
                        │       │
                        ▼       ▼
                   CLOSED     OPEN
```

### Closed (Normal Operation)

Requests flow through normally. The breaker tracks failures. If failures stay below the threshold, everything continues.

### Open (Blocked)

Failure threshold exceeded. The breaker "trips." All requests are **immediately rejected** — no network call, no timeout. A fallback response is returned instead.

### Half-Open (Testing)

After a cooldown period, the breaker allows **one test request** through:
- If it succeeds → circuit closes → normal operation resumes
- If it fails → circuit stays open → wait another cooldown period

## Implementing a Circuit Breaker

### With Opossum (Node.js)

```text
npm install opossum
```

```text
const CircuitBreaker = require("opossum");

// The function to protect
async function callPaymentService(order) {
  const response = await fetch("http://payment-service/charge", {
    method: "POST",
    body: JSON.stringify(order),
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error(`Payment failed: ${response.status}`);
  return response.json();
}

// Wrap with circuit breaker
const breaker = new CircuitBreaker(callPaymentService, {
  timeout: 3000,         // Fail if no response in 3s
  errorThresholdPercentage: 50,  // Open after 50% failures
  resetTimeout: 30000,   // Try again after 30s
  rollingCountTimeout: 10000,    // Measure over 10s window
  volumeThreshold: 5,    // Need at least 5 calls before deciding
});

// Fallback when circuit is open
breaker.fallback(() => ({
  status: "queued",
  message: "Payment service unavailable. Order queued for retry.",
}));

// Event listeners
breaker.on("open", () => console.log("Circuit OPEN — payment service blocked"));
breaker.on("close", () => console.log("Circuit CLOSED — payment service recovered"));
breaker.on("halfOpen", () => console.log("Circuit HALF-OPEN — testing payment service"));
breaker.on("fallback", () => console.log("Fallback executed"));

// Usage
app.post("/api/orders", async (req, res) => {
  const result = await breaker.fire(req.body);
  res.json(result);
});
```

### Manual Implementation

```text
class CircuitBreaker {
  constructor(fn, options = {}) {
    this.fn = fn;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.state = "CLOSED";
    this.failures = 0;
    this.nextAttempt = Date.now();
  }

  async fire(...args) {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttempt) {
        throw new Error("Circuit is OPEN — request blocked");
      }
      this.state = "HALF-OPEN";
    }

    try {
      const result = await this.fn(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}
```

## Fallback Strategies

When the circuit is open, what do you return?

| Strategy | Example | Use Case |
|---|---|---|
| **Cached response** | Return last successful result | Product details, settings |
| **Default value** | Return safe default | Feature flags, config |
| **Queue for retry** | Save to DB, process later | Orders, payments |
| **Degraded feature** | Skip optional enrichment | Recommendations, suggestions |
| **Error with context** | "Service unavailable, try later" | When no fallback exists |

```text
breaker.fallback((order) => {
  // Queue for later processing
  await redis.lpush("payment:retry_queue", JSON.stringify(order));
  return { status: "queued", message: "Payment will be processed shortly" };
});
```

## Circuit Breaker Configuration

| Setting | What It Does | Typical Value |
|---|---|---|
| `timeout` | Max wait for response | 3-5 seconds |
| `failureThreshold` | Failures to trip the breaker | 5 or 50% |
| `resetTimeout` | Cooldown before testing | 15-60 seconds |
| `volumeThreshold` | Min calls before evaluating | 5-10 |
| `rollingCountTimeout` | Window for counting failures | 10-60 seconds |

## When to Use Circuit Breakers

### ✅ Use For

- External API calls (third-party services)
- Inter-service calls in microservices
- Database connections (switch to read replica)
- Any dependency that can fail independently

### ❌ Don't Use For

- Internal function calls (use try/catch)
- Idempotent, cacheable requests (use caching instead)
- One-time initialization code (use retry with backoff)

## Circuit Breaker vs Retry

These are complementary, not alternatives:

```text
Retry:
  - For transient failures (network glitch, timeout)
  - Try the same request again immediately
  - Use with exponential backoff

Circuit Breaker:
  - For sustained failures (service is down)
  - Stop calling entirely
  - Give the failing service time to recover

Combined:
  Try request → fails → retry with backoff
  Still failing after retries → circuit opens
  Circuit open → immediate fallback
  After cooldown → half-open → test → close if OK
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Circuit breaker** | Detects failures, stops calling, prevents cascading outages |
| **Closed state** | Normal — requests flow through |
| **Open state** | Blocked — requests rejected immediately with fallback |
| **Half-open state** | Testing — one request to check if service recovered |
| **Failure threshold** | Number/percentage of failures to trip the breaker |
| **Reset timeout** | How long to wait before testing recovery |
| **Fallback** | Alternative response when circuit is open |
| **Opossum** | Popular Node.js circuit breaker library |
| **Use with retry** | Retry handles transient; breaker handles sustained failures |

**When a service is down, the kindest thing you can do is stop calling it — for its sake and yours.**
