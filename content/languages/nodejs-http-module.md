---
title: "Node.js HTTP Module"
date: "2026-04-16"
tags: ["nodejs", "http", "server", "networking", "api"]
excerpt: "Learn how to create HTTP servers and make HTTP requests using Node.js built-in http and https modules — the foundation that frameworks like Express.js are built on."
---

# Node.js HTTP Module

## What is it?

The **http module** is a built-in Node.js core module that provides functionality for creating **HTTP servers** and making **HTTP client requests**. It is the low-level foundation that web frameworks like Express.js, Fastify, and Koa are built on top of.

## How it Works

### Creating an HTTP Server

```javascript
const http = require("http");

const server = http.createServer((req, res) => {
  // req = IncomingMessage (readable stream)
  // res = ServerResponse (writable stream)

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from Node.js HTTP server!");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
```

### Understanding the Request Object (`req`)

The `req` (IncomingMessage) object contains all information about the incoming HTTP request:

```javascript
const server = http.createServer((req, res) => {
  // Request method (GET, POST, PUT, DELETE, etc.)
  console.log("Method:", req.method);

  // URL and path
  console.log("URL:", req.url);       // /api/users?page=1
  console.log("Path:", req.url.split("?")[0]); // /api/users

  // Headers
  console.log("Headers:", req.headers);
  console.log("Content-Type:", req.headers["content-type"]);
  console.log("Authorization:", req.headers["authorization"]);

  // Parse query parameters manually
  const url = new URL(req.url, `http://${req.headers.host}`);
  const page = url.searchParams.get("page");     // "1"
  const limit = url.searchParams.get("limit");   // "10"

  // Parse URL parameters (route params)
  // Need to do manually with http module (Express does this automatically)
  const match = req.url.match(/^\/api\/users\/(.+)$/);
  const userId = match ? match[1] : null;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ method: req.method, url: req.url, page, userId }));
});
```

### Reading Request Body

Since `req` is a readable stream, you must collect the body data manually:

```javascript
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const bodyParts = [];
    req
      .on("data", (chunk) => {
        bodyParts.push(chunk);
      })
      .on("end", () => {
        const body = Buffer.concat(bodyParts).toString();
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      })
      .on("error", reject);
  });
}

// Usage
server.on("request", async (req, res) => {
  if (req.method === "POST") {
    const body = await parseBody(req);
    console.log("Request body:", body);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: body }));
  }
});
```

### Understanding the Response Object (`res`)

```javascript
server.on("request", (req, res) => {
  // Set status code
  res.statusCode = 200;

  // Set headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("X-Custom-Header", "Hello");

  // Set multiple headers at once
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    "Access-Control-Allow-Origin": "*",
  });

  // Send response (can call multiple times, end() finishes)
  res.write("{");
  res.write('"message": "Hello"');
  res.write("}");
  res.end();

  // Or send everything at once
  res.end(JSON.stringify({ message: "Hello" }));

  // Shortcut methods
  // Send JSON
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ data: "Hello" }));

  // Send HTML
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("<h1>Hello World</h1>");

  // Send error
  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));

  // Redirect
  res.writeHead(302, { Location: "/new-url" });
  res.end();
});
```

### Building a REST API (Without Express)

```javascript
const http = require("http");

// In-memory data store
let users = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

function parseBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // GET /users — List all users
  if (req.method === "GET" && pathname === "/users") {
    return sendJSON(res, 200, { data: users });
  }

  // GET /users/:id — Get single user
  if (req.method === "GET" && pathname.match(/^\/users\/\d+$/)) {
    const id = parseInt(pathname.split("/")[2]);
    const user = users.find((u) => u.id === id);
    if (!user) return sendJSON(res, 404, { error: "User not found" });
    return sendJSON(res, 200, { data: user });
  }

  // POST /users — Create user
  if (req.method === "POST" && pathname === "/users") {
    const body = await parseBody(req);
    const newUser = {
      id: users.length + 1,
      name: body.name,
      email: body.email,
    };
    users.push(newUser);
    return sendJSON(res, 201, { data: newUser });
  }

  // PUT /users/:id — Update user
  if (req.method === "PUT" && pathname.match(/^\/users\/\d+$/)) {
    const id = parseInt(pathname.split("/")[2]);
    const body = await parseBody(req);
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) return sendJSON(res, 404, { error: "User not found" });
    users[index] = { ...users[index], ...body };
    return sendJSON(res, 200, { data: users[index] });
  }

  // DELETE /users/:id — Delete user
  if (req.method === "DELETE" && pathname.match(/^\/users\/\d+$/)) {
    const id = parseInt(pathname.split("/")[2]);
    users = users.filter((u) => u.id !== id);
    return sendJSON(res, 204, null);
  }

  // 404 — Not Found
  sendJSON(res, 404, { error: "Route not found" });
});

server.listen(3000, () => console.log("API server on port 3000"));
```

### Making HTTP Client Requests

```javascript
const http = require("http");
const https = require("https");

// GET request
function fetchData(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;

    client
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ statusCode: res.statusCode, data });
          }
        });
      })
      .on("error", reject);
  });
}

// POST request
function postData(url, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(body)),
      },
    };

    const client = urlObj.protocol === "https:" ? https : http;
    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

// Usage
const result = await fetchData("https://jsonplaceholder.typicode.com/users");
console.log(result);
```

### Server Events

```javascript
const server = http.createServer();

server.on("request", (req, res) => {
  // Handle every request
});

server.on("connection", (socket) => {
  console.log("New connection from:", socket.remoteAddress);
});

server.on("close", () => {
  console.log("Server closed");
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error("Port already in use!");
  }
});

server.listen(3000);
```

## Why Understanding the HTTP Module Matters

| Reason | Explanation |
|--------|-------------|
| **Foundation** | Express.js, Fastify, Koa all build on top of `http.createServer()` |
| **Debugging** | Understanding the raw request/response helps debug framework issues |
| **Lightweight Services** | For simple APIs, you might not need Express at all |
| **Interview Knowledge** | Shows deep understanding of how Node.js handles HTTP |
| **Custom Servers** | WebSocket servers, proxy servers, custom protocols |

> **Interview Question:** _"How does Express.js relate to the Node.js http module?"_
>
> Express.js is built **on top of** the `http` module. `express()` internally calls `http.createServer()`. Express adds a layer of abstraction: routing, middleware, request/response helpers, and more. Under the hood, every Express app still uses `http.Server` and the raw `IncomingMessage`/`ServerResponse` objects.

> **Interview Question:** _"How do you parse a request body in raw Node.js (without Express)?"_
>
> The `req` object is a readable stream. You collect body data by listening to `data` events (receiving chunks) and concatenating them, then process the complete body in the `end` event. For JSON: `let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => const parsed = JSON.parse(body));`. Express's `express.json()` middleware does this automatically.

-> Next: [Node.js Error Handling](/post/languages/nodejs-error-handling)
