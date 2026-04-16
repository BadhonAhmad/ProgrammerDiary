---
title: "Express.js REST API"
date: "2026-04-16"
tags: ["expressjs", "rest", "api", "crud", "mongodb"]
excerpt: "Build a complete REST API with Express.js — CRUD operations, MongoDB integration, pagination, filtering, sorting, and API best practices."
---

# Express.js REST API

## What is it?

**REST (Representational State Transfer)** is an architectural style for designing networked applications. A **REST API** exposes resources through URLs, using standard HTTP methods to perform CRUD (Create, Read, Update, Delete) operations.

## How it Works

### REST API Design Principles

| Principle | Description |
|-----------|-------------|
| **Resource-based URLs** | URLs represent resources (nouns), not actions: `/users`, `/posts` |
| **HTTP Methods** | Use methods to describe the action: GET (read), POST (create), PUT (replace), PATCH (update), DELETE (remove) |
| **JSON** | Request and response bodies use JSON |
| **Stateless** | Each request contains all information needed — no server-side sessions |
| **Proper Status Codes** | 200 for success, 201 for created, 400 for bad request, 404 for not found |

### RESTful URL Design

```
GET    /api/v1/users           → List all users
GET    /api/v1/users/:id       → Get a specific user
POST   /api/v1/users           → Create a new user
PUT    /api/v1/users/:id       → Replace a user entirely
PATCH  /api/v1/users/:id       → Update a user partially
DELETE /api/v1/users/:id       → Delete a user

GET    /api/v1/users/:id/posts → Get all posts by a user
POST   /api/v1/users/:id/posts → Create a post for a user
```

### Complete REST API with MongoDB

#### Model

```javascript
// src/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Text index for search
postSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("Post", postSchema);
```

#### Controller

```javascript
// src/controllers/postController.js
const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// GET /api/v1/posts — Get all posts (with pagination, filtering, sorting)
exports.getPosts = asyncHandler(async (req, res) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ["page", "limit", "sort", "fields", "search"];
  excludedFields.forEach((f) => delete queryObj[f]);

  // Search
  let query = Post.find(queryObj);
  if (req.query.search) {
    query = query.find({ $text: { $search: req.query.search } });
  }

  // Sorting: ?sort=-createdAt,title (descending createdAt, ascending title)
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Field selection: ?fields=title,content,author
  if (req.query.fields) {
    const fields = req.query.fields.split(",").join(" ");
    query = query.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit).populate("author", "name email");

  const posts = await query;
  const total = await Post.countDocuments(queryObj);

  res.json({
    success: true,
    count: posts.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    data: posts,
  });
});

// GET /api/v1/posts/:id — Get single post
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id).populate("author", "name email");

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  res.json({ success: true, data: post });
});

// POST /api/v1/posts — Create post
exports.createPost = asyncHandler(async (req, res) => {
  req.body.author = req.user.id; // From auth middleware

  const post = await Post.create(req.body);

  res.status(201).json({ success: true, data: post });
});

// PUT /api/v1/posts/:id — Update post (full replacement)
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  // Check ownership
  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("Not authorized to update this post", 403));
  }

  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: post });
});

// DELETE /api/v1/posts/:id — Delete post
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new AppError("Post not found", 404));
  }

  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("Not authorized to delete this post", 403));
  }

  await post.deleteOne();

  res.status(204).send();
});
```

#### Routes

```javascript
// src/routes/postRoutes.js
const express = require("express");
const router = express.Router();
const postController = require("../controllers/postController");
const { authenticate } = require("../middleware/auth");

// Public routes
router.get("/", postController.getPosts);
router.get("/:id", postController.getPost);

// Protected routes (require authentication)
router.post("/", authenticate, postController.createPost);
router.put("/:id", authenticate, postController.updatePost);
router.delete("/:id", authenticate, postController.deletePost);

module.exports = router;
```

#### Mount Routes

```javascript
// src/server.js
const postRoutes = require("./routes/postRoutes");

app.use("/api/v1/posts", postRoutes);
```

### API Testing Examples

```bash
# Get all posts (with pagination)
curl http://localhost:3000/api/v1/posts?page=1&limit=10

# Search posts
curl http://localhost:3000/api/v1/posts?search=nodejs

# Sort by newest first
curl http://localhost:3000/api/v1/posts?sort=-createdAt

# Filter by status
curl http://localhost:3000/api/v1/posts?status=published

# Select specific fields
curl http://localhost:3000/api/v1/posts?fields=title,author,createdAt

# Get single post
curl http://localhost:3000/api/v1/posts/64f1a2b3c4d5e6f7a8b9c0d1

# Create post (authenticated)
curl -X POST http://localhost:3000/api/v1/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Post","content":"Hello World","tags":["nodejs"]}'

# Update post
curl -X PUT http://localhost:3000/api/v1/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","content":"Updated content"}'

# Delete post
curl -X DELETE http://localhost:3000/api/v1/posts/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### API Versioning Strategies

```javascript
// Strategy 1: URL-based (most common)
app.use("/api/v1/users", v1UserRoutes);
app.use("/api/v2/users", v2UserRoutes);

// Strategy 2: Header-based
app.use("/api/users", (req, res, next) => {
  const version = req.get("API-Version") || "v1";
  req.apiVersion = version;
  next();
});

// Strategy 3: Route-based versioning
const { version } = require("express-routes-versioning");
app.get(
  "/api/users",
  version({
    "1.0.0": getUsersV1,
    "2.0.0": getUsersV2,
  })
);
```

### Consistent Response Format

```javascript
// src/utils/response.js
class ApiResponse {
  static success(res, data, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  static paginated(res, data, page, limit, total) {
    return res.json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  }

  static error(res, message, statusCode = 500) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  static created(res, data) {
    return res.status(201).json({ success: true, data });
  }

  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ApiResponse;
```

## Why REST API Design Matters

| Principle | Why it Matters |
|-----------|---------------|
| **Consistent URLs** | Developers can predict endpoints without reading docs |
| **Proper HTTP methods** | Clear intent — GET is safe, DELETE is idempotent |
| **Status codes** | Clients handle responses correctly (retry on 5xx, cache 200) |
| **Pagination** | Prevents timeouts and memory issues on large datasets |
| **Versioning** | Change API without breaking existing clients |
| **Consistent response format** | Easy to parse and handle on the frontend |

> **Interview Question:** _"What is a REST API and what are its key principles?"_
>
> REST (Representational State Transfer) is an architectural style for APIs. Key principles: (1) **Resource-based URLs** — nouns not verbs (`/users` not `/getUsers`), (2) **HTTP methods** — GET/POST/PUT/PATCH/DELETE for CRUD, (3) **Stateless** — each request is independent, (4) **JSON** — standard data format, (5) **Proper status codes** — 200, 201, 400, 404, 500, etc., (6) **HATEOAS** (optional) — responses include links to related resources.

> **Interview Question:** _"How do you implement pagination in a REST API?"_
>
> Accept `page` and `limit` query parameters. Calculate `skip = (page - 1) * limit`. Use database skip/limit: `Model.find().skip(skip).limit(limit)`. Return metadata: total count, current page, total pages, and hasMore flag. Example: `GET /api/posts?page=2&limit=10` returns 10 posts from position 11-20 with pagination metadata.

-> Next: [Express.js Authentication & Security](/post/languages/expressjs-authentication-security)
