---
title: "Spring Boot Annotations"
date: "2026-04-21"
tags: ["java", "springboot", "annotations", "core", "reference"]
excerpt: "A comprehensive reference of the most important Spring Boot annotations — what each one does, when to use it, and how they connect the pieces of your application."
---

# Spring Boot Annotations

Spring Boot uses annotations everywhere — `@RestController`, `@Autowired`, `@Transactional`, `@Value`. Each one tells Spring to do something specific: create a bean, inject a dependency, wrap a method in a transaction. Understanding the core annotations is understanding Spring Boot itself.

## Why Annotations?

❌ **Problem:** In old Spring, you configure everything in XML — thousands of lines of angle brackets. Hard to read, hard to debug, and disconnected from the code it configures.

✅ **Solution:** Annotations live right on the code they affect. `@Service` on a class tells Spring it's a service. `@GetMapping("/users")` on a method maps it to an HTTP endpoint. Configuration is co-located with the code.

## Core Annotations

### Application
```text
@SpringBootApplication    → Entry point (combines 3 annotations below)
  @SpringBootConfiguration → This class provides configuration
  @EnableAutoConfiguration → Turn on auto-config based on classpath
  @ComponentScan          → Scan for @Component classes in this package

@SpringBootAppliction is all you need on your main class.
```

### Component Stereotypes
```java
@Component       // Generic Spring-managed bean
@Service         // Business logic layer (semantic alias for @Component)
@Repository      // Data access layer (adds automatic exception translation)
@Controller      // Web MVC controller (returns views)
@RestController  // REST API controller (returns JSON) = @Controller + @ResponseBody
@Configuration   // Class that defines @Bean methods
```

### Dependency Injection
```java
@Autowired          // Inject a dependency (optional with single constructor)
@Qualifier("name")  // Specify which bean when multiple exist
@Primary            // Mark a bean as the default choice
@Value("${key}")    // Inject a property value
```

### HTTP / REST
```java
@RestController                    // REST controller
@RequestMapping("/api/users")      // Base path for all methods in class
@GetMapping("/{id}")               // GET request
@PostMapping                       // POST request
@PutMapping("/{id}")               // PUT request
@DeleteMapping("/{id}")            // DELETE request
@PatchMapping("/{id}")             // PATCH request

@PathVariable                      // Extract from URL path: /users/{id}
@RequestParam                      // Extract from query string: ?page=2
@RequestBody                       // Parse JSON body into object
@RequestHeader("Authorization")    // Extract from HTTP header
@CookieValue("token")              // Extract from cookie

@ResponseBody                      // Return JSON instead of view name
@ResponseStatus(HttpStatus.CREATED)// Set HTTP status code
```

### Validation
```java
@Valid                    // Trigger validation on a request body

// On DTO fields (from javax.validation):
@NotBlank                 // String must not be null or empty
@NotNull                  // Must not be null
@Size(min = 2, max = 50)  // String length range
@Email                    // Valid email format
@Min(0)                   // Number minimum
@Max(150)                 // Number maximum
@Pattern(regexp = "...")  // Regex match
@Past                     // Date must be in the past
@Future                   // Date must be in the future
```

### Data / JPA
```java
@Entity                       // Maps class to database table
@Table(name = "users")        // Specify table name
@Id                           // Primary key field
@GeneratedValue               // Auto-generate ID value
@Column(nullable = false)     // Column constraints
@OneToMany(mappedBy = "user") // One-to-many relationship
@ManyToOne                    // Many-to-one relationship
@ManyToMany                   // Many-to-many relationship
@JoinColumn(name = "user_id") // Foreign key column
@Transactional                // Wrap method in a database transaction
```

### Configuration
```java
@Configuration                // Define beans with @Bean methods
@Bean                         // Create and configure a bean
@ConfigurationProperties(prefix = "app")  // Bind properties to class
@Profile("dev")               // Only active in specific profile
@ConditionalOnProperty(...)   // Only if a property has specific value
@Scope("prototype")           // Change bean scope from default singleton
```

### Security
```java
@PreAuthorize("hasRole('ADMIN')")    // Check before method runs
@PostAuthorize("returnObject.owner == authentication.name")  // Check after
@Secured("ROLE_ADMIN")               // Role-based access control
@WithMockUser(roles = "ADMIN")       // Test with mock authenticated user
```

## Annotation Quick Reference Table

| Annotation | Layer | What It Does |
|---|---|---|
| `@RestController` | Web | Handles HTTP requests, returns JSON |
| `@Service` | Business | Business logic bean |
| `@Repository` | Data | Data access bean |
| `@GetMapping` | Web | Maps GET request to method |
| `@PathVariable` | Web | Extracts value from URL path |
| `@RequestBody` | Web | Parses JSON body into object |
| `@Valid` | Web | Triggers validation |
| `@Transactional` | Data | Wraps method in DB transaction |
| `@Autowired` | Core | Injects a dependency |
| `@Value` | Core | Injects property value |
| `@Entity` | Data | Maps class to DB table |
| `@Configuration` | Core | Defines beans |

**Annotations are Spring Boot's language — each one is a declarative instruction that tells the framework what to do, so you write less boilerplate and more business logic.**
