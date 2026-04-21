---
title: "Spring Boot Security Basics"
date: "2026-04-21"
tags: ["java", "springboot", "security", "authentication", "authorization"]
excerpt: "Learn how Spring Security works — the filter chain, authentication flow, and how to secure your API endpoints with the most powerful security framework in the Java ecosystem."
---

# Spring Boot Security Basics

You add `spring-boot-starter-security` to your project. Suddenly every endpoint requires a login. Your entire API is locked down. That's Spring Security's default — deny everything. Now you configure exactly who can access what.

## What is Spring Security?

**Spring Security** is a framework that provides authentication (who are you?) and authorization (what can you do?) for Java applications. It works as a chain of filters that intercept every HTTP request and decide whether to allow or deny it.

```text
HTTP request arrives
  → Filter 1: CSRF check
  → Filter 2: Session management
  → Filter 3: Authentication check (who are you?)
  → Filter 4: Authorization check (can you access this?)
  → Your controller (only if all filters pass)

If any filter rejects the request → 401 Unauthorized or 403 Forbidden
```

## Why Does It Matter?

❌ **Problem:** Your API has no security. Anyone can call DELETE /users/42 and delete any user. No login, no identity, no access control. You try to add basic auth manually — checking headers in every controller method. Inconsistent, error-prone, easy to bypass.

✅ **Solution:** Spring Security applies security rules consistently through a filter chain. Define once which endpoints need authentication, which roles can access what. Every request passes through the same security checks — nothing bypasses it.

## SecurityFilterChain Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())          // Disable for REST APIs
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()       // Public
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Admin only
                .requestMatchers("/api/**").authenticated()        // Auth required
                .anyRequest().denyAll()                            // Deny rest
            )
            .httpBasic(Customizer.withDefaults());

        return http.build();
    }
}
```

## Authentication Flow

```text
1. Client sends request with credentials (Basic Auth, JWT, etc.)
2. Spring Security extracts credentials from the request
3. AuthenticationProvider validates credentials (check database)
4. If valid → SecurityContext is populated with user details
5. If invalid → 401 Unauthorized

Key interfaces:
  Authentication       → Represents the user's identity + credentials
  UserDetails          → Spring's representation of a user
  UserDetailsService   → Loads user from database
  AuthenticationProvider → Validates credentials
  SecurityContext      → Holds the current authentication
```

## Custom UserDetailsService

```java
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
            user.getEmail(),
            user.getHashedPassword(),
            user.isActive(),
            true, true, true,
            getAuthorities(user.getRole())
        );
    }

    private Collection<GrantedAuthority> getAuthorities(String role) {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }
}
```

## Method-Level Security

```java
@Configuration
@EnableMethodSecurity
public class SecurityConfig { ... }

// Use on any service or controller method:
@Service
public class UserService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) { ... }

    @PreAuthorize("hasRole('ADMIN') or #id == authentication.principal.id")
    public UserResponse getUser(Long id) { ... }
    // Users can only access their own data, admins can access anyone's
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Spring Security** | Authentication + authorization framework |
| **SecurityFilterChain** | Chain of filters that process every HTTP request |
| **`permitAll()`** | Allow unauthenticated access |
| **`authenticated()`** | Require login |
| **`hasRole("ADMIN")`** | Require specific role |
| **UserDetailsService** | Loads user details from your database |
| **SecurityContext** | Holds the current authenticated user |
| **`@PreAuthorize`** | Method-level authorization with SpEL expressions |

**Spring Security is like a bouncer at every endpoint — by default, nobody gets in. You configure exactly who can access what, and the filter chain enforces it on every request without exception.**
