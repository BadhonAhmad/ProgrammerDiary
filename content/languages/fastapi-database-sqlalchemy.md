---
title: "FastAPI Database with SQLAlchemy"
date: "2026-04-21"
tags: ["python", "fastapi", "sqlalchemy", "database", "orm"]
excerpt: "Learn how to connect FastAPI to a database using SQLAlchemy — from setup and models to CRUD operations and dependency injection for database sessions."
---

# FastAPI Database with SQLAlchemy

Your API needs to store users, products, and orders. Right now, everything lives in memory — restart the server and it's gone. SQLAlchemy gives FastAPI a full ORM: define models as Python classes, query with Python code, and let SQLAlchemy handle the SQL.

## Setup

### Install Dependencies

```bash
pip install sqlalchemy psycopg2-binary alembic
```

```text
sqlalchemy:        Python ORM
psycopg2-binary:   PostgreSQL driver (use pymysql for MySQL, aiosqlite for SQLite)
alembic:           Database migrations
```

### Database Connection

```python
# database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = "postgresql://user:password@localhost:5432/mydb"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

class Base(DeclarativeBase):
    pass
```

## Define Models

```python
# models/user.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    items = relationship("Item", back_populates="owner")

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="items")
```

## Database Session Dependency

```python
# dependencies.py
from sqlalchemy.orm import Session

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

## CRUD Operations

### Create
```python
@router.post("/users", response_model=UserResponse, status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = User(
        email=user.email,
        name=user.name,
        hashed_password=hash_password(user.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # Get the auto-generated id
    return db_user
```

### Read
```python
@router.get("/users", response_model=list[UserResponse])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### Update
```python
@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key, value in user_update.model_dump(exclude_unset=True).items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return user
```

### Delete
```python
@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
```

## Why Does It Matter?

❌ **Problem:** Writing raw SQL for every CRUD operation is repetitive and error-prone. SQL injection vulnerabilities. Different SQL dialects for different databases. No Python-level validation between your code and the database.

✅ **Solution:** SQLAlchemy models define your schema as Python classes. CRUD operations use Python method calls instead of SQL strings. The ORM handles SQL generation, connection management, and type conversion.

## Migrations with Alembic

```bash
# Initialize Alembic
alembic init migrations

# Generate migration from models
alembic revision --autogenerate -m "create users table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

```text
Alembic workflow:
  1. Change your SQLAlchemy models
  2. Run alembic revision --autogenerate
  3. Review the generated migration
  4. Run alembic upgrade head
  5. Database schema matches your models
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **SQLAlchemy** | Python ORM — define models as classes, query with Python |
| **`SessionLocal`** | Factory for creating database sessions |
| **`Depends(get_db)`** | Injects and cleans up database sessions automatically |
| **`Base`** | Declarative base class for all models |
| **`db.add/commit/refresh`** | Create records and get generated values |
| **`db.query(Model).filter()`** | Read records with Python filters |
| **`setattr` pattern** | Update only provided fields (partial update) |
| **Alembic** | Migration tool that tracks schema changes |

**SQLAlchemy lets you think in Python, not SQL — define your tables as classes, query with methods, and let the ORM handle the database dialect.**
