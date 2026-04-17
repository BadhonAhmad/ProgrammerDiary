---
title: "Auto Scaling: Add Capacity When You Need It"
date: "2026-04-17"
tags: ["system-design", "auto-scaling", "scaling", "cloud", "architecture"]
excerpt: "Learn how auto scaling automatically adds and removes servers based on traffic — handling spikes without over-provisioning for peak load."
---

# Auto Scaling: Add Capacity When You Need It

Black Friday traffic is 10x normal. You could run 50 servers year-round for the one day you need them. Or you could run 5 servers normally and let auto scaling add 45 more when traffic spikes. Same result, 90% less waste.

## What is Auto Scaling?

**Auto scaling** automatically adjusts the number of running instances based on current demand. When traffic increases, new instances launch. When traffic decreases, excess instances terminate.

```text
Normal day:
  5 instances handling 1,000 req/s

Traffic spike:
  Metrics show CPU > 70%
  Auto scaler launches 10 more instances
  15 instances handling 3,000 req/s

Traffic returns to normal:
  Metrics show CPU < 30%
  Auto scaler terminates 10 instances
  5 instances handling 1,000 req/s
```

## Why Does It Matter?

❌ **Problem:** You provision for peak load — 50 servers running 24/7. Peak happens 5% of the time. The other 95%, 45 servers are idle, burning money. Or worse: you provision for average load, and the first traffic spike takes down your entire system.

✅ **Solution:** Auto scaling matches capacity to demand in real-time. Pay for what you use, handle spikes automatically, and shrink back during quiet periods. No manual intervention needed.

## Auto Scaling Strategies

### Reactive Scaling

Scale based on current metrics.

```text
Rules:
  IF CPU > 70% for 5 minutes → Add 2 instances
  IF CPU < 30% for 10 minutes → Remove 1 instance
  IF request queue > 1000 → Add 3 instances
  IF error rate > 5% → Add 2 instances

Pros: Responds to actual conditions
Cons: There's a lag — instances take 1-2 minutes to start
```

### Predictive Scaling

Scale based on predicted demand using historical patterns.

```text
Pattern: Traffic always spikes at 9 AM and 1 PM
Action: Pre-scale at 8:50 AM and 12:50 PM

Pros: No lag — instances are ready before traffic arrives
Cons: Requires historical data, doesn't handle unexpected spikes
```

### Scheduled Scaling

Scale at known times.

```text
Schedule:
  Weekdays 8 AM → Scale to 20 instances
  Weekdays 6 PM → Scale to 5 instances
  Black Friday → Scale to 100 instances

Pros: Predictable, no lag
Cons: Only works for known patterns
```

## Auto Scaling Configuration

```text
Key parameters:
  Min instances: 3 (always running — baseline capacity)
  Max instances: 50 (cap to prevent runaway costs)
  Target metric: CPU at 60% (sweet spot)
  Scale-up cooldown: 60 seconds (don't add too fast)
  Scale-down cooldown: 300 seconds (don't remove too fast)
  Instance warmup: 120 seconds (time to be ready)
```

## Auto Scaling Challenges

| Challenge | Mitigation |
|---|---|
| **Cold start** (new instance takes time) | Keep minimum instances, use predictive scaling |
| **Cost surprises** (runaway scaling) | Set maximum instance limits, budget alerts |
| **Stateful applications** (can't just add servers) | Design stateless, externalize state |
| **Database bottleneck** (scaling app servers doesn't help if DB is slow) | Scale database independently (read replicas) |
| **Thrashing** (scale up/down repeatedly) | Set appropriate cooldown periods |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Auto scaling** | Automatically add/remove instances based on demand |
| **Reactive** | Scale based on current metrics (CPU, latency) |
| **Predictive** | Scale based on historical patterns |
| **Scheduled** | Scale at known times |
| **Min/Max bounds** | Always keep minimum, cap maximum for cost control |
| **Cooldown periods** | Prevent rapid scaling up and down |
| **Stateless requirement** | Auto scaling requires stateless, interchangeable instances |

**Don't provision for peak. Provision for average and let auto scaling handle the spikes.**
