---
title: "try-catch and Error Handling in TypeScript"
date: "2026-03-12"
tags: ["typescript", "error-handling", "try-catch", "type-safety", "unknown"]
excerpt: "TypeScript makes error handling stricter and safer than JavaScript. Learn how try-catch works, why the catch variable is typed as unknown, and all the patterns for writing robust error handling."
---

# `try-catch` and Error Handling in TypeScript

Error handling in TypeScript is more explicit than JavaScript. The most important change: starting from TypeScript 4.0, the `catch` clause variable is typed as **`unknown`** — not `any`. This one change forces you to think carefully about what an error actually is before you use it.

---

## Basic Structure

```ts
try {
  // code that might throw
} catch (error) {
  // error is typed as: unknown
} finally {
  // always runs — with or without an error
}
```

### The `finally` block

`finally` runs no matter what — whether the `try` succeeded, whether `catch` ran, even if there's a `return` inside `try` or `catch`. Use it for cleanup:

```ts
function readFile(path: string): string {
  let handle = null;
  try {
    handle = openFile(path);
    return handle.read();
  } catch (error) {
    console.error("Failed to read file");
    return "";
  } finally {
    if (handle) handle.close(); // always closes the file handle
  }
}
```

---

## Why `catch (error)` is `unknown`

In JavaScript, `catch` gives you `any`. TypeScript changed this to **`unknown`** because **anything can be thrown** in JavaScript — not just `Error` objects:

```ts
throw "something went wrong";     // string
throw 404;                         // number
throw { code: "NOT_FOUND" };       // plain object
throw new Error("standard error"); // Error object
throw null;                        // even null
```

Since any of these can land in your `catch` block, TypeScript types `error` as `unknown` and forces you to narrow it before using it. This is the correct behaviour — it mirrors reality.

---

## Rule 1 — Always Narrow the Error Before Using It

```ts
try {
  riskyOperation();
} catch (error) {
  console.log(error.message);
  // ❌ Error: Object is of type 'unknown'
}
```

You cannot access `.message` directly. You must check first:

```ts
try {
  riskyOperation();
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // ✅ TypeScript knows it's an Error
    console.log(error.stack);   // ✅ also available
  } else {
    console.log("Unknown error:", error);
  }
}
```

`instanceof Error` is the standard narrowing check. After it succeeds, TypeScript knows `error` is an `Error` instance with `.message`, `.name`, and `.stack`.

---

## Rule 2 — Create Custom Error Classes

For structured error handling across a codebase, extend the built-in `Error` class:

```ts
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";

    // Required in TypeScript when extending built-in classes:
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
```

> **Important:** Always call `Object.setPrototypeOf(this, SubClass.prototype)` after `super()` when extending built-in classes in TypeScript. Without it, `instanceof` checks can fail in some environments.

### Using custom errors

```ts
try {
  const user = await getUser(id);
  if (!user) throw new NotFoundError("User");

} catch (error) {
  if (error instanceof NotFoundError) {
    res.status(404).json({ error: error.message, code: error.code });

  } else if (error instanceof ValidationError) {
    res.status(400).json({ error: error.message, field: error.field });

  } else if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });

  } else if (error instanceof Error) {
    res.status(500).json({ error: "Internal server error" });

  } else {
    res.status(500).json({ error: "Unknown error occurred" });
  }
}
```

---

## Rule 3 — Write a Type Guard for Errors

Repeating `instanceof Error` checks everywhere gets verbose. A reusable type guard cleans this up:

```ts
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred";
}
```

Now your catch blocks become clean and consistent:

```ts
try {
  await processOrder(orderId);
} catch (error) {
  logger.error(getErrorMessage(error));
}
```

---

## Rule 4 — Never Swallow Errors Silently

This is the number one bad pattern in error handling:

```ts
// ❌ Never do this
try {
  doSomething();
} catch {
  // silently ignore
}
```

If an error happens here, you'll never know. The system will behave incorrectly and you'll have no idea why. At a minimum, always log:

```ts
// ✅ Minimum acceptable
try {
  doSomething();
} catch (error) {
  console.error("doSomething failed:", getErrorMessage(error));
}
```

---

## Rule 5 — Return Result Types Instead of Throwing (When Appropriate)

For expected failure cases, throwing exceptions is noisy. A functional alternative is returning a **Result type** that explicitly represents success or failure:

```ts
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function parseUser(json: string): Promise<Result<User>> {
  try {
    const raw = JSON.parse(json);
    const user = validateUser(raw); // may throw ValidationError
    return { success: true, data: user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Caller does not need try-catch:
const result = await parseUser(input);

if (result.success) {
  console.log(result.data.name); // ✅
} else {
  console.error(result.error.message); // ✅
}
```

Use Result types when:
- The failure is expected and part of normal control flow
- You want to force callers to handle both success and failure paths
- You want to avoid exception propagation across async boundaries

Use `throw` when:
- The error is truly unexpected or unrecoverable
- You are writing library code and want to propagate errors up a call stack
- The error should crash the current request/operation immediately

---

## Rule 6 — Handle Async Errors Correctly

Unhandled promise rejections are a common source of crashes in Node.js backend applications.

### With async/await — always wrap in try-catch

```ts
async function fetchUser(id: string): Promise<User> {
  try {
    const res = await fetch(`/api/users/${id}`);
    if (!res.ok) throw new AppError(`HTTP ${res.status}`, "HTTP_ERROR", res.status);
    return await res.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Network request failed", "NETWORK_ERROR");
  }
}
```

### With `.then().catch()` — always attach a `.catch()`

```ts
fetchUser("123")
  .then(user => console.log(user))
  .catch(error => console.error(getErrorMessage(error)));
```

### Global handler in Node.js (last resort)

```ts
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1); // always exit on unhandled rejection in production
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});
```

---

## All the Rules at a Glance

| Rule | Description |
|---|---|
| **1. Narrow `unknown`** | Always use `instanceof Error` or a type guard before accessing error properties |
| **2. Custom error classes** | Extend `Error` for structured, typed error categories |
| **3. Type guards** | Write `isError()` and `getErrorMessage()` helpers used consistently |
| **4. Never swallow** | Always log at minimum; never have an empty `catch` block |
| **5. Result types** | Return `{ success, data/error }` for expected failure paths |
| **6. Async handling** | Always wrap `await` in try-catch or attach `.catch()` |
| **7. `finally` for cleanup** | Close connections, release locks, release resources — always |
| **8. Re-throw when needed** | If you can't handle it, rethrow: `catch (e) { log(e); throw e; }` |

---

## Complete Real-World Example

```ts
class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, "DB_ERROR", 500);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

async function createUser(data: CreateUserDTO): Promise<User> {
  try {
    const existing = await db.users.findByEmail(data.email);
    if (existing) {
      throw new ValidationError("Email already registered", "email");
    }

    const user = await db.users.create(data);
    return user;

  } catch (error) {
    // Re-throw errors we already typed
    if (error instanceof AppError) throw error;

    // Wrap unknown DB/driver errors
    if (error instanceof Error) {
      throw new DatabaseError(`User creation failed: ${error.message}`);
    }

    throw new DatabaseError("User creation failed: unknown reason");

  } finally {
    // e.g. release DB connection back to pool
    db.release();
  }
}
```

Error handling isn't glamorous, but it's the difference between a system that crashes silently and one that fails gracefully, logs everything useful, and keeps running.
