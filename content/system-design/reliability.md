---
title: "Reliability: Build Systems That Don't Break"
date: "2026-04-17"
tags: ["system-design", "reliability", "fundamentals", "fault-tolerance"]
excerpt: "Learn what reliability means in system design — why correct results under failure matter, how to measure it, and the patterns that keep systems trustworthy."
---

# Reliability: Build Systems That Don't Break

A bank processes a $500 transfer twice. A ride-sharing app shows your location as a different city. A medical system records the wrong dosage. These aren't performance problems — they're reliability problems. And they're far more dangerous.

## What is Reliability?

**Reliability** is the probability that a system performs its intended function correctly under stated conditions for a given period of time. In plain English: **does the system do the right thing, even when things go wrong?**

```text
Reliable system:
  - Transfer $100 → exactly $100 moves, no duplicates
  - User submits form → data saved exactly once
  - Service restarts → all in-flight operations complete or roll back

Unreliable system:
  - Transfer $100 → sometimes moves $200, sometimes $0
  - Form submission → might save twice or not at all
  - Service crashes → data left in inconsistent state
```

## Why Does It Matter?

❌ **Problem:** Your e-commerce system has a race condition in checkout. Two users buy the last item simultaneously. Both orders go through. One user gets the item, the other gets a confirmation email for something that's out of stock. Customer support gets flooded. Trust erodes. Revenue is lost processing refunds.

✅ **Solution:** Reliable systems use **transactions, idempotency, and atomic operations** to guarantee correct behavior — even under concurrent access, network failures, and crashes.

## Reliability vs Availability

These are related but different:

```text
Availability: "Can users reach the system?"
  → The system is UP and responding

Reliability: "Does the system give correct answers?"
  → The system is UP and CORRECT

A system can be available but unreliable:
  Always responds in 50ms, but sometimes returns wrong data

A system can be reliable but unavailable:
  When it responds, it's always correct — but it's down 10% of the time
```

## Measuring Reliability

### Mean Time Between Failures (MTBF)

Average time between system failures.

```text
System runs for 720 hours, fails, runs for 480 hours, fails
MTBF = (720 + 480) / 2 = 600 hours
```

### Mean Time to Recovery (MTTR)

Average time to fix a failure and restore service.

```text
Failure 1: 30 minutes to fix
Failure 2: 2 hours to fix
MTTR = (30 + 120) / 2 = 75 minutes
```

### Reliability Formula

```text
Reliability = MTBF / (MTBF + MTTR)

High MTBF + Low MTTR = High Reliability
```

## Patterns for Building Reliable Systems

### 1. Idempotency

Operations that produce the same result no matter how many times they're executed.

```text
Idempotent:
  SET balance = 100        → Always sets to 100
  DELETE /users/42         → Gone after first call, same state on repeats

Not idempotent:
  ADD 50 to balance        → Each call adds another 50!
  SEND email               → Each call sends another email

Fix for non-idempotent operations:
  Use idempotency keys
  Client sends unique key with request
  Server tracks processed keys → rejects duplicates
```

### 2. Atomic Operations and Transactions

All steps succeed, or none do. No partial states.

```text
Transfer money:
  BEGIN TRANSACTION
    Debit account A: -$100
    Credit account B: +$100
  COMMIT

  If credit fails → debit is rolled back
  No partial state where money disappeared
```

### 3. Retry with Deduplication

Retry failed operations, but prevent duplicates.

```text
async function reliableTransfer(transferId, from, to, amount) {
  // Check if already processed (deduplication)
  const existing = await db.findTransfer(transferId);
  if (existing) return existing;

  // Execute atomically
  return await db.transaction(async (tx) => {
    await tx.debit(from, amount);
    await tx.credit(to, amount);
    return tx.recordTransfer(transferId, from, to, amount);
  });
}
```

### 4. Compensating Transactions

When you can't use atomic transactions (distributed systems), undo partial work.

```text
Step 1: Reserve inventory      → Success
Step 2: Charge credit card     → Failure
Step 3: Compensate: release reserved inventory

This is the Saga pattern for distributed transactions.
```

### 5. Data Integrity Checks

Verify data correctness at every layer.

```text
Database constraints:
  NOT NULL — field must have a value
  UNIQUE — no duplicate values
  FOREIGN KEY — references must exist
  CHECK — custom validation (age >= 0)
```

## Common Reliability Threats

| Threat | What Goes Wrong | Defense |
|---|---|---|
| **Race conditions** | Concurrent access corrupts data | Locks, atomic operations |
| **Network failures** | Messages lost or duplicated | Retries + idempotency |
| **Hardware crashes** | In-memory data lost | Persist before acknowledging |
| **Software bugs** | Logic errors produce wrong results | Automated testing, invariant checks |
| **Human error** | Bad deploy, misconfiguration | Gradual rollouts, automated safeguards |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Reliability** | System produces correct results, even under failure |
| **MTBF** | Mean Time Between Failures — how often it breaks |
| **MTTR** | Mean Time To Recovery — how fast you fix it |
| **Idempotency** | Same operation repeated = same result |
| **Atomic transactions** | All steps succeed or none do |
| **Compensating transactions** | Undo partial work in distributed systems |
| **Data integrity** | Constraints enforce correctness at the database level |
| **Reliability ≠ availability** | Available = responding. Reliable = responding correctly |

**An unreliable system that's always up is worse than a reliable system that's occasionally down — wrong answers are more dangerous than no answers.**
