---
title: "Schema Validation: Enforce the Shape of Your Data"
date: "2026-04-17"
tags: ["backend", "schema", "validation", "Zod", "JSON-Schema", "API", "TypeScript"]
excerpt: "Learn how schema validation defines and enforces the exact shape of your data — from API requests to database writes — catching errors before they become bugs."
---

# Schema Validation: Enforce the Shape of Your Data

You deploy a new feature. The frontend sends `firstName` but your code expects `first_name`. No error. Just `undefined` everywhere. The user profile shows blank. No crash. No log. Just silent failure. Schema validation prevents this.

## What is Schema Validation?

**Schema validation** is defining a **blueprint** (schema) for what your data should look like, then validating all data against that blueprint. A schema specifies:

- Which fields exist
- What types they are
- Which are required vs optional
- What values are allowed
- How fields relate to each other

```text
// Schema definition
UserSchema = {
  id:       number, required
  name:     string, 2-100 chars, required
  email:    string, valid email format, required
  age:      number, 0-150, optional
  role:     enum ["user", "admin"], default "user"
}

// Valid data ✅
{ id: 1, name: "Alice", email: "alice@dev.io" }

// Invalid data ❌
{ id: "one", name: "", email: "not-an-email", role: "superuser" }
```

Think of it like a contract. The schema says *"data will look like this."* If incoming data doesn't match, the contract is violated and you reject it.

## Why Does It Matter?

❌ **Problem:** Your API accepts any JSON. A mobile app sends `{ "name": 42 }` instead of `{ "name": "Alice" }`. Your code does `name.charAt(0)` — crashes with "charAt is not a function." The error message is useless. The user sees "Internal Server Error." You spend 30 minutes debugging what should have been caught at the API boundary.

Or: an external API changes its response format silently. Your code reads `response.data.items` but it's now `response.data.results`. Everything returns empty arrays. No error. Silent data loss.

✅ **Solution:** Schema validation catches type mismatches, missing fields, and structural changes immediately — with clear error messages that tell you exactly what's wrong and where.

## Schema Validation vs Input Validation

These overlap but serve different purposes:

| Aspect | Input Validation | Schema Validation |
|---|---|---|
| **Focus** | Individual field values | Overall data structure |
| **Questions** | "Is this email valid?" | "Does this object have the right shape?" |
| **Scope** | Single fields | Entire objects and nested structures |
| **When used** | Form inputs, query params | API bodies, config, external responses |
| **Example** | `email.isEmail()` | `userSchema.parse(data)` |

In practice, schema validation **includes** input validation. A good schema defines both structure and field-level rules.

## Defining Schemas with Zod

Zod is the leading schema validation library for TypeScript/JavaScript.

### Basic Schemas

```text
const { z } = require("zod");

// Primitive schemas
const stringSchema = z.string();
const numberSchema = z.number();
const booleanSchema = z.boolean();
const dateSchema = z.date();

// With constraints
const email = z.string().email();
const age = z.number().int().min(0).max(150);
const name = z.string().min(2).max(100);
const password = z.string().min(8);
```

### Object Schemas

```text
const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(["user", "editor", "admin"]).default("user"),
  tags: z.array(z.string()).default([]),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().regex(/^\d{5}$/),
    country: z.string().length(2),  // ISO country code
  }).optional(),
});

// TypeScript type from schema — single source of truth
type User = z.infer<typeof UserSchema>;
```

### Validation Methods

```text
// Parse — throws on invalid
const user = UserSchema.parse(data);
// ZodError if invalid

// Safe parse — returns result object
const result = UserSchema.safeParse(data);
if (result.success) {
  console.log(result.data);   // Validated data
} else {
  console.log(result.error);  // Detailed error info
}

// Partial — make all fields optional (for PATCH requests)
const PartialUserSchema = UserSchema.partial();

// Pick — select specific fields
const LoginSchema = UserSchema.pick({ email: true, password: true });

// Omit — exclude specific fields
const PublicUserSchema = UserSchema.omit({ id: true, role: true });

// Extend — add fields to existing schema
const CreateUserSchema = UserSchema.extend({
  password: z.string().min(8),
}).omit({ id: true });
```

### Nested and Recursive Schemas

```text
// Nested objects
const CommentSchema = z.object({
  id: z.number(),
  text: z.string().min(1),
  author: z.object({
    id: z.number(),
    name: z.string(),
  }),
  replies: z.lazy(() => z.array(CommentSchema)).default([]),
});
```

### Transformations in Schemas

Schemas can transform data during validation:

```text
const UserInputSchema = z.object({
  name: z.string().transform(n => n.trim()),
  email: z.string().email().transform(e => e.toLowerCase()),
  age: z.string().transform(a => parseInt(a)),  // String → Number
  dateOfBirth: z.string().transform(d => new Date(d)),
});

const input = { name: "  Alice  ", email: "ALICE@DEV.IO", age: "30", dateOfBirth: "1994-03-15" };
const result = UserInputSchema.parse(input);
// { name: "Alice", email: "alice@dev.io", age: 30, dateOfBirth: Date object }
```

### Refinements (Custom Validation)

```text
const SignupSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],  // Error attached to this field
});

const EventSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});
```

## Schema Validation in Express

### Middleware Pattern

```text
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;  // Replace with validated/transformed data
    next();
  };
}

// Usage
app.post("/api/users",
  validate(CreateUserSchema),
  async (req, res) => {
    // req.body is validated and properly typed
    const user = await createUser(req.body);
    res.status(201).json(user);
  }
);

app.patch("/api/users/:id",
  validate(PartialUserSchema),
  async (req, res) => {
    const user = await updateUser(req.params.id, req.body);
    res.json(user);
  }
);
```

### Validating Different Parts of the Request

```text
// Validate URL params
app.get("/api/users/:id",
  validate(z.object({ id: z.string().uuid() }), "params"),
  getUser
);

// Validate query string
app.get("/api/products",
  validate(z.object({
    page: z.string().transform(Number).default("1"),
    limit: z.string().transform(Number).default("20"),
    sort: z.enum(["price", "name", "date"]).default("date"),
  }), "query"),
  getProducts
);

// Validate response (ensure API contract)
app.get("/api/users/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  const validated = PublicUserSchema.parse(user);  // Validate output too
  res.json(validated);
});
```

## JSON Schema

An alternative approach — define schemas as plain JSON objects, language-agnostic.

```text
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "email"],
  "properties": {
    "name": { "type": "string", "minLength": 2, "maxLength": 100 },
    "email": { "type": "string", "format": "email" },
    "age": { "type": "integer", "minimum": 0, "maximum": 150 }
  },
  "additionalProperties": false
}
```

```text
const Ajv = require("ajv");
const ajv = new Ajv();

const validate = ajv.compile(schema);
const valid = validate(data);
if (!valid) console.log(validate.errors);
```

**When to use JSON Schema:**
- Language-agnostic APIs (shared between Python, Go, Java services)
- OpenAPI / Swagger specifications
- Config validation across different tools

**When to use Zod instead:**
- TypeScript projects (automatic type inference)
- Node.js backends
- When you want runtime + compile-time safety

## Schema Validation for External Data

Never trust data from external APIs. Validate it against your own schema.

```text
// External API might change its format
async function fetchGitHubUser(username) {
  const response = await fetch(`https://api.github.com/users/${username}`);
  const data = await response.json();

  // Validate — catches format changes immediately
  const GitHubUserSchema = z.object({
    login: z.string(),
    id: z.number(),
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    avatar_url: z.string().url(),
    public_repos: z.number(),
  });

  return GitHubUserSchema.parse(data);
}
```

## Schema Design Best Practices

### ✅ One Schema per Use Case

```text
// Different schemas for different operations
const CreateUserSchema = z.object({ /* name, email, password */ });
const UpdateUserSchema = CreateUserSchema.partial();  // All optional
const LoginSchema = z.object({ /* email, password */ });
const PublicUserSchema = z.object({ /* id, name, email */ });  // No password
```

### ✅ Reuse and Compose Schemas

```text
const EmailSchema = z.string().email().toLowerCase();
const PasswordSchema = z.string().min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/);

const SignupSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword);

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string(),  // Don't validate format on login
});
```

### ✅ Validate Output Too

Don't just validate input. Validate what your API returns to catch bugs:

```text
app.get("/api/users/:id", async (req, res) => {
  const user = await getUser(req.params.id);
  res.json(PublicUserSchema.parse(user));  // Guarantees response shape
});
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Schema validation** | Define and enforce the exact shape of data |
| **Zod** | TypeScript-first schema library with type inference |
| **`.parse()`** | Validate + throw on error |
| **`.safeParse()`** | Validate + return success/error object |
| **`.partial()`** | Make all fields optional (PATCH requests) |
| **`.pick()` / `.omit()`** | Select or exclude specific fields |
| **`.refine()`** | Custom cross-field validation logic |
| **`.transform()`** | Modify data during validation |
| **JSON Schema** | Language-agnostic schema format (OpenAPI, cross-service) |
| **Validate output** | Ensure API responses match the expected contract |

**A schema is a contract. Validate on the way in, validate on the way out, and never trust data that hasn't been checked.**
