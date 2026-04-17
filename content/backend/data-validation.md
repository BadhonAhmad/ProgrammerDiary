---
title: "Data Validation: The First Line of Defense Against Bad Data"
date: "2026-04-17"
tags: ["backend", "validation", "data", "security", "Node.js", "Express", "Zod"]
excerpt: "Learn why validating data at every boundary — API input, database writes, external services — prevents bugs, security holes, and silent data corruption."
---

# Data Validation: The First Line of Defense Against Bad Data

Your API accepts `age: -5`, `email: "not an email"`, and `role: "superadmin"`. The database stores all of it. Weeks later, your analytics report shows users with negative ages. Your authorization system trusts the `role` field. This is why validation exists.

## What is Data Validation?

**Data validation** is verifying that data meets expected rules before your application processes it. This includes checking types, formats, ranges, required fields, and business logic constraints.

Validation answers: *"Is this data what I expect it to be — before I do anything with it?"*

```text
Input:  { email: "hello", age: -5, name: "" }

Validation rules:
  email: required, valid email format         ❌ "hello" is not an email
  age:   required, integer, min 0, max 150    ❌ -5 is below minimum
  name:  required, 2-100 characters           ❌ "" is empty

Result: Reject with specific error messages
```

## Why Does It Matter?

❌ **Problem:** Imagine a restaurant where the kitchen accepts any order without checking. A customer orders "negative 3 pizzas" and pays with "a picture of a cat." The kitchen tries to make -3 pizzas and charge a JPEG. Chaos.

In software, invalid data causes:
- **Database errors** — inserting a string where a number is expected crashes the query
- **Silent bugs** — negative ages don't crash but corrupt analytics
- **Security holes** — accepting `role: "admin"` in a signup form escalates privileges
- **Downstream failures** — one service sends bad data, three others break

✅ **Solution:** Validate data at every entry point to your system. Reject invalid input early, with clear error messages, before it reaches your business logic or database.

## Where to Validate

```text
┌─────────────────────────────────────────────────────────┐
│                     Your Application                     │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐ │
│  │ API     │  │ Business │  │ Database│  │ External  │ │
│  │ Input   │→ │ Logic    │→ │ Write   │→ │ Service   │ │
│  │         │  │          │  │         │  │ Response  │ │
│  │ VALIDATE│  │ VALIDATE │  │ VALIDATE│  │ VALIDATE  │ │
│  └─────────┘  └──────────┘  └─────────┘  └───────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

Validate at **every boundary** where data enters your system:
1. **API input** — user-submitted data
2. **Database writes** — protect data integrity
3. **External service responses** — don't trust third-party data
4. **Internal service communication** — catch issues between microservices

## Types of Validation

### Format Validation

Checks if data matches an expected pattern.

```text
email:     matches email regex
phone:     matches phone format
URL:       valid URL structure
date:      valid ISO 8601 date
username:  alphanumeric, 3-30 chars
```

### Type Validation

Checks if data is the correct type.

```text
age:       number (not string "25")
active:    boolean (not string "true")
tags:      array (not object)
quantity:  integer (not float 3.5)
```

### Range Validation

Checks if numeric values fall within acceptable bounds.

```text
age:       0-150
quantity:  1-999
rating:    1-5
price:     > 0
```

### Business Logic Validation

Checks if data makes sense in the context of your application.

```text
endDate > startDate
discount <= originalPrice
orderItems.length > 0
availableSeats >= requestedSeats
```

### Cross-Field Validation

Checks relationships between multiple fields.

```text
if type === "credit_card":
  cardNumber is required
  expiryDate is required
  cvv is required

if shippingMethod === "express":
  address.zipCode is required
```

## Implementing Validation

### With Zod (Recommended)

Zod is a TypeScript-first validation library with static type inference.

```text
npm install zod
```

```text
const { z } = require("zod");

// Define schema
const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(["user", "editor"]).default("user"),
  password: z.string().min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Must contain uppercase, lowercase, and number"),
});

// Validate
app.post("/api/users", (req, res) => {
  const result = createUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      errors: result.error.flatten().fieldErrors,
    });
  }

  // result.data is typed and validated
  const user = createUser(result.data);
  res.status(201).json(user);
});
```

Zod automatically generates TypeScript types from schemas:

```text
type CreateUser = z.infer<typeof createUserSchema>;
// { name: string; email: string; age?: number; role: "user" | "editor"; password: string }
```

### With express-validator

The traditional Express validation middleware.

```text
npm install express-validator
```

```text
const { body, validationResult } = require("express-validator");

app.post("/api/users",
  body("email").isEmail().normalizeEmail(),
  body("name").trim().isLength({ min: 2, max: 100 }),
  body("age").optional().isInt({ min: 0, max: 150 }),
  body("password").isStrongPassword({
    minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1,
  }),

  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Validated data available in req.body
  }
);
```

### With Joi

Another popular validation library, predating Zod.

```text
const Joi = require("joi");

const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  age: Joi.number().integer().min(0).max(150),
});

const { error, value } = userSchema.validate(req.body);
if (error) {
  return res.status(400).json({ error: error.details[0].message });
}
```

## Validation Library Comparison

| Feature | Zod | express-validator | Joi |
|---|---|---|---|
| **TypeScript inference** | ✅ Automatic | ❌ Manual | ❌ Manual |
| **Framework** | Agnostic | Express only | Agnostic |
| **Error messages** | Structured | Array of errors | Detailed |
| **Async validation** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Bundle size** | Small | Medium | Larger |
| **Learning curve** | Low | Low | Medium |
| **Best for** | New TS projects | Express APIs | Legacy JS projects |

## Validation at the Database Level

Application validation can be bypassed (direct database access, another service). The database is the last line of defense.

```text
-- PostgreSQL constraints
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  age INTEGER CHECK (age >= 0 AND age <= 150),
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- The CHECK constraint rejects:
-- INSERT INTO users (name, email, age) VALUES ('Bob', 'bob@x.com', -5);
-- ERROR: new row for relation "users" violates check constraint "users_age_check"
```

```text
// Prisma schema validation
model User {
  id    Int     @id @default(autoincrement())
  name  String  @db.VarChar(100)
  email String  @unique @db.VarChar(255)
  age   Int?
  role  Role    @default(USER)

  @@validate(age == null || (age >= 0 && age <= 150))
}
```

## Validation Anti-Patterns

### ❌ Validating Only on the Frontend

Frontend validation improves UX but is trivially bypassed. A single `curl` command skips your React form entirely.

```text
// Bypasses frontend validation
curl -X POST http://api.myapp.com/users \
  -d '{"email":"not-an-email","age":-999}'
```

### ❌ Overly Generic Error Messages

```text
// Bad — user can't fix the problem
{ "error": "Invalid input" }

// Good — specific and actionable
{ "errors": {
    "email": "Must be a valid email address",
    "age": "Must be between 0 and 150"
  }
}
```

### ❌ Trusting Internal Data

Data that was valid yesterday might be invalid today (schema changes, migrations). Validate at the boundary, even for internal calls.

### ❌ Stripping Instead of Rejecting

```text
// Dangerous — silently modifies data
const clean = input.replace(/<[^>]*>/g, "");  // Strips HTML silently

// Better — reject and explain
if (/<[^>]*>/.test(input)) {
  return res.status(400).json({ error: "HTML tags not allowed" });
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Data validation** | Verify data meets rules before processing |
| **Format validation** | Email, URL, date, regex patterns |
| **Type validation** | Number vs string vs boolean |
| **Range validation** | Min/max bounds on values |
| **Business logic** | Cross-field rules, context-aware checks |
| **Zod** | TypeScript-first validation with type inference |
| **express-validator** | Express middleware for request validation |
| **Database constraints** | Last line of defense — CHECK, NOT NULL, UNIQUE |
| **Validate at boundaries** | Every entry point: API, DB, external services |
| **Frontend validation** | UX only — backend is the real enforcement |

**Invalid data doesn't just cause bugs — it erodes trust in your entire system. Validate early, validate often, validate at every boundary.**
