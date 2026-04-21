---
title: "Spring Boot Project Structure"
date: "2026-04-21"
tags: ["java", "springboot", "architecture", "project-structure", "organization"]
excerpt: "Learn how to organize a Spring Boot project for maintainability — layered architecture, package conventions, and the separation of concerns that keeps your codebase clean."
---

# Spring Boot Project Structure

Your `controller` package has 50 classes. Business logic lives in controllers. Database queries are scattered everywhere. Adding a feature means touching five unrelated files. A clean layered structure fixes this before the codebase becomes unmanageable.

## Why Structure Matters

❌ **Problem:** Controllers directly call the database. Business logic is mixed with HTTP handling. Change the database, and you break 30 controllers. No reuse, no testability, no separation of concerns.

✅ **Solution:** Layered architecture — controller handles HTTP, service handles business logic, repository handles data access. Each layer has one responsibility. Change the database? Only the repository layer changes.

## Standard Package Structure

```text
com.example.myapp/
├── MyAppApplication.java          # Entry point
├── config/                        # Configuration classes
│   ├── SecurityConfig.java
│   └── WebConfig.java
├── controller/                    # HTTP layer (receives requests)
│   ├── UserController.java
│   └── ProductController.java
├── service/                       # Business logic layer
│   ├── UserService.java
│   ├── ProductService.java
│   └── impl/                      # Service implementations
│       ├── UserServiceImpl.java
│       └── ProductServiceImpl.java
├── repository/                    # Data access layer
│   ├── UserRepository.java
│   └── ProductRepository.java
├── model/                         # Domain models (JPA entities)
│   ├── User.java
│   └── Product.java
├── dto/                           # Data Transfer Objects
│   ├── UserRequest.java
│   └── UserResponse.java
├── exception/                     # Custom exceptions
│   ├── ResourceNotFoundException.java
│   └── GlobalExceptionHandler.java
└── util/                          # Utility classes
    └── DateUtils.java
```

## The Layers

### Controller Layer
```java
// Receives HTTP requests, validates input, calls service, returns response
// Contains ZERO business logic

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        return ResponseEntity.status(201).body(userService.createUser(request));
    }
}
```

### Service Layer
```java
// Contains business logic
// Orchestrates between repositories
// No HTTP knowledge (no @GetMapping here)

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }
        User user = mapToEntity(request);
        User saved = userRepository.save(user);
        return mapToResponse(saved);
    }
}
```

### Repository Layer
```java
// Data access only — queries and persistence
// No business logic

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByIsActiveTrue();
}
```

### Model vs DTO

```text
Model (Entity):
  Maps to a database table
  Contains JPA annotations
  Internal representation — never exposed to API

DTO (Data Transfer Object):
  Defines API contract — what client sends/receives
  Contains validation annotations
  Public representation — never touches database

Why separate them:
  - Password is in the request DTO but NEVER in the response DTO
  - id is in the response DTO but NEVER in the create request DTO
  - Database column names differ from API field names
  - Prevents over-posting (client sending fields they shouldn't)
```

```java
// model/User.java
@Entity
@Table(name = "users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;
    private String hashedPassword;  // Never expose
    private boolean isActive;
}

// dto/UserRequest.java
public class UserRequest {
    @NotBlank private String name;
    @Email private String email;
    @Size(min = 8) private String password;
}

// dto/UserResponse.java
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    // No password field
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Controller** | HTTP layer — receives requests, returns responses |
| **Service** | Business logic — rules, validation, orchestration |
| **Repository** | Data access — database queries via Spring Data JPA |
| **Model (Entity)** | Database table mapping with JPA annotations |
| **DTO** | API request/response objects — the public contract |
| **Layered architecture** | Each layer has one responsibility, depends only on the layer below |
| **`config/`** | Spring configuration classes (security, web, etc.) |
| **`exception/`** | Custom exceptions and global exception handler |

**A clean structure isn't over-engineering — it's giving every class a single job and a predictable home. Controllers handle HTTP, services handle logic, repositories handle data. Mix them and you get a mess.**
