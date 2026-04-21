---
title: "Spring Boot Request Body & Validation"
date: "2026-04-21"
tags: ["java", "springboot", "validation", "request-body", "dto"]
excerpt: "Learn how Spring Boot validates incoming requests — from DTOs with Bean Validation annotations to custom validators and consistent error responses."
---

# Spring Boot Request Body & Validation

Your API accepts a POST to create a user. Someone sends `{ "name": "", "email": "not-an-email", "age": -5 }`. Without validation, garbage data hits your database. Spring Boot's validation framework catches invalid input before your code ever runs.

## How Request Body Works

Spring Boot uses **HTTP message converters** (Jackson by default) to deserialize JSON into Java objects. The `@RequestBody` annotation tells Spring to parse the incoming JSON body into your DTO class.

```java
public class UserRequest {
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Must be a valid email")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @Min(value = 0, message = "Age cannot be negative")
    @Max(value = 150, message = "Age must be 150 or less")
    private Integer age;

    // Getters and setters
}
```

```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED)
public UserResponse createUser(@Valid @RequestBody UserRequest request) {
    return userService.createUser(request);
    // @Valid triggers validation BEFORE the method runs
}
```

## Why Does It Matter?

❌ **Problem:** Every endpoint manually checks fields — `if (name == null || name.isEmpty()) return error`. You forget to validate `email` format in one endpoint. Negative ages appear in your database. Validation logic is scattered, inconsistent, and incomplete.

✅ **Solution:** Annotations on DTO fields define validation rules. `@Valid` triggers them automatically. Invalid requests never reach your controller method — Spring returns a 400 with detailed error messages. Validation is centralized, consistent, and impossible to forget.

## Validation Annotations

```java
// Null checks
@NotNull                       // Must not be null
@NotBlank                      // String: not null, not empty, not just whitespace
@NotEmpty                      // Collection/String: not null, not empty

// String
@Size(min = 2, max = 50)       // Length range
@Pattern(regexp = "^[A-Z].*")  // Regex match
@Email                         // Valid email format

// Numbers
@Min(0)                        // Minimum value
@Max(100)                      // Maximum value
@Positive                      // Must be > 0
@PositiveOrZero                // Must be >= 0

// Dates
@Past                          // Must be in the past
@Future                        // Must be in the future

// Collections
@Size(min = 1, max = 10)       // Collection size range

// Nested objects
@Valid                          // Validate nested object's fields too
```

## Custom Validation

### Custom Annotation
```java
@Target({FIELD})
@Retention(RUNTIME)
@Constraint(validatedBy = PasswordStrengthValidator.class)
public @interface StrongPassword {
    String message() default "Password must contain uppercase, lowercase, and digit";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
```

### Custom Validator
```java
public class PasswordStrengthValidator implements ConstraintValidator<StrongPassword, String> {
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null) return true;  // Let @NotBlank handle null
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        return hasUpper && hasLower && hasDigit;
    }
}
```

```java
public class UserRequest {
    @StrongPassword
    private String password;  // Uses your custom validator
}
```

## Validation Error Response

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> errors = new HashMap<>();
        errors.put("status", 400);
        errors.put("error", "Validation failed");

        List<Map<String, String>> details = ex.getBindingResult()
            .getFieldErrors().stream()
            .map(err -> Map.of(
                "field", err.getField(),
                "message", err.getDefaultMessage()
            ))
            .toList();
        errors.put("details", details);
        return errors;
    }
}
```

```text
Response for invalid request:
{
  "status": 400,
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name is required" },
    { "field": "email", "message": "Must be a valid email" },
    { "field": "age", "message": "Age cannot be negative" }
  ]
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@Valid`** | Triggers validation on `@RequestBody` parameter |
| **`@NotBlank/@NotNull`** | Field must not be empty/null |
| **`@Size/@Min/@Max`** | Length and range constraints |
| **`@Email/@Pattern`** | Format validation |
| **Custom validator** | Create your own annotation + validation logic |
| **`MethodArgumentNotValidException`** | Exception thrown when validation fails |
| **`@RestControllerAdvice`** | Global handler for validation errors |
| **DTO** | Separate request object from database entity |

**Validation with annotations is declarative — you say what valid looks like, Spring enforces it. No if-statements, no manual checks, no forgotten validations.**
