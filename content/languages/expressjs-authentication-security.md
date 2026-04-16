---
title: "Express.js Authentication & Security"
date: "2026-04-16"
tags: ["expressjs", "authentication", "jwt", "security", "cors", "helmet"]
excerpt: "Implement authentication and security in Express.js — JWT tokens, bcrypt password hashing, CORS, Helmet, rate limiting, and production security practices."
---

# Express.js Authentication & Security

## What is it?

**Authentication** verifies who a user is (identity). **Security** protects your application from attacks. In Express.js, authentication is typically implemented with **JWT (JSON Web Tokens)** or **sessions**, while security involves middleware like Helmet, CORS, rate limiting, and input validation.

## How it Works

### Complete Authentication System with JWT

#### 1. User Model

```javascript
// src/models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    refreshToken: String,
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
  );
};

// Generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
  );
};

module.exports = mongoose.model("User", userSchema);
```

#### 2. Auth Controller

```javascript
// src/controllers/authController.js
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already registered", 409));
  }

  // Create user (password auto-hashed by model pre-save hook)
  const user = await User.create({ name, email, password });

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token to database
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Set cookie options
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  res
    .status(201)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
      },
    });
});

// POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }

  // Find user (include password field since it's select: false)
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Compare passwords
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Generate tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  // Save refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json({
      success: true,
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        accessToken,
      },
    });
});

// POST /api/v1/auth/refresh
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    return next(new AppError("No refresh token provided", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return next(new AppError("Invalid refresh token", 401));
    }

    const accessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json({ success: true, data: { accessToken } });
  } catch {
    return next(new AppError("Invalid refresh token", 401));
  }
});

// POST /api/v1/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  // Clear refresh token from database
  await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

  res
    .clearCookie("refreshToken")
    .json({ success: true, message: "Logged out successfully" });
});

// GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user });
});
```

#### 3. Auth Middleware

```javascript
// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

// Verify JWT token
exports.authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Check Authorization header
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError("User no longer exists", 401));
    }

    req.user = user;
    next();
  } catch (error) {
    return next(new AppError("Invalid or expired token", 401));
  }
});

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized for this action`, 403)
      );
    }
    next();
  };
};
```

#### 4. Auth Routes

```javascript
// src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
```

### Security Middleware Stack

```javascript
// src/server.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const app = express();

// 1. Security headers (Helmet)
app.use(helmet());

// 2. CORS — restrict to trusted origins
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: "Too many requests" },
});
app.use("/api/", limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
});
app.use("/api/v1/auth/login", authLimiter);
app.use("/api/v1/auth/register", authLimiter);

// 4. Body parsing with size limit
app.use(express.json({ limit: "10kb" }));

// 5. Data sanitization
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss());            // Clean XSS from input
app.use(hpp());            // Prevent parameter pollution

// 6. Disable revealing Express version
app.disable("x-powered-by");
```

### Token Strategy: Access + Refresh Tokens

```
┌──────────────┐                         ┌──────────────┐
│   Client     │                         │   Server     │
│  (Frontend)  │                         │  (Backend)   │
└──────┬───────┘                         └──────┬───────┘
       │                                        │
       │  POST /auth/login                      │
       │  { email, password }                   │
       │───────────────────────────────────────►│
       │                                        │ Verify credentials
       │  { accessToken (15min),                │ Generate both tokens
       │    refreshToken (7d) in cookie }       │
       │◄───────────────────────────────────────│
       │                                        │
       │  GET /api/users (with accessToken)     │
       │  Authorization: Bearer <accessToken>   │
       │───────────────────────────────────────►│
       │                                        │ Verify access token
       │  { users }                             │
       │◄───────────────────────────────────────│
       │                                        │
       │  ... 15 minutes later ...              │
       │  Access token expired!                 │
       │                                        │
       │  POST /auth/refresh                    │
       │  (refreshToken sent via cookie)        │
       │───────────────────────────────────────►│
       │                                        │ Verify refresh token
       │  { new accessToken }                   │ Generate new access token
       │◄───────────────────────────────────────│
```

## Why Authentication & Security Matter

| Aspect | Importance |
|--------|-----------|
| **JWT Tokens** | Stateless auth — no server-side sessions needed, scales horizontally |
| **Refresh Tokens** | Short-lived access tokens + long-lived refresh = security + UX |
| **bcrypt** | Salted, slow hashing makes brute force attacks impractical |
| **Helmet** | Sets 15+ security headers with zero configuration |
| **CORS** | Prevents unauthorized cross-origin requests |
| **Rate Limiting** | Prevents brute force, DDoS, and abuse |
| **Input Sanitization** | Prevents injection attacks (SQL, NoSQL, XSS) |

> **Interview Question:** _"How does JWT authentication work?"_
>
> Client sends credentials (email/password) to `/login`. Server verifies and returns a JWT containing user claims (id, role) signed with a secret key. Client stores the token and sends it in the `Authorization: Bearer <token>` header with every request. Server verifies the signature and extracts user info. JWTs are **stateless** — no session storage needed. Trade-off: cannot easily revoke a token before expiry (mitigate with short expiry + refresh tokens).

> **Interview Question:** _"What is the difference between access tokens and refresh tokens?"_
>
> **Access token**: Short-lived (5-15 min), used for API requests in the Authorization header. If compromised, damage is limited. **Refresh token**: Long-lived (7-30 days), stored in an httpOnly cookie, used only to get new access tokens. Stored in the database so it can be revoked. This pattern provides security (short-lived access) + UX (user stays logged in).

-> Next: [Express.js File Upload & Static Files](/post/languages/expressjs-file-upload-and-static-files)
