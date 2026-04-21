---
title: "FastAPI Middleware"
date: "2026-04-21"
tags: ["python", "fastapi", "middleware", "request-lifecycle", "cross-cutting"]
excerpt: "Learn how FastAPI middleware intercepts every request and response — for logging, CORS, timing, authentication, and any cross-cutting concern."
---

# FastAPI Middleware

Every request needs logging. Every response needs CORS headers. Every call needs timing tracked. You could add this code to every endpoint — or you could write it once as middleware and let it run automatically for every request.

## What is Middleware?

**Middleware** is a function that runs before and/or after every request. It intercepts the request, can modify it, passes it to the route handler, then intercepts the response on the way out.

```text
Request flow:
  Client → Middleware (before) → Route Handler → Middleware (after) → Client

Middleware can:
  - Inspect and modify requests before they reach handlers
  - Inspect and modify responses before they reach clients
  - Short-circuit (return a response without calling the handler)
  - Run code on every request without touching route code
```

## Why Does It Matter?

❌ **Problem:** You add timing headers to 30 endpoints. Then you need to add logging to all 30. Then error tracking. Each change touches every route function. Code gets bloated, and you forget to add it to new endpoints.

✅ **Solution:** Middleware runs on every request automatically. Add timing, logging, and CORS in one place. New endpoints get it for free. Route handlers stay focused on business logic.

## Writing Middleware

```python
import time
from fastapi import FastAPI, Request

app = FastAPI()

@app.middleware("http")
async def add_process_time(request: Request, call_next):
    # BEFORE the route handler
    start_time = time.time()

    # Call the actual route handler
    response = await call_next(request)

    # AFTER the route handler
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response
```

```text
1. Request arrives
2. Middleware records start time
3. call_next(request) → runs the route handler
4. Middleware calculates elapsed time
5. Adds X-Process-Time header to response
6. Returns modified response to client
```

## Common Middleware Uses

### Logging
```python
import logging

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"→ {request.method} {request.url}")
    response = await call_next(request)
    logger.info(f"← {response.status_code}")
    return response
```

### Request ID Tracking
```python
import uuid

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response
```

### Blocking IPs
```python
BLOCKED_IPS = {"192.168.1.100"}

@app.middleware("http")
async def block_ips(request: Request, call_next):
    client_ip = request.client.host
    if client_ip in BLOCKED_IPS:
        return JSONResponse(
            status_code=403,
            content={"detail": "Forbidden"},
        )
    return await call_next(request)
```

## Built-in Middleware

### CORS
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://frontend.com"],  # Allowed origins
    allow_credentials=True,
    allow_methods=["*"],      # All HTTP methods
    allow_headers=["*"],      # All headers
)
```

### GZip Compression
```python
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
# Compresses responses larger than 1000 bytes
```

### HTTPS Redirect
```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(HTTPSRedirectMiddleware)
# All HTTP requests redirect to HTTPS
```

### Trusted Host
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["example.com", "api.example.com"],
)
```

## Middleware Execution Order

```text
Middleware runs in reverse order of registration:

app.add_middleware(MiddlewareA)  # Runs LAST (outermost)
app.add_middleware(MiddlewareB)  # Runs SECOND
app.add_middleware(MiddlewareC)  # Runs FIRST (innermost)

Request:  C → B → A → Route Handler
Response: A → B → C → Client

Register in reverse order of how you want them to execute:
  CORS first (outermost — should wrap everything)
  Logging second
  Timing innermost
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Middleware** | Function that runs before/after every request |
| **`call_next(request)`** | Passes request to the route handler |
| **CORS** | Controls which origins can access your API |
| **GZip** | Compresses responses automatically |
| **Logging middleware** | Track every request/response |
| **Execution order** | Reverse of registration — last registered runs first |
| **Short-circuit** | Return response without calling route handler |
| **Cross-cutting** | Concerns that apply to ALL endpoints (logging, auth, timing) |

**Middleware is the express lane for cross-cutting concerns — write it once, it runs everywhere, and your route handlers never know it exists.**
