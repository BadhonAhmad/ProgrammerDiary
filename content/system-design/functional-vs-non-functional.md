---
title: "Functional vs Non-Functional Requirements"
date: "2026-04-17"
tags: ["system-design", "requirements", "fundamentals", "architecture"]
excerpt: "Learn the difference between what a system does (functional) and how well it does it (non-functional) — and why missing either one leads to a broken design."
---

# Functional vs Non-Functional Requirements

"We need a login system." That's a functional requirement. "The login system must respond in under 200ms and handle 10,000 concurrent logins." That's non-functional. Confuse them, and you build something that works perfectly for 5 users and collapses at 500.

## What are Requirements?

**Requirements** define what a system must do and how well it must do it. They split into two categories:

- **Functional requirements (FR):** What the system must **do** — features, behaviors, operations.
- **Non-functional requirements (NFR):** How well the system must **perform** — speed, reliability, security, scalability.

```text
Functional:     "Users can upload profile photos"
Non-functional: "Photo upload completes in <3 seconds, supports up to 10MB, 99.9% availability"
```

## Why Does It Matter?

❌ **Problem:** A team builds all the features perfectly — users can post, like, comment, share. Everything works. Then they launch. 100,000 users sign up on day one. The system takes 30 seconds per page load. Comments take 2 minutes to appear. The app technically "works" (all functional requirements met) but is completely unusable (no non-functional requirements defined).

✅ **Solution:** Defining both functional AND non-functional requirements before building ensures the system doesn't just work — it works **at the scale and quality users expect**.

## Functional Requirements

These define **what the system does** — the features and behaviors.

```text
Examples for a Twitter-like system:

Functional requirements:
  - Users can post tweets (max 280 characters)
  - Users can follow other users
  - Users see a timeline of tweets from followed users
  - Users can like and retweet
  - Users can search for other users
  - Users receive notifications for mentions

Each functional requirement answers:
  "What specific action must the system support?"
```

### Categories of Functional Requirements

| Category | Examples |
|---|---|
| **Data processing** | Create, read, update, delete records |
| **User actions** | Register, login, post, follow, search |
| **Business rules** | Max 280 chars, $1000 daily transfer limit |
| **Integration** | Send email, process payment, sync with CRM |
| **Reporting** | Generate monthly report, show analytics |

## Non-Functional Requirements

These define **how well the system performs** — the quality attributes.

```text
Examples for the same Twitter-like system:

Non-functional requirements:
  - Timeline loads in <200ms (p99)
  - System supports 10 million active users
  - 99.9% uptime (8.76 hours downtime per year max)
  - Data is encrypted at rest and in transit
  - API responds to 50,000 requests per second at peak
  - New developer can deploy a feature within 1 day

Each NFR answers:
  "What quality standard must the system meet?"
```

### Categories of Non-Functional Requirements

| Category | Examples | Key Metric |
|---|---|---|
| **Performance** | Response time < 200ms | Latency (p50, p99) |
| **Scalability** | Handle 10x traffic growth | Max concurrent users |
| **Availability** | 99.9% uptime | Nines of uptime |
| **Reliability** | Zero data loss | Error rate |
| **Security** | AES-256 encryption, GDPR compliance | Vulnerability count |
| **Maintainability** | Deploy in < 1 hour | MTTR, time to deploy |
| **Durability** | Data survives disk failure | Data loss rate |

## The Relationship

```text
Functional requirements  → Define the FEATURES
Non-functional           → Define the QUALITY of those features

A system that meets all FRs but no NFRs:
  ✅ Users can tweet
  ❌ It takes 30 seconds
  ❌ It goes down daily
  ❌ Data gets corrupted

A system that meets all NFRs but no FRs:
  ✅ Responds in 10ms
  ✅ 99.999% uptime
  ❌ Users can't tweet (feature not built)
```

Both must be defined. Both must be tested.

## How to Elicit Requirements

### For System Design Interviews

```text
Step 1: Clarify scope
  "Are we designing all of Twitter or just the timeline?"
  "Do we need direct messages?"

Step 2: Define functional requirements
  "Users can post tweets, follow others, view timeline"

Step 3: Ask about scale (non-functional)
  "How many daily active users?"
  "What's the read-to-write ratio?"
  "What latency is acceptable?"
```

### Back-of-Envelope Numbers

Common reference numbers for estimation:

```text
Typical numbers:
  - New SSD random read:          0.1 ms
  - Same-datacenter network call: 0.5 ms
  - Disk seek (HDD):             10 ms
  - Compress 1KB with gzip:      0.003 ms
  - Read 1MB from memory:        0.25 ms
  - Read 1MB from SSD:           1 ms
  - Read 1MB from network:       10 ms
  - Database query (simple):     1-5 ms
  - DNS lookup:                  50-150 ms

Quick reference:
  - 2.5 million seconds per month
  - 86,400 seconds per day
  - 1 million requests/day ≈ 12 QPS average
```

## Common Mistakes

### ❌ Only Defining Functional Requirements

"We need a search feature." Without NFRs: search works but takes 30 seconds. Define: "Search returns results in <500ms for up to 100M documents."

### ❌ Unrealistic Non-Functional Requirements

"Zero downtime, instant responses, unlimited scale." Pick realistic targets based on business needs. 99.999% uptime for an internal tool is over-engineering.

### ❌ Not Prioritizing Requirements

All requirements are not equal. A social feed can tolerate stale data (eventual consistency). A banking transaction cannot (strong consistency). Rank your NFRs.

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **Functional requirements** | What the system does — features and behaviors |
| **Non-functional requirements** | How well it performs — speed, scale, reliability |
| **Performance NFR** | Response time, throughput |
| **Scalability NFR** | Max users, max data, growth capacity |
| **Availability NFR** | Uptime percentage (the "nines") |
| **Security NFR** | Encryption, compliance, access control |
| **Both are required** | Features without quality = unusable. Quality without features = useless |
| **Prioritize** | Not all NFRs are equal — rank based on business needs |

**Functional requirements make the system useful. Non-functional requirements make the system usable. You need both.**
