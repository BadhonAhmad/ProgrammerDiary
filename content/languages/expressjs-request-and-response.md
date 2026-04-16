---
title: "Express.js Request & Response"
date: "2026-04-16"
tags: ["expressjs", "request", "response", "api"]
excerpt: "Master the Express.js request and response objects — accessing request data, sending responses, setting headers, cookies, redirects, and file downloads."
---

# Express.js Request & Response

## What is it?

The **Request (`req`)** and **Response (`res`)** objects are the core of every Express.js route handler. The `req` object represents the HTTP request and contains all data sent by the client. The `res` object represents the HTTP response and provides methods for sending data back to the client.

## How it Works

### The Request Object (`req`)

#### Request Properties

```javascript
app.get("/demo", (req, res) => {
  // URL Information
  req.originalUrl;   // "/demo?name=alice"
  req.path;          // "/demo"
  req.hostname;      // "localhost"
  req.protocol;      // "http" or "https"
  req.secure;        // true if https

  // HTTP Method
  req.method;        // "GET", "POST", "PUT", "DELETE"

  // Headers
  req.headers;            // All headers object
  req.headers["content-type"];    // "application/json"
  req.headers["authorization"];   // "Bearer eyJhbG..."
  req.get("User-Agent");   // Same as req.headers["user-agent"]

  // Route Parameters
  req.params;   // From /users/:id → { id: "42" }

  // Query String
  req.query;    // From /search?q=test&page=1 → { q: "test", page: "1" }

  // Request Body (requires express.json() middleware)
  req.body;     // Parsed JSON: { name: "Alice", age: 25 }

  // Cookies (requires cookie-parser middleware)
  req.cookies;        // { sessionId: "abc123" }
  req.signedCookies;  // Verified with secret

  // IP Address
  req.ip;            // "::ffff:127.0.0.1"
  req.ips;           // Array (if trust proxy is set)

  // Custom properties (set by middleware)
  req.user;          // Set by auth middleware
  req.startTime;     // Set by timing middleware

  res.json({ received: true });
});
```

#### Accessing Route Data — Complete Example

```javascript
// POST /api/v1/users/42/posts?draft=true
// Body: { title: "My Post", content: "Hello World" }
// Headers: Authorization: Bearer token123

app.post("/api/v1/users/:userId/posts", authenticate, (req, res) => {
  // Route parameters
  const userId = req.params.userId;        // "42"

  // Query parameters
  const isDraft = req.query.draft;         // "true"

  // Request body (parsed by express.json())
  const { title, content } = req.body;     // "My Post", "Hello World"

  // Headers
  const token = req.get("Authorization");  // "Bearer token123"

  // Custom property (set by authenticate middleware)
  const currentUser = req.user;            // { id: 1, role: "admin" }

  res.status(201).json({
    message: "Post created",
    userId,
    title,
    isDraft,
  });
});
```

### The Response Object (`res`)

#### Sending Responses

```javascript
// Send JSON (most common for APIs)
res.json({ users: [], total: 0 });
res.status(201).json({ user: newUser });

// Send plain text
res.send("Hello World");
res.status(200).send("OK");

// Send HTML
res.send("<h1>Welcome</h1>");
res.render("index", { title: "Home" }); // With template engine

// Send status code only
res.sendStatus(200);  // "OK"
res.sendStatus(204);  // "No Content" (for DELETE)
res.sendStatus(404);  // "Not Found"

// Chain status and response
res.status(400).json({ error: "Bad Request" });
res.status(401).json({ error: "Unauthorized" });
res.status(500).json({ error: "Internal Server Error" });
```

#### Setting Headers

```javascript
// Set a single header
res.set("Content-Type", "application/json");
res.set("X-Custom-Header", "value");

// Set multiple headers
res.set({
  "Content-Type": "application/json",
  "Cache-Control": "no-cache",
  "X-Request-Id": "abc-123",
});

// Shortcut for Content-Type
res.type("json");     // "application/json"
res.type("html");     // "text/html"
res.type("png");      // "image/png"

// CORS header
res.set("Access-Control-Allow-Origin", "*");
```

#### Cookies

```javascript
const cookieParser = require("cookie-parser");
app.use(cookieParser("your-secret-key"));

// Set cookie
res.cookie("token", "abc123", {
  httpOnly: true,     // Not accessible via JavaScript
  secure: true,       // HTTPS only
  maxAge: 86400000,   // 24 hours in milliseconds
  sameSite: "strict", // CSRF protection
  signed: true,       // Signed with secret key
});

// Clear cookie
res.clearCookie("token");

// Read cookies
app.get("/check", (req, res) => {
  const token = req.signedCookies.token;  // Verified cookie
  const pref = req.cookies.theme;         // Unsigned cookie
  res.json({ token, pref });
});
```

#### Redirects

```javascript
// Redirect (302 by default)
res.redirect("/new-url");
res.redirect(301, "/permanent-redirect");   // 301 = permanent
res.redirect(302, "/temporary-redirect");   // 302 = temporary
res.redirect("https://example.com");        // External URL
res.redirect("back");                       // Back to referrer
```

#### File Downloads

```javascript
// Trigger file download
app.get("/download/report", (req, res) => {
  res.download("/files/report.pdf");
});

// With custom filename
res.download("/files/report.pdf", "monthly-report.pdf");

// Send file for display (not download)
res.sendFile("/files/image.png");

// Send file with options
res.sendFile("/files/image.png", {
  root: path.join(__dirname, "public"),
  lastModified: true,
  headers: { "X-Sent": "true" },
});
```

#### Streaming Response

```javascript
// Stream a large file
app.get("/video/:id", (req, res) => {
  const filePath = path.join(__dirname, "videos", `${req.params.id}.mp4`);
  const stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "video/mp4",
    "Content-Length": stat.size,
  });

  const readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

// Server-Sent Events (SSE)
app.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const interval = setInterval(() => {
    sendEvent({ time: new Date().toISOString(), value: Math.random() });
  }, 1000);

  req.on("close", () => {
    clearInterval(interval);
  });
});
```

### HTTP Status Codes Reference

| Code | Meaning | When to Use |
|------|---------|-------------|
| **200** | OK | Successful GET, PUT, PATCH |
| **201** | Created | Successful POST (resource created) |
| **204** | No Content | Successful DELETE |
| **301** | Moved Permanently | Permanent URL change |
| **302** | Found | Temporary redirect |
| **304** | Not Modified | Cached response |
| **400** | Bad Request | Invalid input, validation error |
| **401** | Unauthorized | Missing or invalid authentication |
| **403** | Forbidden | Authenticated but not authorized |
| **404** | Not Found | Resource or route doesn't exist |
| **409** | Conflict | Duplicate resource |
| **422** | Unprocessable Entity | Validation failure |
| **429** | Too Many Requests | Rate limiting |
| **500** | Internal Server Error | Unexpected server error |
| **502** | Bad Gateway | Upstream server error |
| **503** | Service Unavailable | Server overloaded/maintenance |

### Best Practices for API Responses

```javascript
// Consistent response format
// Success
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 100 }
}

// Error
{
  "success": false,
  "error": "Error message",
  "details": ["Field X is required"]  // Optional
}

// Implementation
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({ success: false, error: message });
}

function sendPaginated(res, data, page, limit, total) {
  return res.json({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
```

## Why Understanding req/res Matters

| Reason | Explanation |
|--------|-------------|
| **API Design** | Proper status codes and response formats make your API professional |
| **Security** | Setting correct headers prevents attacks (XSS, clickjacking) |
| **Performance** | Streaming responses saves memory for large files |
| **User Experience** | Proper cookies and redirects create smooth navigation |

> **Interview Question:** _"What is the difference between `res.json()` and `res.send()`?"_
>
> `res.send()` can send any type (string, object, buffer) and auto-sets Content-Type. `res.json()` specifically sends JSON — it converts objects to JSON using `JSON.stringify()` and always sets `Content-Type: application/json`. For APIs, always use `res.json()` — it's explicit and consistent. `res.json()` also handles null, undefined, and non-object values correctly.

> **Interview Question:** _"How do you handle file uploads in Express.js?"_
>
> Use **Multer** middleware (`npm install multer`). Multer handles `multipart/form-data` for file uploads. Configure storage destination, file size limits, and file type filters. Access uploaded files via `req.file` (single) or `req.files` (multiple). Always validate file types and sizes on the server — never trust client-side validation alone.

-> Next: [Express.js REST API](/post/languages/expressjs-rest-api)
