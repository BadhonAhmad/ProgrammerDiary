---
title: "Express.js Middleware"
date: "2026-04-16"
tags: ["expressjs", "middleware", "request-processing", "pipeline"]
excerpt: "Deep dive into Express.js middleware — what it is, how the middleware stack works, built-in middleware, third-party middleware, and creating custom middleware."
---

# Express.js Middleware

## What is it?

**Middleware** functions are functions that have access to the **request object** (`req`), the **response object** (`res`), and the **next middleware** function in the application's request-response cycle. They can:

- Execute any code
- Modify the request and response objects
- End the request-response cycle (send a response)
- Call `next()` to pass control to the next middleware

Think of middleware as a **pipeline** or **assembly line** — each station processes the request before passing it along:

```
HTTP Request
    │
    ▼
┌────────────┐   ┌────────────┐   ┌────────────┐   ┌────────────┐
│  Logger    │──►│  Body      │──►│  Auth      │──►│  Route     │──► HTTP Response
│  (morgan)  │   │  Parser    │   │  Check     │   │  Handler   │
└────────────┘   └────────────┘   └────────────┘   └────────────┘
```

## How it Works

### The Middleware Function Signature

```javascript
function middleware(req, res, next) {
  // req → The request object (read + modify)
  // res → The response object (read + modify)
  // next → Function to call when done (pass to next middleware)

  // Do something...
  console.log(`${req.method} ${req.url}`);

  // Either:
  next();                    // Pass to next middleware
  // OR:
  res.json({ error: "No" }); // End the cycle (send response)
}
```

**Critical Rule:** You MUST call either `next()` OR send a response (`res.json()`, `res.send()`, etc.). If you do neither, the request **hangs forever**.

### Types of Middleware

#### 1. Application-Level Middleware

Applied to the entire Express app using `app.use()` or `app.METHOD()`:

```javascript
const express = require("express");
const app = express();

// Runs for EVERY request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Runs only for GET /hello
app.get("/hello", (req, res, next) => {
  console.log("Hello route accessed");
  next();
}, (req, res) => {
  res.json({ message: "Hello!" });
});

// Runs only for paths starting with /api
app.use("/api", (req, res, next) => {
  console.log("API route accessed");
  next();
});
```

#### 2. Router-Level Middleware

Same as application-level but bound to an `express.Router()` instance:

```javascript
const router = express.Router();

// Auth middleware for all routes in this router
router.use((req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  next();
});

router.get("/profile", (req, res) => {
  res.json({ user: "Authenticated user" });
});

module.exports = router;
```

#### 3. Built-in Middleware

Express comes with three built-in middleware functions:

```javascript
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies (form submissions)
app.use(express.urlencoded({ extended: true }));

// Serve static files (images, CSS, JS)
app.use(express.static("public"));
// Now: /images/logo.png serves public/images/logo.png

// Can set virtual path prefix
app.use("/static", express.static("public"));
// Now: /static/images/logo.png serves public/images/logo.png
```

#### 4. Third-Party Middleware

```javascript
const morgan = require("morgan");       // HTTP request logger
const cors = require("cors");           // Cross-Origin Resource Sharing
const helmet = require("helmet");       // Security headers
const rateLimit = require("express-rate-limit");

// Logging
app.use(morgan("dev"));                 // Console: GET /users 200 5ms
app.use(morgan("combined"));            // Apache-style log
app.use(morgan("tiny"));                // Minimal output

// CORS
app.use(cors());                                        // Allow all origins
app.use(cors({ origin: "https://myapp.com" }));        // Allow specific origin

// Security headers
app.use(helmet());

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
}));
```

#### 5. Error-Handling Middleware

Has **4 parameters** instead of 3 (Express uses the number of params to identify it):

```javascript
// MUST have exactly 4 parameters: (err, req, res, next)
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});
```

### Creating Custom Middleware

#### Request Logger

```javascript
const logger = (req, res, next) => {
  const start = Date.now();

  // Log when response finishes
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });

  next();
};

app.use(logger);
// Output: GET /api/users → 200 (45ms)
```

#### Authentication Middleware

```javascript
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Usage: protect specific routes
app.get("/profile", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

#### Authorization Middleware

```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Usage
app.delete("/users/:id", authenticate, authorize("admin"), deleteUser);
app.get("/dashboard", authenticate, authorize("admin", "manager"), getDashboard);
```

#### Validation Middleware

```javascript
const Joi = require("joi");

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message);
      return res.status(400).json({
        error: "Validation failed",
        details: messages,
      });
    }

    req.body = value; // Use validated/sanitized data
    next();
  };
};

// Usage
const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

app.post("/users", validate(userSchema), createUser);
```

#### Async Error Wrapper

```javascript
// Wraps async route handlers to catch rejected promises
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Without asyncHandler (verbose):
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// With asyncHandler (clean):
app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));
```

#### Request Timing Middleware

```javascript
app.use((req, res, next) => {
  req.startTime = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    if (duration > 1000) {
      console.warn(`SLOW REQUEST: ${req.method} ${req.url} took ${duration}ms`);
    }
  });
  next();
});
```

### Middleware Execution Order

```javascript
const express = require("express");
const app = express();

// 1. Runs first for ALL requests
app.use((req, res, next) => {
  console.log("1. Global middleware");
  next();
});

// 2. Runs only for /api/* paths
app.use("/api", (req, res, next) => {
  console.log("2. API middleware");
  next();
});

// 3. Runs for specific route
app.get("/api/users", (req, res, next) => {
  console.log("3. Route middleware");
  next();
}, (req, res) => {
  console.log("4. Route handler");
  res.json({ users: [] });
});

// 5. Error handler (must be last!)
app.use((err, req, res, next) => {
  console.log("5. Error handler");
  res.status(500).json({ error: err.message });
});

// Request: GET /api/users
// Console output:
// 1. Global middleware
// 2. API middleware
// 3. Route middleware
// 4. Route handler
```

## Why Middleware Matters

| Reason | Explanation |
|--------|-------------|
| **Separation of Concerns** | Each middleware handles one concern (logging, auth, validation) |
| **Reusability** | Write once, apply to multiple routes |
| **Composability** | Chain middleware to build complex behavior from simple pieces |
| **Extensibility** | Add functionality without modifying route handlers |
| **Clean Code** | Route handlers focus on business logic only |

> **Interview Question:** _"What is middleware in Express.js? Give examples."_
>
> Middleware is a function with access to `req`, `res`, and `next` that runs during the request-response cycle. Examples: (1) **Body parsing** — `express.json()` parses request bodies, (2) **Authentication** — verifies JWT tokens before reaching route handlers, (3) **Logging** — `morgan` logs HTTP requests, (4) **Error handling** — 4-parameter functions that catch errors. Middleware must call `next()` or send a response, otherwise the request hangs.

> **Interview Question:** _"What happens if you don't call `next()` in middleware?"_
>
> The request **hangs** — the client never receives a response and eventually times out. The request-response cycle stops at that middleware. You must either call `next()` to pass control to the next middleware, or end the cycle by sending a response (`res.json()`, `res.send()`, `res.end()`, etc.). There is no timeout built into Express for this — it simply waits.

-> Next: [Express.js Request & Response](/post/languages/expressjs-request-and-response)
