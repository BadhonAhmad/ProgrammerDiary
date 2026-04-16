---
title: "Node.js Callbacks, Promises & Async/Await"
date: "2026-04-16"
tags: ["nodejs", "async", "callbacks", "promises", "async-await"]
excerpt: "Master asynchronous programming in Node.js — from callbacks to promises to async/await, including error handling patterns and common pitfalls."
---

# Node.js Callbacks, Promises & Async/Await

## What is it?

**Asynchronous programming** is the backbone of Node.js. Since Node.js is single-threaded, it cannot afford to wait (block) for slow operations like file reads, database queries, or HTTP requests. Instead, it uses asynchronous patterns to continue executing other code while waiting for results.

Node.js supports three async patterns evolved over time:
1. **Callbacks** — The original pattern (Node.js 2009)
2. **Promises** — The modern pattern (ES6, 2015)
3. **Async/Await** — The syntactic sugar (ES8, 2017)

## How it Works

### 1. Callbacks

A **callback** is a function passed as an argument to another function, which is then invoked when the operation completes.

```javascript
// Basic callback
function greetUser(name, callback) {
  console.log(`Hello, ${name}!`);
  callback();
}

greetUser("Alice", () => {
  console.log("Callback executed after greeting");
});
```

#### Error-First Callback Pattern

Node.js convention: the first parameter of a callback is always reserved for an error (if any):

```javascript
const fs = require("fs");

// Error-first callback pattern
fs.readFile("data.txt", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return; // Always return early on error
  }
  console.log("File content:", data);
});
```

#### Callback Hell (Pyramid of Doom)

When you have multiple async operations that depend on each other:

```javascript
// ❌ CALLBACK HELL — Hard to read, hard to maintain
getUser(userId, (err, user) => {
  if (err) return handleError(err);

  getOrders(user.id, (err, orders) => {
    if (err) return handleError(err);

    getOrderDetails(orders[0].id, (err, details) => {
      if (err) return handleError(err);

      processPayment(details, (err, payment) => {
        if (err) return handleError(err);

        sendConfirmation(payment, (err, confirmation) => {
          if (err) return handleError(err);
          console.log("Done!", confirmation);
        });
      });
    });
  });
});
```

### 2. Promises

A **Promise** is an object representing the eventual completion (or failure) of an asynchronous operation. It has three states:

```
┌─────────────┐
│   Pending   │ ← Initial state
└──────┬──────┘
       │
    ┌──┴──┐
    │     │
┌───▼──┐ ┌▼────────┐
│Fulfilled│ │Rejected │
│(Resolved)│ │(Failed) │
└────────┘ └─────────┘
```

#### Creating Promises

```javascript
const myPromise = new Promise((resolve, reject) => {
  // Async operation here
  const success = true;

  if (success) {
    resolve({ id: 1, name: "Alice" }); // Data on success
  } else {
    reject(new Error("Something went wrong")); // Error on failure
  }
});
```

#### Consuming Promises

```javascript
// .then() for success, .catch() for errors
myPromise
  .then((data) => {
    console.log("Success:", data);
    return processUser(data); // Chain: return another promise
  })
  .then((processed) => {
    console.log("Processed:", processed);
  })
  .catch((error) => {
    console.error("Error:", error.message); // Catches ANY error in the chain
  })
  .finally(() => {
    console.log("Runs regardless of success/failure");
  });
```

#### Promise Chaining (Solving Callback Hell)

```javascript
// ✅ CLEAN — Promise chaining
getUser(userId)
  .then((user) => getOrders(user.id))
  .then((orders) => getOrderDetails(orders[0].id))
  .then((details) => processPayment(details))
  .then((payment) => sendConfirmation(payment))
  .then((confirmation) => console.log("Done!", confirmation))
  .catch((error) => console.error("Error:", error.message)); // ONE catch for ALL errors
```

#### Promise Utility Methods

```javascript
// Promise.all — Wait for ALL promises to resolve (fail-fast)
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
// If ANY promise rejects, the whole thing rejects

// Promise.allSettled — Wait for ALL, regardless of success/failure
const results = await Promise.allSettled([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);
results.forEach((result) => {
  if (result.status === "fulfilled") {
    console.log("Success:", result.value);
  } else {
    console.error("Failed:", result.reason);
  }
});

// Promise.race — Return the FIRST to settle (resolve OR reject)
const fastest = await Promise.race([
  fetchFromServer1(),
  fetchFromServer2(),
]);

// Promise.any — Return the FIRST to RESOLVE (ignores rejections)
const firstSuccess = await Promise.any([
  fetchFromServer1(),
  fetchFromServer2(),
  fetchFromServer3(),
]);
```

### 3. Async/Await

**Async/await** is syntactic sugar over Promises that makes async code look and behave like synchronous code:

```javascript
// async keyword makes a function return a Promise
async function getUserOrders(userId) {
  try {
    const user = await getUser(userId);         // Wait for result
    const orders = await getOrders(user.id);     // Then wait for this
    const details = await getOrderDetails(orders[0].id);
    return details;                              // Resolved value
  } catch (error) {
    console.error("Error:", error.message);      // Catches any error above
    throw error;                                 // Re-throw if needed
  }
}

// Usage
getUserOrders(1)
  .then((details) => console.log(details))
  .catch((error) => console.error(error));
```

#### Async/Await with Parallel Operations

```javascript
// ❌ Sequential — takes 6 seconds total (2s + 2s + 2s)
async function sequential() {
  const users = await fetchUsers();     // 2s
  const posts = await fetchPosts();     // 2s
  const comments = await fetchComments(); // 2s
  return { users, posts, comments };
}

// ✅ Parallel — takes 2 seconds total (all at once)
async function parallel() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(),
    fetchPosts(),
    fetchComments(),
  ]);
  return { users, posts, comments };
}
```

#### Top-Level Await (ES Modules only)

```javascript
// Only works in ES Modules (package.json → "type": "module")
const config = await loadConfig();
console.log("Config loaded:", config);
```

#### Async Iterator Pattern

```javascript
// Processing items sequentially
async function processUsers(userIds) {
  for (const id of userIds) {
    const user = await getUser(id);
    await sendEmail(user.email);
    console.log(`Email sent to ${user.name}`);
  }
}

// Processing items in parallel with limit
async function processInBatches(items, batchSize = 5) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map((item) => processItem(item)));
  }
}
```

### Error Handling Patterns

```javascript
// Pattern 1: try/catch
async function safeOperation() {
  try {
    const result = await riskyOperation();
    return result;
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null;
    }
    throw error;
  }
}

// Pattern 2: Wrapper function (no try/catch needed)
async function asyncHandler(fn) {
  try {
    return await fn();
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Usage in Express
app.get("/users/:id", asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
}));

// Pattern 3: Go-style error handling
async function goStyle() {
  const [userError, user] = await getUser(1)
    .then((data) => [null, data])
    .catch((err) => [err, null]);

  if (userError) {
    return { error: userError.message };
  }

  const [orderError, orders] = await getOrders(user.id)
    .then((data) => [null, data])
    .catch((err) => [err, null]);

  return { user, orders };
}
```

### Converting Callbacks to Promises

```javascript
const fs = require("fs");
const { promisify } = require("util");

// Method 1: Using util.promisify
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

async function readConfig() {
  const data = await readFile("config.json", "utf8");
  return JSON.parse(data);
}

// Method 2: Manual wrapping
function readFilePromise(path, encoding) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });
}

// Method 3: fs.promises API (built-in)
const fsPromises = require("fs").promises;

async function readConfig() {
  const data = await fsPromises.readFile("config.json", "utf8");
  return JSON.parse(data);
}
```

## Why Async Programming Matters

| Reason | Explanation |
|--------|-------------|
| **Performance** | Non-blocking async code lets a single thread handle thousands of concurrent operations |
| **Resource Efficiency** | No thread-per-connection overhead — minimal memory usage |
| **User Experience** | Responsive servers that don't freeze under load |
| **Scalability** | Handle more users with less hardware |

> **Interview Question:** _"What is the difference between callbacks, promises, and async/await?"_
>
> **Callbacks** are functions passed as arguments and called when an operation completes. They can lead to "callback hell" with deep nesting. **Promises** are objects representing future results with `.then()`/`.catch()` chaining — eliminates callback hell. **Async/await** is syntactic sugar over promises using `try`/`catch` — makes async code read like synchronous code. All three achieve the same thing; async/await is the most readable and is the modern standard.

> **Interview Question:** _"What is `Promise.all` and how does it differ from `Promise.allSettled`?"_
>
> `Promise.all` takes an array of promises and resolves when ALL resolve, or rejects immediately if ANY reject (fail-fast). Use it when all operations must succeed. `Promise.allSettled` waits for ALL promises regardless of outcome and returns an array of `{status, value/reason}` objects. Use it when you want to know the result of every promise, even failures.

> **Interview Question:** _"What happens if you forget `await` in an async function?"_
>
> You get a **Promise object** instead of the resolved value. This can cause subtle bugs: `const user = getUser(1)` gives you a Promise, not a user. Methods like `user.name` will be undefined. The operation still runs, but you can't use its result directly. Always use `await` (or `.then()`) to get the resolved value.

-> Next: [Node.js Streams & Buffers](/post/languages/nodejs-streams-and-buffers)
