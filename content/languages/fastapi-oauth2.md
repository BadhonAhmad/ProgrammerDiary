---
title: "FastAPI OAuth2"
date: "2026-04-21"
tags: ["python", "fastapi", "oauth2", "authentication", "social-login"]
excerpt: "Learn how OAuth2 works with FastAPI — from the password flow to third-party login (Google, GitHub) — and how it differs from basic JWT authentication."
---

# FastAPI OAuth2

Your users don't want to create another account. They want to "Sign in with Google" or "Continue with GitHub". That's OAuth2 — your app asks Google to authenticate the user, Google tells your app who they are, and nobody shares their password.

## What is OAuth2?

**OAuth2** is an authorization framework that lets users grant third-party applications limited access to their accounts without sharing passwords. In FastAPI, OAuth2 handles the flow of getting and using access tokens.

```text
Basic JWT (previous section):
  User → Your API: email + password
  Your API → User: JWT token
  (You handle everything)

OAuth2 with third party:
  User → Your API: "I want to login with Google"
  Your API → Google: "This user wants to authenticate"
  User → Google: "Yes, I allow this app"
  Google → Your API: "Here's an authorization code"
  Your API → Google: "Give me a token for this code"
  Google → Your API: "Here's the access token"
  Your API: Creates your own JWT for the user
```

## Why Does It Matter?

❌ **Problem:** Users abandon signup because they don't want another password. You store passwords, becoming a security liability. Users reuse passwords across sites, and when another site gets breached, your users are compromised.

✅ **Solution:** OAuth2 lets users authenticate through Google, GitHub, or any provider they already trust. You never see their password. They click one button. Everyone wins.

## OAuth2 Password Flow (FastAPI Built-in)

The simplest OAuth2 flow — your own API handles everything.

```python
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

@router.post("/auth/token")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
def read_me(token: str = Depends(oauth2_scheme)):
    user = verify_token(token)
    return user
```

```text
OAuth2PasswordRequestForm:
  - Expects form data (not JSON): username + password
  - Works with /docs "Authorize" button out of the box
  - Standard OAuth2 password grant type
```

## OAuth2 Authorization Code Flow (Third-Party Login)

### Google OAuth2 Example

```python
from fastapi import FastAPI
from fastapi.responses import RedirectResponse

GOOGLE_CLIENT_ID = "your-client-id"
GOOGLE_CLIENT_SECRET = "your-client-secret"
GOOGLE_REDIRECT_URI = "http://localhost:8000/auth/google/callback"

@router.get("/auth/google")
def google_login():
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"response_type=code&"
        f"scope=openid email profile"
    )
    return RedirectResponse(url)

@router.get("/auth/google/callback")
def google_callback(code: str, db: Session = Depends(get_db)):
    # Exchange code for token
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        },
    )
    id_token = token_response.json().get("id_token")
    user_info = verify_google_token(id_token)

    # Find or create user
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        user = create_user_from_google(user_info, db)

    # Issue your own JWT
    jwt_token = create_access_token({"sub": str(user.id)})
    return {"access_token": jwt_token, "token_type": "bearer"}
```

## OAuth2 Scopes

```python
from fastapi.security import OAuth2PasswordBearer, SecurityScopes

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/token",
    scopes={
        "read": "Read access",
        "write": "Write access",
        "admin": "Admin access",
    },
)

def get_current_user(
    security_scopes: SecurityScopes,
    token: str = Depends(oauth2_scheme),
):
    payload = decode_token(token)
    token_scopes = payload.get("scopes", [])
    for scope in security_scopes.scopes:
        if scope not in token_scopes:
            raise HTTPException(403, f"Missing scope: {scope}")
    return payload

@router.get("/items", dependencies=[Security(get_current_user, scopes=["read"])])
def list_items():
    return get_items()

@router.post("/items", dependencies=[Security(get_current_user, scopes=["write"])])
def create_item(item: ItemCreate):
    return save_item(item)
```

## OAuth2 Password vs Authorization Code

| Factor | Password Flow | Authorization Code Flow |
|---|---|---|
| **Who authenticates** | Your API | Third-party (Google, GitHub) |
| **Password stored** | You hash and store it | Never touches your server |
| **Complexity** | Simple | Moderate |
| **Use case** | Your own users | Social login, SSO |
| **Trust** | Users trust you | Users trust Google/GitHub |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **OAuth2** | Authorization framework for token-based access |
| **Password flow** | Your API authenticates with email + password |
| **Authorization code flow** | Third-party (Google) authenticates the user |
| **OAuth2PasswordRequestForm** | FastAPI form handler for password flow |
| **Scopes** | Fine-grained permissions (read, write, admin) |
| **SecurityScopes** | Enforce required scopes on endpoints |
| **Client ID + Secret** | Credentials registered with the OAuth provider |
| **Redirect URI** | Where the provider sends the user after auth |

**OAuth2 password flow is for when you handle authentication. OAuth2 authorization code flow is for when you want Google or GitHub to handle it — so your users don't need yet another password.**
