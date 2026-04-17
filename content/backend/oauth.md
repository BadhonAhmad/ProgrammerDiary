---
title: "OAuth 2.0: Let Someone Else Handle Login"
date: "2026-04-17"
tags: ["backend", "oauth", "authentication", "security", "API", "Node.js"]
excerpt: "Learn how OAuth 2.0 lets users log in with Google, GitHub, or Facebook — and why delegating authentication is often smarter than building your own."
---

# OAuth 2.0: Let Someone Else Handle Login

You've seen the "Sign in with Google" button everywhere. That's OAuth in action — and it's better than building your own login system from scratch.

## What is OAuth 2.0?

**OAuth 2.0** is an authorization framework that lets a user grant a third-party application limited access to their resources on another service — **without sharing their password**.

Instead of creating an account with yet another password, the user authenticates through a trusted provider (Google, GitHub, Facebook). Your app receives a **token** that proves the user is who they say they are, plus some basic profile info.

Think of it like a hotel keycard. The front desk (OAuth provider) verifies your identity and gives you a card (token) that opens specific doors. The hotel doesn't give you the master key — just access to what you need.

## Why Does It Matter?

❌ **Problem:** Building authentication from scratch means you're responsible for storing passwords securely, handling password resets, implementing MFA, preventing brute-force attacks, and keeping up with security best practices. One mistake and your users' credentials are exposed.

On top of that, users hate creating new accounts. The average person has **80+ passwords** and reuses them across sites. More login forms means more drop-offs.

✅ **Solution:** OAuth delegates the hard parts to providers who specialize in security. Google, GitHub, and Facebook have entire security teams protecting user credentials. You just receive a verified identity — no passwords stored, no hashing to worry about.

## Key OAuth Concepts

### The Cast of Characters

| Role | Who They Are | Example |
|---|---|---|
| **Resource Owner** | The user | You, logging into an app |
| **Client** | The app requesting access | "MyApp" that wants your Google info |
| **Authorization Server** | Issues tokens | Google's auth server |
| **Resource Server** | Has the user's data | Google's user info API |

### Key Terms

- **Access Token:** A credential the client uses to access the user's data. Short-lived.
- **Refresh Token:** Used to get a new access token without asking the user to log in again. Long-lived.
- **Authorization Code:** A temporary code the client exchanges for tokens. Single-use.
- **Redirect URI:** Where the provider sends the user after they approve access.
- **Scope:** What the app is asking permission for (e.g., `profile`, `email`).

## The OAuth 2.0 Authorization Code Flow

This is the most common and secure flow for server-side apps:

```text
┌──────────┐       ┌──────────┐       ┌──────────┐
│   User   │       │  Your App│       │  Google  │
│ (Browser)│       │ (Server) │       │Auth Srvr │
└────┬─────┘       └────┬─────┘       └────┬─────┘
     │                   │                   │
     │ 1. "Login with    │                   │
     │    Google" click  │                   │
     │──────────────────>│                   │
     │                   │                   │
     │ 2. Redirect to Google auth URL        │
     │<──────────────────│                   │
     │                   │                   │
     │ 3. User logs in & approves access     │
     │─────────────────────────────────────->│
     │                   │                   │
     │ 4. Redirect back to your app          │
     │    with ?code=abc123 │                │
     │<─────────────────────────────────────│
     │                   │                   │
     │ 5. Send code to your server           │
     │──────────────────>│                   │
     │                   │                   │
     │                   │ 6. Exchange code  │
     │                   │    for tokens     │
     │                   │──────────────────>│
     │                   │                   │
     │                   │ 7. Return tokens  │
     │                   │<──────────────────│
     │                   │                   │
     │                   │ 8. Use access     │
     │                   │    token to get   │
     │                   │    user profile   │
     │                   │──────────────────>│
     │                   │                   │
     │                   │ 9. Return profile │
     │                   │<──────────────────│
     │                   │                   │
     │ 10. User logged in!                   │
     │<──────────────────│                   │
```

### Step-by-Step Breakdown

**Step 1 — User clicks "Sign in with Google"**

Your app redirects the user to the provider's authorization URL:

```text
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=http://localhost:3000/auth/callback&
  response_type=code&
  scope=profile email&
  state=random_csrf_token
```

**Step 2 — User authenticates with Google**

Google shows its own login page. Your app never sees the password.

**Step 3 — User grants permission**

Google shows: "MyApp wants to access your profile and email." User approves.

**Step 4 — Google redirects back with an authorization code**

```text
http://localhost:3000/auth/callback?code=abc123&state=random_csrf_token
```

**Step 5 — Your server exchanges the code for tokens**

```text
POST https://oauth2.googleapis.com/token
{
  "code": "abc123",
  "client_id": "YOUR_CLIENT_ID",
  "client_secret": "YOUR_CLIENT_SECRET",
  "redirect_uri": "http://localhost:3000/auth/callback",
  "grant_type": "authorization_code"
}
```

**Step 6 — Google returns access and refresh tokens**

```text
{
  "access_token": "ya29.a0AfH6...",
  "refresh_token": "1//0dx7...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Step 7 — Use the access token to get user info**

```text
GET https://www.googleapis.com/oauth2/v2/userinfo
Authorization: Bearer ya29.a0AfH6...
```

Returns the user's profile data — name, email, avatar.

## Other OAuth Flows

| Flow | Use Case | Security |
|---|---|---|
| **Authorization Code** | Server-side apps (most secure) | Uses client_secret |
| **Authorization Code + PKCE** | Mobile/SPA apps | No client_secret needed |
| **Client Credentials** | Server-to-server | No user involved |
| **Implicit** | Legacy SPA (deprecated) | Token in URL fragment |

For most web apps, use **Authorization Code flow**. For mobile apps or SPAs, use **Authorization Code + PKCE**.

## Implementing OAuth in Node.js with Passport.js

Passport.js is the most popular authentication middleware for Express.

```text
// Install
npm install passport passport-google-oauth20 express-session

// Configure
const GoogleStrategy = require("passport-google-oauth20").Strategy;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // Find or create user in your database
    User.findOrCreate({ googleId: profile.id }, (err, user) => {
      return done(err, user);
    });
  }
));

// Routes
app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);
```

## Security Considerations

### ❌ Not Validating the `state` Parameter

The `state` parameter prevents **CSRF attacks**. Without it, an attacker could trick a user into linking their account with the attacker's OAuth account.

**Fix:** Generate a random `state` value, store it in the session, and verify it matches in the callback.

### ❌ Exposing `client_secret` in the Browser

The client secret must **never** reach the frontend. Keep all token exchanges on your server.

### ❌ Accepting Tokens Without Verification

Don't trust the token blindly. Verify its signature, expiration, and that it was issued for your app's `client_id`.

### ❌ Ignoring Token Expiration

Access tokens expire. Handle refresh gracefully instead of asking users to log in again every hour.

## OAuth vs Building Your Own Auth

| Factor | OAuth (Social Login) | Custom Auth |
|---|---|---|
| **Implementation** | Simpler (provider handles it) | Complex (hashing, sessions, MFA) |
| **Password storage** | Not your problem | Your responsibility |
| **User experience** | Fewer passwords to remember | Another password to create |
| **Trust** | Users trust Google/GitHub | Users must trust you |
| **Dependency** | Depends on provider availability | Fully in your control |
| **Account recovery** | Provider handles it | You must build it |
| **Best for** | Consumer apps, quick onboarding | Enterprise, healthcare, finance |

Many apps use **both** — OAuth for convenience and email/password as a fallback.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **OAuth 2.0** | Framework for delegated authorization |
| **Authorization Code Flow** | Most secure flow for server-side apps |
| **Access Token** | Short-lived credential for API access |
| **Refresh Token** | Gets new access tokens without re-login |
| **Scope** | Defines what permissions the app requests |
| **State parameter** | Prevents CSRF attacks during OAuth |
| **Passport.js** | Popular Node.js library for OAuth |
| **client_secret** | Must stay on the server, never in the browser |
| **PKCE** | Security extension for mobile/SPA apps |

**Don't build auth from scratch unless you have to — OAuth lets specialists handle the hard parts.**
