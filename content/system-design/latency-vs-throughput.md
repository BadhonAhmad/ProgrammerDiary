---
title: "Latency vs Throughput: Speed vs Volume"
date: "2026-04-17"
tags: ["system-design", "latency", "throughput", "performance", "fundamentals"]
excerpt: "Learn the difference between latency and throughput, how they relate, and why optimizing one often hurts the other — the fundamental performance trade-off."
---

# Latency vs Throughput: Speed vs Volume

A Ferrari is fast (low latency) but carries 2 people. A bus is slow (high latency) but carries 50 people. The Ferrari wins on speed; the bus wins on throughput. Systems face the same trade-off.

## What are Latency and Throughput?

**Latency** is the time it takes for a single request to travel from start to finish. How long from "I click" to "I see the result?"

**Throughput** is the number of requests a system can process in a given time period. How many operations per second?

```text
Latency:  "How long does ONE request take?" → Measured in milliseconds
Throughput: "How many requests per SECOND?"  → Measured in requests/second

Example:
  Single request latency: 50ms
  Throughput: 1,000 requests/second
```

## Why Does It Matter?

❌ **Problem:** You optimize your API for maximum throughput by batching all database writes together. You process 50,000 requests per second — amazing! But each individual request waits up to 5 seconds for its batch to fill. Users see a 5-second delay on every click. Your throughput is high, but your latency is terrible.

Conversely: you optimize every request to respond in 5ms by processing each one immediately. But your server can only handle 100 concurrent requests. At 101 requests, latency spikes to seconds.

✅ **Solution:** Understanding the latency-throughput trade-off helps you find the right balance for your use case. A real-time game needs low latency. A batch data pipeline needs high throughput. Most web apps need both — achieved through parallelism, caching, and async processing.

## The Relationship

```text
Throughput = Concurrency / Latency

Where Concurrency = number of parallel operations

Example:
  Latency: 100ms per request
  Concurrency: 10 parallel connections
  Throughput: 10 / 0.1 = 100 requests/second

To increase throughput:
  Option 1: Decrease latency (make each request faster)
  Option 2: Increase concurrency (handle more requests at the same time)
```

### Little's Law

A fundamental queuing theory result:

```text
L = λ × W

L = average number of items in the system
λ = average arrival rate (throughput)
W = average time in the system (latency)

Translation:
  If 100 requests arrive per second (throughput)
  And each takes 2 seconds to process (latency)
  Then 200 requests are being processed simultaneously

  To handle more throughput at the same latency:
  → You need more concurrent processing capacity
```

## Tail Latency Matters More Than Average

Average latency hides the worst cases:

```text
Response times:
  95 requests: 50ms
  4 requests:  200ms
  1 request:   5000ms (5 seconds!)

Average: 97ms (looks great!)
p99:     5000ms (one user waited 5 seconds)

Percentile latencies:
  p50 (median):  50ms — half of requests faster than this
  p95:           100ms — 95% of requests faster
  p99:           5000ms — 1% of requests this slow

For a system with 10,000 requests/second:
  1% = 100 requests/second taking 5 seconds
  That's 100 users having a terrible experience every second
```

**Always measure p99 (or p999) latency, not averages.**

## Optimizing Latency

```text
1. Caching               → Serve from memory instead of disk
2. CDN                    → Serve from edge, closer to user
3. Database indexing      → Faster queries
4. Connection pooling     → Skip connection setup time
5. Async processing      → Don't wait for non-critical work
6. Compression            → Smaller payloads = faster transfer
```

## Optimizing Throughput

```text
1. Horizontal scaling     → More servers processing in parallel
2. Batching               → Group operations, fewer round-trips
3. Async I/O              → Don't block threads waiting for I/O
4. Load balancing         → Distribute across servers
5. Partitioning/sharding  → Split data across databases
6. Message queues         → Buffer requests, process at own pace
```

## The Trade-off in Practice

| Scenario | Optimize For | Why |
|---|---|---|
| Real-time gaming | Latency | 100ms delay = unplayable |
| Video streaming | Throughput | Huge data volume, some buffering OK |
| Web search | Latency | Users expect instant results |
| Data pipeline (ETL) | Throughput | Processing millions of records, delay acceptable |
| E-commerce checkout | Latency | Users abandon slow checkouts |
| Log aggregation | Throughput | Millions of logs/second, some delay OK |

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Latency** | Time for one request (milliseconds) |
| **Throughput** | Requests per unit of time (req/s) |
| **Little's Law** | Throughput = Concurrency / Latency |
| **p99 latency** | The worst 1% of response times — matters more than average |
| **Latency optimization** | Cache, CDN, indexing, async |
| **Throughput optimization** | Scale, batch, partition, queue |
| **Trade-off** | Batching increases throughput but increases per-request latency |
| **Measure both** | High throughput + high latency = unhappy users |

**Throughput is how many. Latency is how fast. A good system is measured in both — and optimized for the one that matters most to its users.**
