---
title: "Real-Time Systems: When 'Eventually' Is Not Good Enough"
date: "2026-04-17"
tags: ["backend", "real-time", "websockets", "SSE", "architecture", "Node.js"]
excerpt: "Learn the architecture patterns behind real-time features — from choosing the right transport to handling state synchronization, conflict resolution, and presence."
---

# Real-Time Systems: When 'Eventually' Is Not Good Enough

You open a Google Doc. Your collaborator types a word. You see it instantly. No refresh. No polling. No "saving..." That's a real-time system — and building one requires different architectural decisions than traditional request-response apps.

## What is a Real-Time System?

A **real-time system** delivers information to users with minimal delay — typically under 500ms from when an event occurs to when the user sees it. This includes:

- **Live updates:** Scores, stock prices, social feeds
- **Collaboration:** Document editing, whiteboards, cursors
- **Communication:** Chat, video calls, notifications
- **Streaming:** Live video, audio, data feeds

"Real-time" doesn't mean zero latency. It means **latency low enough that the interaction feels instantaneous** to the user.

## Why Does It Matter?

❌ **Problem:** Your project management tool requires users to refresh the page to see task updates. Two team members edit the same task simultaneously. Both save. One overwrites the other's changes. No one knows until the next refresh. Collaboration breaks down.

Or: your trading dashboard shows prices from 30 seconds ago. Users make decisions on stale data. They lose money. They leave your platform.

✅ **Solution:** Real-time architecture pushes updates instantly, handles concurrent edits, and keeps all clients in sync — so users always see current state without manual refreshes.

## Transport Options for Real-Time

| Transport | Direction | Latency | Complexity | Best For |
|---|---|---|---|---|
| **WebSocket** | Bidirectional | < 100ms | Medium | Chat, gaming, collaboration |
| **SSE** | Server → Client | < 100ms | Low | Notifications, feeds, dashboards |
| **Long Polling** | Client → Server | 1-30s | Low | Legacy fallback |
| **HTTP Polling** | Client → Server | 2-60s | Very low | Rarely acceptable |

### Server-Sent Events (SSE)

When you only need server-to-client updates (no client-to-server messaging), SSE is simpler than WebSockets:

```text
// Server — Express SSE endpoint
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send an event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Example: push notifications
  notificationService.on("new", (notification) => {
    sendEvent({ type: "notification", data: notification });
  });

  // Heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
  });
});
```

```text
// Client — EventSource API (built into browsers)
const eventSource = new EventSource("/api/events");

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  showNotification(data);
};

eventSource.onerror = () => {
  console.log("Reconnecting...");
  // EventSource auto-reconnects
};
```

SSE advantages: native browser API, automatic reconnection, HTTP/2 multiplexing, simpler than WebSockets for one-way data.

## Real-Time Architecture Patterns

### Pattern 1: Pub/Sub with Channels

The most common pattern. Clients subscribe to channels. Events published to a channel reach all subscribers.

```text
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────>│  Pub/Sub     │<────│  Server  │
│  A       │     │  (Redis)     │     │  Worker  │
└──────────┘     │              │     └──────────┘
┌──────────┐     │  Channel:    │     ┌──────────┐
│  Client  │────>│  "game:42"   │<────│  Game    │
│  B       │     │              │     │  Engine  │
└──────────┘     └──────────────┘     └──────────┘

1. Clients A and B join channel "game:42"
2. Game engine publishes score update to "game:42"
3. Redis delivers to both clients instantly
```

### Pattern 2: Event Sourcing with Live Projections

Every state change is an event. The current state is derived by replaying events. Clients subscribe to the event stream.

```text
Events stored:
  { type: "task_created", taskId: 1, title: "Build API" }
  { type: "task_assigned", taskId: 1, userId: 42 }
  { type: "task_completed", taskId: 1 }

Current state (projection):
  Task 1: "Build API" → assigned to user 42 → completed

New event arrives → all subscribed clients update their local state
```

### Pattern 3: Operational Transformation (OT)

For collaborative text editing (Google Docs-style). When two users edit simultaneously, OT algorithms merge changes without conflicts.

```text
User A types "Hello W" → sends operation: insert "W" at position 6
User B types "World"  → sends operation: insert "orld" at position 6

Server transforms operations so both see: "Hello World"

The transformation ensures:
  - Both clients converge to the same final state
  - No user's changes are lost
  - Order of operations doesn't affect the result
```

### Pattern 4: CRDTs (Conflict-Free Replicated Data Types)

An alternative to OT. Data structures designed to **automatically merge** without conflicts.

```text
// Last-Write-Wins Register (simple CRDT)
Each update has a timestamp. On conflict, the latest timestamp wins.

// G-Counter (Grow-only Counter)
Each client has its own counter. Merge = sum of all client counters.
Client A: 5, Client B: 3 → Total: 8 (no conflict possible)
```

CRDTs are simpler than OT but use more memory and bandwidth. Used by Figma, Notion, and many modern collaboration tools.

## Presence System

Showing who's online and what they're doing:

```text
// Track active users with Redis
async function userConnected(userId) {
  await redis.set(`presence:${userId}`, JSON.stringify({
    status: "online",
    page: "/dashboard",
    lastSeen: Date.now(),
  }), "EX", 60);  // Auto-expire after 60 seconds
}

// Heartbeat — client sends every 30 seconds
socket.on("heartbeat", async (data) => {
  await redis.set(`presence:${socket.user.id}`, JSON.stringify({
    status: "online",
    page: data.currentPage,
    lastSeen: Date.now(),
  }), "EX", 60);
});

// Get online users
async function getOnlineUsers() {
  const keys = await redis.keys("presence:*");
  const users = await Promise.all(
    keys.map(key => redis.get(key))
  );
  return users.map(JSON.parse);
}
```

## Handling State Synchronization

### The Problem

```text
Server state:    { score: 100 }
Client A sees:   { score: 100 }
Client B sees:   { score: 100 }

Server updates score to 105.
Client A gets update → sees 105 ✅
Client B is on slow network → still sees 100 ❌

Client B sends action based on stale state (score: 100)
Server must decide: accept or reject?
```

### Solutions

**State versioning:** Each state has a version number. Clients send their version with actions. Server rejects if version is stale.

```text
// Client sends action with state version
{ action: "increment_score", version: 3 }

// Server checks
if (clientVersion < currentVersion) {
  // Send full state sync
  socket.emit("state:sync", currentState);
} else {
  // Apply action
  applyAction(action);
  currentVersion++;
  io.emit("state:update", { score: newScore, version: currentVersion });
}
```

**Delta updates:** Instead of sending full state, send only what changed.

```text
// Instead of:
{ score: 105, team: "Lakers", quarter: 3, ... }  // Full state

// Send:
{ score: { team: "Lakers", value: 105 } }  // Only what changed
```

## Real-Time Performance Considerations

| Concern | Solution |
|---|---|
| High message frequency | Throttle/debounce rapid updates (e.g., cursor positions at 30fps → 10fps) |
| Many concurrent connections | Use WebSocket connection pooling, load balancing with sticky sessions or Redis adapter |
| Memory per connection | Each socket ~20-50KB; plan server capacity accordingly |
| Message ordering | Use sequence numbers; process messages in order per client |
| Reconnection state | Send missed events on reconnect (event log with sequence IDs) |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Real-time system** | Updates within ~500ms — feels instantaneous to users |
| **WebSocket** | Bidirectional, persistent — best for interactive features |
| **SSE** | Server-to-client only — simpler for notifications/feeds |
| **Pub/Sub channels** | Clients subscribe to topics; events reach all subscribers |
| **OT / CRDTs** | Merge concurrent edits without conflicts |
| **Presence** | Track who's online using Redis with TTL-based heartbeats |
| **State versioning** | Detect stale clients and send full sync when needed |
| **Delta updates** | Send only changed fields, not full state |
| **Throttling** | Cap update frequency for high-frequency events (cursors, etc.) |

**Real-time isn't about being fast — it's about being current. The user should never have to ask 'is this up to date?'**
