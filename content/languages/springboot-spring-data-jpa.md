---
title: "Spring Boot Spring Data JPA"
date: "2026-04-21"
tags: ["java", "springboot", "jpa", "hibernate", "database", "orm"]
excerpt: "Learn how Spring Data JPA makes database access trivial — define interfaces and Spring generates the implementation. No SQL, no boilerplate, just method names."
---

# Spring Boot Spring Data JPA

You need to find all active users ordered by creation date. In raw JDBC, that's a SQL string, a prepared statement, a result set loop, and manual object mapping. In Spring Data JPA, it's one method name: `findByIsActiveTrueOrderByCreatedAtDesc()`. The framework writes the SQL for you.

## What is Spring Data JPA?

**Spring Data JPA** is a Spring module that provides an abstraction over JPA (Java Persistence API) and Hibernate. You define repository interfaces, and Spring generates the implementation at runtime — including SQL queries from method names.

## Setup

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: admin
    password: secret
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

## Entity Definition

```java
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "hashed_password", nullable = false)
    private String hashedPassword;

    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Item> items = new ArrayList<>();
}
```

## Repository Interface

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Spring generates SQL from method name!
    Optional<User> findByEmail(String email);

    List<User> findByIsActiveTrueOrderByCreatedAtDesc();

    boolean existsByEmail(String email);

    List<User> findByNameContainingIgnoreCase(String name);

    long countByIsActiveTrue();
}
```

```text
Method name → SQL:
  findByEmail                    → WHERE email = ?
  findByIsActiveTrue             → WHERE active = true
  OrderByCreatedAtDesc           → ORDER BY created_at DESC
  findByNameContainingIgnoreCase → WHERE LOWER(name) LIKE LOWER(%?%)
  countByIsActiveTrue            → SELECT COUNT(*) WHERE active = true

Keywords:
  findBy, readBy, queryBy, getBy    → all equivalent
  And, Or                           → compound conditions
  OrderBy, Asc, Desc                → sorting
  Containing, StartingWith, EndingWith → LIKE queries
  IgnoreCase                        → case-insensitive
  IsNull, IsNotNull                 → null checks
  In, NotIn                         → IN clause
  Before, After, Between            → date comparisons
```

## Why Does It Matter?

❌ **Problem:** Writing SQL for every query — string concatenation, parameter binding, result set parsing, object mapping. It's repetitive, error-prone, and different for every database. Changing a column name means updating SQL strings across 20 files.

✅ **Solution:** JPA entities map to tables with annotations. Repository interfaces generate queries from method names. Change a column name in one place (the entity), and every query updates automatically. No SQL strings, no manual mapping.

## Custom Queries

### JPQL
```java
@Query("SELECT u FROM User u WHERE u.active = true AND u.createdAt > :date")
List<User> findActiveUsersSince(@Param("date") LocalDateTime date);
```

### Native SQL
```java
@Query(value = "SELECT * FROM users WHERE email = ?1", nativeQuery = true)
Optional<User> findByEmailNative(String email);
```

### Update/Delete
```java
@Modifying
@Query("UPDATE User u SET u.active = false WHERE u.lastLogin < :date")
int deactivateInactiveUsers(@Param("date") LocalDateTime date);
```

## Pagination and Sorting

```java
// Repository
Page<User> findByIsActiveTrue(Pageable pageable);

// Service
public Page<UserResponse> listUsers(int page, int size) {
    Pageable pageable = PageRequest.of(page, size, Sort.by("name").ascending());
    Page<User> result = userRepository.findByIsActiveTrue(pageable);
    return result.map(this::mapToResponse);
}

// Response includes metadata:
// {
//   "content": [...],
//   "totalElements": 150,
//   "totalPages": 15,
//   "number": 0,
//   "size": 10
// }
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **JPA Entity** | Java class mapped to a database table via `@Entity` |
| **JpaRepository** | Interface with CRUD + pagination + sorting methods |
| **Derived queries** | Spring generates SQL from method names |
| **`@Query`** | Custom JPQL or native SQL queries |
| **`@OneToMany/@ManyToOne`** | Define relationships between entities |
| **`Pageable`** | Pagination support built into repositories |
| **`@Transactional`** | Wraps method in a database transaction |
| **Hibernate** | JPA implementation that generates and executes SQL |

**Spring Data JPA lets you query by writing method names, not SQL — the framework translates `findByEmail` into `WHERE email = ?` and handles all the boilerplate you never wanted to write.**
