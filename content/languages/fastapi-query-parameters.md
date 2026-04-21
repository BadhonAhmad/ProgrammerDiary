---
title: "FastAPI Query Parameters"
date: "2026-04-21"
tags: ["python", "fastapi", "query-parameters", "filtering", "api"]
excerpt: "Learn how FastAPI handles query parameters — optional filters, pagination, sorting — with type validation, defaults, and automatic documentation."
---

# FastAPI Query Parameters

Your API returns 10,000 products. Nobody wants all 10,000. Users want page 2, 20 items per page, sorted by price, filtered by category "electronics". All of that goes in query parameters: `?page=2&limit=20&sort=price&category=electronics`.

## What are Query Parameters?

**Query parameters** are key-value pairs in the URL after the `?`. They're used for filtering, sorting, pagination, and optional configuration.

```python
@app.get("/items")
def list_items(skip: int = 0, limit: int = 10):
    return {"skip": skip, "limit": limit}
```

```text
GET /items                   → skip=0, limit=10 (defaults)
GET /items?skip=20           → skip=20, limit=10
GET /items?skip=20&limit=50  → skip=20, limit=50
GET /items?limit=abc         → 422 error (limit must be integer)
```

## Why Does It Matter?

❌ **Problem:** Without query parameters, every filter and option needs its own endpoint — `/items/page/2`, `/items/category/electronics`, `/items/sorted/price`. Your URL structure becomes a nightmare. And you still manually parse and validate each value.

✅ **Solution:** Query parameters provide a clean, standard way to pass optional data. FastAPI validates types, applies defaults, and generates documentation showing every parameter with its type and default value.

## Required vs Optional

```python
from typing import Union

@app.get("/items")
def list_items(
    q: Union[str, None] = None,  # Optional, defaults to None
    skip: int = 0,               # Optional, defaults to 0
    limit: int = 10,             # Optional, defaults to 10
):
    return {"q": q, "skip": skip, "limit": limit}
```

```text
Parameter has a default → optional
  skip: int = 0        → optional (defaults to 0)
  q: str | None = None → optional (defaults to None)

Parameter has no default → required
  needed: str           → required (missing = 422 error)

Modern Python (3.10+):
  q: str | None = None  (same as Union[str, None] = None)
```

## Validation with Query()

```python
from fastapi import Query

@app.get("/items")
def list_items(
    q: str | None = Query(None, min_length=3, max_length=50),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
):
    return {"q": q, "skip": skip, "limit": limit}
```

```text
Validation options:
  min_length=N  → string must be at least N characters
  max_length=N  → string must be at most N characters
  regex="..."   → string must match pattern
  ge=N          → number must be >= N
  gt=N          → number must be > N
  le=N          → number must be <= N
  lt=N          → number must be < N

Results:
  GET /items?q=ab          → 422 (min_length is 3)
  GET /items?limit=200     → 422 (max is 100)
  GET /items?skip=-1       → 422 (must be >= 0)
  GET /items?limit=50      → valid
```

## Pagination Pattern

```python
@app.get("/users")
def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
):
    skip = (page - 1) * page_size
    users = get_users_from_db(skip=skip, limit=page_size)
    return {
        "users": users,
        "page": page,
        "page_size": page_size,
    }

# GET /users?page=2&page_size=50
```

## Multiple Values

```python
@app.get("/items")
def list_items(tags: list[str] = Query([])):
    return {"tags": tags}

# GET /items?tags=python&tags=fastapi&tags=api
# → {"tags": ["python", "fastapi", "api"]}
```

## Query Parameter Metadata

```python
@app.get("/items")
def list_items(
    q: str | None = Query(
        None,
        title="Search query",
        description="Search items by name (min 3 characters)",
        min_length=3,
        alias="search",        # Use ?search= instead of ?q= in URL
        deprecated=True,       # Marked as deprecated in docs
    ),
):
    return {"q": q}
```

## Path vs Query Parameters

| Factor | Path Parameter | Query Parameter |
|---|---|---|
| **Position** | In the URL path | After `?` in URL |
| **Required** | Always (unless optional) | Optional by default |
| **Use for** | Identifying resources | Filtering, sorting, pagination |
| **Example** | `/users/42` | `/users?role=admin&page=2` |
| **REST convention** | Noun for resource | Modifiers for collection |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Query parameter** | Key-value pairs after `?` in the URL |
| **Default value** | Makes parameter optional |
| **`Query()`** | Add validation, metadata, and constraints |
| **`ge/le/gt/lt`** | Numeric range validation |
| **`min_length/max_length`** | String length validation |
| **`alias`** | Use different URL name than Python variable |
| **`list[str]`** | Accept multiple values for same parameter |
| **Pagination** | `page` + `page_size` or `skip` + `limit` pattern |

**Path parameters identify WHAT you want. Query parameters describe HOW you want it — filtered, sorted, paginated. FastAPI validates both automatically.**
