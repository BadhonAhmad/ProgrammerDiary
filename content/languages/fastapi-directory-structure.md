---
title: "FastAPI Directory Structure"
date: "2026-04-21"
tags: ["python", "fastapi", "architecture", "project-structure"]
excerpt: "Learn how to organize a FastAPI project for maintainability — from single-file apps to multi-module architectures with routers, models, and services."
---

# FastAPI Directory Structure

Your `main.py` is 500 lines. Routes, models, database queries, business logic — everything mixed together. Adding a feature means scrolling through unrelated code. A clean directory structure fixes this before the chaos takes over.

## Single File (Start Here)

```text
main.py   ← Everything in one file

Fine for:
  - Learning and prototyping
  - APIs with fewer than 5-10 endpoints
  - Quick scripts and demos

Outgrows fast when you hit:
  - Multiple resources (users, items, orders)
  - Database models and migrations
  - Authentication and middleware
```

## Multi-File Structure (Production)

```text
project/
├── app/
│   ├── __init__.py
│   ├── main.py              # App instance, startup, shutdown
│   ├── config.py            # Settings (env vars, config)
│   ├── database.py          # Database session and connection
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # SQLAlchemy models
│   │   └── item.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py          # Pydantic request/response models
│   │   └── item.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py          # /auth/* endpoints
│   │   ├── users.py         # /users/* endpoints
│   │   └── items.py         # /items/* endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py  # Business logic
│   │   └── item_service.py
│   ├── dependencies.py      # Shared dependencies (auth, db session)
│   └── utils.py             # Utility functions
├── migrations/               # Alembic migrations
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest fixtures
│   ├── test_auth.py
│   ├── test_users.py
│   └── test_items.py
├── .env                      # Environment variables
├── .gitignore
├── requirements.txt
└── README.md
```

## Why Separate Models from Schemas?

```text
SQLAlchemy models (models/):
  Define DATABASE tables — columns, relationships, constraints
  These map to your database schema

Pydantic schemas (schemas/):
  Define API CONTRACT — what the client sends and receives
  These map to your JSON request/response

They're different because:
  - Password hash is in the database model but NEVER in the response
  - Created_at is auto-generated in DB but always returned in response
  - Confirmation password is in the request but not stored in DB
```

```python
# models/user.py — Database model
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    hashed_password = Column(String)  # Never expose this
    created_at = Column(DateTime)

# schemas/user.py — API schemas
class UserCreate(BaseModel):        # Request
    email: str
    password: str

class UserResponse(BaseModel):      # Response
    id: int
    email: str
    created_at: datetime
    # No password field — security
```

## How Routers Work

```python
# routers/users.py
from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
def list_users():
    return [{"id": 1, "name": "Alice"}]

@router.get("/{user_id}")
def get_user(user_id: int):
    return {"id": user_id, "name": "Alice"}

# main.py
from app.routers import users, items

app = FastAPI()
app.include_router(users.router)
app.include_router(items.router)
```

```text
Each router is independent:
  - Its own prefix (/users, /items)
  - Its own tag (groups in /docs)
  - Can have its own dependencies

main.py just registers them:
  app.include_router(users.router)
```

## The Service Layer

```text
 routers/users.py        → Handles HTTP (request → response)
 services/user_service.py → Handles business logic
 models/user.py           → Handles database

Why a service layer?
  - Router: "Accept this request, validate it, call service, return response"
  - Service: "Get user by ID, check permissions, apply business rules"
  - Model: "Map to database row"

Benefits:
  - Test business logic without HTTP (unit test the service)
  - Reuse logic across multiple routes
  - Keep routers thin and focused on HTTP concerns
```

```python
# services/user_service.py
def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundError("User not found")
    return user

# routers/users.py — thin, just handles HTTP
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return user_service.get_user_by_id(db, user_id)
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`routers/`** | Route handlers — one file per resource |
| **`models/`** | SQLAlchemy database models |
| **`schemas/`** | Pydantic request/response models |
| **`services/`** | Business logic (separate from HTTP) |
| **`config.py`** | Settings loaded from environment variables |
| **`dependencies.py`** | Shared FastAPI dependencies (auth, db session) |
| **Models vs Schemas** | Models = database tables, Schemas = API contract |
| **Service layer** | Business logic reusable across routes and tests |

**A clean structure isn't over-engineering — it's giving future-you a map instead of a mess. Separate by responsibility: HTTP in routers, logic in services, data in models.**
