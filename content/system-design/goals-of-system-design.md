---
title: "Goals of System Design: What Makes a Good System?"
date: "2026-04-17"
tags: ["system-design", "fundamentals", "scalability", "reliability"]
excerpt: "Learn the key goals every system design strives for — scalability, reliability, availability, maintainability — and why you can't optimize for all of them at once."
---

# Goals of System Design: What Makes a Good System?

A system that's fast but crashes daily is broken. A system that never crashes but takes 10 seconds per request is also broken. Good system design balances competing goals — and knowing which ones to prioritize is the real skill.

## What are the Goals of System Design?

Every system design decision serves one or more of these core goals:

| Goal | One-Line Definition |
|---|---|
| **Scalability** | Handle more load without falling apart |
| **Reliability** | Do the right thing, consistently |
| **Availability** | Be there when users need you |
| **Maintainability** | Be easy to change without breaking things |
| **Fault Tolerance** | Keep working when parts fail |
| **Performance** | Respond quickly and use resources efficiently |
| **Security** | Protect data and access |
| **Cost-effectiveness** | Don't spend more than necessary |

## Why Does It Matter?

❌ **Problem:** You optimize everything for speed. The system responds in 5ms — amazing. But it goes down every week, costs $50K/month in cloud bills, and no developer wants to touch the code because it's a tangled mess. Fast isn't enough.

✅ **Solution:** Understanding design goals lets you make **intentional trade-offs**. A real-time trading platform prioritizes performance and reliability. A blog platform prioritizes availability and cost. Neither is "wrong" — they serve different needs.

## The Core Goals in Detail

### Scalability — Handle Growth

```text
Question: What happens when traffic goes from 100 to 100,000 users?

Scalable system:   Add more servers, everything keeps working
Non-scalable:      Single server overloads, system crashes
```

Scalability has two dimensions:
- **Vertical (scale up):** Bigger machine (more CPU, RAM)
- **Horizontal (scale out):** More machines working together

### Reliability — Correctness Under Pressure

```text
Question: Does the system produce correct results even when things go wrong?

Reliable system:    If I transfer $100, exactly $100 moves — no more, no less
Unreliable system:  Race conditions cause double-charges or lost money
```

Reliability means the system does what it's supposed to do, even under adverse conditions.

### Availability — Always Reachable

```text
Question: What percentage of time is the system operational?

99% available     = 3.65 days of downtime per year
99.9% available   = 8.76 hours of downtime per year
99.99% available  = 52.6 minutes of downtime per year
99.999% available = 5.26 minutes of downtime per year
```

Availability = Uptime / (Uptime + Downtime). High availability comes from redundancy, failover, and fault tolerance.

### Maintainability — Easy to Evolve

```text
Question: How hard is it to fix a bug, add a feature, or onboard a new developer?

Maintainable:   Clear code, good docs, automated tests, clean architecture
Unmaintainable: Spaghetti code, no tests, one person understands it (and they left)
```

Three aspects:
- **Operability:** Easy for ops teams to keep it running
- **Simplicity:** Easy for new developers to understand
- **Evolvability:** Easy to make changes

### Fault Tolerance — Graceful Degradation

```text
Question: What happens when a component fails?

Fault-tolerant:    Database replica dies → primary takes over, users don't notice
Non-fault-tolerant: Any component failure → total system crash
```

Fault tolerance means the system continues operating (possibly at reduced capacity) when individual components fail.

## The Trade-off Matrix

You can't maximize everything. Here's how the goals interact:

```text
Scalability    vs  Consistency     (scale makes consistency harder)
Availability    vs  Consistency     (CAP theorem — pick one during failures)
Performance     vs  Reliability     (caching is fast but can serve stale data)
Simplicity      vs  Fault Tolerance (redundancy adds complexity)
Cost            vs  Availability    (more nines = more money)
```

### The "Nine" Cost Curve

```text
Availability    Approximate Cost
99%             Single server
99.9%           Redundant servers, basic failover
99.99%          Multi-zone, automated failover, monitoring
99.999%         Multi-region, chaos engineering, dedicated SRE team
```

Each additional "nine" costs roughly **10x more** than the previous one.

## Prioritizing Goals for Different Systems

| System Type | Top Priority | Second Priority | Nice to Have |
|---|---|---|---|
| Banking / Finance | Consistency, Reliability | Security | Availability |
| Social Media | Availability, Scalability | Performance | Consistency |
| E-commerce | Availability, Performance | Scalability | Consistency |
| Healthcare | Reliability, Security | Consistency | Performance |
| Gaming | Performance, Scalability | Availability | Consistency |
| Blog / CMS | Availability, Cost | Maintainability | Performance |

## Key Points Cheat Sheet

| Goal | What It Means | Key Metric |
|---|---|---|
| **Scalability** | Handle increasing load | Requests per second |
| **Reliability** | Produce correct results | Error rate |
| **Availability** | Stay operational | Uptime percentage (nines) |
| **Maintainability** | Easy to change | Time to deploy, MTTR |
| **Fault Tolerance** | Survive component failures | Blast radius of failures |
| **Performance** | Fast responses | Latency (p50, p99) |
| **Trade-offs** | Every optimization has a cost | Depends on business needs |
| **Cost curve** | Each "nine" costs ~10x more | Budget vs uptime |

**The art of system design isn't maximizing everything — it's knowing which goals matter most for your specific problem.**
