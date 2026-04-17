---
title: "Data Transformation: Shape Data for Where It's Going"
date: "2026-04-17"
tags: ["backend", "data-transformation", "API", "ETL", "mapping", "Node.js"]
excerpt: "Learn why raw database data rarely matches what the frontend needs, and how to transform, map, and reshape data between layers without making a mess."
---

# Data Transformation: Shape Data for Where It's Going

Your database stores `created_at` as a timestamp, `price_cents` as an integer, and `is_active` as a boolean. Your frontend needs a formatted date string, dollars with currency symbol, and a status label. If you send raw database data to the client, you're coupling your internal schema to your API contract forever.

## What is Data Transformation?

**Data transformation** is converting data from one format, structure, or representation to another. It happens everywhere in a backend system — between database and API, between services, between external APIs and your domain model.

```text
Database row:
  { created_at: "2024-03-15T10:30:00Z", price_cents: 2999, is_active: true }

Transform to API response:
  { createdAt: "March 15, 2024", price: "$29.99", status: "Active" }

Transform for external API:
  { date: "03/15/2024", amount: 29.99, active: 1 }
```

Every layer of your application speaks a slightly different data dialect. Transformation is the translation between them.

## Why Does It Matter?

❌ **Problem:** Your database has columns like `fname`, `lname`, `dob`, `is_del`. Your API returns them exactly as-is. Now:
- Frontend developers must know your column naming conventions
- Renaming a database column breaks every client consuming your API
- Sensitive fields (`password_hash`, `internal_notes`) accidentally leak to the frontend
- The API shape is dictated by 3-year-old database decisions you can't change

✅ **Solution:** Transform data at every boundary. The database speaks its own language. The API speaks its own language. External services speak theirs. Each layer gets data in the shape it expects, and changes in one layer don't cascade into others.

## Where Transformation Happens

```text
┌───────────┐     ┌───────────────┐     ┌──────────┐     ┌───────────┐
│  External  │     │  API Layer    │     │ Business │     │ Database  │
│  Service   │────>│  (Transform)  │────>│  Logic   │────>│  (Store)  │
│  Response  │     │  Map to model │     │          │     │           │
└───────────┘     └───────────────┘     └──────────┘     └───────────┘

Transform at each boundary:
  External → Internal: Map third-party fields to your domain model
  API Input → Domain:  Map request body to business objects
  Domain → API Output: Map internal data to API response format
  Domain → Database:   Map objects to storage format
```

## Common Transformation Patterns

### 1. Field Renaming

Database naming conventions (snake_case) rarely match API conventions (camelCase).

```text
// Database returns snake_case
const dbUser = {
  id: 42,
  first_name: "Alice",
  created_at: "2024-03-15T10:30:00Z",
  is_active: true,
};

// Transform to camelCase for API
function toApiUser(dbUser) {
  return {
    id: dbUser.id,
    firstName: dbUser.first_name,
    createdAt: dbUser.created_at,
    isActive: dbUser.is_active,
  };
}
```

### 2. Field Selection (Projection)

Don't send everything. Pick only what the consumer needs.

```text
// ❌ Sending raw database data — includes password hash
app.get("/api/users/:id", async (req, res) => {
  const user = await db.user.findById(req.params.id);
  res.json(user);
  // Returns: { id, email, password_hash, internal_notes, ... }
});

// ✅ Select specific fields
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl,
  };
}

app.get("/api/users/:id", async (req, res) => {
  const user = await db.user.findById(req.params.id);
  res.json(toPublicUser(user));
});
```

### 3. Value Formatting

Convert raw values to display-friendly formats.

```text
function formatProduct(product) {
  return {
    ...product,
    price: `$${(product.priceCents / 100).toFixed(2)}`,
    createdAt: new Date(product.createdAt).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    }),
    status: product.isActive ? "Active" : "Inactive",
    tags: product.tags?.join(", ") || "No tags",
  };
}
```

### 4. Nesting and Flattening

Restructure data between flat (database-friendly) and nested (API-friendly) formats.

```text
// Flat (database / form data)
const flat = {
  userId: 42,
  userName: "Alice",
  userEmail: "alice@dev.io",
  orderId: 101,
  orderTotal: 99.99,
};

// Nested (API response)
function toNested(flat) {
  return {
    user: {
      id: flat.userId,
      name: flat.userName,
      email: flat.userEmail,
    },
    order: {
      id: flat.orderId,
      total: flat.orderTotal,
    },
  };
}
```

### 5. Type Coercion

Convert between types as data crosses boundaries.

```text
// Query params are always strings — coerce to proper types
app.get("/api/products", (req, res) => {
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: Math.min(parseInt(req.query.limit) || 20, 100),
    minPrice: parseFloat(req.query.minPrice) || 0,
    isActive: req.query.active === "true",
    tags: req.query.tags?.split(",") || [],
    sortBy: req.query.sortBy || "createdAt",
  };

  // filters now has proper types instead of all strings
});
```

### 6. Enrichment

Add computed or related data to the response.

```text
async function toProductResponse(product) {
  const reviewCount = await db.review.count({ productId: product.id });
  const averageRating = await db.review.avg({ productId: product.id }, "rating");
  const isInStock = product.stockCount > 0;

  return {
    ...product,
    reviewCount,
    averageRating: Math.round(averageRating * 10) / 10,
    isInStock,
    stockStatus: isInStock ? `${product.stockCount} in stock` : "Out of stock",
  };
}
```

## Transformation with Maps and Reduces

### Mapping Collections

```text
// Transform each item in a list
const publicUsers = dbUsers.map(toPublicUser);

// With filtering
const activeProducts = dbProducts
  .filter(p => p.isActive)
  .map(toProductResponse);
```

### Grouping and Aggregating

```text
// Group orders by status
const ordersByStatus = orders.reduce((groups, order) => {
  const status = order.status;
  groups[status] = groups[status] || [];
  groups[status].push(toOrderSummary(order));
  return groups;
}, {});

// Result:
// { pending: [...], shipped: [...], delivered: [...] }
```

### Pivot / Reshape

```text
// Array of { date, category, revenue } → { date, electronics, clothing, food }
function pivotByCategory(rows) {
  const byDate = {};

  rows.forEach(({ date, category, revenue }) => {
    byDate[date] = byDate[date] || { date };
    byDate[date][category] = revenue;
  });

  return Object.values(byDate);
}
```

## API Response Patterns

### Consistent Response Envelope

```text
// Always wrap responses in a consistent structure
function apiResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

function apiError(error, statusCode = 400) {
  return {
    success: false,
    error: {
      message: error.message,
      code: error.code,
    },
  };
}

// Usage
app.get("/api/users/:id", async (req, res) => {
  const user = await db.user.findById(req.params.id);
  res.json(apiResponse(toPublicUser(user)));
});
```

### Pagination Metadata

```text
function paginatedResponse(data, page, limit, total) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}
```

## Transformation Anti-Patterns

### ❌ Mutating Input Data

```text
// Dangerous — mutates the original object
function transform(user) {
  user.name = user.firstName + " " + user.lastName;
  delete user.passwordHash;
  return user;
}

// Safe — creates a new object
function transform(user) {
  const { passwordHash, firstName, lastName, ...rest } = user;
  return { ...rest, name: `${firstName} ${lastName}` };
}
```

### ❌ Transforming in Multiple Places

If 5 different routes each manually build the user response, you get 5 different response shapes. Centralize transformations.

```text
// ✅ One transformer, used everywhere
const UserTransformer = {
  toPublic(user) { /* ... */ },
  toProfile(user) { /* ... */ },
  toAdmin(user) { /* ... */ },
};

// Used consistently
app.get("/api/users/:id", (req, res) => {
  res.json(UserTransformer.toPublic(user));
});

app.get("/api/admin/users/:id", (req, res) => {
  res.json(UserTransformer.toAdmin(user));
});
```

### ❌ Over-Transforming

Don't create 15 transformation functions for slightly different views. Find the common shapes and reuse them.

### ❌ Transforming in the Database Query

Keep SQL queries focused on fetching data. Transform in the application layer.

```text
// ❌ Formatting in SQL — mixes concerns
SELECT CONCAT(first_name, ' ', last_name) AS name,
       FORMAT(created_at, 'yyyy-MM-dd') AS date
FROM users;

// ✅ Fetch raw, transform in code
SELECT first_name, last_name, created_at FROM users;
// Then format in JavaScript
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Data transformation** | Convert data between formats at system boundaries |
| **Field renaming** | snake_case (DB) → camelCase (API) |
| **Projection** | Select only the fields the consumer needs |
| **Formatting** | Cents → dollars, timestamps → readable dates |
| **Nesting/flattening** | Restructure between flat and hierarchical shapes |
| **Type coercion** | Query string → number, boolean, array |
| **Enrichment** | Add computed or related data to responses |
| **Transformer pattern** | Centralized transformation functions per model |
| **Immutable transforms** | Create new objects — never mutate input |
| **Consistent envelope** | Same response structure across all endpoints |

**Your database shape is your business. Your API shape is your contract. Transform between them so both can evolve independently.**
