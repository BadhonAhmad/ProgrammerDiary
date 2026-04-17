---
title: "Error Handling: What Happens When Things Go Wrong"
date: "2026-04-17"
tags: ["backend", "fundamentals", "error-handling", "Node.js", "Express"]
excerpt: "Learn how backend error handling works — the difference between operational errors and bugs, how to structure error responses, and why what you log versus what you return to the client matters enormously."
---

# Error Handling: What Happens When Things Go Wrong

Your code works perfectly in development. Then a user submits a username with 10,000 characters. The database goes offline for maintenance. A third-party payment API returns an unexpected response. What happens next depends entirely on your error handling — and most of the time, the difference between a minor hiccup and a full outage is how well you planned for failure.

## What is Error Handling?

**Error handling** is the practice of anticipating, detecting, and responding to failures in your application. It ensures that when something goes wrong — and it always will — your system degrades gracefully instead of crashing, leaking information, or leaving the client hanging.

```text
Good error handling:
  Something fails → error is caught → user sees a helpful message → you see a detailed log → system keeps running

Bad error handling:
  Something fails → unhandled exception → server crashes → user sees "Internal Server Error" or nothing → you have no idea what happened
```

## Why It Matters

### ❌ Problem: Unhandled Errors Crash Servers and Expose Data

An unhandled exception in Node.js terminates the process. If your server crashes on every malformed request, attackers can deliberately send bad data to take your service offline (a denial-of-service by exception). Worse, default error messages often include stack traces, database query text, and file paths — a roadmap for attackers.

### ✅ Solution: Structured Error Handling at Every Layer

Catching errors at the right layer, responding with safe messages, and logging detailed diagnostics internally keeps your system running and your data protected.

## Two Types of Errors

### Operational Errors — Expected Failures

These are not bugs. They are runtime problems that you should anticipate:

- A user submits invalid input (missing email, negative age)
- A database query times out
- A third-party API returns a 503
- A file is not found
- A user tries to access a resource they do not own
- Network connection drops mid-request

Operational errors are **predictable**. You know they will happen. Your code should handle them explicitly and return a meaningful response.

### Programmer Errors — Bugs

These are mistakes in your code:

- Calling a function on `undefined`
- Accessing a property that does not exist
- Passing the wrong number of arguments
- Infinite recursion causing a stack overflow

Programmer errors are **bugs**. You cannot handle them gracefully — the correct response is to log the error, return a generic 500 response, and fix the bug. Restarting the process (or letting a process manager like PM2 do it) is often the safest option.

## HTTP Error Response Structure

A well-designed error response tells the client what went wrong, without revealing internal details:

```text
Client receives:
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid"
  }
}

Server logs (never sent to client):
[ERROR] 2026-04-17T10:30:00Z
  Request: POST /api/users
  User IP: 203.0.113.42
  Input: { "name": "Nobel", "email": "not-an-email" }
  Stack: ValidationError: Invalid email at validateEmail (src/utils/validation.js:15)
```

The client gets a clear, actionable message. The logs get everything you need to debug. Neither gets database connection strings, stack traces, or file paths.

### Standard Error Response Pattern

| Status Code | Meaning | Client Message Example |
|-------------|---------|----------------------|
| **400** | Bad Request — invalid input | "Email format is invalid" |
| **401** | Unauthorized — no/invalid token | "Authentication required" |
| **403** | Forbidden — insufficient permissions | "You do not have access to this resource" |
| **404** | Not Found — resource does not exist | "User not found" |
| **409** | Conflict — duplicate or constraint violation | "Email already registered" |
| **422** | Unprocessable Entity — validation failure | "Name is required, age must be positive" |
| **429** | Too Many Requests — rate limit exceeded | "Slow down, try again in 60 seconds" |
| **500** | Internal Server Error — unexpected failure | "Something went wrong. Please try again." |

The **500** message is intentionally vague. The client does not need to know that your database connection pool was exhausted. That detail belongs in your logs.

## Error Handling Layers

### Layer 1: Input Validation

Catch bad data at the edge, before it reaches your business logic.

```text
User submits: { "age": -5 }
Validation: "Age must be a positive number"
Response: 400 Bad Request
→ The request never reaches the database
```

### Layer 2: Business Logic Errors

Handle expected failures in your application rules.

```text
User tries to transfer $500 with $200 balance
Business rule: "Insufficient funds"
Response: 400 Bad Request with clear message
→ The transfer is rejected cleanly
```

### Layer 3: Database Errors

Handle database-specific failures.

```text
Database query times out
Response: 500 Internal Server Error (generic message to client)
Log: Full query, timeout duration, connection pool status
→ The user retries. You investigate the slow query.
```

### Layer 4: Global Error Handler

A catch-all middleware that catches any error not handled by the layers above.

```text
Any unhandled error → global handler catches it
→ Logs the full error internally
→ Returns generic 500 to the client
→ Server keeps running
```

This is your safety net. No matter what goes wrong, the global handler ensures the server does not crash and the client gets a response.

## Key Principles

### Return Safe Messages, Log Detailed Errors

The cardinal rule of error handling: **tell the user what happened in plain language, tell yourself everything, and never mix the two.**

```text
Client sees:  { "error": "Something went wrong" }
Logs show:    TypeError: Cannot read property 'id' of undefined
              at getUser (src/controllers/users.js:23)
              at Router.get (node_modules/express/lib/router/index.js:345)
```

### Use Consistent Error Formats

Every error response should follow the same structure. The client should not have to parse three different error formats across your API.

### Do Not Swallow Errors

Silently catching errors without logging them is worse than not catching them at all. An error you cannot see is an error you cannot fix.

### Fail Fast on Programmer Errors

If your code encounters a bug (programmer error), log it, return a 500, and let the process restart. Trying to continue after a bug often leads to corrupted state and cascading failures.

## Key Points Cheat Sheet

| Concept | What to Remember |
|---------|-----------------|
| **Operational errors** | Expected failures — invalid input, timeouts, not-found. Handle gracefully. |
| **Programmer errors** | Bugs — undefined access, wrong arguments. Log, return 500, restart. |
| **Safe messages to client** | "Something went wrong" for 500s. Specific messages for 4xx errors only. |
| **Detailed logs internally** | Stack traces, input values, request context — everything you need to debug. |
| **Consistent format** | Every error response uses the same structure. |
| **Layered handling** | Validation → business logic → database → global handler. Each layer catches what it understands. |
| **Fail fast on bugs** | Do not try to recover from programmer errors. Restart clean. |
| **Never swallow errors** | Catching without logging hides problems until they become outages. |

Error handling is not glamorous. It does not ship features or impress users. But it is the difference between a system that survives real-world conditions and one that falls apart the moment something unexpected happens. Plan for failure, and your system will outlast it.
