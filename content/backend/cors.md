---
title: "CORS: Why Your API Calls Get Blocked by the Browser"
date: "2026-04-17"
tags: ["backend", "cors", "security", "API", "Node.js", "Express"]
excerpt: "Learn why browsers block cross-origin requests, how CORS fixes it, and how to configure it correctly in your Express backend."
---

# CORS: Why Your API Calls Get Blocked by the Browser

You wrote a perfect API. Your frontend calls it. The browser says "No." Welcome to CORS.

## What is CORS?

**CORS** stands for **Cross-Origin Resource Sharing**. It's a browser security mechanism that controls whether a web page running at one origin (domain) can request resources from a different origin.

An **origin** is the combination of:
- **Protocol** (http vs https)
- **Host** (example.com vs api.example.com)
- **Port** (3000 vs 8080)

```text
Same origin:
  https://myapp.com/page    →  https://myapp.com/api/users     ✅ Allowed

Different origins:
  https://myapp.com/page    →  https://api.myapp.com/users     ❌ Blocked (different host)
  http://localhost:3000     →  http://localhost:8080/api        ❌ Blocked (different port)
  http://myapp.com          →  https://myapp.com/api            ❌ Blocked (different protocol)
```

## Why Does It Matter?

❌ **Problem:** Your React app at `http://localhost:3000` makes a `fetch()` call to your Express API at `http://localhost:5000`. The browser blocks it with:

```text
Access to fetch at 'http://localhost:5000/api/users' from origin
'http://localhost:3000' has been blocked by CORS policy
```

This isn't a bug — it's the **Same-Origin Policy (SOP)**, a critical browser security feature. Without it, any website you visit could make requests to your bank, your email, or any other service where you're logged in — and steal your data.

✅ **Solution:** CORS lets the server explicitly tell the browser: "Yes, this origin is allowed to access my resources." The server adds specific HTTP headers that the browser checks before allowing the request.

## How CORS Works

### Simple Requests

For simple requests (GET, POST with standard headers), the browser sends the request and checks the response headers:

```text
Browser sends:
  GET /api/users
  Origin: http://localhost:3000

Server responds with:
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Credentials: true

Browser checks: Does the Allow-Origin match? Yes → let the response through.
```

### Preflight Requests

For "complex" requests (PUT, DELETE, custom headers, JSON content type), the browser sends a **preflight** request first using the `OPTIONS` method:

```text
Browser sends preflight:
  OPTIONS /api/users
  Origin: http://localhost:3000
  Access-Control-Request-Method: PUT
  Access-Control-Request-Headers: Content-Type, Authorization

Server responds:
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Content-Type, Authorization

Browser checks: Is PUT allowed? Are those headers allowed?
  Yes → Send the actual PUT request.
  No  → Block it. Never send the actual request.
```

### Which Requests Trigger Preflights?

| Request Type | Triggers Preflight? |
|---|---|
| GET, HEAD, POST (simple) | No |
| PUT, DELETE, PATCH | Yes |
| POST with `application/json` | Yes |
| Custom headers (Authorization) | Yes |
| POST with `application/x-www-form-urlencoded` | No |

## Configuring CORS in Express

### Using the `cors` Package

```text
npm install cors
```

```text
// Allow everything (development only!)
const cors = require("cors");
app.use(cors());

// Allow specific origin
app.use(cors({
  origin: "https://myapp.com"
}));

// Allow multiple origins
app.use(cors({
  origin: ["https://myapp.com", "https://admin.myapp.com"]
}));

// Allow with credentials (cookies, auth headers)
app.use(cors({
  origin: "https://myapp.com",
  credentials: true
}));

// Configure per route
app.get("/api/public", cors(), publicHandler);
app.post("/api/private", cors({ origin: "https://myapp.com" }), privateHandler);
```

### Dynamic Origin Validation

```text
const allowedOrigins = [
  "https://myapp.com",
  "https://admin.myapp.com"
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
```

### Manual CORS Headers (Without the Package)

```text
app.use((req, res, next) => {
  const allowedOrigins = ["https://myapp.com"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "86400"); // Cache preflight for 24h

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});
```

## Key CORS Headers

| Header | Purpose | Example |
|---|---|---|
| `Access-Control-Allow-Origin` | Which origins can access | `https://myapp.com` |
| `Access-Control-Allow-Methods` | Allowed HTTP methods | `GET, POST, PUT, DELETE` |
| `Access-Control-Allow-Headers` | Allowed request headers | `Content-Type, Authorization` |
| `Access-Control-Allow-Credentials` | Allow cookies/auth | `true` |
| `Access-Control-Max-Age` | Preflight cache duration (seconds) | `86400` |
| `Access-Control-Expose-Headers` | Which response headers JS can read | `X-Total-Count` |

## Common CORS Mistakes

### ❌ Using `Access-Control-Allow-Origin: *` with Credentials

The browser **will not allow** `*` when `credentials: true`. You must specify the exact origin.

```text
// This will fail in the browser
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
```

### ❌ Setting CORS Headers on the Frontend

CORS headers are set by the **server**, not the client. No amount of frontend configuration will fix a server that doesn't send CORS headers.

### ❌ Ignoring Preflight Requests

If your server doesn't handle `OPTIONS` requests, preflight fails and the actual request never happens. Always handle or use the `cors` middleware.

### ❌ Using CORS as Security

CORS is enforced by the **browser**. A malicious script or tool (curl, Postman) ignores it completely. CORS is not a replacement for authentication and authorization — it only protects legitimate browser users.

### ❌ Allowing All Origins in Production

```text
// Dangerous in production
app.use(cors({ origin: "*" }));

// Better — whitelist specific origins
app.use(cors({ origin: ["https://myapp.com"] }));
```

## CORS vs Same-Origin Policy

```text
Same-Origin Policy (SOP)
  └─ Default browser behavior — blocks all cross-origin requests

CORS
  └─ A way to relax SOP — server tells browser which cross-origin requests are OK
```

SOP protects users. CORS lets legitimate apps work across origins.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Same-Origin Policy** | Browser blocks cross-origin requests by default |
| **CORS** | Server tells browser which origins are allowed |
| **Preflight** | Browser checks permissions before complex requests (OPTIONS) |
| **Simple request** | GET/HEAD/POST with standard headers — no preflight |
| **Access-Control-Allow-Origin** | The key header that enables cross-origin access |
| **credentials: true** | Allows sending cookies — can't use with `*` origin |
| **cors npm package** | Express middleware — configure once, handles everything |
| **CORS ≠ security** | Only browser-enforced; always add real auth checks |

**CORS is the browser's way of asking your server for permission — make sure your server gives the right answer.**
