---
title: "FastAPI Authentication & JWT"
date: "2026-04-21"
tags: ["python", "fastapi", "jwt", "authentication", "security"]
excerpt: "Learn how to implement JWT authentication in FastAPI — from password hashing to token creation, verification, and protecting endpoints with dependency injection."
---

# FastAPI Authentication & JWT

Anyone can call your `DELETE /users/42` endpoint. No authentication, no authorization — if someone knows the URL, they can delete any user. JWT authentication ensures only logged-in users can access protected endpoints.

## What is JWT Authentication?

**JSON Web Token (JWT)** is a standard for securely transmitting information between parties as a signed JSON object. In authentication, the server issues a signed token after login. The client includes this token in every subsequent request. The server verifies the token to identify the user.

```text
Login flow:
  1. Client sends email + password
  2. Server verifies credentials
  3. Server creates JWT: { user_id: 42, exp: "2026-04-22" }
  4. Server signs JWT with secret key
  5. Client stores token (localStorage/cookie)
  6. Client sends token in Authorization header for every request
  7. Server verifies signature + expiry → identifies user
```

## Why Does It Matter?

❌ **Problem:** Your API has no authentication. Anyone who discovers the URL can read, modify, or delete any data. No way to know who's making requests. No way to restrict actions to authorized users.

✅ **Solution:** JWT authentication. Users log in with credentials, receive a signed token, and include it with every request. The server verifies the token cryptographically — no database lookups needed for each request. Fast, stateless, and secure.

## Implementation

### Password Hashing
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### Token Creation and Verification
```python
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError

SECRET_KEY = "your-secret-key"  # Use env variable in production!
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### Login Endpoint
```python
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
```

### Protecting Endpoints
```python
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Use it:
@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
```

## OAuth2PasswordBearer Flow

```text
How it works with /docs:
  1. Open /docs → see a "Authorize" button
  2. Click → enter username + password
  3. FastAPI calls your /auth/login endpoint
  4. Token stored in browser session
  5. All subsequent /docs requests include the token
  6. Protected endpoints work in /docs automatically
```

## Token Expiry and Refresh

```python
# Short-lived access token + long-lived refresh token
def create_tokens(user_id: int):
    access = create_access_token(
        {"sub": str(user_id)},
        expires_delta=timedelta(minutes=15),
    )
    refresh = create_access_token(
        {"sub": str(user_id), "type": "refresh"},
        expires_delta=timedelta(days=7),
    )
    return {"access_token": access, "refresh_token": refresh}

@router.post("/auth/refresh")
def refresh_token(refresh: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(401, "Invalid refresh token")
    user_id = int(payload.get("sub"))
    new_access = create_access_token({"sub": str(user_id)})
    return {"access_token": new_access, "token_type": "bearer"}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **JWT** | Signed JSON token containing user identity and expiry |
| **bcrypt** | Password hashing algorithm — slow to brute-force |
| **OAuth2PasswordBearer** | Extracts token from Authorization header |
| **`Depends(get_current_user)`** | Injects authenticated user into endpoints |
| **`create_access_token`** | Signs a JWT with secret key and expiry |
| **`decode_token`** | Verifies signature and extracts payload |
| **Refresh token** | Long-lived token to get new access tokens |
| **/docs integration** | Swagger UI has built-in "Authorize" button |

**JWT makes your API stateless — the token carries all the proof of identity, no server-side sessions needed. Verify the signature, check the expiry, and you know exactly who's calling.**
