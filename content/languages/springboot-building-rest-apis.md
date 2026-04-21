---
title: "Spring Boot Building REST APIs"
date: "2026-04-21"
tags: ["java", "springboot", "rest", "api", "http"]
excerpt: "Learn how to build REST APIs with Spring Boot — from your first GET endpoint to full CRUD with proper HTTP methods, status codes, and response entities."
---

# Spring Boot Building REST APIs

You need an API that creates users, retrieves them, updates profiles, and deletes accounts. Four operations, four HTTP methods, four endpoints. Spring Boot makes each one a single method with one annotation.

## What is a REST API?

**REST** (Representational State Transfer) is an architectural style where resources are accessed via standard HTTP methods. Each URL represents a resource, and HTTP verbs define the action.

```text
Resource: Users

GET    /api/users        → List all users
GET    /api/users/42     → Get user 42
POST   /api/users        → Create a new user
PUT    /api/users/42     → Replace user 42 entirely
PATCH  /api/users/42     → Partially update user 42
DELETE /api/users/42     → Delete user 42
```

## Your First REST Controller

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<UserResponse> listUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/{id}")
    public UserResponse getUser(@PathVariable Long id) {
        return userService.getUserById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse createUser(@Valid @RequestBody UserRequest request) {
        return userService.createUser(request);
    }

    @PutMapping("/{id}")
    public UserResponse updateUser(@PathVariable Long id,
                                    @Valid @RequestBody UserRequest request) {
        return userService.updateUser(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
```

## Why Does It Matter?

❌ **Problem:** You build an API with a single POST endpoint for everything — create, update, delete all go to `/api/action`. No standard HTTP methods, no proper status codes, no RESTful structure. Clients can't predict how your API works.

✅ **Solution:** REST conventions make your API predictable. `GET /users` always lists users. `POST /users` always creates one. `DELETE /users/42` always deletes user 42. Status codes tell the client what happened. Any developer can use your API without reading documentation.

## ResponseEntity for Full Control

```java
@GetMapping("/{id}")
public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
    UserResponse user = userService.getUserById(id);
    return ResponseEntity.ok(user);                    // 200 OK

    // Or with headers:
    return ResponseEntity.ok()
        .header("X-Total-Count", "42")
        .body(user);

    // Or not found:
    return ResponseEntity.notFound().build();          // 404

    // Or created:
    return ResponseEntity
        .created(URI.create("/api/users/" + user.getId()))  // 201 + Location header
        .body(user);
}
```

## Request Parameters

### Path Variables
```java
@GetMapping("/{userId}/posts/{postId}")
public PostResponse getPost(
    @PathVariable Long userId,
    @PathVariable Long postId
) { ... }

// GET /api/users/42/posts/7 → userId=42, postId=7
```

### Query Parameters
```java
@GetMapping
public List<UserResponse> listUsers(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size,
    @RequestParam(required = false) String role
) {
    return userService.listUsers(page, size, role);
}

// GET /api/users?page=2&size=10&role=admin
```

### Request Headers
```java
@GetMapping("/profile")
public UserProfile getProfile(
    @RequestHeader("Authorization") String token
) { ... }
```

## CRUD Summary

| Method | Endpoint | Purpose | Status Code |
|---|---|---|---|
| `GET` | `/api/users` | List all | 200 OK |
| `GET` | `/api/users/{id}` | Get one | 200 OK / 404 Not Found |
| `POST` | `/api/users` | Create | 201 Created |
| `PUT` | `/api/users/{id}` | Full update | 200 OK |
| `PATCH` | `/api/users/{id}` | Partial update | 200 OK |
| `DELETE` | `/api/users/{id}` | Delete | 204 No Content |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@RestController`** | Marks class as REST API — methods return JSON |
| **`@RequestMapping`** | Base URL path for all methods in class |
| **`@GetMapping/PostMapping`** | Maps HTTP method to Java method |
| **`@PathVariable`** | Extract value from URL path |
| **`@RequestParam`** | Extract value from query string |
| **`@RequestBody`** | Parse JSON body into Java object |
| **`ResponseEntity`** | Full control over status, headers, and body |
| **`@ResponseStatus`** | Set the HTTP status code for a method |

**A REST API in Spring Boot is just a class with annotations — `@RestController` makes it JSON, `@GetMapping` maps the route, `@PathVariable` extracts the ID. No boilerplate, just business logic.**
