---
title: "What is System Design?"
date: "2026-04-17"
tags: ["system-design", "fundamentals", "architecture", "interview"]
excerpt: "Learn what system design is, why it matters before writing code, and how it bridges the gap between 'it works on my machine' and 'it works for a million users.'"
---

# What is System Design?

You can build a todo app in an afternoon. But can that todo app serve 10 million users, survive a server crash, and respond in under 200ms? That gap — between "works" and "works at scale" — is system design.

## What is System Design?

**System design** is the process of defining the architecture, components, modules, interfaces, and data for a system to satisfy specified requirements. It's the blueprint before the building.

When you design a system, you make decisions about:
- How components talk to each other
- Where data lives and how it moves
- What happens when things fail
- How the system behaves under load
- What trade-offs you're willing to accept

```text
Without system design:
  "Let's just build it and figure it out as we go"
  → Works for 10 users, falls apart at 10,000

With system design:
  "We expect 10,000 concurrent users, 99.9% uptime, <200ms latency"
  → Architecture chosen to meet those specific goals
```

System design is not about picking technologies. It's about understanding **constraints** and making **trade-offs**.

## Why Does It Matter?

❌ **Problem:** A team builds an app without thinking about scale. They pick a single database, one server, no caching. It launches. It works. Traffic grows. The database slows down. The server crashes under load. Adding features becomes harder because the codebase is tangled. Rewriting everything costs 6 months.

This is the "build first, design later" trap. It works until it catastrophically doesn't.

✅ **Solution:** System design forces you to think about **what could go wrong** before you write a single line of code. You don't need to build for 10 million users on day one — but you need an architecture that *can* get there without a rewrite.

## System Design in Interviews

System design interviews test your ability to architect systems at scale. The typical format:

```text
Interviewer: "Design Twitter."

What they expect:
  1. Clarify requirements (what features? how many users?)
  2. Estimate scale (storage, bandwidth, QPS)
  3. Define API / data model
  4. High-level architecture diagram
  5. Deep dive into components (database, cache, queue)
  6. Address bottlenecks and trade-offs
```

The interviewer doesn't want a perfect answer. They want to see how you think about trade-offs, constraints, and failure modes.

## The System Design Framework

### Step 1: Understand Requirements

```text
Questions to ask:
  - What are the functional requirements? (What must it do?)
  - What are the non-functional requirements? (How fast? How available?)
  - How many users? How much data?
  - What's the read-to-write ratio?
  - Are there real-time requirements?
```

### Step 2: Estimate Scale

```text
Back-of-envelope calculations:
  - Users: 10 million total, 1 million daily active
  - Requests per second (QPS): 1M users × 20 requests/day ÷ 86400s ≈ 230 QPS
  - Peak QPS: 230 × 3 (peak multiplier) ≈ 700 QPS
  - Storage: 10M users × 1KB profile = 10 GB
  - Bandwidth: 700 QPS × 10KB per request ≈ 7 MB/s
```

### Step 3: Define the System Interface

```text
API endpoints:
  POST /api/tweets          → Create tweet
  GET  /api/tweets/{id}     → Get tweet
  GET  /api/feed/{user_id}  → Get user's timeline
  POST /api/follow          → Follow user
```

### Step 4: High-Level Design

Draw the architecture — boxes and arrows:

```text
Client → CDN → Load Balancer → API Servers → Database
                                   ↕
                                 Cache (Redis)
                                   ↕
                                Message Queue
                                   ↕
                               Search Cluster
```

### Step 5: Deep Dive

Pick the hardest parts and go deeper:
- Which database? SQL vs NoSQL?
- How to cache? What's the invalidation strategy?
- How to handle the news feed? Push vs pull model?
- How to search? Full-text search with Elasticsearch?

### Step 6: Identify Bottlenecks and Trade-offs

```text
Bottleneck: Database is the bottleneck at high QPS
Trade-off: Add caching (faster reads, but stale data possible)

Bottleneck: Single database can't store all data
Trade-off: Sharding (scales writes, but complex queries)

Bottleneck: Global users experience high latency
Trade-off: Multi-region deployment (faster, but more expensive)
```

## System Design is About Trade-offs

There are no perfect solutions. Every design decision involves trade-offs:

```text
Consistency    vs  Availability
Performance    vs  Simplicity
Reliability    vs  Cost
Security       vs  Usability
Normalization  vs  Denormalization
```

The "right" answer depends on your specific requirements. A banking system prioritizes consistency. A social media feed prioritizes availability and speed.

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **System design** | Blueprint for how a system works at scale |
| **Requirements** | Functional (what it does) + Non-functional (how well) |
| **Estimation** | Back-of-envelope calculations for scale |
| **Trade-offs** | Every decision has a cost — there are no free lunches |
| **Bottlenecks** | The slowest part of your system determines overall speed |
| **Interview framework** | Requirements → Estimate → API → Architecture → Deep dive → Bottlenecks |
| **Design before code** | Fix architecture mistakes on paper, not in production |

**Good system design isn't about knowing the right answer — it's about asking the right questions.**
