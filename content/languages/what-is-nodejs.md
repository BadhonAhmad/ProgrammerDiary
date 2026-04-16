---
title: "What is Node.js?"
date: "2026-04-16"
tags: ["nodejs", "backend", "javascript", "runtime"]
excerpt: "A deep dive into what Node.js is, its architecture, how the V8 engine powers it, and why it changed backend development forever."
---

# What is Node.js?

## What is it?

Node.js is a **JavaScript runtime built on Chrome's V8 JavaScript engine** that allows you to run JavaScript code **outside of a web browser** — primarily on the server side. It is **not** a programming language, and it is **not** a framework. It is a **runtime environment** that executes JavaScript.

Before Node.js (released in 2009 by Ryan Dahl), JavaScript could only run inside browsers. Node.js broke that barrier, making JavaScript a full-stack language.

```
┌─────────────────────────────────────────┐
│              Node.js Runtime             │
│                                         │
│  ┌───────────┐    ┌──────────────────┐  │
│  │ V8 Engine │    │ libuv (C Library)│  │
│  │ (JS →     │    │ (Event Loop,     │  │
│  │ Machine   │    │  Async I/O,      │  │
│  │ Code)     │    │  Thread Pool)    │  │
│  └───────────┘    └──────────────────┘  │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │   Core Modules (fs, http, path...) ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │   C++ Bindings / Add-ons           ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## How it Works

### 1. The V8 JavaScript Engine

V8 is Google's open-source JavaScript engine, written in C++. It compiles JavaScript directly to **native machine code** before executing it — no intermediate bytecode. This makes V8 extremely fast.

- **Parsing** → V8 reads your JavaScript code and builds an Abstract Syntax Tree (AST).
- **Ignition (Interpreter)** → Converts AST to bytecode for quick startup.
- **TurboFan (Optimizing Compiler)** → Hot code paths get compiled to highly optimized machine code.

### 2. libuv — The Secret Sauce

While V8 handles JavaScript execution, **libuv** (written in C) handles all the I/O operations:

- **Event Loop** — A single-threaded loop that manages all asynchronous operations.
- **Thread Pool** — A pool of worker threads (default 4) for expensive operations like file I/O, DNS lookups, and compression.
- **OS-level Async I/O** — Uses epoll (Linux), kqueue (macOS), or IOCP (Windows) for non-blocking network I/O.

### 3. Event-Driven, Non-Blocking Architecture

Node.js operates on an **event-driven, non-blocking I/O model**:

```javascript
// Blocking (Synchronous) — BAD in Node.js
const data = fs.readFileSync("file.txt", "utf8");
console.log(data);
console.log("This waits until file is read");

// Non-Blocking (Asynchronous) — GOOD, Node.js way
fs.readFile("file.txt", "utf8", (err, data) => {
  console.log(data);
});
console.log("This runs immediately, doesn't wait for file");
```

**What happens under the hood:**

1. `fs.readFile` is called → Node.js delegates to libuv
2. libuv performs the file read on a worker thread (or uses OS async I/O)
3. The main thread **continues executing** the next line
4. When the file read completes, libuv places a **callback** in the event queue
5. The event loop picks up the callback and executes it

### 4. Single-Threaded but Scalable

Node.js runs JavaScript in a **single thread**, but it can handle thousands of concurrent connections because:

- I/O operations are **offloaded** to libuv (which may use threads internally)
- The single thread only handles the event loop and callback execution
- No thread-per-connection overhead (unlike traditional servers like Apache)

```
Traditional Server (Thread-per-Request):
┌──────┐   ┌──────┐   ┌──────┐   ┌──────┐
│Thread│   │Thread│   │Thread│   │Thread│  ← Expensive!
│  #1  │   │  #2  │   │  #3  │   │  #4  │     Each ~1MB RAM
└──────┘   └──────┘   └──────┘   └──────┘

Node.js (Single Thread + Event Loop):
┌─────────────────────────────────────────┐
│         Single Thread (Event Loop)      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│  │CB 1│ │CB 2│ │CB 3│ │CB 4│ │CB 5│   │  ← Lightweight!
│  └────┘ └────┘ └────┘ └────┘ └────┘   │     ~Thousands of connections
└─────────────────────────────────────────┘
```

## Why it is Used

| Reason | Explanation |
|--------|-------------|
| **Full-Stack JavaScript** | Use the same language (JS/TS) on frontend and backend — shared code, types, and team skills |
| **High Concurrency** | Handles thousands of simultaneous connections efficiently (ideal for real-time apps, APIs, chat, streaming) |
| **Fast Execution** | V8 compiles JS to native machine code; non-blocking I/O means no wasted time waiting |
| **Rich Ecosystem** | npm has **2+ million packages** — the largest package registry in the world |
| **Real-Time Applications** | Perfect for WebSockets, chat apps, live dashboards, collaborative tools |
| **Microservices** | Lightweight and fast to start — ideal for containerized microservice architectures |
| **Corporate Backing** | Maintained by OpenJS Foundation; used by Netflix, Uber, PayPal, LinkedIn, Walmart |

### Real-World Use Cases

- **API Servers** — RESTful and GraphQL APIs
- **Real-Time Apps** — Chat applications, live sports updates, stock tickers
- **Streaming Services** — Audio/video streaming, data pipelines
- **Single-Page Applications (SPA)** — Backend for React/Vue/Angular frontends
- **Microservices** — Small, independent services communicating over HTTP/gRPC
- **Serverless Functions** — AWS Lambda, Google Cloud Functions, Vercel Edge Functions
- **CLI Tools** — Build tools (Webpack, Vite), testing frameworks (Jest), dev utilities
- **Desktop Apps** — Electron (VS Code, Slack, Discord are built on it)

### When NOT to Use Node.js

| Scenario | Better Alternative |
|----------|-------------------|
| CPU-intensive tasks (video encoding, ML training) | Python, Go, Rust, C++ |
| Heavy mathematical computation | Python (NumPy), Julia |
| Long-running blocking operations | Java, Go with goroutines |

> **Interview Question:** _"What is Node.js and how does it differ from browser JavaScript?"_
>
> Node.js is a JavaScript runtime built on V8 that runs on the server. Unlike browser JS (which has DOM, window, document), Node.js has core modules for file system, HTTP, OS, and networking. Browser JS is sandboxed for security; Node.js has full system access. Both share the same V8 engine and ECMAScript features.

> **Interview Question:** _"Is Node.js single-threaded?"_
>
> Yes and no. The JavaScript execution is single-threaded (one main thread runs the event loop). However, Node.js uses **libuv** internally which maintains a **thread pool** (default 4 threads) for handling expensive I/O operations like file reads, DNS lookups, and compression. So while your JS code runs on one thread, I/O work happens in parallel on background threads.

-> Next: [Why Node.js?](/post/languages/why-nodejs)
