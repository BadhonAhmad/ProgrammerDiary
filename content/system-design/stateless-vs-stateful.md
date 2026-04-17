---
title: "Stateless vs Stateful Systems"
date: "2026-04-17"
tags: ["system-design", "stateless", "stateful", "scaling", "architecture"]
excerpt: "Learn why stateless systems scale horizontally while stateful systems don't — and how to externalize state so your app can run on any number of servers."
---

# Stateless vs Stateful Systems

Your server stores the user's shopping cart in memory. Another request hits a different server. Cart is empty. The user is confused. This is the stateful vs stateless problem — and it's the #1 architectural decision that determines whether you can scale.

## What is State?

**State** is data that persists across multiple requests from the same user — sessions, shopping carts, game progress, form data in progress.

```text
Stateful: Server remembers who you are between requests
  Request 1 → Server A stores your cart in memory
  Request 2 → Must hit Server A (other servers don't have your cart)

Stateless: Server forgets you after each request
  Request 1 → Server A processes, returns response, forgets you
  Request 2 → Server B processes (all needed info comes with the request)
```

## Why Does It Matter?

❌ **Problem:** A stateful system ties users to specific servers. If Server A holds 1,000 user sessions and crashes, all 1,000 users lose their sessions and must log in again. You can't freely redistribute traffic — users must "stick" to their server. Scaling requires complicated session replication.

✅ **Solution:** Stateless systems externalize state — store it in Redis, a database, or the client (JWT). Any server can handle any request. Servers are interchangeable. One crashes, others take over seamlessly. Horizontal scaling works naturally.

## Comparison

| Factor | Stateful | Stateless |
|---|---|---|
| **Horizontal scaling** | Hard (sticky sessions) | Easy (any server handles any request) |
| **Fault tolerance** | Low (session lost on crash) | High (state stored externally) |
| **Load balancing** | Must route to specific server | Any server works |
| **Memory usage** | Grows with active users | Constant per server |
| **Complexity** | Simpler code, harder infrastructure | More external dependencies, easier scaling |

## Making a System Stateless

### Sessions → Redis or JWT

```text
Stateful:
  req.session.user = user;  // Stored in server memory

Stateless (JWT):
  const token = jwt.sign({ userId: user.id }, SECRET);
  res.json({ token });  // Client stores and sends with each request

Stateless (Redis sessions):
  await redis.set(`session:${sessionId}`, JSON.stringify(user));
  // Any server reads from Redis
```

### File Uploads → Cloud Storage

```text
Stateful:
  fs.writeFileSync(`uploads/${file.name}`, data);  // Stored on server disk

Stateless:
  await s3.putObject({ Bucket: "uploads", Key: file.name, Body: data });
  // Stored externally, accessible from any server
```

### In-Memory Cache → Redis

```text
Stateful:
  const cache = new Map();  // Lost on restart, not shared across servers

Stateless:
  await redis.set("key", value);  // Shared across all servers
```

## When Stateful Makes Sense

Not everything needs to be stateless:

```text
✅ Stateful is fine for:
  - Single-server applications (no need to distribute)
  - Development and prototyping
  - WebSocket connections (inherently stateful — use Redis adapter)
  - Real-time game state (too fast for external store)
```

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **State** | Data that persists across multiple requests |
| **Stateful** | Server stores state locally — ties user to specific server |
| **Stateless** | Server stores nothing — any server handles any request |
| **External state** | Redis for sessions, S3 for files, database for data |
| **JWT** | Stateless auth — client stores and sends token |
| **Stateless = scalable** | Horizontal scaling requires stateless design |

**If your server remembers anything between requests, it can't be replaced by another server. Externalize state, and every server becomes interchangeable.**
