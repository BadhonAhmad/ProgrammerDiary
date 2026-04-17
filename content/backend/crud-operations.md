---
title: "CRUD Operations: The Four Things Every App Does with Data"
date: "2026-04-17"
tags: ["backend", "fundamentals", "CRUD", "API", "database"]
excerpt: "Every data-driven application boils down to four operations: Create, Read, Update, Delete. Learn how CRUD maps to HTTP methods, SQL, and real-world API design."
---

# CRUD Operations: The Four Things Every App Does with Data

Strip away the frameworks, the architecture patterns, the fancy tooling — and every data-driven application is doing the same four things over and over: creating data, reading it, updating it, and deleting it. These four operations are called **CRUD**, and they are the atomic unit of every backend system.

## What is CRUD?

**CRUD** stands for **Create, Read, Update, Delete** — the four basic operations you can perform on any piece of data in a system.

```text
Create → Add new data (a new user, a new post, a new order)
Read   → Retrieve existing data (view a profile, list products, search)
Update → Modify existing data (change a name, mark an order as shipped)
Delete → Remove data (delete a comment, cancel an account)
```

Think of a library. You can **add** a book to the shelf (Create). You can **browse** the catalog or **look up** a specific book (Read). You can **update** the book's location or condition (Update). You can **remove** a damaged book from the system (Delete). Every interaction with the library's data is one of these four operations.

## Why It Matters

### ❌ Problem: Inconsistent Data Operations

Without a consistent mental model, developers handle data operations haphazardly. One endpoint creates users by POSTing JSON. Another "deactivates" a user by PATCHing a flag instead of deleting. A third updates via PUT but returns different response formats. The API becomes unpredictable.

### ✅ Solution: CRUD as a Design Framework

CRUD gives you a consistent vocabulary. Every data entity in your system supports the same four operations, mapped to the same HTTP methods, returning predictable response formats. This consistency makes your API intuitive, your code maintainable, and your database queries systematic.

## How CRUD Maps to Everything

### CRUD ↔ HTTP Methods

| CRUD Operation | HTTP Method | Example Endpoint | What It Does |
|---------------|-------------|-----------------|--------------|
| **Create** | POST | `POST /users` | Create a new user |
| **Read** (all) | GET | `GET /users` | List all users |
| **Read** (one) | GET | `GET /users/123` | Get a specific user |
| **Update** (full) | PUT | `PUT /users/123` | Replace user 123 entirely |
| **Update** (partial) | PATCH | `PATCH /users/123` | Update specific fields of user 123 |
| **Delete** | DELETE | `DELETE /users/123` | Remove user 123 |

This mapping is the foundation of RESTful API design. When a client sends `POST /users`, the server knows the intent is to create. When it sends `DELETE /users/123`, the intent is to remove. The HTTP method carries the verb; the URL carries the noun.

### CRUD ↔ SQL

| CRUD Operation | SQL Statement | Example |
|---------------|--------------|---------|
| **Create** | INSERT | `INSERT INTO users (name, email) VALUES ('Nobel', 'nobel@example.com')` |
| **Read** | SELECT | `SELECT * FROM users WHERE id = 123` |
| **Update** | UPDATE | `UPDATE users SET name = 'Nobel Ahmad' WHERE id = 123` |
| **Delete** | DELETE | `DELETE FROM users WHERE id = 123` |

### CRUD ↔ HTTP Status Codes

| Operation | Success Code | Meaning |
|-----------|-------------|---------|
| Create | **201 Created** | New resource was created |
| Read | **200 OK** | Resource(s) returned successfully |
| Update | **200 OK** | Resource was updated |
| Delete | **204 No Content** | Resource was deleted (no body returned) |
| Any | **400 Bad Request** | Invalid input |
| Any | **404 Not Found** | Resource does not exist |

## Each Operation in Detail

### Create — Bringing Data into Existence

The client sends data to the server. The server validates it, assigns an ID, saves it to the database, and returns the created resource.

```text
Client:  POST /users { "name": "Nobel", "email": "nobel@example.com" }
Server:  201 Created { "id": 1, "name": "Nobel", "email": "nobel@example.com" }
```

Key rules: always validate input before saving. Always return the created resource (including the generated ID) so the client knows what was stored.

### Read — Retrieving Data

Read operations come in two flavors: **list** (multiple records) and **detail** (a single record).

```text
Client:  GET /users          → Server: 200 OK [ { id: 1, ... }, { id: 2, ... } ]
Client:  GET /users/1        → Server: 200 OK { id: 1, name: "Nobel", ... }
Client:  GET /users?role=admin → Server: 200 OK [ filtered results ]
```

Key rules: list endpoints should support pagination (`?page=2&limit=20`), filtering (`?role=admin`), and sorting (`?sort=name`). Never return unbounded lists — they become slow and memory-heavy as data grows.

### Update — Modifying Existing Data

Two approaches with different semantics:

- **PUT** — replaces the *entire* resource. The client sends the full object. Any fields missing from the request are set to their defaults or null.
- **PATCH** — modifies *specific fields*. Only the fields included in the request are changed. Everything else stays the same.

```text
PUT /users/1 { "name": "Nobel Ahmad", "email": "nobel@example.com" }
→ Replaces the entire user record

PATCH /users/1 { "name": "Nobel Ahmad" }
→ Only updates the name, email stays unchanged
```

### Delete — Removing Data

The resource is removed from the database. The server returns **204 No Content** with an empty body.

```text
Client:  DELETE /users/1
Server:  204 No Content (empty body)
```

Key decision: **hard delete** vs **soft delete**. Hard delete permanently removes the row. Soft delete sets a `deleted_at` timestamp and filters it out of queries. Soft delete is safer — you can recover accidentally deleted data — but it means your database keeps growing.

## CRUD Beyond the Basics

### Nested Resources

When resources belong to other resources, CRUD operations nest naturally:

```text
POST   /users/1/posts       → Create a post for user 1
GET    /users/1/posts        → List user 1's posts
GET    /users/1/posts/42     → Get a specific post by user 1
PATCH  /users/1/posts/42     → Update that post
DELETE /users/1/posts/42     → Delete that post
```

### Batch Operations

Some systems need to create, update, or delete multiple records at once:

```text
POST /users/bulk       → Create multiple users
DELETE /users/bulk     → Delete multiple users by ID
PATCH /users/bulk      → Update multiple users with the same change
```

Batch operations are not standard REST but are common in real-world APIs for performance reasons.

## Key Points Cheat Sheet

| Concept | What to Remember |
|---------|-----------------|
| **CRUD** | Create, Read, Update, Delete — the four data operations |
| **HTTP mapping** | POST (Create), GET (Read), PUT/PATCH (Update), DELETE (Delete) |
| **SQL mapping** | INSERT, SELECT, UPDATE, DELETE |
| **Status codes** | 201 (Create), 200 (Read/Update), 204 (Delete) |
| **PUT vs PATCH** | PUT replaces everything. PATCH changes only specified fields. |
| **Read variants** | List (GET /users) vs Detail (GET /users/123) |
| **Pagination** | Always paginate list endpoints — never return unbounded results |
| **Soft delete** | Set `deleted_at` instead of removing the row — recoverable, auditable |
| **Nested resources** | `/users/1/posts` — CRUD on resources that belong to a parent |

CRUD is not a framework or a library — it is a universal pattern. Whether you use SQL, NoSQL, REST, GraphQL, or gRPC, you are always doing these four things. Master the pattern, and every data system you encounter will feel familiar.
