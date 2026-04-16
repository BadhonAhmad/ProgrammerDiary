---
title: "Express.js Routing"
date: "2026-04-16"
tags: ["expressjs", "routing", "api", "rest"]
excerpt: "Master Express.js routing — route methods, path patterns, parameters, query strings, Router module, and best practices for organizing routes."
---

# Express.js Routing

## What is it?

**Routing** determines how an application responds to a client request to a particular **endpoint** (URL path + HTTP method). Each route can have one or more handler functions that execute when the route is matched.

A route definition has this structure:

```
app.METHOD(PATH, HANDLER)
 │    │      │      │
 │    │      │      └── Function(s) to execute
 │    │      └── URL pattern (string or regex)
 │    └── HTTP method (get, post, put, delete, etc.)
 └── Express app or Router instance
```

## How it Works

### Basic Route Methods

```javascript
const express = require("express");
const app = express();

// GET — Retrieve data
app.get("/users", (req, res) => {
  res.json({ users: [] });
});

// POST — Create new data
app.post("/users", (req, res) => {
  const user = req.body;
  res.status(201).json({ user });
});

// PUT — Replace entire resource
app.put("/users/:id", (req, res) => {
  res.json({ message: `User ${req.params.id} replaced` });
});

// PATCH — Partial update
app.patch("/users/:id", (req, res) => {
  res.json({ message: `User ${req.params.id} updated` });
});

// DELETE — Remove resource
app.delete("/users/:id", (req, res) => {
  res.status(204).send();
});

// app.all() — Matches ALL HTTP methods
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});
```

### Route Paths & Patterns

```javascript
// 1. Exact string match
app.get("/about", handler);

// 2. String patterns
app.get("/ab?cd", handler);     // acd, abcd (b is optional)
app.get("/ab+cd", handler);     // abcd, abbcd, abbbcd (one or more b)
app.get("/ab*cd", handler);     // abXYcd, abAnythingcd (anything between)
app.get("/ab(cd)?e", handler);  // abe, abcde (cd is optional group)

// 3. Regular expressions
app.get(/.*fly$/, handler);     // butterfly, dragonfly
app.get(/^\/users\/(\d+)$/, handler); // /users/123

// 4. Multiple handlers for one route
app.get(
  "/protected",
  authenticate,    // Middleware 1
  authorize("admin"), // Middleware 2
  (req, res) => {     // Final handler
    res.json({ data: "Secret admin data" });
  }
);
```

### Route Parameters

```javascript
// URL Parameters (req.params)
app.get("/users/:id", (req, res) => {
  console.log(req.params);    // { id: "42" }
  console.log(req.params.id); // "42"
  res.json({ userId: req.params.id });
});

// Multiple parameters
app.get("/posts/:postId/comments/:commentId", (req, res) => {
  const { postId, commentId } = req.params;
  res.json({ postId, commentId });
});

// Parameters with regex constraints
app.get("/users/:id(\\d+)", (req, res) => {
  // Only matches numeric IDs: /users/123 ✓  /users/abc ✗
  res.json({ userId: req.params.id });
});
```

### Query Parameters

```javascript
// GET /users?page=2&limit=10&sort=name&order=asc
app.get("/users", (req, res) => {
  const { page = 1, limit = 10, sort = "createdAt", order = "desc" } = req.query;

  console.log(req.query);
  // { page: "2", limit: "10", sort: "name", order: "asc" }

  // Note: query values are STRINGS — convert as needed
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);

  res.json({
    users: [],
    pagination: { page: pageNum, limit: limitNum },
  });
});

// GET /search?q=node&tags=javascript,backend
app.get("/search", (req, res) => {
  const query = req.query.q;
  const tags = req.query.tags?.split(",");
  res.json({ query, tags });
});
```

### The express.Router()

`Router` is a mini Express application used to **modularize routes** into separate files:

```javascript
// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();

// All these routes are relative to where the router is mounted
router.get("/", (req, res) => {
  res.json({ users: [] });
});

router.get("/:id", (req, res) => {
  res.json({ user: { id: req.params.id } });
});

router.post("/", (req, res) => {
  res.status(201).json({ user: req.body });
});

router.put("/:id", (req, res) => {
  res.json({ user: req.body, id: req.params.id });
});

router.delete("/:id", (req, res) => {
  res.status(204).send();
});

module.exports = router;
```

```javascript
// src/server.js
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");

app.use("/api/v1/users", userRoutes);     // Mount at /api/v1/users
app.use("/api/v1/auth", authRoutes);       // Mount at /api/v1/auth
app.use("/api/v1/posts", postRoutes);      // Mount at /api/v1/posts
```

### Router-Level Middleware

```javascript
const router = express.Router();

// Middleware specific to this router
router.use((req, res, next) => {
  console.log("Router-level middleware:", req.originalUrl);
  next();
});

// Auth middleware for specific routes
router.use("/:id", (req, res, next) => {
  console.log("User ID accessed:", req.params.id);
  next();
});

// Apply auth to all routes in this router
// router.use(authenticate);

// Or apply to specific routes
router.get("/profile", authenticate, (req, res) => {
  res.json(req.user);
});
```

### Route Chaining

```javascript
// app.route() — chain handlers for the same path
app
  .route("/users/:id")
  .get((req, res) => {
    res.json({ action: "get", id: req.params.id });
  })
  .put((req, res) => {
    res.json({ action: "update", id: req.params.id });
  })
  .delete((req, res) => {
    res.status(204).send();
  });

// router.route() — same for Router
router
  .route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
```

### Complete Routing Example

```javascript
// src/controllers/userController.js
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find().skip(skip).limit(limit).select("-password");
  const total = await User.countDocuments();

  res.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) return next(new AppError("User not found", 404));
  res.json({ success: true, data: user });
});

exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ success: true, data: user });
});

exports.updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-password");
  if (!user) return next(new AppError("User not found", 404));
  res.json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new AppError("User not found", 404));
  res.status(204).send();
});
```

## Why Routing Matters

| Concept | Explanation |
|---------|-------------|
| **RESTful Design** | Clean URLs with proper HTTP methods make APIs intuitive |
| **Modularity** | `express.Router()` keeps routes organized by feature |
| **Middleware Integration** | Routes can have route-specific middleware (auth, validation) |
| **Versioning** | Mount routers with `/api/v1/`, `/api/v2/` prefixes for API versioning |

### HTTP Methods Cheat Sheet

| Method | Purpose | Idempotent | Safe | Typical Status |
|--------|---------|-----------|------|---------------|
| GET | Read/Fetch | Yes | Yes | 200 OK |
| POST | Create new | No | No | 201 Created |
| PUT | Replace entire | Yes | No | 200 OK |
| PATCH | Partial update | No | No | 200 OK |
| DELETE | Remove | Yes | No | 204 No Content |

> **Interview Question:** _"What is the difference between `req.params` and `req.query`?"_
>
> `req.params` extracts values from the URL path defined with `:` placeholders: `/users/:id` → `req.params.id`. Used for identifying specific resources. `req.query` extracts values from the query string after `?`: `/users?page=2&limit=10` → `req.query.page`. Used for filtering, sorting, pagination. Params are part of the route definition; queries are optional and appended to any URL.

> **Interview Question:** _"What is `express.Router()` and why is it used?"_
>
> `express.Router()` creates a **modular, mountable route handler** — a mini Express app. It lets you organize routes into separate files by feature (users, posts, auth). Each router has its own middleware stack. You then mount routers on the main app with `app.use("/users", userRouter)`. Benefits: cleaner code, separation of concerns, reusable route modules, independent middleware per route group.

-> Next: [Express.js Middleware](/post/languages/expressjs-middleware)
