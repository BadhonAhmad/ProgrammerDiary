---
title: "Availability: How Often Is Your System Actually Working?"
date: "2026-04-17"
tags: ["system-design", "availability", "fundamentals", "uptime", "SLA"]
excerpt: "Learn what availability means, how it's measured in 'nines,' why each additional nine costs 10x more, and the patterns that keep systems online when components fail."
---

# Availability: How Often Is Your System Actually Working?

Your system was up all month — except for that 4-hour outage during peak traffic. That's 99.5% availability. Sounds great, until you realize those 4 hours cost $2 million in lost revenue. Availability is measured in pain, not percentages.

## What is Availability?

**Availability** is the proportion of time a system is operational and accessible to users. It's measured as a percentage of uptime over total time.

```text
Availability = Uptime / (Uptime + Downtime) × 100

Example:
  Total time: 30 days (720 hours)
  Downtime: 4 hours
  Availability = (720 - 4) / 720 × 100 = 99.44%
```

## The "Nines" of Availability

| Availability | Downtime per Year | Downtime per Month | Downtime per Week |
|---|---|---|---|
| **99%** (two nines) | 3.65 days | 7.31 hours | 1.68 hours |
| **99.9%** (three nines) | 8.76 hours | 43.8 minutes | 10.1 minutes |
| **99.99%** (four nines) | 52.6 minutes | 4.38 minutes | 1.01 minutes |
| **99.999%** (five nines) | 5.26 minutes | 26.3 seconds | 6.05 seconds |

### What Each Level Requires

```text
99%:     Single server, basic monitoring
99.9%:   Redundant servers, automated failover
99.99%:  Multi-zone deployment, chaos engineering
99.999%: Multi-region, dedicated SRE team, extreme investment
```

Each additional nine costs roughly **10x more** in infrastructure and engineering effort.

## Why Does It Matter?

❌ **Problem:** Amazon goes down for 1 hour. Estimated cost: **$100 million**. Not from the lost sales — from the damage to trust, the PR fallout, and the competitive advantage handed to rivals. For smaller companies, a prolonged outage can be an existential threat.

✅ **Solution:** High availability comes from **redundancy, failover, and fault tolerance** — designing the system so no single component failure can take it down.

## How to Achieve High Availability

### Redundancy

Run multiple copies of every critical component.

```text
No redundancy:   1 web server → dies → users see nothing
With redundancy: 3 web servers → 1 dies → other 2 keep serving

Rule: Every single point of failure needs a backup.
```

### Failover

Automatically switch to a backup when the primary fails.

```text
Active-passive:
  Primary handles all traffic
  Standby watches and takes over if primary fails
  Switchover time: seconds to minutes

Active-active:
  Both servers handle traffic simultaneously
  If one dies, the other absorbs all traffic
  No switchover delay
```

### Graceful Degradation

When the full system can't be available, keep core features working.

```text
Full system:
  Product listings ✅
  Shopping cart ✅
  Recommendations ✅
  Reviews ✅
  Wishlists ✅

Degraded (database under load):
  Product listings ✅ (from cache)
  Shopping cart ✅ (core functionality)
  Recommendations ❌ (disabled to save resources)
  Reviews ❌ (disabled)
  Wishlists ❌ (disabled)

Users can still buy. Non-essential features return later.
```

### Health Checks and Auto-Recovery

Detect failures and recover automatically.

```text
Health check fails → Remove instance from load balancer
                      → Auto-scale new instance
                      → Health check passes → Back in rotation
```

### Maintenance Without Downtime

```text
Rolling deployment:
  - Update Server 1 (Servers 2,3 handle traffic)
  - Update Server 2 (Servers 1,3 handle traffic)
  - Update Server 3 (Servers 1,2 handle traffic)

Zero downtime, users never notice.
```

## Calculating Composite Availability

When components are in series, availability multiplies:

```text
Web server: 99.9% → Database: 99.9% → Cache: 99.9%
Overall: 0.999 × 0.999 × 0.999 = 99.7%

Three 99.9% components = only 99.7% overall!
```

When components are in parallel (with redundancy):

```text
Primary: 99%, Backup: 99%
Overall: 1 - (0.01 × 0.01) = 99.99%

Two 99% components in parallel = 99.99%!
```

More parallel redundancy = higher availability, but more cost.

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Availability** | % of time the system is operational |
| **The nines** | 99%, 99.9%, 99.99%, 99.999% — each costs ~10x more |
| **Redundancy** | Multiple copies of critical components |
| **Failover** | Auto-switch to backup when primary fails |
| **Graceful degradation** | Core features stay up, non-essential disabled |
| **Rolling deployment** | Update one server at a time — no downtime |
| **Composite availability** | Series → multiply. Parallel → dramatically higher |
| **SLA** | Service Level Agreement — contractual availability guarantee |

**Availability isn't about never failing — it's about failing in a way users never notice.**
