---
title: "FastAPI Response Models"
date: "2026-04-21"
tags: ["python", "fastapi", "response", "serialization", "api"]
excerpt: "Learn how to control what your API returns — response filtering, multiple response types, status codes, and why response_model is your safety net."
---

# FastAPI Response Models

Your database has a `User` table with `id`, `name`, `email`, `hashed_password`, and `is_admin`. A GET `/users/42` returns the user. Without a response model, you might accidentally leak the hashed password and admin flag in the JSON response. Response models prevent this.

## What are Response Models?

A **response model** defines the shape of your API's output. By declaring `response_model` on a route, FastAPI filters and validates the response — only the fields you specify are returned, and the data is checked against the expected types.

```python
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    # Returns ALL fields from database
    user = db.query(User).get(user_id)
    # But response_model filters to only: id, name, email
    # hashed_password and is_admin are EXCLUDED automatically
    return user
```

## Why Does It Matter?

❌ **Problem:** Your endpoint returns a dict with 15 fields from the database. You add a `password_hash` column. It shows up in the API response. You didn't mean to expose it, but there's no filter — whatever the database returns goes to the client.

✅ **Solution:** `response_model` acts as a whitelist. Only declared fields pass through. New database columns are invisible to the API until you explicitly add them to the response model. Data leaks become structurally impossible.

## Response Model Filtering

```python
# Full database model
class UserInDB:
    id: int
    name: str
    email: str
    hashed_password: str
    is_active: bool
    is_admin: bool
    created_at: datetime

# Public response model
class UserResponse(BaseModel):
    id: int
    name: str
    email: str

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    user = get_full_user_from_db(user_id)
    return user
    # Only id, name, email returned
    # hashed_password, is_admin NEVER exposed
```

## Multiple Response Models

```python
class UserSummary(BaseModel):
    id: int
    name: str

class UserDetail(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    posts_count: int

@app.get("/users", response_model=list[UserSummary])
def list_users():
    return get_all_users()

@app.get("/users/{user_id}", response_model=UserDetail)
def get_user(user_id: int):
    return get_user_details(user_id)
```

## Status Codes

```python
from fastapi import status

@app.post("/users",
          response_model=UserResponse,
          status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate):
    return save_user(user)

@app.delete("/users/{user_id}",
            status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int):
    delete_from_db(user_id)
    return None  # 204 = no content
```

## Response Model in Router

```python
router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "User not found"}},
)

@router.get("/", response_model=list[UserResponse])
def list_users(): ...

@router.get("/{user_id}", response_model=UserDetail)
def get_user(user_id: int): ...

@router.post("/", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate): ...
```

## JSONResponse and Headers

```python
from fastapi.responses import JSONResponse

@app.get("/custom")
def custom_response():
    content = {"message": "Custom response"}
    return JSONResponse(
        content=content,
        status_code=200,
        headers={"X-Custom-Header": "value"},
    )
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`response_model`** | Filters and validates the response — only declared fields returned |
| **Security** | Prevents accidental data leaks (passwords, internal fields) |
| **`status_code`** | Set HTTP status code for the response |
| **`list[Model]`** | Response model for returning arrays |
| **Router-level responses** | Default responses for all routes in a router |
| **`JSONResponse`** | Full control over response content, status, and headers |
| **`response_model_exclude`** | Exclude specific fields from response |
| **`response_model_include`** | Include only specific fields in response |

**Response models are a safety net — they catch data leaks before they happen and guarantee your API returns exactly what you intended, nothing more.**
