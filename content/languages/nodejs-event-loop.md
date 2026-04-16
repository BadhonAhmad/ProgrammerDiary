---
title: "Node.js Event Loop"
date: "2026-04-16"
tags: ["nodejs", "event-loop", "async", "architecture"]
excerpt: "Deep dive into the Node.js event loop — the heart of Node.js. Understand its phases, microtasks vs macrotasks, and how asynchronous execution really works."
---

# Node.js Event Loop

## What is it?

The **event loop** is the mechanism that allows Node.js to perform **non-blocking I/O operations** despite JavaScript being single-threaded. It continuously checks for pending operations and executes their callbacks when ready.

Think of it as a **restaurant waiter**: The waiter takes orders from many tables (requests), gives them to the kitchen (I/O operations), and while the food is cooking, the waiter takes more orders. When food is ready, the waiter delivers it — all with a single waiter.

## How it Works

### Event Loop Phases

```
   ┌──────────────────────────┐
┌─>│         timers            │ ← setTimeout, setInterval
│  └─────────────┬────────────┘
│  ┌─────────────┴────────────┐
│  │     pending callbacks     │ ← System-level callbacks (TCP errors)
│  └─────────────┬────────────┘
│  ┌─────────────┴────────────┐
│  │       idle, prepare      │ ← Internal use only
│  └─────────────┬────────────┘
│  ┌─────────────┴────────────┐
│  │         poll              │ ← Retrieve new I/O events, execute callbacks
│  └─────────────┬────────────┘
│  ┌─────────────┴────────────┐
│  │         check             │ ← setImmediate callbacks
│  └─────────────┬────────────┘
│  ┌─────────────┴────────────┐
│  │     close callbacks       │ ← socket.on('close', ...)
│  └─────────────┬────────────┘
│                │
└────────────────┘
```

### Phase Details

#### 1. Timers Phase
Executes callbacks scheduled by `setTimeout()` and `setInterval()`.

```javascript
setTimeout(() => {
  console.log("Timer callback");
}, 1000);

setInterval(() => {
  console.log("Runs every 2 seconds");
}, 2000);
```

#### 2. Pending Callbacks Phase
Executes I/O callbacks deferred to the next loop iteration (like TCP connection errors).

#### 3. Idle, Prepare Phase
Used internally by Node.js. You won't interact with this.

#### 4. Poll Phase
The **most important phase**. This is where the event loop:
1. Retrieves new I/O events from the system
2. Executes their callbacks (file read complete, network data received, etc.)
3. If no callbacks are pending, it either:
   - Waits for new events (if timers are scheduled)
   - Moves to the check phase (if no timers)

```javascript
const fs = require("fs");

// The callback runs in the POLL phase
fs.readFile("data.txt", "utf8", (err, data) => {
  console.log("File read complete — executed in poll phase");
});
```

#### 5. Check Phase
Executes callbacks scheduled by `setImmediate()`.

```javascript
setImmediate(() => {
  console.log("Immediate callback — runs in check phase");
});
```

#### 6. Close Callbacks Phase
Executes close event callbacks (e.g., `socket.on("close", ...)`).

### Microtasks vs Macrotasks

This is one of the most important concepts to understand:

```
Execution Priority:
1. Process.nextTick queue  (highest priority)
2. Promise microtask queue
3. All event loop phases    (timers, poll, check, etc.)
```

```javascript
console.log("1 - Synchronous");

setTimeout(() => console.log("2 - setTimeout (macrotask)"), 0);

Promise.resolve().then(() => console.log("3 - Promise (microtask)"));

process.nextTick(() => console.log("4 - nextTick (microtask)"));

console.log("5 - Synchronous");

// Output:
// 1 - Synchronous
// 5 - Synchronous
// 4 - nextTick (microtask)     ← Runs BEFORE promises
// 3 - Promise (microtask)      ← Runs BEFORE macrotasks
// 2 - setTimeout (macrotask)   ← Runs LAST
```

**Why this order?**

1. Synchronous code runs first (always)
2. After the current operation completes, Node.js checks the **microtask queue**:
   - `process.nextTick` callbacks run first (highest priority microtask)
   - Promise `.then()` / `.catch()` / `.finally()` callbacks run next
3. Only after ALL microtasks are drained, the event loop moves to the next phase
4. Macrotask callbacks (`setTimeout`, `setImmediate`, I/O) run in their respective phases

### setTimeout vs setImmediate

```javascript
// Outside of I/O cycle — order is non-deterministic
setTimeout(() => console.log("timeout"), 0);
setImmediate(() => console.log("immediate"));
// Could print either order depending on process performance

// Inside I/O cycle — setImmediate always runs first
const fs = require("fs");
fs.readFile("file.txt", () => {
  setTimeout(() => console.log("timeout"), 0);
  setImmediate(() => console.log("immediate"));
  // ALWAYS: immediate, then timeout
  // Because setImmediate runs in the CHECK phase which comes after POLL
});
```

### The Event Loop in Action — A Complete Example

```javascript
console.log("🟢 1. Script starts");

// Timer
setTimeout(() => {
  console.log("🔴 2. setTimeout 0ms");

  Promise.resolve().then(() => {
    console.log("🟡 3. Promise inside setTimeout");
  });
}, 0);

// Immediate
setImmediate(() => {
  console.log("🔵 4. setImmediate");
});

// Microtasks
Promise.resolve().then(() => {
  console.log("🟡 5. Promise.resolve");
});

process.nextTick(() => {
  console.log("🟣 6. nextTick");
});

// I/O
const fs = require("fs");
fs.readFile(__filename, () => {
  console.log("📂 7. File read callback");
});

console.log("🟢 8. Script ends");

// Likely output:
// 🟢 1. Script starts
// 🟢 8. Script ends
// 🟣 6. nextTick
// 🟡 5. Promise.resolve
// 🔴 2. setTimeout 0ms
// 🟡 3. Promise inside setTimeout
// 🔵 4. setImmediate
// 📂 7. File read callback
```

## Why Understanding the Event Loop Matters

| Reason | Explanation |
|--------|-------------|
| **Performance** | Blocking the event loop blocks the ENTIRE application — no other requests can be served |
| **Debugging** | Understanding execution order helps debug race conditions and unexpected behavior |
| **Interview Essential** | One of the most commonly asked Node.js interview topics |
| **Architecture Decisions** | Knowing when to use Worker Threads vs the event loop affects system design |

### Don't Block the Event Loop!

```javascript
// ❌ BAD — Blocks the event loop for ALL users
app.get("/heavy", (req, res) => {
  let sum = 0;
  for (let i = 0; i < 10000000000; i++) {
    sum += i; // This takes seconds — ALL other requests wait!
  }
  res.json({ sum });
});

// ✅ GOOD — Offload to Worker Thread
const { Worker } = require("worker_threads");

app.get("/heavy", (req, res) => {
  const worker = new Worker("./heavy-task.js");
  worker.on("message", (result) => {
    res.json({ sum: result });
  });
});

// ✅ ALSO GOOD — Chunk the work
app.get("/heavy", async (req, res) => {
  let sum = 0;
  const chunkSize = 1000000;
  for (let i = 0; i < 10000000000; i += chunkSize) {
    const end = Math.min(i + chunkSize, 10000000000);
    for (let j = i; j < end; j++) sum += j;
    await new Promise((resolve) => setImmediate(resolve)); // Yield to event loop
  }
  res.json({ sum });
});
```

> **Interview Question:** _"Explain the phases of the Node.js event loop."_
>
> The event loop has 6 phases: (1) **timers** — executes setTimeout/setInterval callbacks, (2) **pending callbacks** — deferred system callbacks, (3) **idle/prepare** — internal, (4) **poll** — retrieves and executes I/O callbacks, (5) **check** — setImmediate callbacks, (6) **close callbacks** — close event handlers. Between each phase, the microtask queue (nextTick + Promises) is drained.

> **Interview Question:** _"What is the difference between process.nextTick() and setImmediate()?"_
>
> `process.nextTick()` fires on the **microtask queue** — it executes immediately after the current operation, BEFORE the event loop continues. `setImmediate()` fires in the **check phase** of the event loop — it executes on the NEXT iteration. Despite the names, `nextTick` fires sooner than `setImmediate`. Use `nextTick` for urgent cleanup, `setImmediate` for deferring non-urgent work.

> **Interview Question:** _"What happens if you block the event loop?"_
>
> Since Node.js runs JavaScript on a single thread, a blocking operation (heavy computation, synchronous I/O) prevents the event loop from processing ANY other callbacks, timers, or incoming requests. The entire application becomes unresponsive. Solutions: use Worker Threads, chunk work with `setImmediate`/`setTimeout`, or offload to a separate microservice.

-> Next: [Node.js Modules & Require](/post/languages/nodejs-modules-and-require)
