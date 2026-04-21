---
title: "FastAPI APIRouter"
date: "2026-04-21"
tags: ["python", "fastapi", "router", "modular", "architecture"]
excerpt: "Learn how to split your FastAPI app into multiple route modules using APIRouter — keeping your code organized, reusable, and maintainable as your project grows."
---

# FastAPI APIRouter

Your `main.py` has 2,000 lines — user routes, item routes, order routes, auth routes, all crammed into one file. Finding anything takes scrolling forever. APIRouter lets you split routes into separate files, each focused on one resource.

## What is APIRouter?

**APIRouter** is FastAPI's class for grouping related routes together. Each router is like a mini FastAPI app — it has its own routes, prefix, tags, and dependencies. You then register routers in your main app.

```python
# routers/users.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list_users():
    return [{"id": 1, "name": "Alice"}]

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "Alice"}
```

```python
# main.py
from fastapi import FastAPI
from routers import users, items

app = FastAPI()
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(items.router, prefix="/items", tags=["items"])
```

## Why Does It Matter?

❌ **Problem:** Everything in `main.py`. Every merge conflict touches the same file. Can't find the user endpoints without searching through 1,000 lines of unrelated code. Adding a developer means everyone edits the same file.

✅ **Solution:** Each resource gets its own router file. `routers/users.py` for users, `routers/items.py` for items. Each file is focused, searchable, and independently editable. No merge conflicts.

## Router Configuration

```python
router = APIRouter(
    prefix="/users",              # All routes start with /users
    tags=["users"],              # Groups endpoints in /docs
    dependencies=[Depends(get_db)],  # Apply to ALL routes in this router
    responses={404: {"description": "Not found"}},
)
```

```text
prefix:     All routes in this router get this prefix
            router.get("/")  → GET /users/
            router.get("/me") → GET /users/me

tags:       Groups endpoints under "users" in Swagger UI
            Makes /docs organized and navigable

dependencies: Applied to every route in the router
             (database session, auth check, etc.)

responses:  Default response descriptions for all routes
```

## Multiple Routers

```text
project/
├── app/
│   ├── main.py
│   └── routers/
│       ├── __init__.py
│       ├── auth.py       # prefix="/auth"
│       ├── users.py      # prefix="/users"
│       ├── items.py      # prefix="/items"
│       └── admin.py      # prefix="/admin"
```

```python
# main.py
from app.routers import auth, users, items, admin

app = FastAPI()

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(items.router)
app.include_router(
    admin.router,
    prefix="/admin",
    dependencies=[Depends(require_admin)],  # Admin-only
)
```

## Router-Level Dependencies

```python
# Every route in this router requires authentication
router = APIRouter(
    prefix="/items",
    dependencies=[Depends(get_current_user)],
)

@router.get("/")          # Requires auth (from router)
def list_items(): ...

@router.post("/")         # Requires auth (from router)
def create_item(item: ItemCreate): ...

@router.delete("/{item_id}")  # Requires auth + admin
@router.delete("/{item_id}", dependencies=[Depends(require_admin)])
def delete_item(item_id: int): ...
```

## Nested Routers

```python
# routers/users.py
router = APIRouter(prefix="/users")

# routers/users/items.py
from fastapi import APIRouter

router = APIRouter(
    prefix="/{user_id}/items",   # Nested under users
    tags=["user-items"],
)

# main.py
app.include_router(users_router)
app.include_router(user_items_router)

# Routes:
# GET /users/             → list users
# GET /users/42/items/    → list user 42's items
# GET /users/42/items/7   → get user 42's item 7
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **APIRouter** | Groups related routes into a module |
| **prefix** | URL prefix applied to all routes in the router |
| **tags** | Groups endpoints in Swagger UI documentation |
| **include_router** | Registers a router with the main FastAPI app |
| **Router dependencies** | Apply auth/db to all routes in one place |
| **One file per resource** | `users.py`, `items.py`, `orders.py` |
| **Nested routers** | Sub-resources under parent routes |

**APIRouter is how you go from a 2,000-line main.py to a clean, modular codebase — each resource owns its file, and main.py just wires them together.**
