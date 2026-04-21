---
title: "FastAPI Dependency Injection"
date: "2026-04-21"
tags: ["python", "fastapi", "dependency-injection", "architecture", "design-patterns"]
excerpt: "Learn FastAPI's dependency injection system — the most powerful feature that handles database sessions, authentication, pagination, and shared logic without repeating yourself."
---

# FastAPI Dependency Injection

Every endpoint needs a database session. You create it, pass it, close it. Every endpoint. Then you add authentication — check the token, get the user, pass it along. Every endpoint. Dependency injection lets you write this once and have FastAPI inject it automatically.

## What is Dependency Injection?

**Dependency injection (DI)** is a pattern where a framework provides dependencies to your function instead of you creating them inside. In FastAPI, you declare what you need using `Depends()`, and FastAPI provides it automatically.

```python
from fastapi import Depends

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users
```

```text
Without DI:
  You create db session in every endpoint
  You handle cleanup in every endpoint
  You handle errors in every endpoint

With DI:
  Declare db = Depends(get_db)
  FastAPI creates, injects, and cleans up automatically
```

## Why Does It Matter?

❌ **Problem:** 30 endpoints each create a database session, use it, and close it. You forget `db.close()` in one endpoint — connection leak. You add auth checking to 30 endpoints individually. When the auth logic changes, you update 30 places.

✅ **Solution:** Write the database and auth logic once as a dependency. FastAPI injects it into every endpoint that needs it. Change the logic once — all endpoints updated. Connection cleanup guaranteed.

## Database Session Dependency

```python
# dependencies.py
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db          # Provide the session
    finally:
        db.close()        # Always cleanup

# routers/users.py
@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(**user.model_dump())
    db.add(db_user)
    db.commit()
    return db_user
```

## Authentication Dependency

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

# Now any endpoint that needs auth just declares it:
@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/my-items")
def read_my_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Item).filter(Item.owner_id == current_user.id).all()
```

## Chained Dependencies

```python
def get_current_user(token: str = Depends(oauth2_scheme)):
    # Depends on oauth2_scheme
    user = decode_token(token)
    return user

def get_current_active_user(user: User = Depends(get_current_user)):
    # Depends on get_current_user (which depends on oauth2_scheme)
    if not user.is_active:
        raise HTTPException(400, "Inactive user")
    return user

# Dependency chain:
# get_current_active_user → get_current_user → oauth2_scheme
# All resolved automatically

@router.get("/me")
def read_me(user: User = Depends(get_current_active_user)):
    return user
```

## Pagination Dependency

```python
class PaginationParams:
    def __init__(
        self,
        page: int = Query(1, ge=1),
        page_size: int = Query(20, ge=1, le=100),
    ):
        self.skip = (page - 1) * page_size
        self.limit = page_size

@router.get("/items")
def list_items(pagination: PaginationParams = Depends()):
    items = db.query(Item).offset(pagination.skip).limit(pagination.limit).all()
    return items
```

## Global Dependencies

```python
# Applied to ALL routes in the app
app = FastAPI(dependencies=[Depends(verify_api_key)])

# Applied to all routes in a router
router = APIRouter(dependencies=[Depends(get_db)])
```

## Testing with DI Override

```python
def test_list_users():
    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    response = client.get("/users")
    assert response.status_code == 200

    # Clean up
    app.dependency_overrides.clear()
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Depends()** | Declare a dependency — FastAPI resolves and injects it |
| **yield dependency** | Setup + cleanup pattern (database sessions) |
| **Chained dependencies** | Dependencies that depend on other dependencies |
| **Global dependencies** | Apply to all routes via app or router |
| **Dependency overrides** | Swap dependencies for testing |
| **get_db** | Common pattern for database session injection |
| **get_current_user** | Common pattern for authentication injection |
| **Class-based** | Use a class as a dependency for reusable parameter groups |

**Dependency injection is FastAPI's superpower — write shared logic once, inject it everywhere, test it by swapping implementations. No more boilerplate, no more repetition.**
