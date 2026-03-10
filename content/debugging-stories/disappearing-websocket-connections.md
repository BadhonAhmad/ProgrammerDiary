---
title: "The Mystery of the Disappearing WebSocket Connections"
date: "2026-01-20"
tags: ["debugging-stories", "WebSocket", "backend", "networking"]
excerpt: "A tale of debugging WebSocket connections that kept dropping after exactly 60 seconds. Spoiler: it was the load balancer all along."
---

# The Mystery of the Disappearing WebSocket Connections

We had just launched a real-time chat feature. Everything worked perfectly in development. In production? Connections dropped like flies after exactly 60 seconds.

## The Symptoms

- Users could connect to the WebSocket server fine
- Messages worked for about a minute
- Then — disconnected. Every time. Exactly 60 seconds.

## The Red Herring

My first instinct: it must be a bug in our WebSocket server code. I spent hours reviewing:

```typescript
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    // Handle message
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
```

Nothing wrong here. Heartbeat/ping was configured correctly. The server was fine.

## The Debugging Process

### Step 1: Timing Analysis

I added detailed timestamps:

```typescript
ws.on('connection', () => {
  const connectTime = Date.now();
  ws.on('close', () => {
    const duration = Date.now() - connectTime;
    console.log(`Connection lasted: ${duration}ms`);
  });
});
```

Result: Always between 59,500ms and 60,500ms. **Exactly 60 seconds.**

### Step 2: The 60-Second Clue

What has a 60-second timeout? Our infrastructure:
- **Nginx reverse proxy** ✓
- **AWS ALB (Application Load Balancer)** ✓

### Step 3: The Culprit

Our Nginx config had:

```nginx
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # Missing: proxy_read_timeout
}
```

The default `proxy_read_timeout` in Nginx is — you guessed it — **60 seconds**.

WebSocket connections are long-lived. If no data flows for 60 seconds, Nginx kills the connection thinking it's dead.

## The Fix

```nginx
location /ws {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;    # 1 hour
    proxy_send_timeout 3600s;
}
```

Plus, we added proper ping/pong heartbeats every 30 seconds to keep connections alive through any intermediary.

## Lessons Learned

1. **Infrastructure matters** — your code isn't the only thing running
2. **Exact timeouts are infrastructure clues** — 60s, 30s, 120s usually point to config defaults
3. **Test in production-like environments** — our dev setup had no reverse proxy
4. **Every proxy layer can interfere** with long-lived connections
