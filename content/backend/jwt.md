---
title: "JWT: The Definitive Guide to JSON Web Tokens"
date: "2026-04-17"
tags: ["backend", "authentication", "JWT", "security", "API"]
excerpt: "A deep dive into JSON Web Tokens — how they are structured, how signing works, what claims are, how refresh tokens solve expiration, and the security pitfalls most developers miss."
---

# JWT: The Definitive Guide to JSON Web Tokens

You built a login system. It works. Then you add a second server, and suddenly neither server knows who the user is. That is the problem JWT was born to solve — and it solves it brilliantly, until you misuse it and accidentally hand attackers the keys to your entire system.

## What is a JWT?

A **JSON Web Token (JWT)** is a self-contained, digitally signed string that carries information (called **claims**) between two parties. It proves that a user is who they say they are — without the server needing to look anything up in a database.

Think of it like a **passport**. The government (your server) issues it. It has your photo, name, and nationality (your claims). It has a holographic seal that nobody can forge (the signature). Every border officer (every server in your system) can verify it independently — no phone call to the issuing government required.

A JWT looks like this:

```text
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoibm9iZWxAZXhhbXBsZS5jb20ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

That is three blocks of Base64URL-encoded text separated by dots:

```text
header . payload . signature
```

Each part has a specific job. Let us break them down.

## Why JWT Matters

### ❌ Problem: Sessions Do Not Scale

Traditional session-based auth stores login state on the server. User logs in → server creates a session in memory or Redis → server sends back a session ID cookie. On every request, the server looks up that session.

This works fine with one server. But the moment you add a second server behind a load balancer, you have a problem: Server A created the session, but the load balancer sent the next request to Server B. Server B has no idea who this user is. You need a shared session store (Redis, database), which adds complexity, latency, and a single point of failure.

### ✅ Solution: Self-Contained Tokens

JWT eliminates server-side state entirely. The token itself contains all the information the server needs to identify the user. Any server can verify the token using just the signing secret or public key — no database lookup, no shared session store, no Redis.

```text
Session approach:  Server creates state → stores it → looks it up on every request
JWT approach:      Server creates token → gives it to client → never stores anything
```

---

## JWT Structure: The Three Parts

### 1. Header — What Kind of Token Is This?

The header tells the receiver two things: the token type and the signing algorithm.

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- **`alg`** — the algorithm used to create the signature. Common values: `HS256`, `RS256`
- **`typ`** — always `JWT`

This is Base64URL-encoded to form the first part of the token. It is metadata, nothing secret.

### 2. Payload — The Actual Data

The payload contains **claims** — statements about the user (or any subject) that the server is making. This is the useful part.

```json
{
  "sub": "1234567890",
  "name": "Nobel",
  "email": "nobel@example.com",
  "role": "admin",
  "iat": 1716364800,
  "exp": 1716375600
}
```

Anyone can decode a JWT and read the payload. **It is not encrypted — it is just encoded.** Never put passwords, social security numbers, or API keys in the payload. Think of it like the printed page of a passport — visible to anyone who opens it, but tamper-proof because of the signature.

### 3. Signature — The Tamper-Proof Seal

The signature is what makes JWT trustworthy. It is computed from the header, the payload, and a secret key:

```text
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

If anyone changes even a single character in the header or payload, the signature will not match — and every server that verifies the token will reject it instantly.

### ❌ Problem: Anyone Could Fake a Token

Without a signature, a user could simply Base64-encode their own JSON, send it to your server, and claim to be an admin. Your server would have no way to know the token was forged.

### ✅ Solution: Cryptographic Signatures

The signing process uses a secret that only your server knows. When your server receives a token, it recomputes the signature using the same secret. If the computed signature matches the one on the token, the server knows two things:

1. **This token was issued by us** — only we know the secret
2. **Nobody has modified it** — any change to the header or payload would produce a different signature

---

## Encoding vs Encryption

This is the single most misunderstood thing about JWT.

**JWT is encoded, not encrypted.**

Anyone can take a JWT, paste it into jwt.io, and instantly read the payload. No secret key needed. This is by design — the goal of JWT is **integrity** (nobody tampered with it) and **authenticity** (we issued it), not **confidentiality** (nobody can read it).

```text
Encoding  → Reversibly transforms data into a different format (anyone can decode it)
Encryption → Makes data unreadable without a secret key (only authorized parties can read it)
Signing    → Proves data has not been tampered with (anyone can verify, only issuer can create)
```

JWT uses encoding (Base64URL) for the header and payload, and signing for verification. If you need the payload to be confidential, you need **JWE (JSON Web Encryption)** — a related but different standard.

### ❌ Problem: Developers Put Secrets in the Payload

Because "it looks encrypted" (a long string of random-looking characters), developers sometimes store sensitive data in JWT payloads — passwords, API keys, personal identification numbers.

### ✅ Solution: Only Put Non-Sensitive Claims in the Payload

A good JWT payload contains only what the server needs to identify and authorize the user: user ID, role, email, and standard metadata fields. Nothing that would cause harm if read by an attacker.

---

## Signing Algorithms

The algorithm determines how the signature is created and verified. The two most common families:

### HMAC (Symmetric) — HS256, HS384, HS512

One shared secret is used for both signing and verification. The server that creates the token and any server that verifies it must all know the same secret.

```text
Signing:    secret + header + payload → signature
Verifying:  same secret + header + payload → compare signatures
```

- Simple to set up — one secret, done
- Works well when only your own servers need to verify tokens
- The secret must be shared with every service that verifies tokens — a security risk if one service is compromised

### RSA (Asymmetric) — RS256, RS384, RS512

A **private key** signs the token. A **public key** verifies it. The private key never leaves the auth server. Any other service only needs the public key to verify tokens.

```text
Signing:    private key + header + payload → signature
Verifying:  public key + header + payload → compare signatures
```

- More secure — the signing key never leaves the auth server
- Ideal for microservices — each service gets the public key, but only the auth server can create tokens
- Slightly more complex to set up (key pair generation and distribution)

### Which Should You Use?

| Scenario | Algorithm | Why |
|----------|-----------|-----|
| Single server, simple app | HS256 | Easier to set up, one secret |
| Microservices | RS256 | Private key stays on auth server |
| Third-party token verification | RS256 | You share the public key, not the secret |
| High performance needed | HS256 | HMAC is faster than RSA |

---

## Claims: What Goes Inside a JWT

**Claims** are the key-value pairs in the payload. They come in three categories:

### Registered Claims (Standard Fields)

These have reserved three-letter names defined by the JWT specification:

| Claim | Name | Purpose |
|-------|------|---------|
| `iss` | Issuer | Who created the token (e.g., `"auth.myapp.com"`) |
| `sub` | Subject | Who the token is about (usually the user ID) |
| `aud` | Audience | Who the token is intended for (e.g., `"api.myapp.com"`) |
| `exp` | Expiration | When the token expires (Unix timestamp) |
| `nbf` | Not Before | When the token becomes valid |
| `iat` | Issued At | When the token was created |
| `jti` | JWT ID | Unique identifier for the token (useful for revocation) |

The most important one is **`exp`** — without it, the token is valid forever. A stolen token would grant permanent access.

### Public Claims

Custom claim names that might be shared across applications. They should be registered at the IANA JSON Web Token Registry to avoid collisions. In practice, most teams skip formal registration and just use descriptive names.

### Private Claims

Custom claims specific to your application. This is where you put your domain-specific data:

```json
{
  "sub": "user_42",
  "role": "admin",
  "department": "engineering",
  "permissions": ["read", "write", "delete"]
}
```

### ❌ Problem: Token Bloat

Developagers sometimes stuff the entire user profile into a JWT — name, address, avatar URL, preferences, order history. This makes the token huge. Every HTTP request now carries a massive token in the header, increasing bandwidth and latency.

### ✅ Solution: Keep Claims Minimal

Only include what the server needs to make an authorization decision: user ID, role, and expiration. If the frontend needs the user's name or avatar, fetch it from a `/me` endpoint separately. JWT is an identity card, not a user profile.

---

## Token Lifecycle

### Issuance: How a Token Is Born

```text
1. User submits email and password to POST /login
2. Server verifies credentials against the database
3. Server creates a JWT with user ID, role, and expiration
4. Server signs the token with its secret or private key
5. Server sends the token back to the client
```

### Usage: How the Client Sends It

The client includes the JWT in the `Authorization` header of every subsequent request:

```text
GET /api/users
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

The word `Bearer` tells the server: "the thing after this space is an access token."

### Verification: How the Server Checks It

```text
1. Server receives the request with the Authorization header
2. Server extracts the token from the header
3. Server decodes the header to find the algorithm
4. Server recomputes the signature using its secret or public key
5. Server compares the computed signature with the token's signature
6. If they match → token is authentic and untampered
7. Server checks the exp claim → token has not expired
8. Server reads the claims → knows who the user is and what they can do
9. Server processes the request
```

No database lookup. No session store. The token is self-contained.

### Expiration: What Happens When It Expires

Every token should have an `exp` claim. When the current time passes that timestamp, the token is rejected. This limits the damage window if a token is stolen.

But this creates a tension:

- **Short expiration** (15 minutes) → more secure, but users get logged out constantly
- **Long expiration** (30 days) → better user experience, but a stolen token is dangerous for a long time

This tension is resolved by **refresh tokens**.

---

## Refresh Tokens

### ❌ Problem: Short-Lived Tokens Annoy Users

If your access token expires in 15 minutes, the user has to log in again every 15 minutes. That is terrible user experience. But making the access token last 30 days means a stolen token gives an attacker a month of access.

### ✅ Solution: Two-Token System

A **refresh token** is a long-lived, one-time-use token stored securely on the server. The system works like this:

```text
Login:
  Server issues access token (expires in 15 minutes)
  Server issues refresh token (expires in 7 days)
  Client stores both

After 15 minutes (access token expires):
  Client sends refresh token to POST /auth/refresh
  Server verifies the refresh token
  Server issues a new access token (another 15 minutes)
  Client continues without the user noticing

After 7 days (refresh token expires):
  User must log in again with email and password
```

The access token is short-lived and stateless. The refresh token is long-lived but stored server-side, which means the server can revoke it at any time — if the user logs out, changes their password, or you detect suspicious activity.

### Refresh Token Security

Refresh tokens are more sensitive than access tokens because they last longer and can issue new access tokens. They must be:

- Stored in **httpOnly cookies** — not localStorage (where XSS can steal them)
- Transmitted over **HTTPS only**
- **One-time use** — each refresh token is consumed and a new one is issued alongside the new access token (called **refresh token rotation**)
- Stored in a **database** so the server can revoke them

---

## Token Storage: Where to Keep JWTs on the Client

### ❌ Problem: XSS Can Steal Tokens from localStorage

Many tutorials store JWTs in `localStorage`. This is convenient but dangerous. If your application has an XSS vulnerability (even in a third-party script), an attacker can run `localStorage.getItem('token')` and send the token to their server. Game over.

### ✅ Solution: httpOnly Cookies

When you store the token in an **httpOnly cookie**, JavaScript cannot access it. The browser automatically includes it in requests to your API. Even if an attacker injects a script into your page, they cannot read the cookie.

| Storage Method | XSS-Proof | CSRF-Proof | Verdict |
|---------------|-----------|------------|---------|
| localStorage | No | Yes | Vulnerable to XSS |
| httpOnly cookie | Yes | No | Vulnerable to CSRF |
| httpOnly cookie + CSRF token | Yes | Yes | Most secure option |

If you use httpOnly cookies, you must also implement **CSRF protection** — because the browser sends cookies automatically, a malicious website could trick the user's browser into making a request to your API. CSRF tokens (or SameSite cookie attribute) prevent this.

---

## Token Revocation: The Hard Problem

### ❌ Problem: JWTs Cannot Be Easily Revoked

This is JWT's biggest trade-off. Because JWTs are stateless — the server does not store them — the server has no way to invalidate a token before it expires. If an attacker steals a token with a 1-hour expiration, they have a full hour of access. Even if the user changes their password or clicks "log out," the stolen token remains valid.

### ✅ Solutions (Pick One Based on Your Needs)

**Short expiration + Refresh tokens** — the simplest approach. Access tokens last 15 minutes. Even if stolen, the damage window is small. Refresh tokens are server-side and can be revoked.

**Token blacklist** — maintain a list of revoked token IDs (using the `jti` claim) in Redis or your database. On every request, check if the token is blacklisted. This re-introduces state, which undermines one of JWT's core benefits, but gives you instant revocation.

**Token versioning** — store a `tokenVersion` field on the user record in the database. Include this version in the JWT payload. When the user changes their password or logs out, increment the version. On each request, compare the version in the token with the version in the database. If they do not match, the token is rejected.

No solution is perfect. The right choice depends on your security requirements and how much state you are willing to reintroduce.

---

## Security Pitfalls

### ❌ Algorithm Confusion Attack

Some JWT libraries accept `alg: "none"` in the header, which means "this token has no signature." An attacker could modify the payload to `{"role": "admin"}`, change the algorithm to `none`, and strip the signature. The server, if misconfigured, would accept it as valid.

### ✅ Always Specify the Expected Algorithm

Never trust the `alg` field from the token header. Always configure your verification library with the exact algorithm you use for signing:

```javascript
// Specify the algorithm explicitly — never read it from the token
jwt.verify(token, secret, { algorithms: ['HS256'] });
```

### ❌ Weak Signing Secrets

Using `"secret"`, `"password"`, or `"my-app-key"` as your HMAC secret makes it trivial for an attacker to brute-force the signature and forge their own tokens.

### ✅ Use Long, Random Secrets

Generate your secret with a cryptographically secure random generator. At least 256 bits (32 bytes). Store it in environment variables or a secret manager — never in source code.

### ❌ Not Validating All Claims

Verifying the signature is not enough. You must also check:

- **`exp`** — has the token expired?
- **`iss`** — was this token issued by our auth server?
- **`aud`** — is this token intended for our API?
- **`nbf`** — is the token active yet?

A token with a valid signature but the wrong issuer or audience should be rejected.

### ❌ Transmitting Tokens Over HTTP

Sending a JWT over plain HTTP means anyone on the network can intercept it. The token is encoded, not encrypted — the payload is readable by anyone.

### ✅ Always Use HTTPS

Every endpoint that sends, receives, or verifies tokens must use HTTPS. No exceptions.

---

## JWT Cheat Sheet

| Concept | Key Point |
|---------|-----------|
| **Structure** | Three parts: `header.payload.signature`, separated by dots |
| **Encoding** | Base64URL encoded — not encrypted. Anyone can read the payload. |
| **Integrity** | The signature proves the token was not tampered with. |
| **Authenticity** | Only the holder of the secret/private key can create valid signatures. |
| **Stateless** | No server-side storage needed. Any server with the secret can verify. |
| **Claims** | `sub` (who), `exp` (when it expires), `iat` (when issued), `role` (permissions) |
| **Expiration** | Always set `exp`. Tokens without expiration are valid forever. |
| **Algorithms** | HS256 (shared secret) for single server. RS256 (public/private key pair) for microservices. |
| **Refresh tokens** | Long-lived, server-stored tokens that issue new access tokens without re-login. |
| **Storage** | httpOnly cookies + CSRF protection. Not localStorage. |
| **Revocation** | Short expiration + refresh tokens, or blacklist, or token versioning. |
| **Never** | Put secrets in the payload, use `alg: none`, use weak secrets, send over HTTP. |

## The Takeaway

JWT is not a magic bullet — it is a trade-off. You gain stateless scalability and microservice-friendly authentication, but you lose easy revocation and must carefully manage token lifecycle, storage, and expiration. Use it when you need its strengths (distributed systems, mobile backends), respect its limitations (never put secrets in the payload, always set expiration, use refresh tokens), and it will serve you well.

For the broader comparison between JWT and session-based authentication, see [Understanding Authentication: JWT vs Session-Based Auth](/post/backend/jwt-vs-session-auth).
