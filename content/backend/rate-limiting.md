---
title: "Rate Limiting: Protecting Your Backend from Abuse"
date: "2026-04-17"
tags: ["backend", "security", "rate-limiting", "Node.js", "Express", "API"]
excerpt: "Learn what rate limiting is, how it protects your API from abuse, different algorithms for implementing it, and how to add it to a Node.js Express application."
---

# Rate Limiting: Protecting Your Backend from Abuse

Imagine your API is a restaurant. Without a host at the door, a single customer could walk in, order everything on the menu, and prevent anyone else from being served. Rate limiting is that host — it ensures everyone gets a fair turn and no single client can overwhelm your system. In this article, we will explore what rate limiting is, why it matters, how it works under the hood, and how to implement it in your Node.js applications.

## 1. Introduction

### What is Rate Limiting?

**Rate limiting** is a technique that controls how many requests a client can make to your server within a specific time window. For example, you might allow each user to make at most 100 API requests per minute. If they exceed that limit, the server rejects further requests with an error until the window resets.

```text
Client sends 100 requests in 1 minute → All succeed (200 OK)
Client sends request 101 in same minute → Rejected (429 Too Many Requests)
Minute resets → Client can send requests again
```

### Why Rate Limiting Is Important in Backend Development

Every request to your server costs resources — CPU time, memory, database queries, network bandwidth. Without rate limiting:

- A single misbehaving client can consume all your server resources
- Automated scripts can brute-force passwords or flood your endpoints
- A sudden spike in traffic (even legitimate) can crash your application
- Your cloud bill can skyrocket from unexpected usage

Rate limiting is not a luxury — it is a fundamental part of running any production API.

### Where It Fits in Backend Architecture

Rate limiting typically sits at the **edge** of your backend, acting as a gatekeeper before requests reach your application logic:

```text
Client Request
    ↓
[Load Balancer / Reverse Proxy]
    ↓
[Rate Limiter] ← Request is checked against limits here
    ↓ (if allowed)
[Authentication Middleware]
    ↓
[Route Handlers / Business Logic]
    ↓
[Database]
    ↓
Response
```

If the rate limit is exceeded, the request is rejected immediately — it never reaches your business logic or database, saving valuable resources.

## 2. The Problem It Solves

### Challenges Before Rate Limiting

Before implementing rate limiting, backend developers faced several recurring problems:

**Brute-force attacks** — attackers could try thousands of password combinations per second against a login endpoint. With no request cap, they could keep guessing indefinitely.

**API abuse** — a single user or script could make millions of requests, consuming server resources and degrading performance for everyone else.

**Accidental DDoS** — a buggy client application stuck in a retry loop could flood your server with requests, effectively performing an unintentional denial-of-service attack.

**Resource exhaustion** — without boundaries, any client could trigger expensive operations (large database queries, file downloads, report generation) as many times as they wanted.

### Why Developers Needed This Solution

As APIs became the standard way to build web and mobile applications, developers needed a way to:

- Protect their servers from being overwhelmed
- Ensure fair access for all users
- Prevent abuse without blocking legitimate traffic
- Control infrastructure costs by limiting per-user consumption

Rate limiting emerged as the standard solution to all of these problems.

### Real-World Problems It Addresses

- **Password guessing** — limit login attempts to 5 per minute per IP
- **Account enumeration** — limit registration and password-reset endpoints
- **API scraping** — prevent bots from downloading your entire dataset
- **Cost control** — cap how many expensive operations each user can perform
- **Fair usage** — ensure one heavy user does not degrade the experience for thousands of others
- **Compliance** — many APIs have usage tiers (free, pro, enterprise) enforced through rate limits

## 3. What is Rate Limiting

### Definition

Rate limiting is a **traffic control mechanism** that restricts the number of requests a client can make to a server within a defined time period. When the limit is exceeded, the server returns an error (typically HTTP 429 Too Many Requests) and optionally tells the client when they can try again.

### Core Idea

The concept is straightforward:

1. **Identify** who is making the request (by IP address, API key, user ID)
2. **Count** how many requests they have made in the current time window
3. **Allow** the request if they are within the limit
4. **Reject** the request if they have exceeded the limit

### Key Characteristics

- **Configurable limits** — you decide how many requests are allowed per time window
- **Per-identity** — limits are typically applied per IP, per user, or per API key
- **Time-windowed** — limits reset after a specific period (per minute, per hour, per day)
- **Transparent** — servers communicate limits to clients through HTTP headers
- **Fail-fast** — rejected requests are dropped early, before consuming backend resources

### Where Rate Limiting Is Commonly Used

- **Public APIs** — Twitter, GitHub, Stripe all enforce rate limits on their API consumers
- **Authentication endpoints** — login, registration, password reset
- **Payment systems** — limit charge attempts to prevent fraud
- **Search endpoints** — prevent automated scraping of search results
- **File upload/download** — cap bandwidth-intensive operations
- **SaaS platforms** — differentiate usage tiers (free: 100/day, pro: 10,000/day)

## 4. How It Works

Let us trace what happens when a request arrives at a rate-limited server.

### Core Workflow

```text
1. Client sends a request to the server
        ↓
2. Rate limiter extracts the client's identity (IP, API key, user ID)
        ↓
3. Rate limiter checks the counter for this identity in the current window
        ↓
4. Is the count below the limit?
    ├── YES → Increment the counter, forward the request to the app
    └── NO  → Return 429 Too Many Requests immediately
        ↓
5. (If allowed) Request proceeds to application logic
        ↓
6. Response is sent back with rate limit headers
```

### Interaction with Backend Systems

Rate limiters need to store counters somewhere. The choice of storage depends on your architecture:

**In-memory (single server):**
```text
Request → Express rate limiter → JS Map in process memory → Allow/Reject
```

Fast, but limits are not shared across multiple server instances. If you have 3 servers behind a load balancer, each server tracks its own counters independently.

**Redis (distributed):**
```text
Request → Load Balancer → Server 1 → Redis (shared counter) → Allow/Reject
                                   ↗
                      Server 2 → Redis (same counter)
                                   ↘
                      Server 3 → Redis (same counter)
```

All servers share the same counters through Redis. This is the standard approach for production systems with multiple server instances.

### Flow of Requests and Responses

**Successful request (within limit):**

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 73
X-RateLimit-Reset: 1716364800

{ "data": "..." }
```

**Rejected request (limit exceeded):**

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1716364800
Retry-After: 45

{ "error": "Too many requests. Try again in 45 seconds." }
```

The response headers tell the client:
- **Limit** — the maximum requests allowed in this window
- **Remaining** — how many requests they have left
- **Reset** — when the window resets (Unix timestamp)
- **Retry-After** — how many seconds until they can retry

### Important Technical Details

**Granularity** — rate limits can be applied at different levels:

- Global (all requests to the server)
- Per route (different limits for `/login` vs `/api/users`)
- Per method (stricter limits on POST/DELETE than GET)
- Per client identity (IP, user, API key)

**Window types** — how the time window works affects behavior:

- **Fixed window** — limits reset at fixed intervals (every minute on the minute)
- **Sliding window** — limits are calculated over the last N seconds from the current moment
- **Sliding window log** — tracks the timestamp of every request for precise enforcement

## 5. Core Concepts

### Rate Limiting Algorithms

There are several algorithms for implementing rate limiting. Each has different trade-offs.

#### Fixed Window Counter

Divides time into fixed windows (e.g., 1-minute intervals) and counts requests in each window.

```text
Window: 0:00 - 1:00 → 45 requests (limit: 100) → All allowed
Window: 1:00 - 2:00 → 102 requests → First 100 allowed, last 2 rejected

       0:00         1:00         2:00
         |████████████|████████████|
              45           102
```

**Pros:** Simple to implement, memory efficient
**Cons:** "Burst" problem — a client can make 200 requests in 2 seconds by hitting the end of one window and the start of the next

#### Sliding Window Counter

Combines the current window and the previous window weighted by overlap:

```text
If current window has 30 requests and previous window had 80 requests,
and we are 60% through the current window:
Estimated rate = 80 × 0.4 + 30 = 62 requests
```

**Pros:** Smoother than fixed window, avoids the burst problem
**Cons:** Slightly more complex, approximation rather than exact

#### Token Bucket

Maintains a bucket of tokens. Each request consumes one token. Tokens refill at a constant rate.

```text
Bucket capacity: 100 tokens
Refill rate: 10 tokens per second

Client sends 100 requests → Bucket empties (all succeed)
Client sends 5 more → Rejected (no tokens)
Wait 5 seconds → Bucket refills to 50 tokens → Next 50 requests succeed
```

**Pros:** Allows short bursts while maintaining an average rate. Well-suited for APIs with bursty traffic patterns.
**Cons:** Requires tracking two values (tokens and last refill time)

#### Leaky Bucket

Similar to token bucket but processes requests at a fixed rate, like water dripping from a bucket. Requests enter a queue and are processed at a steady pace.

```text
Queue capacity: 50
Processing rate: 10 requests per second

100 requests arrive → 50 enter queue, 50 rejected
Queue drains at 10/second → Queue empties in 5 seconds
```

**Pros:** Produces a smooth, predictable output rate
**Cons:** Adds latency because requests wait in a queue. Not ideal when immediate responses are expected.

#### Sliding Window Log

Records the exact timestamp of every request. To check the limit, count how many timestamps fall within the last N seconds.

```text
Limit: 5 requests per 60 seconds

Timestamps: [10:00:15, 10:00:30, 10:00:45, 10:01:00, 10:01:15]
Request at 10:01:20 → Count last 60s = 5 → Allowed
Request at 10:01:25 → Count last 60s = 6 → Rejected
```

**Pros:** Most accurate — no burst problem at all
**Cons:** Memory intensive — stores a timestamp for every request

### Choosing the Right Algorithm

| Algorithm | Accuracy | Memory | Burst Tolerant | Best For |
|-----------|----------|--------|----------------|----------|
| Fixed Window | Low | Very Low | No | Simple APIs, low traffic |
| Sliding Window Counter | Medium | Low | Mostly | General-purpose APIs |
| Token Bucket | High | Low | Yes | APIs with bursty traffic |
| Leaky Bucket | High | Medium | No | Traffic shaping, queues |
| Sliding Window Log | Very High | High | Yes | Strict enforcement |

For most web APIs, **sliding window counter** or **token bucket** provides the best balance of accuracy, memory usage, and simplicity.

### Rate Limit Headers

Standard headers communicate limits to clients:

```http
X-RateLimit-Limit: 100          # Max requests per window
X-RateLimit-Remaining: 73       # Requests left in this window
X-RateLimit-Reset: 1716364800   # Window reset time (Unix timestamp)
Retry-After: 45                 # Seconds until retry (on 429 responses)
```

These headers allow well-behaved clients to self-regulate and avoid hitting limits.

### Client Identity

Rate limits are scoped to a specific identity:

- **IP address** — simplest, works for anonymous users. Can be spoofed or shared (NAT, VPNs)
- **API key** — most accurate for third-party API consumers. Requires authentication first
- **User ID** — best for authenticated users. Tied to an account, not a device
- **Combination** — use IP for unauthenticated endpoints, user ID for authenticated ones

### HTTP 429 Status Code

When a client exceeds the rate limit, the server responds with **429 Too Many Requests**. This is the standard HTTP status code for rate-limited responses. Always include a `Retry-After` header so the client knows when to try again.

## 6. Practical Example

Let us implement rate limiting in a Node.js Express application.

### Setup

```bash
mkdir rate-limit-demo && cd rate-limit-demo
npm init -y
npm install express express-rate-limit
```

`express-rate-limit` is the most popular rate limiting middleware for Express.

### Basic Implementation

```javascript
// server.js
const express = require('express');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(express.json());

// ──────────────────────────────────────────────
// Global rate limiter — applies to all routes
// 100 requests per 15 minutes per IP
// ──────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 100,                     // limit each IP to 100 requests per window
  message: {
    error: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,        // Return rate limit info in headers
  legacyHeaders: false,         // Disable X-RateLimit-* legacy headers
});

app.use(globalLimiter);

// ──────────────────────────────────────────────
// Stricter limiter for login endpoint
// 5 login attempts per 15 minutes per IP
// ──────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true,  // Only count failed logins
});

app.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  // Simulated authentication
  if (email === 'nobel@example.com' && password === 'correctpassword') {
    res.json({ message: 'Login successful', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

// ──────────────────────────────────────────────
// Moderate limiter for API endpoints
// 30 requests per minute per IP
// ──────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,         // 1 minute
  max: 30,
  message: {
    error: 'API rate limit exceeded. Try again in a minute.',
  },
});

app.get('/api/users', apiLimiter, (req, res) => {
  res.json({
    users: [
      { id: 1, name: 'Nobel' },
      { id: 2, name: 'Alice' },
    ],
  });
});

app.post('/api/users', apiLimiter, (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  res.status(201).json({ id: 3, name, email });
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### How It Works Step by Step

**1. Start the server:**

```bash
node server.js
```

**2. Normal request (within limit):**

```bash
curl -i http://localhost:3000/api/users
```

Response:

```http
HTTP/1.1 200 OK
RateLimit-Limit: 30
RateLimit-Remaining: 29
RateLimit-Reset: 45

{"users":[{"id":1,"name":"Nobel"},{"id":2,"name":"Alice"}]}
```

**3. After exceeding the limit (30 requests in 1 minute):**

```bash
curl -i http://localhost:3000/api/users
```

Response:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 30
RateLimit-Remaining: 0
RateLimit-Reset: 23
Retry-After: 23

{"error":"API rate limit exceeded. Try again in a minute."}
```

**4. Login endpoint (stricter — 5 attempts per 15 minutes):**

```bash
# Attempt 1-5: returns 401 (wrong password)
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"nobel@example.com","password":"wrong"}'

# Attempt 6: returns 429 (rate limited)
# The limiter only counts failed attempts because skipSuccessfulRequests is true
```

### Per-User Rate Limiting with API Keys

For authenticated APIs, limit by user instead of IP:

```javascript
const userLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,     // 1 hour
  max: (req) => {
    // Different limits for different tiers
    if (req.user?.tier === 'pro') return 10000;
    if (req.user?.tier === 'enterprise') return 100000;
    return 1000; // free tier
  },
  keyGenerator: (req) => {
    // Use user ID instead of IP address
    return req.user?.id || req.ip;
  },
});

app.get('/api/data', authenticate, userLimiter, (req, res) => {
  res.json({ data: 'Protected resource' });
});
```

This pattern lets you enforce tiered pricing — free users get 1,000 requests per hour while pro users get 10,000.

## 7. Advantages

### Security

- **Prevents brute-force attacks** — login endpoints are protected against automated password guessing
- **Blocks credential stuffing** — attackers cannot test stolen username/password pairs at scale
- **Mitigates DDoS** — limits the impact of volumetric attacks by capping per-client requests
- **Stops API scraping** — bots cannot download your entire dataset in one go

### Scalability

- **Protects backend resources** — database, CPU, and memory are shielded from traffic spikes
- **Predictable load** — rate limits create a ceiling on maximum request volume, making capacity planning easier
- **Fair resource allocation** — ensures one aggressive client cannot starve others of resources

### Performance

- **Fail-fast rejection** — overloaded requests are rejected immediately at the edge, before consuming application resources
- **Reduced downstream load** — your database and business logic serve fewer unnecessary requests
- **Cache-friendly** — rate limiting complements caching by reducing repeated identical requests

### Cost Control

- **Limits cloud costs** — fewer requests means lower compute, database, and bandwidth charges
- **Enforces pricing tiers** — free, pro, and enterprise users get appropriate limits matching their plan
- **Prevents runaway costs** — a misconfigured client cannot accidentally cost you thousands of dollars in infrastructure

### Maintainability

- **Clear failure mode** — when the system is under stress, rate limiting provides a clean, predictable way to shed load rather than crashing unpredictably
- **Observable** — rate limit headers and logs give visibility into traffic patterns and abuse attempts
- **Configurable** — limits can be adjusted per endpoint, per user tier, or globally without code changes

## 8. Drawbacks and Limitations

### Can Block Legitimate Traffic

Aggressive rate limits can frustrate real users. If a user legitimately needs to make 50 API calls in quick succession (e.g., syncing data after being offline), they may hit limits designed to stop abusers. This requires careful tuning to balance security and usability.

### Performance Overhead

Every rate-limited request requires a storage lookup (in-memory or Redis) and counter update. At very high throughput (tens of thousands of requests per second), this overhead adds up. The choice of storage — in-memory vs Redis — directly impacts performance.

### Not Effective Against Distributed Attacks

Rate limiting by IP address does not stop a distributed attack where each request comes from a different IP (e.g., a botnet). For those scenarios, you need additional defenses like CAPTCHAs, WAF rules, or behavioral analysis.

### Complexity in Distributed Systems

In a multi-server setup, you need a shared store (like Redis) to maintain consistent counters. This adds infrastructure complexity, introduces a single point of failure, and increases latency on every request.

### NAT and Proxy Issues

Multiple users behind a shared IP address (office networks, VPNs, mobile carriers) share the same rate limit. One heavy user on a corporate network can trigger limits for everyone in the same office. Using authenticated identity (user ID or API key) instead of IP helps mitigate this.

### Stateless Services Cannot Use In-Memory Limiters

If your application is stateless (common in Kubernetes or serverless environments), in-memory rate limiters do not work because each instance maintains its own counters. You must use an external store like Redis.

## 9. Best Practices

### Use Different Limits for Different Endpoints

Not all endpoints are equal. Apply stricter limits to sensitive or expensive operations:

```javascript
// Strict — login is a security-sensitive endpoint
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// Moderate — standard API operations
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

// Relaxed — cheap read operations like viewing a public profile
const readLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
```

### Always Return Rate Limit Headers

```javascript
const limiter = rateLimit({
  standardHeaders: true,   // Sends RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  legacyHeaders: false,     // Disables deprecated X-RateLimit-* headers
});
```

This allows well-behaved clients to monitor their own usage and slow down before hitting limits, improving the experience for everyone.

### Include Retry-After in 429 Responses

Tell clients exactly when they can retry:

```javascript
app.use((req, res, next) => {
  res.setHeader('Retry-After', Math.ceil(res.get('RateLimit-Reset') - Date.now() / 1000));
  next();
});
```

### Use Redis for Multi-Server Setups

```javascript
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

const client = redis.createClient({ url: 'redis://localhost:6379' });

const limiter = rateLimit({
  store: new RedisStore({
    client,
    prefix: 'rl:',  // Redis key prefix
  }),
  windowMs: 60 * 1000,
  max: 100,
});
```

### Graceful Degradation

Return meaningful error messages when rate limits are hit:

```javascript
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'You have exceeded the maximum number of requests. Please slow down.',
      retryAfter: res.get('Retry-After'),
    });
  },
});
```

### Common Mistakes to Avoid

- **Setting limits too high** — a limit of 10,000 requests per minute might as well not exist. Choose limits based on what a normal user would do
- **Limiting only by IP** — behind NAT/VPN, many users share one IP. Use authenticated identity when possible
- **No monitoring** — track how often limits are hit. Frequent 429s from the same identity may indicate an attack or a bug in a client application
- **Same limit for all endpoints** — a login endpoint needs much stricter limits than a public read endpoint
- **Ignoring the Retry-After header** — clients that retry immediately after being limited create unnecessary load

## 10. Real-World Usage

### How Major Platforms Use Rate Limiting

**GitHub API** — 5,000 requests per hour for authenticated users, 60 per hour for unauthenticated. Limits are returned in response headers, and exceeding them returns a 403 with documentation links.

**Twitter/X API** — tiered limits based on plan level. Free tier gets 1,500 tweets per month. Pro tier gets 1,000,000. Rate limits are per-endpoint, with stricter limits on write operations.

**Stripe API** — 100 reads per second and 25 writes per second per account. Returns rate limit headers and suggests exponential backoff for retries.

**Cloudflare** — applies rate limiting at the CDN level before requests reach the origin server. Supports configurable rules like "block if more than 50 requests in 10 seconds from one IP."

**AWS API Gateway** — built-in throttling with configurable burst and rate limits per method. Default is 10,000 requests per second per account.

### Common Production Patterns

- **Edge rate limiting** — applied at the CDN or load balancer level (Cloudflare, AWS ALB, Nginx)
- **Application-level rate limiting** — applied in Express middleware
- **Database-level rate limiting** — some databases enforce query rate limits
- **Multi-layered approach** — most production systems use rate limiting at multiple layers

```text
Request → CDN Rate Limit → Load Balancer Rate Limit → App Rate Limit → Database
           (global cap)      (per-server cap)          (per-user cap)    (query limit)
```

## 11. When to Use It

### Public APIs

Any API exposed to external developers needs rate limiting. It protects your infrastructure and enables tiered pricing models.

### Authentication Endpoints

Login, registration, password reset, and OTP verification are high-value targets for attackers. Always apply strict rate limits here.

### High-Traffic Applications

Applications serving thousands or millions of users benefit from rate limiting to ensure fair resource allocation and prevent any single user from degrading the experience for others.

### SaaS Platforms

If you offer different pricing tiers (free, pro, enterprise), rate limiting enforces the usage boundaries of each tier.

### Resource-Intensive Endpoints

Endpoints that trigger expensive operations — report generation, image processing, bulk exports, AI inference — should be rate-limited to control costs and server load.

### Third-Party Integrations

When your application calls external APIs (payment processors, email services, AI providers), those providers will rate-limit you. Understanding rate limiting helps you handle their 429 responses gracefully with retry logic and exponential backoff.

## 12. When Not to Use It

### Internal Microservices with Controlled Traffic

If your microservices communicate with each other through a service mesh or internal network, and the traffic is predictable and controlled, per-request rate limiting adds unnecessary overhead. Use circuit breakers or bulkheading instead.

### Low-Traffic Internal Tools

For an admin dashboard or internal tool used by a handful of trusted employees, rate limiting adds complexity with little benefit.

### When You Need Per-Request Quotas Instead

Rate limiting controls request frequency. If you need to control usage volume (e.g., "each user can store 1 GB of data"), you need a **quota system**, not a rate limiter.

### Real-Time Communication

WebSockets and Server-Sent Events maintain long-lived connections. Rate limiting connection setup may help, but limiting individual messages on an open connection is a different problem that requires flow control, not HTTP rate limiting.

### When a WAF or CDN Handles It

If you use Cloudflare, AWS WAF, or similar services that already provide rate limiting at the edge, adding another layer in your application may be redundant. Coordinate with your infrastructure team to avoid double-limiting.

## 13. Conclusion

Rate limiting is one of the most impactful things you can add to a production API. It is a relatively simple mechanism that provides outsized benefits in security, reliability, and cost control.

The key takeaways:

- **Rate limiting controls how many requests a client can make** within a time window, protecting your server from abuse
- **Apply different limits to different endpoints** — strict for login, moderate for writes, relaxed for reads
- **Use the right algorithm** — sliding window and token bucket work well for most web APIs
- **Return proper headers** so clients can self-regulate and avoid hitting limits
- **Use Redis for distributed systems** — in-memory limiters do not work across multiple server instances
- **Rate limit at multiple layers** — CDN, load balancer, and application level for defense in depth

A well-implemented rate limiter protects your users, your infrastructure, and your wallet. Add it to every production API you build — your future self will thank you.

For more on securing your backend, check out [bcryptjs: Password Hashing Done Right in Node.js](/post/backend/bcryptjs).
