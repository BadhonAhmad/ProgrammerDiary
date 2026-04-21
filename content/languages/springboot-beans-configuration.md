---
title: "Spring Boot Beans & Configuration"
date: "2026-04-21"
tags: ["java", "springboot", "beans", "configuration", "annotations"]
excerpt: "Learn how Spring Boot beans work — how to create them, configure them, and manage application settings with @Configuration, @Bean, and external properties."
---

# Spring Boot Beans & Configuration

Your application needs a `RestTemplate` for HTTP calls, an `ObjectMapper` for JSON, and a `DataSource` for the database. Who creates these objects? Who configures them? In Spring Boot, the framework does — either through auto-configuration or your own `@Configuration` classes.

## What is a Bean?

A **bean** is an object managed by Spring's IoC container. Spring creates it, configures it, injects it where needed, and handles its lifecycle. You never create beans with `new` — you let Spring manage them.

```text
Ways to create beans:
  1. Component scanning: @Component, @Service, @Repository, @Controller
  2. @Bean method: Define in a @Configuration class
  3. Auto-configuration: Spring Boot creates beans based on classpath

Every bean has:
  - A type (the class or interface)
  - A name (default: camelCase of class name)
  - A scope (default: singleton)
  - A lifecycle (init → use → destroy)
```

## Component Scanning

```java
// Spring scans the package of @SpringBootApplication and sub-packages
// Finds classes with stereotype annotations → creates beans

@Component      // Generic bean
@Service        // Business logic bean (same as @Component, semantic)
@Repository     // Data access bean (adds exception translation)
@Controller     // Web controller bean
@RestController // @Controller + @ResponseBody
@Configuration  // Bean definition class
```

## @Bean Methods

For third-party classes you can't annotate (like RestTemplate, ObjectMapper):

```java
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    @Bean
    public WebClient webClient() {
        return WebClient.builder()
            .baseUrl("https://api.example.com")
            .defaultHeader("Authorization", "Bearer " + apiToken)
            .build();
    }
}

// Now inject anywhere:
@Service
public class ExternalApiService {
    private final RestTemplate restTemplate;  // Spring injects your configured bean
    // ...
}
```

## External Configuration

### application.properties vs application.yml

```properties
# application.properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/mydb
spring.datasource.username=admin
spring.datasource.password=secret
app.jwt.secret=my-secret-key
app.jwt.expiration=86400000
```

```yaml
# application.yml (equivalent, often preferred for readability)
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: admin
    password: secret

app:
  jwt:
    secret: my-secret-key
    expiration: 86400000
```

### @ConfigurationProperties

```java
@ConfigurationProperties(prefix = "app.jwt")
@Component
public class JwtProperties {
    private String secret;
    private long expiration;

    // Getters and setters
    public String getSecret() { return secret; }
    public void setSecret(String secret) { this.secret = secret; }
    public long getExpiration() { return expiration; }
    public void setExpiration(long expiration) { this.expiration = expiration; }
}

// Inject anywhere:
@Service
public class JwtService {
    private final JwtProperties jwtProperties;

    public JwtService(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
        // jwtProperties.getSecret() → "my-secret-key"
    }
}
```

### Profiles

```text
Different configs for different environments:

application.yml           → common config
application-dev.yml        → development overrides
application-staging.yml    → staging overrides
application-prod.yml       → production overrides

Activate a profile:
  spring.profiles.active=prod
  (in application.yml, env variable, or command line)

java -jar myapp.jar --spring.profiles.active=prod
```

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb  # In-memory for dev

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://prod-db:5432/mydb
    username: ${DB_USERNAME}  # From environment variable
    password: ${DB_PASSWORD}
```

## Conditional Beans

```java
@Configuration
public class FeatureConfig {

    @Bean
    @ConditionalOnProperty(name = "app.cache.enabled", havingValue = "true")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager();
    }

    @Bean
    @ConditionalOnMissingBean(RestTemplate.class)
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    @Profile("dev")
    public DevDataService devDataService() {
        return new DevDataService();  // Only created in dev profile
    }
}
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Bean** | Object managed by Spring's IoC container |
| **`@Configuration`** | Class that defines beans with `@Bean` methods |
| **`@Bean`** | Creates and configures a bean manually |
| **`@Component`** | Auto-detects and registers as a bean |
| **`@ConfigurationProperties`** | Maps external properties to a typed Java object |
| **Profiles** | Different configurations for different environments |
| **`application.yml`** | Central configuration file |
| **`${VAR}`** | Resolve values from environment variables |

**Spring Boot's configuration system is a hierarchy: auto-configuration gives you sensible defaults, `application.yml` overrides them, and `@Configuration` classes give you full control when you need it.**
