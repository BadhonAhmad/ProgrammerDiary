---
title: "What is FastAPI?"
date: "2026-04-21"
tags: ["python", "fastapi", "backend", "api", "framework"]
excerpt: "Learn what FastAPI is, why it's one of the fastest-growing Python frameworks, and how it combines speed, developer experience, and automatic documentation into one package."
---

# What is FastAPI?

You write a Python API in 10 lines of code. It's fast (comparable to Node.js and Go). It validates every request automatically. It generates interactive documentation without you writing a single line. That's FastAPI.

## What is FastAPI?

**FastAPI** is a modern, high-performance Python web framework for building APIs. It's built on top of Starlette (for the web layer) and Pydantic (for data validation). It uses Python type hints to validate request data, serialize responses, and auto-generate OpenAPI documentation.

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}
```

That's it. Run it with `uvicorn main:app --reload`, and you have a running API with auto-generated docs at `/docs`.

## Why Does It Matter?

❌ **Problem:** You build a Flask API. You manually validate every field in every request — check types, check ranges, check required fields. You write the same validation code for every endpoint. You forget one check, and bad data reaches your database. After months, you realize you need API documentation — so you write it by hand, and it's instantly outdated.

✅ **Solution:** FastAPI uses Python type hints for validation. Define your data model once with types — FastAPI validates every request, rejects invalid data with clear error messages, and generates interactive documentation that's always in sync with your code.

## What Makes FastAPI Special

### Speed
```text
Built on Starlette + Uvicorn (ASGI server)
Uses async/await natively
Performance comparable to Node.js and Go
One of the fastest Python frameworks available

Benchmark (requests/second, rough):
  Flask:     ~1,000
  Django:    ~800
  FastAPI:  ~10,000+
```

### Automatic Validation
```python
from pydantic import BaseModel

class User(BaseModel):
    name: str
    age: int
    email: str

@app.post("/users")
def create_user(user: User):
    return user

# Send {"name": 123, "age": "hello"}
# FastAPI returns 422 with detailed error:
# "age: value is not a valid integer"
# "name: str type expected"
```

### Auto-Generated Documentation
```text
Every endpoint automatically documented at:
  /docs     → Interactive Swagger UI (test API in browser)
  /redoc    → Clean ReDoc documentation

No extra code needed. Your type hints and function signatures
become the documentation. Always up to date.
```

### Type Hints Everywhere
```python
@app.get("/items/{item_id}")
def get_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

# FastAPI:
#   - Validates item_id is an integer (returns 422 if not)
#   - Makes q optional with default None
#   - Documents both parameters in /docs
#   - IDE autocomplete works for everything
```

## FastAPI vs Other Python Frameworks

| Factor | Flask | Django | FastAPI |
|---|---|---|---|
| **Performance** | Low | Low | High |
| **Async support** | Limited | Partial | Native |
| **Validation** | Manual | Manual/forms | Automatic (Pydantic) |
| **API docs** | Manual | Manual | Auto-generated |
| **Type safety** | None | None | Full type hints |
| **Learning curve** | Low | High | Low-Medium |
| **Best for** | Simple APIs | Full-stack apps | Modern APIs |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **FastAPI** | Modern, high-performance Python web framework for APIs |
| **Pydantic** | Data validation using Python type hints |
| **Starlette** | Underlying ASGI framework handling HTTP |
| **Uvicorn** | ASGI server that runs FastAPI applications |
| **Auto docs** | Swagger UI (`/docs`) and ReDoc (`/redoc`) generated from code |
| **Type hints** | Python type annotations used for validation and documentation |
| **ASGI** | Async Server Gateway Interface — the async version of WSGI |

**FastAPI is what happens when someone asks: what if the framework did all the boring work — validation, documentation, serialization — and let you just write business logic?**
