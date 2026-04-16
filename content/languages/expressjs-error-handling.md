---
title: "Express.js Error Handling"
date: "2026-04-16"
tags: ["expressjs", "error-handling", "debugging", "middleware"]
excerpt: "Master error handling in Express.js — custom error classes, centralized error middleware, async error patterns, and production-ready error management."
---

# Express.js Error Handling

## What is it?

**Error handling in Express.js** refers to how the application catches, processes, and responds to errors that occur during request processing. Express provides a special **4-parameter middleware** pattern for centralized error handling that catches errors from all routes and middleware.

## How it Works

### How Express Detects Error Middleware

Express identifies error-handling middleware by the **number of parameters** — it must have exactly 4:

```javascript
// Regular middleware — 3 parameters
app.use((req, res, next) => { ... });

// Error middleware — 4 parameters (err comes first!)
app.use((err, req, res, next) => { ... });
```

### Custom Error Class

```javascript
// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes from programmer errors
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

### Centralized Error Handler

```javascript
// src/middleware/errorHandler.js
const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  // Default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Different behavior for development vs production
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    sendErrorProd(err, res);
  }
}

function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function sendErrorProd(err, res) {
  // Operational errors: safe to send details to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming/unknown errors: don't leak details
    console.error("UNEXPECTED ERROR:", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
}

module.exports = errorHandler;
```

### Handling Specific Error Types

```javascript
// Enhanced error handler with specific error handling
function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // ─── Mongoose Errors ──────────────────────────

  // Invalid MongoDB ObjectId
  if (err.name === "CastError") {
    error = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Duplicate key (unique constraint violation)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    error = new AppError(`Duplicate value for: ${field}`, 409);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(`Validation failed: ${messages.join(". ")}`, 400);
  }

  // ─── JWT Errors ───────────────────────────────

  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token. Please log in again.", 401);
  }

  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired. Please log in again.", 401);
  }

  // ─── Multer Errors (File Upload) ──────────────

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      error = new AppError("File too large", 400);
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      error = new AppError("Too many files", 400);
    }
  }

  // ─── Syntax Errors (Invalid JSON body) ────────

  if (err.type === "entity.parse.failed") {
    error = new AppError("Invalid JSON in request body", 400);
  }

  // ─── Send Response ────────────────────────────

  if (process.env.NODE_ENV === "development") {
    return res.status(error.statusCode || 500).json({
      status: error.status || "error",
      message: error.message,
      stack: err.stack,
      error: err,
    });
  }

  // Production: don't leak error details
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  // Unknown error
  console.error("UNEXPECTED:", err);
  return res.status(500).json({
    status: "error",
    message: "Something went wrong",
  });
}
```

### Async Error Handling — The Wrapper Pattern

```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

Without `asyncHandler`, async errors are silently swallowed:

```javascript
// ❌ BAD — Async error NOT caught by Express
app.get("/users/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  // If this throws, Express does NOT catch it!
  // Result: unhandledRejection, process may crash
  res.json(user);
});

// ❌ VERBOSE — try/catch everywhere
app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ✅ CLEAN — Use asyncHandler wrapper
app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));
```

### Using Errors in Controllers

```javascript
// src/controllers/userController.js
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    // Throwing AppError triggers error middleware
    return next(new AppError("User not found", 404));
  }

  res.json({ success: true, data: user });
});

exports.createUser = asyncHandler(async (req, res, next) => {
  // Validation
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new AppError("Name, email, and password are required", 400));
  }

  // Check for duplicate
  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError("Email already registered", 409));
  }

  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});
```

### Unhandled Rejection & Uncaught Exception

```javascript
// src/server.js
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  // Close server gracefully
  server.close(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down...");
  server.close(() => {
    console.log("Process terminated.");
    process.exit(0);
  });
});
```

### Complete Server Setup with Error Handling

```javascript
// src/server.js
const express = require("express");
const AppError = require("./utils/AppError");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/posts", require("./routes/postRoutes"));

// 404 handler (for unmatched routes)
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler (MUST be last middleware)
app.use(errorHandler);

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  server.close(() => process.exit(1));
});
```

## Why Centralized Error Handling Matters

| Practice | Benefit |
|----------|---------|
| **Custom AppError class** | Consistent error format across the app |
| **Centralized handler** | One place for logging, formatting, and status codes |
| **asyncHandler wrapper** | No try/catch boilerplate in every controller |
| **Dev vs Prod responses** | Full debug info in dev; safe messages in prod |
| **Operational vs Programmer errors** | Handle expected errors; crash on bugs |
| **404 catch-all** | No request goes unanswered |

> **Interview Question:** _"How does error handling work in Express.js?"_
>
> Express uses a **4-parameter middleware** `(err, req, res, next)` to handle errors. When you call `next(error)` or throw an error synchronously, Express skips all regular middleware and jumps to the error-handling middleware. For async errors, you must pass them to `next()` explicitly (or use a wrapper like `asyncHandler`). The error handler must be registered **last** after all routes and middleware.

> **Interview Question:** _"What happens if you throw an error inside an async route handler in Express?"_
>
> In Express 4.x, an `async` function that throws (or rejects) does **NOT** get caught by Express — it results in an `unhandledRejection`. You must either: (1) wrap in try/catch and call `next(err)`, (2) use an `asyncHandler` wrapper that catches rejections and calls `next()`, or (3) use Express 5 which handles async errors automatically.

-> Next: [Express.js Template Engines](/post/languages/expressjs-template-engines)
