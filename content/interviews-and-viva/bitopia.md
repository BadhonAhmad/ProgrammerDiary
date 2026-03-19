---
title: "Bitopia - Interview Questions and Answers"
date: "2026-03-17"
tags: ["interviews", "viva", "bitopia", "hackerrank", "leetcode", "microservices", "nodejs", "spring-boot"]
excerpt: "Bitopia interview experience with written and viva rounds, including HackerRank contest, LRU cache, microservices communication, Node.js, SQL vs NoSQL, onclick differences, and Spring Boot security."
---

# Bitopia - Interview Questions and Answers

## Written Round

### 1. Contest on HackerRank

**Answer:**
This round typically evaluates coding speed, problem-solving under time pressure, and ability to handle edge cases. The best approach is:
- Solve easiest problems first to secure points quickly.
- Write clean, testable logic.
- Cover edge cases before final submission.
- Optimize only where needed after a correct solution.

---

### 2. Leetcode - Merge Intervals

**Answer:**
Sort intervals by start value, then iterate and merge overlapping ranges.

- If current interval overlaps with last merged interval, extend the end.
- Otherwise, push current interval as a new range.

**Complexity:**
- Time: O(n log n) due to sorting
- Space: O(n) for output

---

### 3. Leetcode - LRU Cache

**Answer:**
An efficient LRU cache supports get and put in O(1) time using:
- Hash map: key -> node
- Doubly linked list: recent items near head, least-recent near tail

Operations:
- get(key): if found, move node to head and return value; else -1
- put(key, value): update existing key and move to head; if full, remove tail and insert new node at head

This is the standard optimal design.

---

### 4. Some Basic Problems

**Answer:**
These usually test fundamentals such as loops, strings, arrays, conditionals, and basic math logic. A strong answer focuses on:
- Correctness first
- Proper boundary checks
- Readable logic
- Reasonable time complexity

---

## Viva Round

### 1. What is a Microservice?

**Answer:**
A microservice is a small, independently deployable service that focuses on one business capability.

Key characteristics:
- Single responsibility
- Independent deployment
- Own codebase and often own database
- Communicates with other services via APIs/events

---

### 2. How Do Microservices Communicate with Each Other?

**Answer:**
Two common ways:

1. **Synchronous communication**
- HTTP/REST, gRPC
- Caller waits for response

2. **Asynchronous communication**
- Message brokers (Kafka, RabbitMQ, SQS)
- Event-driven, decoupled communication

Many systems use a hybrid model.

---

### 3. Which Protocols Are Mostly Used in Microservices?

**Answer:**
Most common protocols:
- HTTP/HTTPS (REST APIs)
- gRPC over HTTP/2 (high-performance internal calls)
- AMQP/Kafka protocols for async messaging

In production, HTTPS is preferred for encrypted communication, especially across networks.

---

### 4. What is Node.js?

**Answer:**
Node.js is a JavaScript runtime built on Chrome V8 that runs JavaScript outside the browser.

Highlights:
- Event-driven, non-blocking I/O
- Single-threaded event loop with async model
- Excellent for I/O-heavy applications (APIs, real-time services)

---

### 5. SQL vs NoSQL

**Answer:**
**SQL:**
- Relational tables with fixed schema
- Strong ACID transactions
- Ideal for structured data and complex joins

**NoSQL:**
- Flexible schema (document/key-value/column/graph)
- Scales horizontally more easily
- Useful for large-scale, rapidly changing, or semi-structured data

Choice depends on consistency, query needs, scale, and data model.

---

### 6. Difference Between onClick in HTML and JavaScript

**Answer:**
**Inline HTML onClick:**
- Example: `<button onclick="handleClick()">Click</button>`
- Quick but mixes behavior with markup
- Harder to maintain in larger apps

**JavaScript event binding:**
- Example: `button.addEventListener("click", handleClick)`
- Separates structure and behavior
- Cleaner, reusable, easier to test and maintain

Best practice: prefer JavaScript event listeners (or framework event handlers) over inline handlers.

---

### 7. How Is Security Maintained in Spring Boot?

**Answer:**
Spring Boot security is commonly implemented using Spring Security with layered controls:

1. **Authentication and Authorization**
- JWT/OAuth2/session-based login
- Role-based access control (RBAC)

2. **Password Security**
- Hash passwords with BCrypt/Argon2

3. **Transport Security**
- Enforce HTTPS/TLS

4. **Request Protection**
- CSRF protection for session-based apps
- CORS configuration for allowed origins
- Input validation and sanitization

5. **Security Headers**
- Configure headers like HSTS, X-Content-Type-Options, frame protection

6. **Operational Security**
- Rate limiting
- Logging and monitoring
- Secret management via environment variables or vault

A secure Spring Boot app combines framework features with proper architecture and deployment practices.
