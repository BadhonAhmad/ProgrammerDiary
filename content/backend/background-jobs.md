---
title: "Background Jobs & Queues: Don't Make the User Wait"
date: "2026-04-17"
tags: ["backend", "background-jobs", "queues", "performance", "Node.js", "BullMQ", "Redis"]
excerpt: "Learn how background jobs move slow work out of the request cycle — sending emails, processing images, generating reports — without blocking the user."
---

# Background Jobs & Queues: Don't Make the User Wait

User clicks "Export Report." The server generates a 50-page PDF. Takes 30 seconds. The user stares at a loading spinner. They click again. Now two PDFs are being generated. The server slows down. Welcome to why background jobs exist.

## What are Background Jobs?

**Background jobs** (also called tasks or workers) are units of work that get **deferred** from the main request-response cycle. Instead of doing the work immediately while the user waits, you add the job to a **queue** and return a response immediately. A separate **worker process** picks up the job and handles it asynchronously.

```text
Synchronous (bad):
  User clicks "Generate Report"
  → Server generates PDF (30 seconds)
  → User gets response
  Total wait: 30 seconds

Asynchronous (good):
  User clicks "Generate Report"
  → Server adds job to queue (5ms)
  → User gets "Report is being generated" immediately
  → Worker picks up job, generates PDF in background
  → User gets notified when done
  Total wait for user: < 1 second
```

## Why Does It Matter?

❌ **Problem:** Your app sends welcome emails when users sign up. The email service takes 2-5 seconds to respond. The user waits 5 seconds staring at a spinner after clicking "Sign Up." If the email service is down, the signup fails entirely — even though the account was created. The user sees an error and tries again, creating a duplicate account.

Same problem applies to: image processing (10s), PDF generation (30s), data imports (minutes), third-party API calls (unreliable latency), and video encoding (hours).

✅ **Solution:** Decouple slow work from the request cycle. Add a job to the queue, respond to the user immediately, and let a background worker handle the slow part. If the worker fails, the job retries automatically.

## Core Concepts

### The Queue Architecture

```text
┌────────┐      ┌───────────┐      ┌──────────┐
│ Producer│─────>│   Queue   │─────>│  Worker  │
│ (API)   │      │  (Redis)  │      │ Process  │
└────────┘      └───────────┘      └──────────┘

1. API receives request
2. API adds job to queue
3. API responds immediately
4. Worker picks up job from queue
5. Worker processes job
6. Worker marks job as completed (or failed)
```

### Key Terms

| Term | What It Means |
|---|---|
| **Producer** | Code that creates and adds jobs to the queue |
| **Queue** | Ordered list of jobs waiting to be processed |
| **Worker** | Process that picks up and executes jobs |
| **Job** | A single unit of work (with data/payload) |
| **Retry** | Automatically re-attempting a failed job |
| **Dead letter queue** | Jobs that failed too many times — for investigation |

## When to Use Background Jobs

### ✅ Use Background Jobs For

| Task | Why |
|---|---|
| Sending emails | External service, slow, unreliable |
| Image/video processing | CPU-intensive, takes seconds to hours |
| PDF/report generation | Slow rendering |
| Data imports/exports | Large datasets, long processing |
| Webhook delivery | External HTTP calls, may fail |
| Push notifications | Many recipients, external service |
| Scheduled tasks | Run every hour/day/week |
| Search indexing | Update search index after data changes |
| Analytics events | Don't block user actions |

### ❌ Don't Use For

| Task | Why |
|---|---|
| Simple CRUD operations | Fast, user expects immediate result |
| Data validation | Must respond with valid/invalid before proceeding |
| Authentication | User needs immediate confirmation |

## Implementing Background Jobs with BullMQ

**BullMQ** is the most popular Node.js job queue. It uses Redis as the queue backend.

### Installation

```text
npm install bullmq ioredis
```

### Basic Producer (Adding Jobs)

```text
const { Queue } = require("bullmq");

const emailQueue = new Queue("emails", {
  connection: { host: "localhost", port: 6379 },
});

// Add a job to the queue
app.post("/register", async (req, res) => {
  const user = await createUser(req.body);

  // Add email job — user gets response immediately
  await emailQueue.add("welcome-email", {
    userId: user.id,
    email: user.email,
    name: user.name,
  });

  res.status(201).json({ message: "Account created! Check your email." });
});
```

### Basic Worker (Processing Jobs)

```text
const { Worker } = require("bullmq");

const emailWorker = new Worker("emails", async (job) => {
  console.log(`Processing ${job.name}:`, job.data);

  if (job.name === "welcome-email") {
    await sendWelcomeEmail(job.data.email, job.data.name);
  }
}, {
  connection: { host: "localhost", port: 6379 },
  concurrency: 5,  // Process 5 jobs simultaneously
});

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});
```

### Worker is a Separate Process

Workers run in their own process — not inside your API server:

```text
// Project structure
src/
  api/
    server.js        ← Express API (producer)
  workers/
    emailWorker.js   ← Email worker process
    imageWorker.js   ← Image processing worker
    reportWorker.js  ← Report generation worker
```

```text
# Start API server
node src/api/server.js

# Start workers (separate terminals or process manager)
node src/workers/emailWorker.js
node src/workers/imageWorker.js
```

In production, use a process manager (PM2, Docker, Kubernetes) to manage workers.

## Advanced Features

### Retries with Backoff

Jobs fail — networks glitch, services go down. Automatic retries handle this.

```text
await emailQueue.add("welcome-email", data, {
  attempts: 5,                     // Retry up to 5 times
  backoff: {
    type: "exponential",
    delay: 1000,                   // 1s, 2s, 4s, 8s, 16s
  },
});
```

### Scheduled / Delayed Jobs

Run a job in the future — without cron.

```text
// Send reminder email in 24 hours
await emailQueue.add("reminder", data, {
  delay: 24 * 60 * 60 * 1000,  // Milliseconds
});

// Schedule recurring job
await emailQueue.add("daily-digest", data, {
  repeat: {
    pattern: "0 9 * * *",  // Cron: every day at 9 AM
  },
});
```

### Job Priorities

Some jobs are more important than others.

```text
await emailQueue.add("password-reset", data, { priority: 1 });   // High
await emailQueue.add("newsletter", data, { priority: 5 });        // Low
await emailQueue.add("welcome-email", data, { priority: 3 });     // Medium
```

Lower number = higher priority.

### Progress Tracking

Report progress for long-running jobs.

```text
const reportWorker = new Worker("reports", async (job) => {
  const pages = await generateReportParts();

  for (let i = 0; i < pages.length; i++) {
    await processPage(pages[i]);
    await job.updateProgress(Math.round(((i + 1) / pages.length) * 100));
  }

  return { url: "/reports/latest.pdf" };
});
```

### Job Events and Notifications

Notify the user when their job is done.

```text
// API endpoint to check job status
app.get("/api/jobs/:jobId", async (req, res) => {
  const job = await emailQueue.getJob(req.params.jobId);

  if (!job) return res.status(404).json({ error: "Job not found" });

  const state = await job.getState();
  const progress = job.progress;

  res.json({
    state,         // completed, failed, active, waiting, delayed
    progress,
    data: job.returnvalue,  // Result if completed
  });
});
```

## Job Lifecycle

```text
                 ┌──────────┐
                 │  Added   │
                 └────┬─────┘
                      │
                 ┌────▼─────┐
          ┌─────>│ Waiting  │<─────┐
          │      └────┬─────┘      │
          │           │            │
          │      ┌────▼─────┐      │
          │      │  Active   │     │
          │      └────┬─────┘      │
          │           │            │
          │    ┌──────┴──────┐     │
          │    │             │     │
          │ ┌──▼───┐  ┌─────▼──┐  │
          │ │Failed│  │Completed│  │
          │ └──┬───┘  └────────┘  │
          │    │                    │
          │    │ (if retries left) │
          │    └────────────────────┘
          │
          │ (max retries reached)
          │
     ┌────▼─────┐
     │  Dead    │  ← Needs manual investigation
     └──────────┘
```

## Common Patterns

### Fan-Out: One Action, Multiple Jobs

User uploads a photo. You need to: resize, generate thumbnail, upload to CDN, update database.

```text
app.post("/upload", async (req, res) => {
  const file = await saveFile(req.file);

  // Fan out to multiple queues
  await Promise.all([
    imageQueue.add("resize", { fileId: file.id, size: "large" }),
    imageQueue.add("resize", { fileId: file.id, size: "thumbnail" }),
    imageQueue.add("upload-to-cdn", { fileId: file.id }),
    notificationQueue.add("photo-uploaded", { fileId: file.id }),
  ]);

  res.json({ message: "Upload received, processing..." });
});
```

### Chaining: Job Triggers Next Job

```text
const { Queue } = require("bullmq");

const importQueue = new Queue("imports");

// First: download file
// When done: parse data
// When done: import to database
// When done: send notification
```

BullMQ supports `job.children` for parent-child job relationships.

## Common Mistakes

### ❌ Processing Jobs Inside the API Server

Workers should run in separate processes. If workers share the API server's process, a CPU-heavy job starves the API of resources.

### ❌ No Dead Letter Handling

Jobs that fail repeatedly disappear silently. Always log and monitor dead-lettered jobs.

### ❌ Infinite Retries Without Backoff

Retrying immediately after failure often fails again. Use exponential backoff.

### ❌ Not Setting Job Timeouts

A stuck job blocks the worker forever.

```text
await emailQueue.add("send-email", data, {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
});
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Background job** | Deferred work processed outside the request cycle |
| **Queue** | Ordered list of jobs waiting for a worker |
| **Worker** | Separate process that picks up and executes jobs |
| **BullMQ** | Popular Node.js job queue backed by Redis |
| **Retry + backoff** | Auto-retry failed jobs with increasing delays |
| **Scheduled jobs** | Delay execution or run on a cron schedule |
| **Priority** | Some jobs get processed before others |
| **Dead letter queue** | Failed jobs for manual investigation |
| **Separate processes** | Workers must run independently from API server |

**If it takes more than 500ms and the user doesn't need to see the result immediately — queue it.**
