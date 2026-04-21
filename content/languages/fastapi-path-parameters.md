---
title: "FastAPI Path Parameters"
date: "2026-04-21"
tags: ["python", "fastapi", "routing", "path-parameters", "api"]
excerpt: "Learn how FastAPI handles path parameters — URL variables like /users/42 — with automatic type conversion, validation, and documentation."
---

# FastAPI Path Parameters

You need an endpoint to get user 42, product 99, order 5001. The ID is part of the URL: `/users/42`. That `42` is a path parameter. FastAPI extracts it, validates it, and converts it to the right type — before your function even runs.

## What are Path Parameters?

**Path parameters** are variable parts of the URL path. They capture values from the URL and pass them to your function as typed arguments.

```python
@app.get("/users/{user_id}")
def get_user(user_id: int):
    return {"user_id": user_id}
```

```text
Request: GET /users/42
  FastAPI extracts "42" from the path
  Converts "42" to integer 42 (because of the type hint)
  Passes 42 to get_user(user_id=42)

Request: GET /users/hello
  FastAPI tries to convert "hello" to int
  Fails → returns 422 error with clear message
```

## Why Does It Matter?

❌ **Problem:** Without path parameters, you use query strings for everything: `/users?id=42`. Your URLs are ugly and un-RESTful. Worse, you manually parse and validate the ID in every handler — `if not id.isdigit(): return error`.

✅ **Solution:** FastAPI extracts path variables automatically, validates types, and passes clean Python values to your function. Invalid input never reaches your code.

## Type Conversion

```python
@app.get("/items/{item_id}")
def get_item(item_id: int):        # Must be integer
    return {"item_id": item_id}

# GET /items/42       → {"item_id": 42}
# GET /items/3.14     → 422 error (not a valid integer)
# GET /items/hello    → 422 error
```

### Supported Types

```python
# Integer
@app.get("/users/{user_id}")
def get_user(user_id: int): ...

# String (default)
@app.get("/files/{filename}")
def get_file(filename: str): ...

# Float
@app.get("/price/{amount}")
def get_price(amount: float): ...

# Path (captures slashes)
@app.get("/files/{file_path:path}")
def get_file(file_path: str):
    return {"path": file_path}
# GET /files/docs/reports/q1.pdf → {"path": "docs/reports/q1.pdf"}

# Enum (restricted values)
from enum import Enum

class ModelName(str, Enum):
    alexnet = "alexnet"
    resnet = "resnet"

@app.get("/models/{model_name}")
def get_model(model_name: ModelName):
    return {"model": model_name}
# GET /models/alexnet → works
# GET /models/unknown → 422 error (not a valid enum value)
```

## Validation with Path()

```python
from fastapi import Path

@app.get("/items/{item_id}")
def get_item(
    item_id: int = Path(ge=1, le=1000, description="Item ID (1-1000)")
):
    return {"item_id": item_id}
```

```text
Validation options:
  gt=N   → greater than N
  ge=N   → greater than or equal to N
  lt=N   → less than N
  le=N   → less than or equal to N

Examples:
  item_id: int = Path(ge=1)           → must be 1 or more
  page: int = Path(ge=1, le=1000)     → must be 1-1000
  score: float = Path(gt=0, lt=100)   → must be 0-100 exclusive
```

## Multiple Path Parameters

```python
@app.get("/users/{user_id}/items/{item_id}")
def get_user_item(user_id: int, item_id: int):
    return {"user_id": user_id, "item_id": item_id}

# GET /users/42/items/7 → {"user_id": 42, "item_id": 7}
```

## Order Matters

```python
# WRONG — /users/me will match /users/{user_id} with user_id="me"
@app.get("/users/{user_id}")
def get_user(user_id: int): ...

@app.get("/users/me")
def get_me(): ...

# CORRECT — specific routes before parameterized ones
@app.get("/users/me")
def get_me(): ...

@app.get("/users/{user_id}")
def get_user(user_id: int): ...
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Path parameter** | Variable part of URL: `/users/{user_id}` |
| **Type conversion** | Auto-converts to int, float, str, enum based on type hint |
| **`Path()`** | Add validation (min, max) and metadata |
| **`:path`** | Capture full path including slashes |
| **Enum** | Restrict to predefined values |
| **Order matters** | Define specific routes before parameterized ones |
| **422 error** | Returned automatically when type conversion or validation fails |

**Path parameters turn URL segments into validated Python variables — you write the type, FastAPI handles the rest.**
