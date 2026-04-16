---
title: "Express.js Installation & Setup"
date: "2026-04-16"
tags: ["expressjs", "nodejs", "setup", "installation", "project-structure"]
excerpt: "Step-by-step guide to setting up an Express.js project — installation, project structure, essential middleware, environment configuration, and your first API."
---

# Express.js Installation & Setup

## What is it?

Setting up an Express.js project involves initializing a Node.js project, installing Express and essential middleware, organizing your code, and configuring the development environment for productivity.

## How to Set Up

### 1. Project Initialization

```bash
# Create project directory
mkdir my-api && cd my-api

# Initialize Node.js project
npm init -y

# Install Express and essential packages
npm install express dotenv cors helmet morgan

# Install development dependencies
npm install -D nodemon

# Install for later (as needed)
npm install mongoose        # MongoDB ODM
npm install bcryptjs jsonwebtoken  # Authentication
npm install joi             # Validation
npm install express-rate-limit     # Rate limiting
```

### 2. Update package.json Scripts

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  }
}
```

### 3. Environment Configuration

```bash
# .env
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173
```

```bash
# .env.example (commit this to Git)
PORT=3000
NODE_ENV=development
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRES_IN=24h
CORS_ORIGIN=
```

```bash
# .gitignore
node_modules/
.env
.env.local
*.log
```

### 4. Basic Server Setup

```javascript
// src/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// ─── Middleware ─────────────────────────────────
app.use(helmet());                        // Security headers
app.use(cors());                          // Enable CORS
app.use(morgan("dev"));                   // HTTP request logger
app.use(express.json());                  // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── Routes ────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ message: "API is running", version: "1.0.0" });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// ─── Error Handling ────────────────────────────
// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ─── Start Server ──────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
```

### 5. Recommended Project Structure

```
my-api/
├── src/
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   └── env.js             # Environment config
│   ├── controllers/
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification
│   │   ├── errorHandler.js
│   │   └── validate.js        # Validation middleware
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   ├── authService.js
│   │   └── userService.js
│   ├── utils/
│   │   ├── AppError.js        # Custom error class
│   │   └── logger.js
│   └── server.js              # Entry point
├── .env
├── .env.example
├── .gitignore
├── package.json
└── package-lock.json
```

### 6. Organized Route Setup

```javascript
// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");

router.get("/", authenticate, authorize("admin"), userController.getAllUsers);
router.get("/:id", authenticate, userController.getUser);
router.post("/", userController.createUser);
router.put("/:id", authenticate, userController.updateUser);
router.delete("/:id", authenticate, authorize("admin"), userController.deleteUser);

module.exports = router;
```

```javascript
// src/routes/index.js
const express = require("express");
const router = express.Router();

const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

module.exports = router;
```

```javascript
// src/server.js (updated)
const routes = require("./routes");
app.use("/api/v1", routes);
// All routes now have /api/v1 prefix
// GET /api/v1/users
// POST /api/v1/auth/login
```

### 7. Custom Error Class

```javascript
// src/utils/AppError.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
```

```javascript
// src/middleware/errorHandler.js
const AppError = require("../utils/AppError");

function errorHandler(err, req, res, next) {
  let error = { ...err };
  error.message = err.message;

  // Log for debugging
  if (process.env.NODE_ENV === "development") {
    console.error(err);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    error = new AppError("Resource not found", 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error = new AppError("Duplicate field value", 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = new AppError(messages.join(", "), 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    error = new AppError("Invalid token", 401);
  }
  if (err.name === "TokenExpiredError") {
    error = new AppError("Token expired", 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
```

### 8. Async Handler Utility

```javascript
// src/utils/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
```

```javascript
// Usage in controllers
const asyncHandler = require("../utils/asyncHandler");

exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  res.json({ success: true, data: user });
});
```

## Why This Setup Matters

| Practice | Benefit |
|----------|---------|
| **Organized structure** | Separation of concerns — easy to find and modify code |
| **Environment variables** | No hardcoded secrets — safe to share code |
| **Centralized error handling** | Consistent error responses across all routes |
| **asyncHandler** | No try/catch boilerplate in every controller |
| **Helmet + CORS** | Security from day one |
| **Morgan** | Request logging for debugging |
| **Nodemon** | Auto-restart on file changes — faster development |

> **Interview Question:** _"How do you structure an Express.js application?"_
>
> I follow a **layered architecture**: `Routes → Controllers → Services → Models`. Routes map URLs to controllers. Controllers handle HTTP concerns (request/response). Services contain business logic. Models define data schemas. Middleware handles cross-cutting concerns (auth, validation, error handling). This separation keeps code maintainable and testable.

-> Next: [Express.js Routing](/post/languages/expressjs-routing)
