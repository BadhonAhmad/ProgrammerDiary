---
title: "Spring Boot Exception Handling"
date: "2026-04-21"
tags: ["java", "springboot", "exceptions", "error-handling", "api"]
excerpt: "Learn how to handle errors gracefully in Spring Boot — from custom exceptions to global exception handlers that return consistent, helpful JSON error responses."
---

# Spring Boot Exception Handling

Your API throws a `NullPointerException`. The user sees a generic 500 error with a stack trace leaking internal details. No context, no helpful message. Proper exception handling turns errors into structured responses that help the client instead of confusing them.

## Why Does It Matter?

❌ **Problem:** Unhandled exceptions return ugly HTML stack traces. Each controller handles errors differently — one returns a string, another returns a map, another just throws. Inconsistent error formats mean clients can't parse errors reliably.

✅ **Solution:** A global exception handler catches all errors and returns a consistent JSON format. Clients always know what to expect. Internal details are hidden. Errors are logged for debugging.

## Custom Exceptions

```java
// exception/ResourceNotFoundException.java
public class ResourceNotFoundException extends RuntimeException {
    private final String resource;
    private final Long id;

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " with id " + id + " not found");
        this.resource = resource;
        this.id = id;
    }
}

// exception/DuplicateResourceException.java
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
```

### Throwing in Service Layer
```java
@Service
public class UserService {

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return mapToResponse(user);
    }

    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered");
        }
        // ...
    }
}
```

## Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex) {
        return new ErrorResponse(
            "not_found",
            ex.getMessage(),
            Map.of("resource", ex.getResource(), "id", ex.getId())
        );
    }

    @ExceptionHandler(DuplicateResourceException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ErrorResponse handleDuplicate(DuplicateResourceException ex) {
        return new ErrorResponse("conflict", ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex) {
        List<String> details = ex.getBindingResult()
            .getFieldErrors().stream()
            .map(err -> err.getField() + ": " + err.getDefaultMessage())
            .toList();
        return new ErrorResponse("validation_error", "Invalid input", details);
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return new ErrorResponse(
            "internal_error",
            "An unexpected error occurred",
            null
        );
    }
}
```

### Error Response DTO
```java
public record ErrorResponse(
    String error,
    String message,
    Object details
) {}
```

```text
All errors return the same shape:
{
  "error": "not_found",
  "message": "User with id 42 not found",
  "details": { "resource": "User", "id": 42 }
}
```

## ResponseStatusException (Quick Alternative)

```java
@GetMapping("/{id}")
public UserResponse getUser(@PathVariable Long id) {
    return userService.getUserById(id)
        .orElseThrow(() -> new ResponseStatusException(
            HttpStatus.NOT_FOUND,
            "User not found with id: " + id
        ));
}
```

```text
When to use ResponseStatusException:
  - Quick, one-off errors
  - Don't need a custom exception class
  - Simple projects

When to use @RestControllerAdvice:
  - Consistent error format across the entire API
  - Need to log errors
  - Multiple controllers with same error types
  - Production applications
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@RestControllerAdvice`** | Global exception handler for all controllers |
| **`@ExceptionHandler`** | Maps an exception type to a handler method |
| **Custom exceptions** | Domain-specific exceptions with context |
| **`ErrorResponse`** | Consistent error response DTO |
| **`ResponseStatusException`** | Quick inline exception with HTTP status |
| **`orElseThrow()`** | Convert Optional empty to an exception |
| **Hide internals** | Never expose stack traces to clients |
| **Log everything** | Always log exceptions, even when returning generic message |

**A global exception handler is the difference between an API that feels professional and one that leaks stack traces — catch everything, return consistent JSON, and never let internal details reach the client.**
