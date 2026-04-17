---
title: "bcryptjs: Password Hashing Done Right in Node.js"
date: "2026-04-17"
tags: ["backend", "security", "bcryptjs", "Node.js", "authentication"]
excerpt: "Learn why password hashing matters, how bcryptjs protects user credentials in Node.js applications, and how to implement secure registration and login flows from scratch."
---

# bcryptjs: Password Hashing Done Right in Node.js

Every time a user signs up for your application, they trust you with their password. If you store that password carelessly and your database ever gets compromised, every single user is at risk. **bcryptjs** is one of the most trusted tools in the Node.js ecosystem for making sure that never happens. In this article, we will explore password hashing from the ground up and learn how to use bcryptjs effectively in your backend applications.

## 1. Introduction

### What is Password Hashing?

**Password hashing** is the process of converting a plain-text password into a fixed-length string of characters that cannot be reversed back to the original password. It is a one-way function — you can turn "mypassword123" into a hash, but you cannot turn the hash back into "mypassword123".

```text
"mypassword123"  →  $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJHd1F5d4ei
```

Instead of storing the actual password, you store this hash. When the user logs in, you hash the password they entered and compare it with the stored hash. If they match, the login succeeds — and you never had to store the real password at all.

### Why Storing Plain-Text Passwords is Dangerous

Storing passwords as plain text is one of the most dangerous mistakes a developer can make. Consider what happens if your database is leaked — through a hack, a misconfigured server, or an insider threat:

- Every user's password is exposed immediately
- Attackers can try those passwords on other websites (most people reuse passwords)
- You cannot "undo" the leak — the passwords are out there forever
- Users lose trust in your application entirely

Major data breaches at companies like LinkedIn, Adobe, and Yahoo were catastrophic precisely because passwords were stored insecurely. Password hashing exists to make sure that even if your database is compromised, attackers cannot recover the original passwords.

### Brief Introduction to bcryptjs

**bcryptjs** is a pure JavaScript implementation of the **bcrypt** password hashing algorithm, designed specifically for Node.js applications. It provides a simple API to hash passwords securely and verify them during authentication. It is widely used in production applications and has millions of weekly downloads on npm.

## 2. The Problem bcryptjs Solves

### Risks of Storing Passwords in Plain Text

Imagine a `users` table like this:

```text
| id | username | password      |
|----|----------|---------------|
| 1  | nobel    | mySecret123   |
| 2  | alice    | password456   |
| 3  | bob      | admin2026     |
```

If an attacker gains access to this table, they instantly have every user's password. No effort required.

### Common Attacks

**Database leaks** — SQL injection, misconfigured permissions, or compromised servers can expose your entire database. If passwords are in plain text, the damage is immediate and total.

**Password cracking** — even if passwords are hashed, weak hashing algorithms can be cracked. Attackers use techniques like:

- **Brute force** — trying every possible combination
- **Dictionary attacks** — trying common passwords from a wordlist
- **Rainbow tables** — precomputed tables of hash values for millions of passwords

### Why Simple Hashing Algorithms Are Not Enough

You might think: "I will just use MD5 or SHA-256 to hash passwords. That should be secure enough." Unfortunately, it is not.

```javascript
// MD5 — fast, but NOT secure for passwords
const md5Hash = crypto.createHash('md5').update('password123').digest('hex');
// Result: 482c811da5d5b4bc6d497ffa98491e38

// SHA-256 — also fast, also NOT secure for passwords
const shaHash = crypto.createHash('sha256').update('password123').digest('hex');
// Result: ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f
```

The problem with MD5 and SHA is that they are **designed to be fast**. A modern GPU can compute billions of SHA-256 hashes per second. This means an attacker with a good graphics card can try billions of password guesses every second, making even moderately complex passwords easy to crack.

### The Need for Secure Password Hashing Algorithms

A good password hashing algorithm must be:

- **Slow** — intentionally computationally expensive to make brute-force attacks impractical
- **Salted** — adds random data to each password before hashing, so identical passwords produce different hashes
- **Adaptive** — the cost can be increased over time as hardware gets faster

bcrypt was designed specifically for this purpose, and bcryptjs brings it to Node.js.

## 3. What is bcryptjs

### Definition

bcryptjs is a **pure JavaScript implementation of the bcrypt password hashing algorithm** for Node.js. It provides functions to generate salted hashes of passwords and compare plain-text passwords against stored hashes.

### How bcryptjs Works Conceptually

bcryptjs follows a straightforward process:

1. Generate a random **salt** (a unique random value)
2. Combine the salt with the password
3. Run the result through the **Eksblowfish** algorithm multiple times (controlled by the cost factor)
4. Produce a final hash that includes the salt and cost factor embedded within it

The resulting hash string contains everything needed to verify a password later — you do not need to store the salt separately.

### Difference Between bcrypt and bcryptjs

| Feature | bcrypt | bcryptjs |
|---------|--------|----------|
| Language | C++ native addon | Pure JavaScript |
| Installation | Requires build tools (node-gyp, Python, compiler) | No build tools needed |
| Platform | May fail on some systems without build tools | Works everywhere Node.js runs |
| Performance | Faster (native code) | Slightly slower (JavaScript) |
| Compatibility | Can have installation issues on Windows | Installs cleanly on all platforms |
| API | Same as bcryptjs | Same as bcrypt |

For most Node.js projects, bcryptjs is the preferred choice because it installs without any native dependency issues, especially on Windows and in CI/CD environments. The performance difference is negligible for typical authentication workloads.

### Why bcryptjs is Commonly Used in Node.js Applications

- **Zero native dependencies** — installs instantly without compilation errors
- **Drop-in replacement for bcrypt** — identical API
- **Battle-tested** — used in thousands of production applications
- **Well-maintained** — actively maintained with regular updates
- **Cross-platform** — works identically on Linux, macOS, and Windows

## 4. How bcryptjs Works Internally

Let us break down what happens behind the scenes when you hash and verify a password.

### Password Hashing

When you call `bcrypt.hash()`, bcryptjs does the following:

1. Generates a random salt using a cryptographically secure random number generator
2. Combines the salt with your password
3. Encrypts the combination using the Eksblowfish cipher — repeated a number of times based on the **cost factor** (salt rounds)
4. Encodes the cost factor, salt, and resulting cipher text into a single string

### Salt Generation

A **salt** is a random value added to the password before hashing. It ensures that even if two users have the same password, their hashes will be completely different.

```text
User A: "password123" + salt "abc" → $2a$10$abc...hashA
User B: "password123" + salt "xyz" → $2a$10$xyz...hashB
```

Same password, completely different hashes. An attacker cannot tell that both users share the same password.

### Hash Computation

The bcrypt hash string has a specific format:

```text
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJHd1F5d4ei
 │  │  │                      │
 │  │  │                      └── The actual hash (31 characters)
 │  │  └── The salt (22 characters)
 │  └── Cost factor (10 = 2^10 = 1024 iterations)
 └── Algorithm version (2a)
```

This single string contains everything needed to verify a password later.

### Comparing Passwords During Login

When a user logs in, you do not decrypt the hash (hashing is one-way). Instead:

1. Extract the salt and cost factor from the stored hash
2. Hash the password the user just entered using the same salt and cost factor
3. Compare the resulting hash with the stored hash
4. If they match, the password is correct

```javascript
// During login
const isMatch = await bcrypt.compare(enteredPassword, storedHash);
// Returns true if the password matches, false otherwise
```

### Why Salting Protects Against Rainbow Table Attacks

A **rainbow table** is a precomputed table mapping millions of common passwords to their hash values. Without salting, an attacker could look up a hash in the rainbow table and instantly find the original password.

With salting, this attack becomes impossible. Because each password has a unique random salt, the attacker would need a separate rainbow table for every possible salt value — which is computationally infeasible.

## 5. Core Concepts in bcryptjs

### Hashing

**Hashing** is the one-way transformation of data into a fixed-length string. In bcryptjs, hashing is intentionally slow to deter brute-force attacks.

```javascript
const hash = await bcrypt.hash('mypassword', 10);
// $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJHd1F5d4ei
```

You **cannot** reverse this process. The only way to verify a password is to hash it again and compare.

### Salt

A **salt** is random data mixed into the password before hashing. It prevents identical passwords from producing identical hashes and makes precomputed attack tables useless.

bcryptjs generates the salt automatically when you use `bcrypt.hash()`. You can also generate it separately:

```javascript
// Automatic (recommended)
const hash = await bcrypt.hash('mypassword', 10);

// Manual salt generation (if you need it)
const salt = await bcrypt.genSalt(10);
const hash = await bcrypt.hash('mypassword', salt);
```

Both approaches produce the same result. The automatic method is cleaner and preferred.

### Salt Rounds (Cost Factor)

The **salt rounds** (also called **cost factor**) determine how many times the hashing algorithm runs internally. A salt round of `N` means the algorithm performs `2^N` iterations.

| Salt Rounds | Iterations | Approximate Time |
|-------------|-----------|-----------------|
| 8 | 256 | ~40ms |
| 10 | 1,024 | ~100ms |
| 12 | 4,096 | ~400ms |
| 14 | 16,384 | ~1.5s |
| 16 | 65,536 | ~6s |

- **Higher rounds** = more secure but slower
- **Lower rounds** = faster but less resistant to brute-force attacks
- **Recommended default: 10** — provides a good balance of security and performance for most applications

As hardware improves over the years, you should increase the cost factor to maintain the same level of security.

### Hash Comparison

bcryptjs provides `bcrypt.compare()` to safely verify a password against a stored hash:

```javascript
const isMatch = await bcrypt.compare('mypassword', storedHash);
// true  → password is correct
// false → password is incorrect
```

This function extracts the salt and cost factor from the stored hash, re-hashes the input password with those same parameters, and compares the results using a timing-safe comparison to prevent timing attacks.

### Synchronous vs Asynchronous Methods

bcryptjs provides both sync and async versions of its methods:

```javascript
// Asynchronous (recommended — does not block the event loop)
const hash = await bcrypt.hash('mypassword', 10);
const isMatch = await bcrypt.compare('mypassword', hash);

// Synchronous (blocks the event loop — avoid in production)
const hash = bcrypt.hashSync('mypassword', 10);
const isMatch = bcrypt.compareSync('mypassword', hash);
```

**Always prefer the async versions** in production applications. Hashing is intentionally slow (by design), and the synchronous versions will freeze your Node.js event loop, preventing your server from handling other requests during the hash computation.

Use synchronous versions only in scripts, seed files, or tests where blocking is acceptable.

## 6. Installation and Setup

### Installing bcryptjs

```bash
npm install bcryptjs
```

That is it. No build tools, no compilers, no native dependencies. It installs instantly.

### Importing bcryptjs in a Project

```javascript
// CommonJS
const bcrypt = require('bcryptjs');

// ES Modules
import bcrypt from 'bcryptjs';

// TypeScript
import * as bcrypt from 'bcryptjs';
```

### Basic Project Setup

Here is a minimal Express.js setup:

```bash
# Create project
mkdir auth-app && cd auth-app
npm init -y

# Install dependencies
npm install bcryptjs express
```

Create a basic server file:

```javascript
// server.js
const express = require('express');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());

// In-memory store (replace with a database in production)
const users = [];

// Routes will go here...

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 7. Example Workflow

Let us build a complete registration and login flow.

### User Registration — Hashing the Password

When a user registers, you hash their password before storing it:

```javascript
// POST /register
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash the password with 10 salt rounds
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store the user with the hashed password
    const user = {
      id: users.length + 1,
      username,
      password: hashedPassword, // NEVER store the plain-text password
    };

    users.push(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

What goes into the database:

```javascript
// What the user sends:
{ "username": "nobel", "password": "mySecret123" }

// What gets stored:
{
  "id": 1,
  "username": "nobel",
  "password": "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJHd1F5d4ei"
}
```

The plain-text password "mySecret123" is never stored anywhere.

### User Login — Comparing the Password

When a user logs in, you compare the entered password against the stored hash:

```javascript
// POST /login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the entered password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Password matches — login successful
    res.json({
      message: 'Login successful',
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

Notice the error message for both "user not found" and "wrong password" is the same — `"Invalid username or password"`. This prevents attackers from discovering which usernames exist in your system.

### Complete Flow Summary

```text
REGISTRATION:
  User enters password  →  bcrypt.hash(password, 10)  →  Store hash in database

LOGIN:
  User enters password  →  bcrypt.compare(password, storedHash)  →  true/false
```

## 8. Advantages of Using bcryptjs

### Strong Password Protection

bcryptjs uses the Eksblowfish algorithm, which was specifically designed for password hashing. Its iterative nature makes brute-force attacks extremely expensive — an attacker would need enormous computational resources to crack even moderately complex passwords.

### Built-in Salting

Unlike simpler hashing methods where you have to manage salts yourself, bcryptjs generates and embeds the salt directly into the hash string. You never have to store or manage salts separately — it is all handled automatically.

### Adjustable Security Cost

The salt rounds parameter lets you control how much computational work goes into each hash. As hardware gets faster over the years, you can increase the cost factor to stay ahead of attackers without changing your code structure.

### Widely Trusted in Backend Authentication Systems

bcryptjs is one of the most downloaded security packages on npm with millions of weekly downloads. It is used in production by companies of all sizes and is recommended in security guides from OWASP and other organizations.

### Easy Integration with Node.js Frameworks

bcryptjs works seamlessly with every major Node.js framework:

```javascript
// Express.js
const hash = await bcrypt.hash(password, 10);

// NestJS (in a service)
@Injectable()
export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

// Works equally well with Fastify, Koa, Hapi, etc.
```

## 9. Drawbacks and Limitations

### Slower Than Simple Hashing Algorithms

This is by design — bcryptjs is intentionally slow to make brute-force attacks impractical. But it means each hash operation takes roughly 100ms (at 10 rounds). For high-traffic applications with thousands of logins per second, this can become a bottleneck. In those cases, consider using a dedicated authentication service or a faster algorithm like Argon2.

### Pure JavaScript Implementation May Be Slower

bcryptjs is written entirely in JavaScript, while the native `bcrypt` package uses C++ bindings. This makes bcryptjs slightly slower per hash operation. However, the difference is small (milliseconds) and rarely matters for typical authentication workloads where you are hashing one password at a time.

### Not Designed for Encrypting Large Data

bcryptjs is purpose-built for **password hashing**, not general-purpose encryption or hashing. Do not use it to:

- Hash file contents (use SHA-256 instead)
- Encrypt data (use AES instead)
- Generate checksums (use MD5 or SHA)

bcryptjs does one thing — password hashing — and does it extremely well.

## 10. bcryptjs vs Other Hashing Methods

### bcryptjs vs bcrypt (native)

| Feature | bcryptjs | bcrypt |
|---------|----------|--------|
| Implementation | Pure JavaScript | C++ native addon |
| Installation | Instant, no build tools | Requires node-gyp, compiler |
| Performance | Slightly slower | Slightly faster |
| Portability | Works on all platforms | May fail on some systems |
| API | Identical | Identical |
| Best For | Most projects, CI/CD, Windows | Linux servers, max performance |

For most projects, bcryptjs is the better choice because of its hassle-free installation. Use native bcrypt only if you need maximum performance on a Linux server.

### bcryptjs vs Argon2

| Feature | bcryptjs | Argon2 |
|---------|----------|--------|
| Algorithm | Eksblowfish | Argon2 (winner of Password Hashing Competition) |
| GPU Resistance | Moderate | Strong (memory-hard) |
| Memory Cost | Not configurable | Configurable |
| Availability | Pure JS, easy install | Requires native bindings |
| Industry Standard | Well-established | Newer, gaining adoption |
| Best For | Most web applications | High-security requirements |

Argon2 is technically superior — it is resistant to GPU-based attacks because it requires significant memory, which GPUs lack. However, Argon2 requires native bindings (similar to bcrypt), making bcryptjs easier to deploy. For most web applications, bcryptjs provides more than adequate security.

### bcryptjs vs SHA-256 / MD5

| Feature | bcryptjs | SHA-256 | MD5 |
|---------|----------|---------|-----|
| Purpose | Password hashing | General-purpose hashing | General-purpose hashing (broken) |
| Speed | Intentionally slow | Very fast | Very fast |
| Salt | Built-in automatic | Must add manually | Must add manually |
| Brute-force Resistance | Strong | Weak for passwords | None (broken) |
| Password Security | Excellent | Poor | Do not use |

MD5 is **cryptographically broken** and should never be used for any security purpose. SHA-256 is a fine general-purpose hash, but it is too fast for passwords — an attacker can guess billions of passwords per second. bcryptjs is designed specifically for passwords and is the right tool for the job.

## 11. Best Practices for Using bcryptjs

### Always Hash Passwords Before Storing

Never store a password in any form before hashing it:

```javascript
// WRONG — never do this
const user = { username, password }; // plain text!

// RIGHT
const hash = await bcrypt.hash(password, 10);
const user = { username, password: hash };
```

### Use Sufficient Salt Rounds

- **10 rounds** — good default for most applications
- **12 rounds** — recommended for applications with higher security requirements
- **14+ rounds** — for highly sensitive systems (be aware of the performance impact)

Never go below 8 rounds in production.

### Never Store Plain-Text Passwords

This cannot be stressed enough. Even for internal tools, test environments, or admin panels — always hash passwords. A breach of a test database can be just as damaging if the same passwords are reused elsewhere.

### Log Passwords Safely

Never log passwords, even hashed ones. Avoid patterns like:

```javascript
// WRONG
console.log('User registered:', username, password);
console.log('Login attempt:', username, password);

// RIGHT
console.log('User registered:', username);
console.log('Login attempt:', username);
```

### Combine with Secure Authentication Practices

bcryptjs handles password hashing, but a complete authentication system needs more:

- **JWT or sessions** — for maintaining authenticated state after login
- **Rate limiting** — prevent brute-force login attempts
- **HTTPS** — encrypt data in transit so passwords cannot be intercepted
- **Input validation** — enforce password complexity requirements
- **Password reset flow** — secure mechanism for users to recover accounts

## 12. When to Use bcryptjs

### User Authentication Systems

Any application where users create accounts and log in with passwords needs bcryptjs (or an equivalent). This covers the vast majority of web and mobile applications.

### Login and Registration APIs

If you are building REST or GraphQL APIs that handle user sign-up and sign-in, bcryptjs should be part of your registration (hashing) and login (comparing) endpoints.

### Secure Backend Applications

Any backend that deals with sensitive credentials — admin panels, internal tools, customer portals — should hash passwords with bcryptjs before storing them in the database.

### When to Choose Something Else

- **High-security applications** (banking, government) — consider Argon2 for its superior GPU resistance
- **Maximum performance** on Linux servers — consider native bcrypt for slightly faster hashing
- **Non-password data** — use the appropriate tool (SHA for integrity checks, AES for encryption)

## 13. Conclusion

bcryptjs solves one of the most critical problems in backend development: keeping user passwords safe. By combining intentional slowness, automatic salting, and an adjustable cost factor, it makes password cracking impractical for attackers — even if they manage to obtain your database.

The key takeaways:

- **Never store plain-text passwords** — hash them with bcryptjs before saving
- **Always use async methods** — synchronous versions block the event loop
- **10 salt rounds is a good default** — increase as hardware improves
- **bcryptjs is easier to deploy than native bcrypt** — pure JavaScript, no build tools
- **Pair it with proper authentication practices** — JWT, sessions, rate limiting, HTTPS

Password security is not optional — it is a fundamental responsibility of every backend developer. bcryptjs makes it straightforward to do the right thing. Add it to your next project, and your users will thank you — even if they never know it.

For more on authentication patterns, check out [Understanding Authentication: JWT vs Session-Based Auth](/post/backend/jwt-vs-session-auth).
