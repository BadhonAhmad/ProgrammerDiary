---
title: "Spring Boot Deployment & Best Practices"
date: "2026-04-21"
tags: ["java", "springboot", "deployment", "docker", "production", "best-practices"]
excerpt: "Learn how to deploy Spring Boot to production — Docker, JVM tuning, health checks, graceful shutdown, and the best practices that separate hobby projects from production systems."
---

# Spring Boot Deployment & Best Practices

`java -jar myapp.jar` works on your laptop. Production demands more — containerization, health checks, proper JVM settings, externalized configuration, and monitoring. Here's how to take Spring Boot from development to production-ready.

## Building for Production

```bash
# Build the JAR
./mvnw clean package -DskipTests

# Run it
java -jar target/myapp-1.0.0.jar

# With production profile
java -jar target/myapp-1.0.0.jar --spring.profiles.active=prod
```

```text
Spring Boot produces a "fat JAR" — your code + all dependencies + embedded Tomcat
in one executable file. No external server needed.
```

## Docker

```dockerfile
# Multi-stage build
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-Xmx512m", \
  "-jar", "app.jar"]
```

```bash
docker build -t myapp .
docker run -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_USERNAME=admin \
  -e DB_PASSWORD=secret \
  myapp
```

## Health Checks (Actuator)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health, info, metrics, prometheus
  endpoint:
    health:
      show-details: always
```

```text
Endpoints:
  GET /actuator/health     → Is the app running? (for load balancers)
  GET /actuator/metrics    → JVM metrics, HTTP metrics
  GET /actuator/info       → Build info, Git commit
  GET /actuator/prometheus → Prometheus-format metrics

Health response:
{
  "status": "UP",
  "components": {
    "db": { "status": "UP" },
    "diskSpace": { "status": "UP" },
    "ping": { "status": "UP" }
  }
}
```

## Custom Health Check

```java
@Component
public class ExternalApiHealth implements HealthIndicator {

    private final RestTemplate restTemplate;

    @Override
    public Health health() {
        try {
            restTemplate.headForUrl("https://api.external.com/health");
            return Health.up().withDetail("externalApi", "reachable").build();
        } catch (Exception e) {
            return Health.down().withDetail("externalApi", "unreachable").build();
        }
    }
}
```

## Graceful Shutdown

```yaml
server:
  shutdown: graceful               # Wait for active requests to finish

spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s  # Max wait before forceful shutdown
```

```text
Without graceful shutdown:
  Deploy → kill process → active requests get 500 errors

With graceful shutdown:
  Deploy → stop accepting new requests → finish active ones → shut down
  Zero dropped requests during deployment
```

## Best Practices

### Code Organization
```text
✅ Use layered architecture (controller → service → repository)
✅ Separate entities from DTOs
✅ Use constructor injection (not field injection)
✅ Use @ConfigurationProperties (not @Value everywhere)
✅ Global exception handling with @RestControllerAdvice
```

### Security
```text
✅ Hash passwords with BCrypt
✅ Never commit secrets — use environment variables
✅ Validate all input with Bean Validation
✅ Use HTTPS in production
✅ Configure CORS explicitly (not *)
✅ Disable CSRF for stateless REST APIs
✅ Use parameterized queries (JPA does this by default)
```

### Performance
```text
✅ Use connection pooling (HikariCP is default)
✅ Cache frequently accessed data
✅ Use @Async for slow non-critical operations
✅ Add database indexes for queried columns
✅ Monitor with Actuator + Prometheus + Grafana
✅ Tune JVM: -Xmx, garbage collector, thread pools
```

### Operations
```text
✅ Externalize all configuration
✅ Use profiles for different environments
✅ Log structured data (JSON logging)
✅ Use Flyway for database migrations
✅ Health checks for load balancer integration
✅ Graceful shutdown for zero-downtime deploys
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Fat JAR** | Single executable JAR with embedded server |
| **Docker** | Containerized deployment — consistent across environments |
| **Actuator** | Production-ready health, metrics, and monitoring endpoints |
| **Graceful shutdown** | Finish active requests before shutting down |
| **Profiles** | Different configuration per environment |
| **JVM tuning** | `-Xmx`, G1GC, thread pools for production load |
| **Externalized config** | All settings from environment variables, not code |
| **Flyway** | Version-controlled database schema changes |

**Development is about making it work. Production is about making it keep working — containerized, monitored, gracefully shutdown, and configured from the outside.**
