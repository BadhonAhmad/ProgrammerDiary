---
title: "Logging: The Story Your Application Tells After You Deploy"
date: "2026-04-17"
tags: ["backend", "fundamentals", "logging", "monitoring", "observability"]
excerpt: "Understand why logging matters, what the different log levels mean, what you should and should not log, and how logs become your most powerful debugging and monitoring tool."
---

# Logging: The Story Your Application Tells After You Deploy

You deployed your backend. Everything works in testing. Three days later, users start reporting that "the app is slow" and "sometimes payments fail." You have no idea why — because you never told your application to write down what it was doing. Logging is how your application talks to you after you ship it.

## What is Logging?

**Logging** is the practice of recording events that happen while your application runs. Every request processed, every error encountered, every database query executed, every user action — logs capture these events as timestamped text entries that you can search, filter, and analyze.

```text
[2026-04-17 10:30:15] INFO  Server started on port 3000
[2026-04-17 10:30:22] INFO  GET /api/users → 200 (45ms)
[2026-04-17 10:30:25] WARN  Rate limit reached for IP 203.0.113.42
[2026-04-17 10:30:28] ERROR Database query timeout after 5000ms
[2026-04-17 10:30:30] INFO  POST /api/orders → 201 (230ms)
```

Think of logs like a **ship's logbook**. The captain records every significant event — departure time, weather, speed, course changes, equipment problems, crew incidents. When something goes wrong, the logbook tells the full story of what led up to it.

## Why It Matters

### ❌ Problem: Debugging in Production Without Logs

Without logs, production issues are invisible. A user reports "I clicked buy and nothing happened." Was the request received? Did the server process it? Did the database write succeed? Did the payment gateway respond? Without logs, you are guessing. You cannot reproduce the issue locally because it only happens under real traffic with real data.

### ✅ Solution: Logs Give You a Playback of What Happened

With proper logging, you search for the user's request by timestamp or request ID and see the entire story:

```text
[10:30:28.001] INFO  Request received: POST /api/orders userId=42
[10:30:28.015] INFO  Input validated successfully
[10:30:28.020] INFO  Querying database for product stock
[10:30:28.035] INFO  Stock confirmed: product_id=7, quantity=2
[10:30:28.040] INFO  Calling payment gateway: amount=$49.99
[10:30:33.050] ERROR Payment gateway timeout after 5000ms
[10:30:33.055] INFO  Rolling back order creation
[10:30:33.060] INFO  Response sent: 502 Bad Gateway
```

Now you know exactly what happened: the payment gateway timed out. The order was rolled back. The user saw an error. You know the root cause and can fix it.

## Log Levels

Log levels categorize messages by severity. This lets you control how much detail you see — verbose logs in development, critical-only logs in production alerts.

### The Standard Levels

| Level | When to Use | Example |
|-------|------------|---------|
| **ERROR** | Something failed that affects the user or system | Database connection lost, payment processing failed |
| **WARN** | Something unexpected happened, but the system recovered | Deprecated API called, rate limit approaching, slow query detected |
| **INFO** | Normal operational events worth recording | Server started, user logged in, order created, request completed |
| **DEBUG** | Detailed diagnostic information for development | Function entered with parameters X and Y, cache hit/miss, SQL query executed |
| **TRACE** | Very fine-grained debugging — variable values, loop iterations | Usually disabled in production entirely |

### How to Use Levels

```text
Development:  Log everything (DEBUG and above)
Staging:      Log INFO and above
Production:   Log INFO and above (WARN/ERROR trigger alerts)
Critical systems: Log ERROR only, with separate alerting pipeline
```

Never use `console.log` in production code — it has no level, no structure, no timestamp, and cannot be filtered. Use a proper logging library (Winston, Pino, Bunyan for Node.js).

## What to Log

### Always Log

- **Requests** — method, path, status code, response time, user ID
- **Errors** — the full error object, stack trace, and context (what request caused it)
- **Authentication events** — login successes and failures, token refreshes
- **Authorization failures** — who tried to access what they should not
- **External service calls** — payment APIs, email services, third-party integrations
- **Slow operations** — queries exceeding a threshold, requests taking too long

### Never Log

- **Passwords** — even hashed ones
- **API keys and tokens** — log "token received" not "token=eyJhbGci..."
- **Credit card numbers** — even partial ones
- **Personally identifiable information (PII)** — social security numbers, health records
- **Full request bodies of file uploads** — multi-megabyte logs help no one

### ❌ Problem: Logging Sensitive Data

A common mistake is logging entire request bodies or response objects. This means passwords, session tokens, and personal data end up in your log files. If those logs are stored in a cloud service or shared with a monitoring tool, you have just expanded your attack surface enormously.

### ✅ Solution: Explicitly Choose What to Log

Never log `req.body` directly. Extract and log only the fields you need:

```text
❌ Log: { "email": "nobel@example.com", "password": "mySecret123" }
✅ Log: { "email": "nobel@example.com", "password": "[REDACTED]" }
```

## Structured Logging

### ❌ Problem: Unstructured Text Is Hard to Search

Traditional logs are plain text lines. Searching through millions of lines of text for "all errors from user 42 in the last hour" requires regex and patience. Correlating related log entries is manual and error-prone.

### ✅ Solution: Structured Logs as JSON

Structured logging writes each log entry as a JSON object with consistent fields:

```text
Unstructured:
  [ERROR] Payment failed for user 42, order 999, gateway timeout

Structured:
  {
    "level": "error",
    "message": "Payment processing failed",
    "timestamp": "2026-04-17T10:30:33.050Z",
    "userId": 42,
    "orderId": 999,
    "error": "GatewayTimeout",
    "duration": 5000,
    "service": "payment-service"
  }
```

Structured logs are machine-parseable. You can filter by any field, aggregate metrics, and build dashboards. Tools like ELK Stack (Elasticsearch, Logstash, Kibana), Datadog, and Grafana Loki are designed for structured log analysis.

## Request Tracing

### ❌ Problem: Connecting Related Logs

A single user action might trigger logs across multiple services and handlers. In a sea of logs, finding all entries related to one specific request is like finding one conversation in a crowded room where everyone is talking at once.

### ✅ Solution: Request IDs

Assign a unique **request ID** to every incoming request. Include this ID in every log entry for that request. Now you can filter by one ID and see the complete trace:

```text
[reqId: a1b2c3] Request received: POST /api/orders
[reqId: a1b2c3] User authenticated: userId=42
[reqId: a1b2c3] Product stock confirmed
[reqId: a1b2c3] Payment gateway called
[reqId: a1b2c3] Payment gateway timeout
[reqId: a1b2c3] Order rolled back
[reqId: a1b2c3] Response: 502
```

Seven log entries across three handlers, one clear story.

## Logs vs Metrics vs Traces

Logging is one part of the **observability** triad:

| Tool | Answers | Example |
|------|---------|---------|
| **Logs** | What happened? (individual events) | "Request POST /orders failed with payment timeout" |
| **Metrics** | How much / how often? (aggregated numbers) | "Error rate: 2.3% in the last hour, average response time: 180ms" |
| **Traces** | Where did it go? (request flow across services) | "Request started at API gateway → auth service (12ms) → order service (45ms) → payment service (timeout)" |

You need all three for full visibility. Logs tell you what went wrong. Metrics tell you how often. Traces tell you where.

## Key Points Cheat Sheet

| Concept | What to Remember |
|---------|-----------------|
| **Logging** | Recording timestamped events during application execution |
| **Log levels** | ERROR > WARN > INFO > DEBUG > TRACE — filter by severity |
| **Always log** | Requests, errors, auth events, external calls, slow operations |
| **Never log** | Passwords, tokens, PII, credit cards, full request bodies |
| **Structured logging** | JSON format — machine-parseable, searchable, aggregatable |
| **Request IDs** | Unique ID per request — traces all related log entries |
| **console.log** | Development only. Use a proper logging library in production. |
| **Observability triad** | Logs (what) + Metrics (how much) + Traces (where) |
| **Log retention** | Set retention policies — logs grow fast and cost money to store |

Logging is not an afterthought — it is the eyes and ears of your production system. The effort you invest in logging today determines how fast you can diagnose and fix problems tomorrow. Write your logs like someone will need to read them at 3 AM during an outage — because that someone might be you.
