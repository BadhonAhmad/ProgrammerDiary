---
title: "CSRF Protection: Defending Against Invisible Attacks"
date: "2026-04-17"
tags: ["backend", "csrf", "security", "cookies", "Node.js", "Express"]
excerpt: "Learn how CSRF attacks trick browsers into making authenticated requests on behalf of users — and how to stop them with tokens and SameSite cookies."
---

# CSRF Protection: Defending Against Invisible Attacks

You're logged into your bank. You visit a funny meme site. The meme site silently transfers money from your bank account. You never clicked anything. That's CSRF.

## What is CSRF?

**CSRF** stands for **Cross-Site Request Forgery**. It's an attack where a malicious website tricks a user's browser into making an authenticated request to a different website — without the user knowing.

The attack exploits the fact that browsers automatically include **cookies** (including session cookies) with every request to a domain. If you're logged into `bank.com`, your browser sends your session cookie with every request to `bank.com` — even if the request originated from `evil.com`.

## Why Does It Matter?

❌ **Problem:** Imagine you're logged into your email. You visit `evil.com` which contains this hidden form:

```text
<!-- On evil.com — you never see this -->
<form action="https://email.com/api/change-password" method="POST">
  <input type="hidden" name="newPassword" value="hacked123">
</form>
<script>
  document.forms[0].submit();
</script>
```

Your browser sends the request to `email.com` **with your session cookie**. The email server thinks it's you making a legitimate password change. Your password is now changed — and you had no idea.

This works because:
1. You're authenticated (session cookie exists)
2. Browsers auto-include cookies with cross-site requests
3. The server can't tell the request came from `evil.com`

✅ **Solution:** CSRF protection ensures that even if a browser sends an authenticated request, the server can verify it was **intentionally** initiated by the user — not forged by a third-party site.

## How CSRF Attacks Work

### The Attack Flow

```text
1. User logs into bank.com → browser stores session cookie
2. User visits evil.com (or clicks a link in an email)
3. evil.com contains:
     - A hidden form that POSTs to bank.com/transfer
     - An img tag: <img src="bank.com/transfer?to=attacker&amount=10000">
     - A fetch() call to bank.com
4. Browser sends the request WITH the session cookie
5. bank.com processes it — money transferred
```

### What Makes CSRF Dangerous

- **Invisible to the user** — no visual indication
- **Uses the user's own credentials** — no need to steal passwords
- **Works with any cookie-based auth** — sessions, remember-me tokens
- **Can target any HTTP method** — GET, POST, PUT, DELETE

### What CSRF Cannot Do

- Cannot steal data (response goes to the attacker's site? No — SOP blocks it)
- Cannot read responses from the target server
- Cannot bypass CORS for reading data
- Only forces the browser to **send** requests

## CSRF Protection Methods

### Method 1: CSRF Tokens (Synchronizer Token Pattern)

The most common defense. The server generates a random token, embeds it in forms, and verifies it on submission.

```text
// Server: Generate CSRF token
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});
```

```text
<!-- Frontend: Include token in forms -->
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="{{csrfToken}}">
  <input name="amount">
  <button>Transfer</button>
</form>
```

```text
// Server: Verify token on POST
app.post("/transfer", (req, res) => {
  if (req.body._csrf !== req.session.csrfToken) {
    return res.status(403).send("CSRF token mismatch");
  }
  // Process transfer
});
```

**Why this works:** The attacker's site at `evil.com` cannot read the CSRF token from `bank.com` (Same-Origin Policy), so it can't include the correct token in the forged request.

### Method 2: SameSite Cookie Attribute

The modern, browser-based defense. Set the `SameSite` attribute on cookies to control cross-site behavior.

```text
Set-Cookie: sessionId=abc123; SameSite=Strict; Secure; HttpOnly
```

| SameSite Value | Behavior |
|---|---|
| `Strict` | Cookie **never** sent on cross-site requests. Most secure but breaks "log in with link" flows. |
| `Lax` | Cookie sent on top-level GET navigation (clicking a link), but **not** on forms, AJAX, or img tags. Good balance. |
| `None` | Cookie sent on all requests. Requires `Secure` flag. Needed for third-party integrations. |

```text
// Express session with SameSite
app.use(session({
  secret: "your-secret",
  cookie: {
    httpOnly: true,
    secure: true,          // HTTPS only
    sameSite: "lax"        // Blocks CSRF on forms/AJAX
  }
}));
```

**`SameSite=Lax`** is the default in modern browsers. It blocks most CSRF attacks while keeping normal link navigation working.

### Method 3: Double Submit Cookie

Store the CSRF token in a cookie and also require it in the request body or header. The server compares both.

```text
// Server sets CSRF cookie
res.cookie("XSRF-TOKEN", csrfToken, { httpOnly: false });

// Frontend reads cookie and sends in header
fetch("/api/data", {
  headers: {
    "X-CSRF-Token": getCookie("XSRF-TOKEN")
  }
});

// Server compares
app.use((req, res, next) => {
  const cookieToken = req.cookies["XSRF-TOKEN"];
  const headerToken = req.headers["x-csrf-token"];
  if (cookieToken !== headerToken) {
    return res.status(403).send("CSRF validation failed");
  }
  next();
});
```

This works because `evil.com` can't read the cookie (different origin) and can't set custom headers on cross-origin requests.

### Method 4: Custom Request Headers

Require a custom header (like `X-Requested-With`) on all state-changing requests.

```text
// Frontend
fetch("/api/transfer", {
  method: "POST",
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
});
```

Cross-origin requests with custom headers trigger a **preflight** (OPTIONS) request. If your server doesn't approve the origin, the actual request never happens. Simple HTML forms can't add custom headers.

### Method 5: Origin and Referer Header Verification

Check the `Origin` or `Referer` header to ensure the request came from your own domain.

```text
app.use((req, res, next) => {
  const origin = req.headers.origin || req.headers.referer;
  if (origin && !origin.startsWith("https://myapp.com")) {
    return res.status(403).send("Invalid origin");
  }
  next();
});
```

Best used as a **defense in depth** layer, not the only protection — headers can sometimes be missing.

## Using the `csurf` Package (Express)

```text
npm install csurf
```

```text
const csrf = require("csurf");
const csrfProtection = csrf({ cookie: true });

// Apply to routes that render forms
app.get("/transfer", csrfProtection, (req, res) => {
  res.render("transfer", { csrfToken: req.csrfToken() });
});

// Verify on submission
app.post("/transfer", csrfProtection, (req, res) => {
  // Token verified automatically — throws error if invalid
  res.send("Transfer successful");
});
```

## CSRF and Token-Based Auth (JWT)

CSRF primarily affects **cookie-based** authentication. If you store JWT in `localStorage` or `sessionStorage` and send it via the `Authorization` header:

- The browser does **not** automatically include it in requests
- `evil.com` can't access `localStorage` from a different origin
- CSRF attacks don't work against this pattern

However, if you store JWT in a **cookie** (httpOnly), CSRF becomes relevant again — use SameSite cookies or CSRF tokens.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **CSRF** | Tricks browser into making authenticated requests to another site |
| **CSRF Token** | Server-generated secret included in forms — attacker can't read it |
| **SameSite Cookie** | Browser blocks cross-site cookie sending (`Lax` or `Strict`) |
| **Double Submit** | Token in cookie + header — server compares both |
| **Custom Headers** | Requires `X-Requested-With` — triggers preflight |
| **Origin Check** | Verify request came from your domain |
| **JWT in localStorage** | Immune to CSRF (browser doesn't auto-send) |
| **JWT in cookies** | Still vulnerable to CSRF — add SameSite |
| **SameSite=Lax** | Good default — blocks form/AJAX CSRF, allows link navigation |

**CSRF attacks are invisible — your users never know they happened. Your defense has to be just as automatic.**
