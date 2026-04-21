---
title: "Spring Boot Dependency Injection & IoC"
date: "2026-04-21"
tags: ["java", "springboot", "dependency-injection", "ioc", "design-patterns"]
excerpt: "Learn how Spring's Inversion of Control container manages your objects — from dependency injection to bean lifecycle — and why it makes your code testable and loosely coupled."
---

# Spring Boot Dependency Injection & IoC

Your controller needs a service. The service needs a repository. The repository needs a data source. You create all of them manually, passing dependencies through constructors. When you need to swap the database for tests, you change 20 files. Dependency injection fixes this — Spring creates and wires everything for you.

## What is Inversion of Control?

**Inversion of Control (IoC)** means your code doesn't create its dependencies — the framework does. Instead of `new UserService(userRepository)`, you declare "I need a UserService" and Spring provides one. The control of object creation is inverted — from your code to the framework.

```java
// Without IoC — you create everything manually
UserRepository repo = new UserRepositoryImpl(dataSource);
UserService service = new UserServiceImpl(repo);
UserController controller = new UserController(service);

// With Spring IoC — just declare what you need
@RestController
public class UserController {
    private final UserService userService;  // Spring injects this

    public UserController(UserService userService) {
        this.userService = userService;
    }
}
```

## Why Does It Matter?

❌ **Problem:** Every class creates its own dependencies with `new`. To test `UserService`, you need a real database because `UserRepository` is hardcoded inside it. To swap PostgreSQL for MySQL, you modify every class that creates a data source.

✅ **Solution:** Spring's IoC container creates all objects (beans) and injects dependencies. For testing, you swap the real repository with a mock. For production, you swap H2 for PostgreSQL by changing one property. The classes never know the difference.

## How Dependency Injection Works

### Constructor Injection (Recommended)
```java
@Service
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    // Spring sees this constructor and injects the beans
    public UserService(UserRepository userRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
}
```

### Field Injection (Avoid)
```java
@Service
public class UserService {

    @Autowired  // Spring injects directly into the field
    private UserRepository userRepository;

    // Simple but: can't make field final, harder to test, hides dependencies
}
```

```text
Why constructor injection is better:
  - Dependencies are explicit (visible in constructor)
  - Fields can be final (immutable after construction)
  - Easy to test (pass mocks to constructor)
  - No magic — you see exactly what the class needs

Why avoid field injection:
  - Hidden dependencies (what does this class need?)
  - Can't be final (might be reassigned)
  - Harder to test (need reflection to inject mocks)
```

### Setter Injection
```java
@Service
public class UserService {

    private UserRepository userRepository;

    @Autowired
    public void setUserRepository(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}
// Useful for optional dependencies
```

## The IoC Container

```text
Spring IoC container lifecycle:

  1. Scan classes with @Component, @Service, @Repository, @Controller
  2. Create bean instances (the objects Spring manages)
  3. Resolve dependencies (inject beans into other beans)
  4. Wire everything together
  5. Application is ready

Your classes declare dependencies.
Spring creates, wires, and manages the lifecycle.
You never write `new` for managed beans.
```

## Bean Scopes

```text
Singleton (default):   One instance shared across the entire application
  → Services, repositories, controllers (stateless objects)

Prototype:             New instance every time it's requested
  → Objects with state that shouldn't be shared

Request:               One instance per HTTP request (web only)
Session:               One instance per HTTP session (web only)

@Component
@Scope("prototype")
public class ShoppingCart { ... }
```

## The @Autowired Behavior

```text
Spring resolves dependencies by TYPE:

  @Service
  public class UserService {
      private final UserRepository repo;
      // Spring looks for a bean of type UserRepository
      // Finds UserRepositoryImpl (which extends JpaRepository)
      // Injects it automatically
  }

When multiple beans of same type exist:
  @Qualifier("postgresRepository")  → specify which one
  @Primary                          → mark one as default
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **IoC container** | Spring creates and manages all beans (objects) |
| **Dependency injection** | Spring provides dependencies instead of you creating them |
| **Constructor injection** | Recommended — explicit, immutable, testable |
| **`@Autowired`** | Tells Spring to inject a dependency (optional with single constructor) |
| **`@Component`** | Marks a class as a Spring-managed bean |
| **`@Service/@Repository/@Controller`** | Specialized @Component with semantic meaning |
| **Bean scope** | Controls how many instances Spring creates (singleton, prototype, etc.) |
| **Loose coupling** | Classes depend on interfaces, not implementations |

**Dependency injection is how you write code that's testable and flexible — your classes declare what they need, and Spring provides it. Swap implementations without touching business logic.**
