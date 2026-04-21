---
title: "Spring Boot Application Properties"
date: "2026-04-21"
tags: ["java", "springboot", "configuration", "properties", "profiles"]
excerpt: "Learn how Spring Boot manages configuration — application properties, environment variables, profiles, and how to externalize every setting so your app works in every environment."
---

# Spring Boot Application Properties

Your database password is hardcoded in the source code. You push to GitHub. Now it's public. Your staging server points to the production database. Configuration should never be in code — Spring Boot's property system externalizes everything.

## What are Application Properties?

Spring Boot uses a **hierarchical property system** that loads configuration from multiple sources — properties files, YAML files, environment variables, and command-line arguments. Values cascade and override each other in a defined order.

## Property Sources (Priority Order)

```text
Highest priority (wins):
  1. Command-line arguments         → --server.port=9090
  2. Environment variables          → SERVER_PORT=9090
  3. application-{profile}.yml      → application-prod.yml
  4. application.yml                → default config
Lowest priority:
  5. Default values in code         → @Value("${server.port:8080}")
```

## Common Properties

### Server
```yaml
server:
  port: 8080                          # HTTP port
  servlet:
    context-path: /api                # Base path for all endpoints
  error:
    include-message: always           # Include error message in response
  tomcat:
    max-threads: 200                  # Max concurrent requests
```

### Database
```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME}          # From environment variable
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10           # Connection pool size
  jpa:
    hibernate:
      ddl-auto: update               # create, update, validate, none
    show-sql: true                    # Log SQL queries
    properties:
      hibernate:
        format_sql: true              # Pretty-print SQL
```

### Logging
```yaml
logging:
  level:
    root: INFO
    com.example.myapp: DEBUG          # Your app at debug level
    org.hibernate.SQL: DEBUG          # See generated SQL
  file:
    name: logs/application.log
```

### Custom Properties
```yaml
app:
  jwt:
    secret: ${JWT_SECRET}
    expiration: 86400000              # 24 hours in ms
  storage:
    upload-dir: /var/uploads
    max-file-size: 10MB
  cors:
    allowed-origins: https://myapp.com
```

## Using Properties in Code

### @Value
```java
@Service
public class JwtService {
    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration:3600000}")  // Default: 1 hour
    private long expiration;
}
```

### @ConfigurationProperties (Preferred)
```java
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private long expiration = 3600000;  // Default value
    // Getters and setters required
}
```

```text
Why @ConfigurationProperties > @Value:
  - Type-safe (validated at startup, not runtime)
  - Grouped in a class (all jwt config in one place)
  - IDE autocomplete for property names
  - Relaxed binding: app.jwt.secret matches app.jwt.secret
  - Supports validation: @NotNull, @Min, @Max on fields
```

### @ConfigurationProperties with Validation
```java
@Component
@ConfigurationProperties(prefix = "app.jwt")
@Validated
public class JwtProperties {
    @NotBlank
    private String secret;

    @Min(3600000)
    private long expiration;

    // Getters and setters
}
// If secret is blank at startup → application fails to start (good!)
```

## Profiles

```text
application.yml           → shared config
application-dev.yml       → dev-only overrides
application-prod.yml      → prod-only overrides

Activate: spring.profiles.active=prod
```

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    hibernate:
      ddl-auto: create-drop    # Recreate DB on every restart

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST}:5432/${DB_NAME}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate       # Only validate schema, never modify
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`application.yml`** | Central configuration file |
| **Environment variables** | Override properties — `${VAR_NAME}` |
| **Profiles** | Different config per environment (dev/staging/prod) |
| **`@Value`** | Inject a single property value |
| **`@ConfigurationProperties`** | Map a group of properties to a typed class |
| **Priority order** | CLI args > env vars > profile yml > default yml > code defaults |
| **Relaxed binding** | `my-property` matches `myProperty` or `MY_PROPERTY` |
| **Validation** | Fail at startup if required properties are missing |

**Never hardcode configuration — use `application.yml` for defaults, environment variables for secrets, and profiles for environment-specific overrides. Your app should work everywhere without code changes.**
