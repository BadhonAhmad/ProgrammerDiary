---
title: "FastAPI Installation & Setup"
date: "2026-04-21"
tags: ["python", "fastapi", "setup", "installation", "getting-started"]
excerpt: "Get a FastAPI project running in under 5 minutes — from installing Python to serving your first API with auto-generated docs."
---

# FastAPI Installation & Setup

Five minutes from zero to a running API with interactive documentation. No boilerplate generators, no complex configurations. Install FastAPI, write 6 lines, run the server. Done.

## Prerequisites

```text
Python 3.8 or higher (3.11+ recommended for best performance)

Check your version:
  python --version
  # Python 3.12.x → good to go
```

## Installation

### Install FastAPI and Uvicorn

```bash
pip install fastapi uvicorn
```

```text
fastapi:  The framework itself
uvicorn:  ASGI server that runs your FastAPI app
          (Think of Uvicorn as the waiter, FastAPI as the kitchen)
```

### Install with All Extras

```bash
pip install "fastapi[all]"
```

This includes uvicorn, Pydantic extras, and commonly used dependencies.

### Using a Virtual Environment (Recommended)

```bash
python -m venv venv

# Activate:
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install fastapi uvicorn
```

## Your First API

### Create `main.py`

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}
```

### Run the Server

```bash
uvicorn main:app --reload
```

```text
main:     The file name (main.py)
app:      The FastAPI instance variable
--reload: Auto-restart on code changes (development only)

Server starts at: http://127.0.0.1:8000
```

### See It in Action

```text
http://127.0.0.1:8000/              → {"message": "Hello, FastAPI!"}
http://127.0.0.1:8000/items/42      → {"item_id": 42, "q": null}
http://127.0.0.1:8000/items/42?q=hi → {"item_id": 42, "q": "hi"}
http://127.0.0.1:8000/docs          → Interactive Swagger UI
http://127.0.0.1:8000/redoc         → ReDoc documentation
```

### Validation in Action

```text
http://127.0.0.1:8000/items/hello

Response (422 Unprocessable Entity):
{
  "detail": [
    {
      "type": "int_parsing",
      "loc": ["path", "item_id"],
      "msg": "Input should be a valid integer",
      "input": "hello"
    }
  ]
}

FastAPI validated item_id must be an integer.
Invalid input → clear error message, not a crash.
```

## Project Structure for Growth

```text
my-api/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app instance and startup
│   ├── routers/         # Route modules
│   │   ├── users.py
│   │   └── items.py
│   ├── models.py        # Pydantic models
│   ├── database.py      # Database connection
│   ├── dependencies.py  # Shared dependencies
│   └── config.py        # Settings and configuration
├── tests/
│   └── test_main.py
├── requirements.txt
└── .env                 # Environment variables
```

## Common CLI Options

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 80 --workers 4

# Options:
# --host       Bind address (default: 127.0.0.1)
# --port       Port number (default: 8000)
# --reload     Auto-restart on code changes (dev only!)
# --workers    Number of worker processes (production)
# --log-level  Logging level (debug, info, warning, error)
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`pip install fastapi uvicorn`** | Install framework and ASGI server |
| **`uvicorn main:app --reload`** | Run dev server with auto-reload |
| **`/docs`** | Auto-generated Swagger UI |
| **`/redoc`** | Auto-generated ReDoc documentation |
| **Virtual environment** | Isolate project dependencies |
| **`--reload`** | Dev only — auto-restart on file changes |
| **`--workers 4`** | Production — multiple processes for throughput |

**FastAPI's setup is proof of its philosophy: the simplest way to do something is usually the right way. Six lines, one command, running API.**
