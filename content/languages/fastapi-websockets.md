---
title: "FastAPI WebSockets"
date: "2026-04-21"
tags: ["python", "fastapi", "websockets", "real-time", "streaming"]
excerpt: "Learn how FastAPI handles WebSockets for real-time communication — chat apps, live dashboards, notifications, and any feature that needs instant server push."
---

# FastAPI WebSockets

HTTP is a one-way street — the client asks, the server responds. But what about chat? Live sports scores? Real-time collaboration? The server needs to push data to the client without waiting for a request. That's WebSockets.

## What are WebSockets?

**WebSocket** is a protocol that creates a persistent, two-way connection between client and server. Unlike HTTP (request → response), WebSocket keeps the connection open — either side can send messages at any time.

```text
HTTP:
  Client: "Give me the score"
  Server: "3-1"
  Connection closes
  (Client must ask again for updates)

WebSocket:
  Client connects → connection stays open
  Server: "Score: 0-0"
  Server: "Score: 1-0" (goal!)
  Server: "Score: 1-1" (goal!)
  (Server pushes updates as they happen)
```

## Why Does It Matter?

❌ **Problem:** Your chat app polls the server every 2 seconds for new messages. That's 30 requests per minute per user. With 1,000 users, that's 30,000 requests/minute — most returning nothing. Wasted bandwidth, wasted server resources, and messages appear with up to 2 seconds delay.

✅ **Solution:** WebSockets maintain a single connection per user. When a message arrives, the server pushes it instantly. No polling, no wasted requests, no delay. 1,000 connections instead of 30,000 requests per minute.

## Basic WebSocket

```python
from fastapi import WebSocket, WebSocketDisconnect

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"You said: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")
```

```javascript
// Frontend JavaScript
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onopen = () => console.log("Connected");
ws.onmessage = (event) => console.log(event.data);
ws.send("Hello from client!");
```

## Chat Room Example

```python
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat/{room_id}")
async def chat(websocket: WebSocket, room_id: str):
    await manager.connect(websocket)
    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast(f"[{room_id}] {message}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast("Someone left the chat")
```

## WebSocket with Authentication

```python
from fastapi import Query

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),  # Token passed as query param
):
    user = verify_token(token)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    # Now you know who's connected
```

## WebSocket vs HTTP

| Factor | HTTP | WebSocket |
|---|---|---|
| **Direction** | Client → Server only | Bidirectional |
| **Connection** | New per request | Persistent |
| **Server push** | Not possible (needs polling) | Native |
| **Overhead** | Headers per request | One-time handshake |
| **Use for** | REST APIs, CRUD | Chat, live updates, streaming |
| **State** | Stateless | Stateful (connection lives) |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **WebSocket** | Persistent bidirectional connection between client and server |
| **`websocket.accept()`** | Accept the incoming connection |
| **`websocket.receive_text()`** | Receive a message from the client |
| **`websocket.send_text()`** | Send a message to the client |
| **WebSocketDisconnect** | Exception when client disconnects |
| **Connection manager** | Pattern for tracking active connections |
| **Broadcast** | Send a message to all connected clients |
| **Auth via query param** | Pass token in WebSocket URL since no headers |

**WebSockets turn your API from a question-and-answer session into an ongoing conversation — both sides talk whenever they want, and nobody has to keep asking "anything new?"**
