---
title: "Sessions & Cookies: How the Web Remembers Who You Are"
date: "2026-04-17"
tags: ["backend", "authentication", "sessions", "cookies", "security"]
excerpt: "A deep dive into how sessions and cookies work — from the cookie mechanism itself, to session storage, to the security flags that keep user login safe in production."
---

# Sessions & Cookies: How the Web Remember Who You Are

HTTP has no memory. Every request is a blank slate — the server has no idea who you are, whether you just logged in, or whether you have been browsing for hours. Sessions and cookies are the two technologies that fix this, together. They are the reason you do not have to type your password on every single page load.

## What Are Sessions and Cookies?

**Cookies** are small pieces of data that the server tells the browser to store and send back with every future request. Think of them like a **handstamp at a concert venue** — the bouncer gives you a stamp when you enter, and every time you walk back in, they check the stamp instead of asking for your ticket again.

**Sessions** are the server-side storage that holds user state (login status, shopping cart, preferences). The cookie does not hold all that data — it holds a **session ID**, which is a reference to the server-side data. The stamp does not have your name on it — it just tells the bouncer to look you up in the guest list.

```text
Cookie:    "Here is my stamp" → carries a session ID
Session:   "The guest list"   → stores the actual user data on the server
```

Together, they create the illusion that HTTP remembers who you are across requests.

## Why It Matters

### ❌ Problem: HTTP Is Stateless

Every HTTP request is independent. The server processes it, sends a response, and forgets you existed. This is by design — it makes HTTP simple and reliable. But it means the server has no way to connect request #47 from request #48. You add an item to your cart on request #47, and by request #48 the server has no idea what is in your cart.

### ✅ Solution: Cookies Bridge Requests

The server sends a `Set-Cookie` header in its response. The browser stores that cookie and automatically includes it in every subsequent request to the same domain. Now the server can connect request #47 to request #48 — they both carry the same cookie. The server looks up the session data tied to that cookie, and your cart is still there.

---

## How Cookies Work

### The Cookie Lifecycle

```text
1. Browser sends: GET /login (no cookie yet)
2. Server responds: Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
3. Browser stores the cookie
4. Browser sends: GET /dashboard
   Cookie: sessionId=abc123
5. Server reads the cookie, looks up session, serves the dashboard
6. This repeats on every single request — automatically
```

The browser handles the storage and transmission. Your JavaScript does not need to manually attach cookies to requests (unless you are using `fetch` with credentials, which we will cover later).

### What a Cookie Looks Like

A cookie has a **name**, a **value**, and several **attributes** that control its behavior:

```text
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400
```

| Attribute | What It Does |
|-----------|-------------|
| `HttpOnly` | JavaScript cannot access this cookie — protects against XSS theft |
| `Secure` | Cookie is only sent over HTTPS — prevents interception on HTTP |
| `SameSite` | Controls when cookies are sent with cross-site requests — prevents CSRF |
| `Path` | Cookie is only sent for requests matching this path |
| `Domain` | Cookie is only sent for requests to this domain and subdomains |
| `Max-Age` | How long (in seconds) the cookie lives before the browser deletes it |
| `Expires` | Specific date/time when the cookie expires (older format, prefer Max-Age) |

We will explore the security attributes in depth later — they are the most important part.

### Cookie Scope Rules

A cookie is only sent to the server that set it (and its subdomains). A cookie set by `api.example.com` is not sent to `api.different.com`. This is a fundamental security feature — it prevents one website from reading another website's cookies.

### ❌ Problem: Developers Store Too Much in Cookies

Because cookies are easy to set, developers sometimes store entire user profiles, preferences, or even authentication tokens directly in cookie values. Cookies are sent on **every single request** to the domain — images, stylesheets, API calls, everything. Bloated cookies waste bandwidth on every HTTP request.

### ✅ Solution: Store an ID, Not the Data

The cookie should contain only a **session ID** — a small, random string that references the actual data stored on the server. The server-side session holds the user data. The cookie is just the key to look it up.

---

## How Sessions Work

### The Session Flow

```text
1. User submits POST /login with email and password
2. Server verifies credentials against the database
3. Server creates a session object:
   { id: "sess_abc123", userId: 42, role: "user", createdAt: "..." }
4. Server stores this session in its session store (memory, Redis, database)
5. Server sends the response with a cookie: Set-Cookie: sessionId=sess_abc123
6. On every subsequent request, the browser sends the cookie automatically
7. Server receives the cookie, looks up the session in the store
8. If session exists and is valid → user is authenticated
9. If session does not exist → user is not logged in
```

### Session Storage Options

Where you store session data has huge implications for scalability and reliability.

#### In-Memory Storage

Sessions live in the server's RAM. Fastest possible access. But:

- **Lost on restart** — restart your server, every user is logged out
- **Not shared** — with multiple servers behind a load balancer, Server A's sessions are invisible to Server B
- **Memory limits** — millions of sessions will exhaust your RAM

Fine for development. Dangerous for production.

#### Database Storage

Sessions are stored in a database table. Every request requires a database query to look up the session. This means:

- **Survives restarts** — sessions persist across server reboots
- **Shared across servers** — any server can read any session
- **Slower** — a database query on every request adds latency
- **Cleanup needed** — expired sessions pile up unless you prune them regularly

#### Redis (Recommended for Production)

**Redis** is an in-memory data store designed for fast read/write operations. It is the standard choice for session storage in production because:

- **Fast** — data lives in memory, reads take microseconds
- **Shared** — all your servers connect to the same Redis instance
- **TTL support** — set an expiration time on each session, and Redis deletes it automatically when it expires
- **Survives app restarts** — session data lives in Redis, not in your Node.js process

```text
Server A  →  Redis (sessions live here)  ←  Server B  ←  Server C
                All servers share the same session data
```

### ❌ Problem: Session Fixation Attacks

An attacker creates a session ID, tricks a victim into using it (by sending a link with the session ID in the URL), and then waits for the victim to log in. Since the attacker knows the session ID, they can now access the victim's account.

### ✅ Solution: Regenerate Session ID on Login

After the user successfully authenticates, destroy the old session and create a brand new one with a new ID. Even if the attacker knew the pre-login session ID, it is now useless.

---

## Session vs JWT: The Core Difference

Since we have a [dedicated JWT article](/post/backend/jwt), here is the essential contrast:

| Aspect | Sessions | JWT |
|--------|----------|-----|
| Where state lives | Server (memory, Redis, database) | Inside the token itself |
| What the client holds | A small session ID (cookie) | A self-contained token (header) |
| Server storage needed | Yes | No |
| Revocation | Instant — delete the session | Hard — token is valid until expiry |
| Horizontal scaling | Needs shared store (Redis) | Any server can verify independently |
| Token size | Tiny (just an ID) | Can be large (contains claims) |
| Best for | Traditional web apps, admin panels | Microservices, mobile backends, SPAs |

**Sessions are stateful** — the server remembers. **JWT is stateless** — the token carries the memory.

Neither is universally better. Sessions give you more control (instant logout, immediate revocation). JWT gives you better scalability in distributed systems.

---

## Cookie Security Flags

This is where most session-based systems get compromised — not because sessions are broken, but because cookie attributes are misconfigured. These flags are not optional extras. They are essential security measures.

### HttpOnly

### ❌ Problem: XSS Steals Cookies

Without `HttpOnly`, JavaScript running on your page can read cookies using `document.cookie`. If an attacker injects a script (XSS), they can read the session cookie and send it to their server. They now have the victim's session and full account access.

### ✅ Solution: HttpOnly Prevents JavaScript Access

Setting `HttpOnly` tells the browser: this cookie is off-limits to JavaScript. `document.cookie` will not include it. XSS attacks can no longer steal the session ID. The browser still sends the cookie with HTTP requests automatically — only scripts cannot read it.

### Secure

### ❌ Problem: Cookies Sent Over HTTP Are Visible

Without the `Secure` flag, the browser sends the cookie over both HTTP and HTTPS connections. If your site is accessible over HTTP (even unintentionally), the session cookie is sent in plain text. Anyone monitoring the network can intercept it.

### ✅ Solution: Secure Restricts Cookies to HTTPS

Setting `Secure` tells the browser to only send this cookie over HTTPS connections. Even if the user types `http://yoursite.com`, the cookie will not be sent. The server must redirect to HTTPS, and the cookie is only included after the connection is encrypted.

### SameSite

### ❌ Problem: CSRF Sends Cookies Without the User Knowing

Without `SameSite`, the browser sends cookies with **any** request to your domain — even requests initiated by a *different* website. An attacker creates a page on `evil.com` with a hidden form that submits to `yourbank.com/transfer`. The victim's browser includes their session cookie automatically. The bank processes the transfer because the session is valid.

This is **Cross-Site Request Forgery (CSRF)**.

### ✅ Solution: SameSite Controls Cross-Site Cookie Behavior

The `SameSite` attribute has three values:

- **`Strict`** — the cookie is only sent when the user is already on your site. Clicking a link from an email, another website, or Slack? Cookie is not sent. Most secure, but can break UX (external links to your site require re-login).

- **`Lax`** — the cookie is sent for top-level navigations (clicking a link to your site) but not for background requests (forms, AJAX, images from other sites). Good balance of security and usability. This is the default in modern browsers.

- **`None`** — the cookie is sent with all requests, including cross-site. You must also set `Secure` when using `None`. Only use this if you genuinely need cross-site cookies (e.g., third-party embeds, SSO flows).

For most applications, **`SameSite=Lax`** is the right choice.

### Cookie Flags Summary

```text
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Lax; Max-Age=86400; Path=/
```

| Flag | Protects Against | Mechanism |
|------|-----------------|-----------|
| `HttpOnly` | XSS (cookie theft) | JavaScript cannot read the cookie |
| `Secure` | Network interception | Cookie only sent over HTTPS |
| `SameSite=Lax` | CSRF (cross-site forgery) | Cookie not sent with cross-site POST requests |
| `Max-Age` | Stale sessions | Browser deletes the cookie after expiry |
| `Path=/` | Scope creep | Cookie only sent for matching paths |

---

## Session Expiration and Management

### Idle Timeout vs Absolute Timeout

**Idle timeout** — the session expires after a period of inactivity. If the user does not make a request for 30 minutes, the session is destroyed. If they are actively browsing, the timeout keeps resetting. This is user-friendly — active users are not interrupted.

**Absolute timeout** — the session expires after a fixed duration regardless of activity. Even if the user is actively browsing, after 24 hours the session ends and they must log in again. This limits the window of opportunity for session hijacking.

Most production systems use both: a 30-minute idle timeout and a 7-day absolute timeout.

### ❌ Problem: Sessions Accumulate Forever

Without cleanup, expired sessions pile up in your session store. Over weeks and months, your Redis or database fills with millions of dead sessions, consuming memory and slowing down lookups.

### ✅ Solution: TTL-Based Expiration

Set a **time-to-live (TTL)** on each session. When a session is created, it gets an expiration timestamp. Redis and databases support automatic deletion of expired records. Every time the user makes a request, the TTL is extended (sliding expiration). This keeps the store clean — inactive sessions disappear automatically.

---

## CSRF Protection in Depth

### ❌ Problem: Even With SameSite, Some Attacks Succeed

`SameSite=Lax` protects against most CSRF attacks, but not all scenarios are covered — particularly same-site attacks or older browsers that do not support the attribute.

### ✅ Solution: CSRF Tokens

A **CSRF token** is a random, unique value generated by the server and embedded in every form or state-changing request. When the user submits the form, the server verifies the token matches. An attacker cannot forge this because they do not know the token — it is tied to the user's session and changes with every request or session.

```text
How CSRF tokens work:
1. Server generates a random token, stores it in the session
2. Server includes the token in every form as a hidden field
3. User submits the form → token is sent along with the session cookie
4. Server compares the submitted token with the one stored in the session
5. If they match → legitimate request → process it
6. If they do not match or are missing → reject it
```

An attacker on `evil.com` can send the session cookie (automatically), but they cannot include the correct CSRF token because they never received it — it is embedded in your page's HTML, not stored in a cookie.

---

## Cookies vs localStorage vs SessionStorage

Developers often ask where to store authentication data. The answer matters for security.

| Storage | Accessible by JS | Sent with Requests | Expires | XSS-Safe |
|---------|------------------|-------------------|---------|----------|
| **Cookie (HttpOnly)** | No | Yes (automatic) | Configurable | Yes |
| **Cookie (no HttpOnly)** | Yes | Yes (automatic) | Configurable | No |
| **localStorage** | Yes | No (must attach manually) | Never (until cleared) | No |
| **sessionStorage** | Yes | No (must attach manually) | Tab closes | No |

### ❌ Problem: Using localStorage for Session Tokens

Storing session IDs or auth tokens in `localStorage` means any script running on your page can read them. A single XSS vulnerability — even in a third-party analytics script — gives an attacker full access to every user's authentication credentials.

### ✅ Solution: Use HttpOnly Cookies for Authentication

Session identifiers belong in `HttpOnly` cookies. They are automatically sent with requests, invisible to JavaScript, and protected by `Secure` and `SameSite` flags. Use `localStorage` for non-sensitive preferences (theme, language), never for anything related to authentication.

---

## Real-World Considerations

### Load Balancing and Sticky Sessions

With multiple servers behind a load balancer, you have two options:

**Sticky sessions (session affinity):** the load balancer always routes the same user to the same server. Sessions live in that server's memory. Simple, but creates uneven load — one server might be overwhelmed while others are idle. If that server goes down, all its users are logged out.

**Shared session store (Redis):** all servers read and write sessions to the same Redis instance. Any server can handle any user's request. This is the standard production approach.

### Session Size

Keep sessions lean. Store only what is needed for authentication and authorization — user ID, role, and maybe a few flags. Do not store entire user objects, large arrays, or binary data. Session data is loaded from the store on every single request — bloated sessions add latency to every page load and API call.

### Logging Out

Proper logout is more than clearing the cookie on the client:

1. **Destroy the session on the server** — delete it from Redis or the database
2. **Clear the cookie** — send a `Set-Cookie` header with `Max-Age=0` to tell the browser to delete it
3. **Invalidate any related tokens** — if you use refresh tokens alongside sessions, revoke them too

Simply clearing the cookie on the client side leaves the session alive on the server. If an attacker captured the session ID before logout, they can still use it until it naturally expires.

---

## Cheat Sheet

| Concept | Key Point |
|---------|-----------|
| **Cookie** | Small data the server tells the browser to store and resend on every request |
| **Session** | Server-side storage for user state, referenced by a session ID cookie |
| **HttpOnly** | Blocks JavaScript from reading the cookie — prevents XSS theft |
| **Secure** | Cookie only sent over HTTPS — prevents network interception |
| **SameSite** | Controls cross-site cookie behavior — prevents CSRF |
| **Session store** | Where sessions live — Redis for production, memory for dev only |
| **Idle timeout** | Session expires after inactivity (e.g., 30 minutes) |
| **Absolute timeout** | Session expires after a fixed duration regardless of activity (e.g., 7 days) |
| **CSRF token** | Random value verified on state-changing requests — second layer beyond SameSite |
| **Session regeneration** | New session ID after login — prevents session fixation |
| **Logout** | Destroy server session + clear cookie — not just one or the other |
| **Session vs JWT** | Sessions: stateful, server-controlled, instant revocation. JWT: stateless, self-contained, hard to revoke |

## The Takeaway

Sessions and cookies are the oldest and most battle-tested approach to keeping users logged in on the web — and for good reason. The server stays in full control: you can revoke sessions instantly, enforce timeouts, and manage access in real time. The trade-off is that you need a shared session store when you scale beyond one server. Set every security flag (`HttpOnly`, `Secure`, `SameSite`), use Redis in production, regenerate session IDs on login, and sessions will serve you reliably for years.

For the stateless alternative, see [JWT: The Definitive Guide to JSON Web Tokens](/post/backend/jwt). For the full comparison, see [Understanding Authentication: JWT vs Session-Based Auth](/post/backend/jwt-vs-session-auth).
