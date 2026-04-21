---
title: "Spring Boot Authorization & Roles"
date: "2026-04-21"
tags: ["java", "springboot", "authorization", "roles", "security"]
excerpt: "Learn how to control who can do what in Spring Boot — role-based access control, method-level security, and the difference between authentication and authorization."
---

# Spring Boot Authorization & Roles

Authentication knows WHO you are. Authorization knows WHAT you can do. A regular user can view their own profile. An admin can view anyone's profile and delete users. Role-based access control (RBAC) makes these rules declarative — annotations instead of if-statements.

## Authentication vs Authorization

```text
Authentication:  Who are you?          → Login, JWT, session
Authorization:   What can you do?      → Roles, permissions, rules

Example:
  Authentication: "I'm Alice, user ID 42, role: USER"
  Authorization:  "Can Alice delete user 43? No — only admins can delete users"
```

## Role-Based Access Control

### Defining Roles in Entities
```java
@Entity
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Role role = Role.USER;

    // Getters, setters
}

public enum Role {
    USER,
    ADMIN,
    MODERATOR
}
```

### URL-Based Authorization
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**").permitAll()           // Anyone
        .requestMatchers("/api/public/**").permitAll()         // Anyone
        .requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN")  // Users + Admins
        .requestMatchers("/api/moderator/**").hasRole("MODERATOR")    // Moderators +
        .requestMatchers("/api/admin/**").hasRole("ADMIN")            // Admins only
        .anyRequest().authenticated()                          // Must be logged in
    );
    return http.build();
}
```

### Method-Level Authorization
```java
@Service
public class UserService {

    // Only admins can delete users
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    // Users can view their own profile, admins can view any
    @PreAuthorize("hasRole('ADMIN') or #userId == authentication.principal.id")
    public UserResponse getUser(Long userId) {
        // ...
    }

    // Only the owner or an admin can update a user
    @PreAuthorize("hasRole('ADMIN') or @userRepository.findById(#id).get().email == authentication.name")
    public UserResponse updateUser(Long id, UserRequest request) {
        // ...
    }
}
```

### Post-Authorization
```java
// Check AFTER the method runs (useful when you need the result)
@PostAuthorize("returnObject.role() != 'ADMIN' or hasRole('ADMIN')")
public UserResponse getUser(Long id) {
    // Regular users can't view admin profiles
    // Admins can view everyone
}
```

## SpEL Expressions

```text
Common authorization expressions:

  hasRole('ADMIN')                 → User has role ADMIN
  hasAnyRole('USER', 'ADMIN')      → User has any of these roles
  hasAuthority('user:delete')      → User has specific permission
  isAuthenticated()                → User is logged in
  isAnonymous()                    → User is NOT logged in
  #id == principal.id              → Path variable matches user's ID
  authentication.name              → Current user's username
  @beanName.method(args)           → Call a Spring bean method
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Authorization** | What the authenticated user is allowed to do |
| **Roles** | `USER`, `ADMIN`, `MODERATOR` — broad access categories |
| **`hasRole()`** | URL or method requires specific role |
| **`@PreAuthorize`** | Check authorization before method executes |
| **`@PostAuthorize`** | Check authorization after method executes |
| **SpEL** | Spring Expression Language for complex rules |
| **`#userId == principal.id`** | Only allow access to own resources |
| **`permitAll()`** | No authentication required |

**Authentication asks 'who are you?' once. Authorization asks 'can you do this?' on every action — and Spring Security enforces the answer before your code even runs.**
