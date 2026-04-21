---
title: "FastAPI Testing"
date: "2026-04-21"
tags: ["python", "fastapi", "testing", "pytest", "tdd"]
excerpt: "Learn how to test FastAPI applications with pytest — from basic route tests to authenticated requests, database mocking, and dependency overrides."
---

# FastAPI Testing

You deploy your API. The login endpoint returns a 500 error. Turns out, you renamed a variable and forgot to update one reference. A test would have caught it in 2 seconds. Testing FastAPI apps is fast, easy, and catches bugs before your users do.

## Setup

```bash
pip install pytest httpx pytest-asyncio
```

```text
pytest:           Test framework
httpx:            HTTP client for testing ASGI apps
pytest-asyncio:   Support for async test functions
```

## Basic Test Structure

```python
# tests/test_main.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello, FastAPI!"}

def test_get_user():
    response = client.get("/users/42")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == 42

def test_user_not_found():
    response = client.get("/users/9999")
    assert response.status_code == 404
```

## Why Does It Matter?

❌ **Problem:** You change the user model, add a new required field, and forget to update one endpoint. The error reaches production. Users see 500 errors. You debug for an hour at 2 AM.

✅ **Solution:** A test suite runs before every deploy. The broken endpoint fails a test in 2 seconds. You fix it before it ever reaches production.

## Testing POST Requests

```python
def test_create_user():
    response = client.post("/users", json={
        "name": "Alice",
        "email": "alice@example.com",
        "age": 25,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Alice"
    assert "id" in data

def test_create_user_invalid():
    response = client.post("/users", json={
        "name": 123,      # Not a string
        "email": "bad",   # Not a valid email
    })
    assert response.status_code == 422
```

## Testing Authentication

```python
def get_auth_header():
    # First, create a user and login
    client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword",
    })
    response = client.post("/auth/token", data={
        "username": "test@example.com",
        "password": "testpassword",
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_protected_endpoint():
    # Without auth → 401
    response = client.get("/me")
    assert response.status_code == 401

    # With auth → 200
    response = client.get("/me", headers=get_auth_header())
    assert response.status_code == 200
```

## Dependency Overrides (Mocking DB)

```python
from database import get_db
from tests.conftest import get_test_db

# Override the database dependency for all tests
app.dependency_overrides[get_db] = get_test_db

def test_list_users():
    response = client.get("/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Clean up after tests
def teardown_module():
    app.dependency_overrides.clear()
```

### Test Database Setup

```python
# tests/conftest.py
import pytest
from database import Base, engine, SessionLocal

@pytest.fixture
def db():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

## Testing File Uploads

```python
def test_upload_file():
    response = client.post(
        "/upload",
        files={"file": ("test.txt", b"file content", "text/plain")},
    )
    assert response.status_code == 200
```

## Test Organization

```text
tests/
├── conftest.py           # Shared fixtures (db, client, auth)
├── test_auth.py          # Authentication tests
├── test_users.py         # User CRUD tests
├── test_items.py         # Item CRUD tests
└── test_validation.py    # Input validation tests
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **TestClient** | HTTP client that tests FastAPI without running a server |
| **pytest** | Python test framework — `test_*.py` files, `def test_*()` functions |
| **`client.get/post`** | Make requests to your app in tests |
| **`assert response.status_code`** | Verify HTTP status |
| **`assert response.json()`** | Verify response data |
| **`dependency_overrides`** | Swap real dependencies (DB) with test ones |
| **`conftest.py`** | Shared pytest fixtures available across test files |
| **Test DB** | Separate database (SQLite in-memory) for isolated tests |

**Tests are the safety net that lets you move fast — write them once, they catch the same bug every time, forever.**
