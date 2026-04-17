---
title: "IP Hash Load Balancing"
date: "2026-04-17"
tags: ["system-design", "load-balancing", "ip-hash", "sticky-sessions"]
excerpt: "Learn how IP hash load balancing routes the same client to the same server — enabling session persistence without external session storage."
---

# IP Hash Load Balancing

A user logs in on Server A. Their next request goes to Server B. Session not found. They're logged out. IP hash ensures the same user always reaches the same server — solving the session problem at the routing level.

## How It Works

Hash the client's IP address and map it to a server. The same IP always hashes to the same server.

```text
hash(192.168.1.10) % 3 = 0 → Server A (always)
hash(192.168.1.20) % 3 = 2 → Server C (always)
hash(192.168.1.30) % 3 = 1 → Server B (always)

Same client → same server every time
```

## Why Use IP Hash

```text
Problem: Stateful sessions stored on individual servers
  User logs in on Server A → session stored on A
  Next request goes to Server B → no session → user logged out

Solution: IP hash ensures user always hits the same server
  User always hits Server A → session always available
```

## Limitations

```text
❌ Uneven distribution: Some IPs generate more traffic than others
❌ Server removal: If Server B goes down, all its users redistribute — potentially overloading others
❌ Shared IPs: Users behind a NAT/proxy share an IP → one server gets all their traffic
❌ Mobile users: IP changes as users move between networks → session lost anyway
```

## Better Alternatives

```text
Instead of IP hash for session persistence, consider:
  1. External session storage (Redis) — any server can read any session
  2. JWT tokens — session data stored client-side, no server memory needed
  3. Cookie-based routing — more reliable than IP (handles NAT/proxy correctly)
```

## Key Points Cheat Sheet

| Concept | What It Means |
|---|---|
| **IP hash** | Route same IP to same server, always |
| **Session persistence** | Solves the "which server has my session" problem |
| **Uneven distribution** | Some servers may get more traffic than others |
| **NAT problems** | Users behind same proxy all route to same server |
| **Better alternatives** | External sessions (Redis) or JWT are more robust |

**IP hash is the quick fix for session persistence. External session storage is the real fix.**
