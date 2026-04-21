---
title: "FastAPI Request Body & Pydantic"
date: "2026-04-21"
tags: ["python", "fastapi", "pydantic", "validation", "request-body"]
excerpt: "Learn how FastAPI uses Pydantic models to validate, parse, and serialize request bodies — the most powerful feature that eliminates manual validation forever."
---

# FastAPI Request Body & Pydantic

You accept a POST request with a JSON body. The email field is missing. The age is negative. The password is "123". Every endpoint, you write the same validation code. Pydantic makes this disappear — define your data model once with types, and validation happens automatically.

## What is a Request Body?

The **request body** is data sent by the client (usually JSON) in POST, PUT, and PATCH requests. FastAPI uses **Pydantic** models to declare the expected shape, validate incoming data, and serialize responses.

```python
from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    age: int

@app.post("/users")
def create_user(user: UserCreate):
    return {"name": user.name, "email": user.email}
```

```text
POST /users
Body: {"name": "Alice", "email": "alice@example.com", "age": 25}

FastAPI:
  1. Reads the JSON body
  2. Validates: name is str, email is str, age is int
  3. Creates UserCreate instance
  4. Passes it to create_user()

If validation fails → 422 error with details
```

## Why Does It Matter?

❌ **Problem:** You write validation for every endpoint: check required fields, check types, check email format, check age range. You forget to validate `email` format in one endpoint — invalid emails hit your database. Every endpoint has different validation rules, and keeping them consistent is a nightmare.

✅ **Solution:** Define a Pydantic model once. Every field has a type, and FastAPI validates every request against it. Add constraints (min length, regex, ranges) to the model. Validation is consistent, automatic, and impossible to forget.

## Pydantic BaseModel

```python
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UserCreate(BaseModel):
    name: str                           # Required string
    email: EmailStr                     # Must be valid email format
    age: int = Field(ge=0, le=150)     # 0-150 range
    bio: str | None = None             # Optional, defaults to None
    tags: list[str] = []               # Optional list, defaults to empty
```

### Field Validation

```python
from pydantic import Field

class Product(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, description="Price in USD")
    quantity: int = Field(ge=0, description="Stock count")
    sku: str = Field(pattern=r"^[A-Z]{3}-\d{4}$")  # Regex pattern

# Valid:   {"name": "Widget", "price": 9.99, "quantity": 50, "sku": "WDG-1234"}
# Invalid: {"name": "", "price": -5, "quantity": -1, "sku": "abc"}
# → 422 with detailed error for each field
```

### Validators (Custom Logic)

```python
from pydantic import field_validator

class UserCreate(BaseModel):
    name: str
    password: str

    @field_validator("password")
    @classmethod
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        return v

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v):
        if not v.strip():
            raise ValueError("Name cannot be blank")
        return v.strip()
```

### Model Validator (Cross-Field Validation)

```python
from pydantic import model_validator

class Booking(BaseModel):
    check_in: date
    check_out: date

    @model_validator(mode="after")
    def dates_valid(self):
        if self.check_out <= self.check_in:
            raise ValueError("check_out must be after check_in")
        return self
```

## Nested Models

```python
class Address(BaseModel):
    street: str
    city: str
    zip_code: str

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    address: Address    # Nested model

# Request body:
{
    "name": "Alice",
    "email": "alice@example.com",
    "address": {
        "street": "123 Main St",
        "city": "Boston",
        "zip_code": "02101"
    }
}
```

## Request Body + Path + Query

```python
@app.put("/users/{user_id}")
def update_user(
    user_id: int,                          # Path parameter
    q: str | None = None,                  # Query parameter
    user: UserUpdate = None,               # Request body
):
    result = {"user_id": user_id, "user": user}
    if q:
        result["q"] = q
    return result
```

## Response Serialization

```python
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

@app.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int):
    user = get_user_from_db(user_id)
    return user  # Auto-serialized to UserResponse shape
```

```text
response_model does two things:
  1. Filters output: only fields in UserResponse are returned
  2. Validates output: response data is checked against the model
     (Catches bugs where you accidentally return wrong data types)
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **BaseModel** | Pydantic base class for defining data models |
| **Field()** | Add validation constraints and metadata to fields |
| **field_validator** | Custom validation logic per field |
| **model_validator** | Cross-field validation logic |
| **EmailStr** | Validates email format automatically |
| **Optional fields** | `str | None = None` — has default, not required |
| **Nested models** | Model as a field type inside another model |
| **response_model** | Controls what fields are returned and validates output |

**Pydantic turns your data model into a contract — invalid data never reaches your code, and the response shape is guaranteed. Write the model once, validation and serialization are free forever.**
