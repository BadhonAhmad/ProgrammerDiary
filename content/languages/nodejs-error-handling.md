---
title: "Node.js Error Handling"
date: "2026-04-16"
tags: ["nodejs", "error-handling", "debugging", "async"]
excerpt: "Comprehensive guide to error handling in Node.js — error types, try/catch, async errors, uncaught exceptions, and production best practices."
---

# Node.js Error Handling

## What is it?

**Error handling** is the process of anticipating, detecting, and resolving errors that occur during application execution. In Node.js, improper error handling can crash the entire process (since it's single-threaded), making it critical to handle errors properly.

## How it Works

### Types of Errors in Node.js

```
Errors in Node.js
├── Operational Errors     → Expected, must be handled (network failure, invalid input)
├── Programmer Errors      → Bugs, must be fixed (typos, logic errors, undefined variables)
├── System Errors          → OS-level (ENOENT, EACCES, EMFILE)
├── Assertion Errors       → Failed conditions (assert.strictEqual)
└── Custom Errors          → Application-specific errors you define
```

### The Error Object

All errors in Node.js inherit from the built-in `Error` object:

```javascript
const error = new Error("Something went wrong");

console.log(error.message);  // "Something went wrong"
console.log(error.name);     // "Error"
console.log(error.stack);    // Stack trace string

// Built-in error types
new TypeError("Expected a string");        // Wrong type
new RangeError("Value out of range");     // Out of range
new SyntaxError("Invalid JSON");          // Parse error
new ReferenceError("x is not defined");   // Undefined variable
```

### Custom Error Classes

```javascript
// Base application error
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

// Usage
function getUser(id) {
  const user = users.find((u) => u.id === id);
  if (!user) {
    throw new NotFoundError("User");
  }
  return user;
}
```

### Synchronous Error Handling

```javascript
// try/catch for synchronous code
function parseConfig(jsonString) {
  try {
    const config = JSON.parse(jsonString);
    if (!config.port) {
      throw new ValidationError("Port is required");
    }
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error("Invalid JSON format:", error.message);
      return { port: 3000 }; // Fallback
    }
    if (error instanceof ValidationError) {
      console.error("Validation failed:", error.message);
      throw error; // Re-throw operational errors
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### Asynchronous Error Handling

#### Callbacks — Error-First Pattern

```javascript
fs.readFile("config.json", "utf8", (error, data) => {
  if (error) {
    // Always check error first
    if (error.code === "ENOENT") {
      console.error("Config file not found");
    } else {
      console.error("Read error:", error.message);
    }
    return;
  }
  // Process data
  console.log(data);
});
```

#### Promises — .catch()

```javascript
fetchData()
  .then(processData)
  .then(saveData)
  .catch((error) => {
    // Catches errors from ANY step in the chain
    console.error("Pipeline failed:", error.message);
  })
  .finally(() => {
    // Cleanup regardless of success/failure
    closeConnection();
  });
```

#### Async/Await — try/catch

```javascript
async function fetchUserData(userId) {
  try {
    const user = await getUser(userId);
    const posts = await getUserPosts(user.id);
    return { user, posts };
  } catch (error) {
    if (error instanceof NotFoundError) {
      // Handle expected errors
      return null;
    }
    // Unexpected errors — log and re-throw
    logger.error("Unexpected error:", error);
    throw error;
  } finally {
    // Always runs
    await closeDatabaseConnection();
  }
}
```

### Handling Uncaught Errors at Process Level

```javascript
// Uncaught exceptions — last safety net for sync errors
process.on("uncaughtException", (error) => {
  logger.fatal("UNCAUGHT EXCEPTION:", error);

  // CRITICAL: The process is in an unknown state
  // You MUST exit after logging
  process.exit(1);
});

// Unhandled promise rejections — for async errors
process.on("unhandledRejection", (reason, promise) => {
  logger.fatal("UNHANDLED REJECTION:", reason);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed. Process exiting.");
    process.exit(0);
  });

  // Force exit after timeout
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
});

process.on("SIGINT", () => {
  console.log("SIGINT received (Ctrl+C). Shutting down...");
  process.exit(0);
});
```

### Express-Style Centralized Error Handling

```javascript
// Error handling middleware (Express.js pattern)
function errorHandler(err, req, res, next) {
  // Default to 500 internal server error
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.code === "ENOENT") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(err);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

// Wrap async route handlers to catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage
app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(user);
}));

// Must be LAST middleware
app.use(errorHandler);
```

### Error Handling Best Practices

| Practice | Explanation |
|----------|-------------|
| **Use async/await with try/catch** | Most readable pattern for async error handling |
| **Create custom error classes** | Distinguish between operational and programmer errors |
| **Always handle unhandledRejection** | Otherwise the process may crash silently |
| **Don't catch programmer errors** | Let bugs crash the process; fix them instead |
| **Use centralized error handler** | One place for logging, formatting, and sending error responses |
| **Log errors with context** | Include request ID, user ID, and relevant state |
| **Never expose stack traces in production** | Security risk — only show in development |
| **Implement graceful shutdown** | Finish in-flight requests before exiting |

> **Interview Question:** _"What is the difference between operational errors and programmer errors?"_
>
> **Operational errors** are expected runtime problems: network failures, invalid user input, database timeouts, file not found. These must be **handled** with retry logic, fallbacks, or user-friendly messages. **Programmer errors** are bugs: calling undefined functions, typos, logic errors. These should not be caught — let them crash the process, fix the bug, and redeploy. Trying to handle bugs with try/catch hides problems and leads to unpredictable state.

> **Interview Question:** _"What happens with an unhandled promise rejection in Node.js?"_
>
> In Node.js 15+, unhandled promise rejections **terminate the process** with a non-zero exit code (similar to uncaught exceptions). Before Node.js 15, they only triggered a warning. Always handle rejections with `.catch()` or `try/catch` with `async/await`, and set up a `process.on("unhandledRejection")` handler as a last-resort safety net.

-> Next: [Node.js Security Best Practices](/post/languages/nodejs-security-best-practices)
