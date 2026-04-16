---
title: "Node.js Security Best Practices"
date: "2026-04-16"
tags: ["nodejs", "security", "helmet", "jwt", "cors", "validation"]
excerpt: "Essential security practices for Node.js applications — input validation, authentication, CORS, rate limiting, security headers, and preventing common attacks."
---

# Node.js Security Best Practices

## What is it?

**Security in Node.js** involves protecting your application from malicious attacks, data breaches, and unauthorized access. Since Node.js runs on the server with full system access, a single vulnerability can compromise your entire infrastructure.

## How it Works

### 1. Input Validation & Sanitization

**Never trust user input.** Validate and sanitize everything.

```javascript
// Using Joi for validation
const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  age: Joi.number().integer().min(0).max(150),
});

// Middleware to validate
function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }
    req.body = value; // Use sanitized value
    next();
  };
}

app.post("/users", validate(userSchema), (req, res) => {
  // req.body is validated and sanitized
  createUser(req.body);
});
```

### 2. Preventing SQL/NoSQL Injection

```javascript
// ❌ VULNERABLE — SQL Injection
app.get("/users", (req, res) => {
  const query = `SELECT * FROM users WHERE name = '${req.query.name}'`;
  db.query(query); // Attacker: name='; DROP TABLE users; --
});

// ✅ SAFE — Parameterized queries
app.get("/users", (req, res) => {
  const query = "SELECT * FROM users WHERE name = ?";
  db.query(query, [req.query.name]);
});

// ❌ VULNERABLE — NoSQL Injection (MongoDB)
app.get("/users", (req, res) => {
  User.find({ email: req.query.email }); // email[$ne]=null returns all users
});

// ✅ SAFE — Validate and cast input
app.get("/users", (req, res) => {
  const email = String(req.query.email);
  User.find({ email: email });
});

// ✅ Use mongoose schemas with type enforcement
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, match: /.+@.+\..+/ },
});
```

### 3. Password Hashing

**Never store plain text passwords.** Always hash with bcrypt.

```javascript
const bcrypt = require("bcryptjs");
const SALT_ROUNDS = 12;

// Hashing a password
async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hash = await bcrypt.hash(plainPassword, salt);
  return hash;
}

// Verifying a password
async function verifyPassword(plainPassword, hashedPassword) {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
  return isMatch;
}

// Registration
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ error: "Email already registered" });
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ name, email, password: hashedPassword });

  res.status(201).json({ id: user.id, name: user.name, email: user.email });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = generateToken(user);
  res.json({ token });
});
```

### 4. JSON Web Tokens (JWT)

```javascript
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET; // Store in .env!
const JWT_EXPIRES_IN = "24h";

// Generate token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify token middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Role-based authorization
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Usage
app.get("/admin/users", authenticate, authorize("admin"), (req, res) => {
  // Only admins can access this route
});
```

### 5. Security Headers with Helmet

```javascript
const helmet = require("helmet");

// Apply all security headers
app.use(helmet());

// Or configure individually
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// What Helmet sets:
// X-Content-Type-Options: nosniff          — Prevents MIME type sniffing
// X-Frame-Options: DENY                     — Prevents clickjacking
// X-XSS-Protection: 0                       — Disables buggy XSS filter
// Strict-Transport-Security                  — Forces HTTPS
// Content-Security-Policy                    — Controls resource loading
// Referrer-Policy                            — Controls referrer info
```

### 6. CORS (Cross-Origin Resource Sharing)

```javascript
const cors = require("cors");

// Allow specific origins
app.use(
  cors({
    origin: ["https://myapp.com", "https://admin.myapp.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400, // Cache preflight for 24 hours
  })
);
```

### 7. Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: { error: "Too many requests, please try again later" },
});

app.use(limiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 login attempts per 15 minutes
  message: { error: "Too many login attempts" },
});

app.post("/login", authLimiter, loginHandler);
app.post("/register", authLimiter, registerHandler);
```

### 8. Environment Variables — Keep Secrets Secret

```javascript
// ❌ NEVER do this
const dbPassword = "my-password-123";
const jwtSecret = "super-secret";

// ✅ Always use environment variables
const dbPassword = process.env.DB_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;

// ❌ NEVER commit .env to Git
// Add to .gitignore:
// .env
// .env.local
// .env.production

// ✅ Use .env.example for documentation
// .env.example (committed to Git):
// PORT=3000
// DATABASE_URL=mongodb://localhost:27017/myapp
// JWT_SECRET=your-secret-here
// NODE_ENV=development
```

### 9. Preventing XSS (Cross-Site Scripting)

```javascript
// ❌ VULNERABLE — Rendering user input as HTML
res.send(`<h1>Welcome, ${req.query.name}</h1>`);
// Attacker: ?name=<script>alert('hacked')</script>

// ✅ SAFE — Escape HTML entities
const escapeHtml = (str) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

res.send(`<h1>Welcome, ${escapeHtml(req.query.name)}</h1>`);

// ✅ Use DOMPurify for rich text
const DOMPurify = require("isomorphic-dompurify");
const clean = DOMPurify.sanitize(req.body.content);

// ✅ Set Content-Security-Policy header (via Helmet)
// ✅ Use JSON API instead of rendering HTML with user data
```

### 10. Express Security Checklist

```javascript
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const app = express();

// 1. Set security headers
app.use(helmet());

// 2. Enable CORS with restrictions
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") }));

// 3. Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// 4. Body parsing with size limit
app.use(express.json({ limit: "10kb" }));

// 5. Sanitize NoSQL queries
app.use(mongoSanitize());

// 6. Clean XSS from input
app.use(xss());

// 7. Prevent HTTP Parameter Pollution
app.use(hpp());

// 8. Disable unnecessary headers
app.disable("x-powered-by");
app.disable("etag");
```

## Why Security Matters

| Attack | Prevention |
|--------|-----------|
| **SQL/NoSQL Injection** | Parameterized queries, input validation, mongoose schemas |
| **XSS** | Escape output, CSP headers, DOMPurify |
| **CSRF** | SameSite cookies, CSRF tokens |
| **Brute Force** | Rate limiting, account lockout |
| **Data Exposure** | Environment variables, no stack traces in production |
| **Man-in-the-Middle** | HTTPS, HSTS headers |
| **Broken Authentication** | bcrypt, JWT with short expiry, secure cookies |

> **Interview Question:** _"How do you secure a Node.js API?"_
>
> Key measures: (1) **Input validation** with Joi/Zod, (2) **Password hashing** with bcrypt, (3) **JWT authentication** with short-lived tokens and refresh tokens, (4) **Security headers** with Helmet, (5) **CORS** with whitelisted origins, (6) **Rate limiting** to prevent brute force, (7) **NoSQL/SQL injection prevention** with parameterized queries, (8) **Environment variables** for secrets, (9) **HTTPS** in production, (10) **Error handling** that doesn't leak stack traces.

> **Interview Question:** _"What is the difference between authentication and authorization?"_
>
> **Authentication** verifies WHO you are (login, JWT, session). **Authorization** verifies WHAT you can do (roles, permissions). Authentication happens first — you prove your identity. Then authorization checks if your identity has permission for the requested action. Example: All authenticated users can view their profile (authentication), but only admins can delete users (authorization).

-> Next: [What is Express.js?](/post/languages/what-is-expressjs)
