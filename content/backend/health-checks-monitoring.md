---
title: "Health Checks & Monitoring: Know Your System Is Alive Before Users Tell You"
date: "2026-04-17"
tags: ["backend", "monitoring", "health-checks", "observability", "logging", "metrics"]
excerpt: "Learn how health checks, metrics, logging, and alerting give you visibility into your system — so you find out about problems before your users do."
---

# Health Checks & Monitoring: Know Your System Is Alive Before Users Tell You

Your app went down at 3 AM. You found out at 7 AM when users started tweeting screenshots of error pages. Four hours of downtime. Zero alerts. You were flying blind. Monitoring changes this completely.

## What are Health Checks and Monitoring?

**Health checks** are endpoints that report whether a service is functioning correctly. **Monitoring** is the continuous collection and analysis of metrics, logs, and traces to understand system behavior.

Together, they answer: *"Is my system working right now? Has it worked in the past? Will it work in the future?"*

```text
Health check:   Is it alive?     → Yes/No
Monitoring:     How alive is it? → CPU 72%, 450 req/s, 2 errors/min
Alerting:       Should I care?   → Error rate > 5%? Wake me up.
```

## Why Does It Matter?

❌ **Problem:** Your server runs fine for weeks. Then the database connection pool slowly leaks. Response times creep from 50ms to 500ms to 5 seconds. Users start seeing timeouts. By the time you notice, the system is fully unresponsive. You SSH into the server, check logs, and find nothing useful — the critical logs were buried in a million other messages.

✅ **Solution:** Health checks detect problems automatically. Monitoring tracks trends before they become outages. Alerting wakes you up at 3 AM when the error rate spikes — not at 7 AM when users complain on Twitter. You fix it in minutes, not hours.

## Health Checks

### Types of Health Checks

```text
Liveness:    Is the process running?
  → GET /health → 200 OK

Readiness:   Is the service ready to accept traffic?
  → GET /ready → Checks DB connection, cache, external deps

Deep health: Are all dependencies healthy?
  → GET /health/deep → Checks DB, Redis, external APIs
```

### Implementing Health Checks

```text
// Basic liveness check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Readiness check (checks dependencies)
app.get("/ready", async (req, res) => {
  const checks = {};

  // Check database
  try {
    await db.raw("SELECT 1");
    checks.database = "ok";
  } catch (err) {
    checks.database = "error";
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = "ok";
  } catch (err) {
    checks.redis = "error";
  }

  const allHealthy = Object.values(checks).every(v => v === "ok");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "ready" : "degraded",
    checks,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});
```

### Health Checks in Kubernetes

Kubernetes uses health checks to manage pods automatically:

```text
apiVersion: v1
kind: Pod
spec:
  containers:
    - name: api
      image: myapp:latest

      # Liveness — restart pod if unhealthy
      livenessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 10
        periodSeconds: 30

      # Readiness — remove from service if unhealthy
      readinessProbe:
        httpGet:
          path: /ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 10
```

```text
Liveness fails → Kubernetes kills and restarts the pod
Readiness fails → Kubernetes stops sending traffic to this pod
Both pass → Pod receives traffic normally
```

## The Three Pillars of Observability

### 1. Metrics

Numeric measurements tracked over time. Answer: *"How many? How fast? How much?"*

```text
Key application metrics:
  Request count:     How many requests total?
  Error rate:        What % of requests fail?
  Response time:     p50, p95, p99 latency
  Active connections: How many users right now?
  CPU / Memory:      Resource utilization
  Queue depth:       How many jobs waiting?
```

```text
// Express metrics middleware (using prom-client)
const client = require("prom-client");

const httpDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.route?.path, status_code: res.statusCode });
  });
  next();
});

// Metrics endpoint (scraped by Prometheus)
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});
```

### 2. Logs

Timestamped records of events. Answer: *"What happened and when?"*

```text
Bad logging:
  console.log("Error");
  console.log(result);

Good structured logging:
  {
    "timestamp": "2024-03-15T10:30:00.123Z",
    "level": "error",
    "message": "Payment processing failed",
    "service": "order-service",
    "requestId": "req_abc123",
    "userId": 42,
    "orderId": "ord_456",
    "error": "Connection timeout to payment-service:3000",
    "duration_ms": 30012
  }
```

```text
// Winston — structured logging
const winston = require("winston");

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Usage
logger.info("Order created", { orderId: "ord_123", userId: 42 });
logger.error("Payment failed", { orderId: "ord_123", error: err.message });
```

### 3. Traces

Follow a request across multiple services. Answer: *"Where did time go?"*

```text
A single user request through microservices:
  [API Gateway]  5ms
    → [Auth Service]   12ms
      → [User Service]   8ms (DB query: 6ms)
    → [Order Service]  45ms
      → [Payment Service]  800ms ← bottleneck!
      → [Inventory Service] 15ms
      → [Cache Update]     3ms
    Total: 890ms

The trace shows: Payment Service is slow. That's where to investigate.
```

```text
// OpenTelemetry setup for distributed tracing
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { JaegerExporter } = require("@opentelemetry/exporter-jaeger");

const provider = new NodeTracerProvider();
provider.addSpanProcessor(
  new SimpleSpanProcessor(new JaegerExporter({ endpoint: "http://localhost:14268/api/traces" }))
);
provider.register();

// Automatic instrumentation for HTTP, Express, Prisma, etc.
// Traces appear in Jaeger UI for visualization
```

## Alerting

Metrics without alerts are just numbers. Define what "bad" looks like and get notified.

```text
Critical alerts (wake someone up):
  - Error rate > 5% for 5 minutes
  - Response time p99 > 5 seconds for 5 minutes
  - Service down (health check fails 3x)
  - Database connection pool exhausted
  - Disk usage > 90%

Warning alerts (investigate during work hours):
  - Response time p95 > 1 second
  - Error rate > 1%
  - Memory usage > 80%
  - Queue depth > 1000

Informational (dashboard only):
  - Deploy completed
  - Auto-scaling event
  - New user signup milestones
```

## Monitoring Stack

| Component | Tool | What It Does |
|---|---|---|
| **Metrics collection** | Prometheus | Scrapes metrics from `/metrics` endpoints |
| **Visualization** | Grafana | Dashboards with charts and alerts |
| **Log aggregation** | ELK Stack (Elasticsearch, Logstash, Kibana) | Centralized log storage and search |
| **Distributed tracing** | Jaeger / Zipkin | Visualize request flow across services |
| **Alerting** | Alertmanager / PagerDuty | Route alerts to the right person |
| **Uptime monitoring** | UptimeRobot / Pingdom | External health check from multiple locations |

## Monitoring Best Practices

### ✅ Use Structured Logs

```text
// Bad — can't search or parse
console.log("User 42 created order ord_123");

// Good — machine-parseable, searchable
logger.info("order_created", { userId: 42, orderId: "ord_123", items: 3 });
```

### ✅ Include Request IDs

Attach a unique ID to every request and include it in all logs. When debugging, search by request ID to see the entire request flow.

```text
app.use((req, res, next) => {
  req.id = uuid();
  logger.defaultMeta = { requestId: req.id };
  next();
});
```

### ✅ Track Business Metrics

Not just technical metrics. Track:
- Orders per minute
- Revenue processed
- User signups
- Active users

These tell you if the system is serving its purpose, not just if it's running.

### ✅ Set SLOs and SLIs

- **SLI** (Service Level Indicator): "p99 latency is 200ms"
- **SLO** (Service Level Objective): "p99 latency must be under 500ms"
- **SLA** (Service Level Agreement): "99.9% uptime or we refund you"

SLOs define what "healthy" means for your specific application.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Health check** | Endpoint reporting if a service is alive and ready |
| **Liveness probe** | Is the process running? (restart if not) |
| **Readiness probe** | Can it handle traffic? (remove from rotation if not) |
| **Metrics** | Numeric measurements over time (CPU, latency, error rate) |
| **Logs** | Structured, timestamped event records |
| **Traces** | Follow a request across multiple services |
| **Prometheus** | Metrics scraper — pulls from `/metrics` endpoints |
| **Grafana** | Dashboard and visualization tool |
| **Alerting** | Notify when metrics cross defined thresholds |
| **Request ID** | Unique ID per request — links logs across services |

**If you can't measure it, you can't fix it. And if you don't measure it, you won't even know it's broken.**
