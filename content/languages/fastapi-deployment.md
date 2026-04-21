---
title: "FastAPI Deployment & Best Practices"
date: "2026-04-21"
tags: ["python", "fastapi", "deployment", "docker", "production", "best-practices"]
excerpt: "Learn how to deploy FastAPI to production — Docker, Gunicorn with Uvicorn workers, environment variables, health checks, and the best practices that separate hobby projects from production systems."
---

# FastAPI Deployment & Best Practices

Your FastAPI app runs perfectly with `uvicorn main:app --reload`. Then you deploy it to production. No --reload. No single worker. No hardcoded secrets. Production demands a different setup — here's how to do it right.

## Production Server Setup

### Don't Use `--reload` in Production

```bash
# Development (auto-restart on changes)
uvicorn main:app --reload

# Production (stable, no auto-reload)
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Gunicorn + Uvicorn Workers

```bash
pip install gunicorn uvicorn[standard]

# Run with multiple workers
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

```text
Why Gunicorn?
  - Manages multiple Uvicorn worker processes
  - If a worker crashes, Gunicorn restarts it
  - Graceful restarts (deploy without downtime)
  - Workers = CPU cores * 2 + 1 (common formula)

Why not just Uvicorn?
  - Single process = single point of failure
  - Can't utilize multiple CPU cores
  - Gunicorn is a battle-tested process manager
```

## Docker

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000"]
```

```bash
# Build and run
docker build -t my-api .
docker run -p 8000:8000 -e DATABASE_URL=postgres://... my-api
```

## Environment Variables

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    allowed_origins: list[str] = ["*"]
    debug: bool = False

    class Config:
        env_file = ".env"

settings = Settings()

# main.py
app = FastAPI(debug=settings.debug)
```

```text
Never hardcode secrets:
  ❌ SECRET_KEY = "my-secret-123"
  ✅ SECRET_KEY = os.environ["SECRET_KEY"]
  ✅ Or use Pydantic Settings (auto-loads from .env)
```

## CORS for Production

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,  # ["https://myapp.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

```text
Development: allow_origins=["*"] (accept from anywhere)
Production:  allow_origins=["https://myapp.com"] (only your frontend)
```

## Health Check Endpoint

```python
@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/health/db")
def db_health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"database": "healthy"}
    except Exception:
        raise HTTPException(503, "Database unreachable")
```

```text
Load balancers and monitoring tools hit /health
  200 → service is up
  503 → service is down (remove from load balancer)
```

## Best Practices

### Project Organization
```text
✅ Use APIRouter — one file per resource
✅ Separate models (DB) from schemas (API)
✅ Use dependency injection for DB sessions and auth
✅ Use Pydantic Settings for configuration
✅ Use Alembic for database migrations
```

### Security
```text
✅ Hash passwords with bcrypt (never store plaintext)
✅ Use HTTPS in production (always)
✅ Validate all input with Pydantic models
✅ Use environment variables for secrets
✅ Set CORS origins explicitly
✅ Rate-limit authentication endpoints
✅ Use parameterized queries (SQLAlchemy does this by default)
```

### Performance
```text
✅ Use async database drivers for async endpoints
✅ Use background tasks for slow operations
✅ Add database indexes for frequently queried columns
✅ Use connection pooling
✅ Cache expensive queries with Redis
✅ Use multiple Gunicorn workers
```

### Error Handling
```text
✅ Use HTTPException for expected errors
✅ Global exception handler for unexpected errors
✅ Log errors with context (request ID, user ID)
✅ Never expose internal details in error responses
✅ Return consistent error format
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Gunicorn + Uvicorn** | Production server with multiple worker processes |
| **Docker** | Containerized deployment — consistent across environments |
| **Pydantic Settings** | Load config from environment variables with validation |
| **CORS** | Control which origins can access your API |
| **Health check** | Endpoint for monitoring and load balancer probes |
| **Multiple workers** | Utilize all CPU cores and survive worker crashes |
| **No --reload** | Never use auto-reload in production |
| **No hardcoded secrets** | Everything from environment variables |

**Development is about making it work. Production is about making it keep working — multiple workers, proper secrets, health checks, and Docker.**
