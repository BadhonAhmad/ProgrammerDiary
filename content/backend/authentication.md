---
title: "Authentication: Proving Who You Are"
date: "2026-04-17"
tags: ["backend", "authentication", "security", "Node.js", "Express"]
excerpt: "Learn how authentication works in backend systems — from login flows to token verification, and why getting it wrong costs companies millions."
---

# Authentication: Proving Who You Are

Someone knocks on your door. You don't just open it — you check who's there first. That's authentication.

## What is Authentication?

**Authentication** is the process of verifying that a user is who they claim to be. It answers one question: *"Are you really who you say you are?"*

When you type your email and password into a login form, the backend checks those credentials against its database. If they match — you're in. If not — rejected.

Authentication is **not** the same as authorization. Authentication checks **identity** (who are you?). Authorization checks **permissions** (what are you allowed to do?).

## Why Does It Matter?

❌ **Problem:** Imagine a bank that doesn't verify identities. Anyone could walk in and withdraw money from any account. In software, weak authentication means attackers can impersonate users, steal data, and cause chaos.

The cost isn't theoretical. Data breaches caused by compromised credentials cost companies an average of **$4.5 million** per incident.

✅ **Solution:** Proper authentication ensures only legitimate users access their own resources — and attackers get stopped at the door.

## How Authentication Works

### Step 1: User Submits Credentials

The user sends something they **know** (password), **have** (phone for OTP), or **are** (fingerprint) to the server.

```text
POST /login
{
  "email": "dev@example.com",
  "password": "my-secret-password"
}
```

### Step 2: Server Verifies Credentials

The server looks up the user by email, then compares the submitted password against the stored **hashed** password (never stored in plain text).

```text
1. Find user by email
2. Hash the submitted password
3. Compare hash with stored hash
4. If match → authentication success
5. If no match → reject with 401 Unauthorized
```

### Step 3: Server Creates a Session or Token

After successful verification, the server creates proof of authentication — either a **session** stored server-side or a **JWT token** sent to the client.

### Step 4: Client Uses Proof for Future Requests

The client includes the session cookie or token in every subsequent request. The server verifies it and knows who the user is without asking for credentials again.

## Types of Authentication

### Password-Based Authentication

The most common form. User provides email + password.

- Simple to implement
- Vulnerable to brute force, credential stuffing, phishing
- Always combine with **password hashing** (bcryptjs) and **rate limiting**

### Multi-Factor Authentication (MFA)

Requires two or more verification factors:

| Factor Type | Examples |
|---|---|
| Something you know | Password, PIN |
| Something you have | Phone (OTP), Hardware key (YubiKey) |
| Something you are | Fingerprint, Face ID |

MFA blocks **99.9%** of account compromise attacks. Even if someone steals your password, they can't get in without the second factor.

### Token-Based Authentication

After login, the server issues a **token** (usually JWT). The client stores it and sends it with each request.

```text
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

- Stateless — server doesn't store session data
- Great for APIs and mobile apps
- Tokens expire and need refresh mechanisms

### Session-Based Authentication

After login, the server creates a **session** stored in memory or database, and sends a **cookie** with the session ID to the client.

```text
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
```

- Stateful — server tracks active sessions
- Easy to invalidate (just delete the session)
- Works well for traditional web apps

### OAuth / Social Login

Instead of managing credentials yourself, you delegate authentication to a trusted provider (Google, GitHub, Facebook).

- Users don't need to create yet another password
- You don't handle sensitive credential storage
- Requires understanding of OAuth 2.0 flows

## Authentication Flow — Complete Picture

```text
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Client   │         │  Server  │         │ Database │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │  POST /login       │                    │
     │  {email, password} │                    │
     │───────────────────>│                    │
     │                    │  Find user by email│
     │                    │───────────────────>│
     │                    │  Return user + hash│
     │                    │<───────────────────│
     │                    │                    │
     │                    │  Compare passwords │
     │                    │  (bcrypt.compare)  │
     │                    │                    │
     │  200 OK + Token    │                    │
     │  or Session Cookie │                    │
     │<───────────────────│                    │
     │                    │                    │
     │  GET /profile      │                    │
     │  Authorization:    │                    │
     │  Bearer <token>    │                    │
     │───────────────────>│                    │
     │                    │  Verify token      │
     │                    │  or session        │
     │  200 + User Data   │                    │
     │<───────────────────│                    │
```

## Common Authentication Pitfalls

### ❌ Storing Passwords in Plain Text

If your database leaks, every user's password is exposed. Always use **bcrypt** to hash passwords before storing.

### ❌ Using Weak Password Policies

Allowing "123456" or "password" is an invitation for attacks. Enforce minimum length, complexity, and check against breached password lists.

### ❌ Not Implementing Account Lockout

Without rate limiting on login attempts, attackers can brute-force passwords. Lock accounts after 5-10 failed attempts.

### ❌ Sending Credentials Over HTTP

Always use **HTTPS**. Credentials sent over plain HTTP can be intercepted by anyone on the network.

### ❌ Never Expiring Sessions

A session that never expires means a stolen cookie works forever. Set reasonable expiration times.

## Authentication Best Practices

| Practice | Why |
|---|---|
| Hash passwords with bcrypt | Protects users even if DB is leaked |
| Use HTTPS everywhere | Prevents credential interception |
| Implement rate limiting | Stops brute-force attacks |
| Use HttpOnly, Secure cookies | Prevents XSS from stealing cookies |
| Enable MFA | Blocks 99.9% of account compromise |
| Set token/session expiration | Limits damage from stolen credentials |
| Log authentication events | Helps detect suspicious activity |
| Use constant-time comparison | Prevents timing attacks |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Authentication** | Verifies identity — "Who are you?" |
| **Password Auth** | Simple but needs hashing + rate limiting |
| **MFA** | Multiple factors — blocks 99.9% of attacks |
| **Token Auth (JWT)** | Stateless, good for APIs |
| **Session Auth** | Stateful, easy to invalidate |
| **OAuth** | Delegate to Google, GitHub, etc. |
| **bcrypt** | Hash passwords — never store plain text |
| **HTTPS** | Encrypt all credential transmission |
| **Rate Limiting** | Prevent brute-force on login endpoints |

**If your authentication is weak, nothing else matters — attackers walk right through the front door.**
