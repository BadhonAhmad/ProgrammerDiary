---
title: "Spring Boot Database Configuration & Migrations"
date: "2026-04-21"
tags: ["java", "springboot", "database", "flyway", "migrations", "configuration"]
excerpt: "Learn how to configure databases in Spring Boot and manage schema changes with Flyway — from connection pooling to versioned migrations that keep your database in sync."
---

# Spring Boot Database Configuration & Migrations

You add a new column to your User entity. On your machine it works. On staging, the column doesn't exist. On production, it's a different column name. Your database schema is out of sync everywhere. Migrations fix this — every change is versioned, ordered, and applied consistently.

## Database Configuration

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10       # Max connections
      minimum-idle: 5             # Min idle connections
      connection-timeout: 30000   # 30s connection timeout
  jpa:
    hibernate:
      ddl-auto: validate          # NEVER use create/update in production
    show-sql: true
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
```

### ddl-auto Options

```text
create:       Drop and recreate all tables on every startup (data lost!)
create-drop:  Same as create, plus drop on shutdown
update:       Add new columns/tables, never removes (dangerous in prod)
validate:     Check schema matches entities, fail if not (prod-safe)
none:         Don't do anything

Development:  update (convenient, schema changes auto-applied)
Production:   validate (never auto-modify production schema)
Migrations:   Use Flyway or Liquibase instead of ddl-auto
```

## Why Migrations?

❌ **Problem:** `ddl-auto: update` doesn't handle column renames, deletions, or data migrations. It can't add a default value to existing rows. It silently fails on complex schema changes. Production databases drift from your entity definitions.

✅ **Solution:** Migration tools like Flyway version every schema change. Each change is a SQL file applied in order. Production gets the exact same changes as development. Rollback is possible. Schema changes are tracked, reviewed, and auditable.

## Flyway Setup

```xml
<dependency>
    <groupId>org.flywaydb</groupId>
    <artifactId>flyway-core</artifactId>
</dependency>
```

```yaml
# application.yml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
```

### Migration Files

```text
src/main/resources/db/migration/
├── V1__create_users_table.sql
├── V2__create_items_table.sql
├── V3__add_user_role_column.sql
└── V4__add_unique_email_constraint.sql
```

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    active      BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- V3__add_user_role_column.sql
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';

-- V4__insert_default_admin.sql
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@example.com', '$2a$10$...', 'ADMIN');
```

### Naming Convention

```text
V{version}__{description}.sql

  V → versioned migration (run once)
  version → number, can be 1, 1.1, 2026.04.21
  __ → double underscore separator
  description → what the migration does

Examples:
  V1__create_users_table.sql
  V2__create_items_table.sql
  V2.1__add_index_to_items.sql
  V3__add_user_role.sql
```

### How Flyway Works

```text
1. Spring Boot starts
2. Flyway checks the database for a flyway_schema_history table
3. Compares applied migrations vs available migration files
4. Runs any unapplied migrations in order (V1, V2, V3...)
5. Records each in flyway_schema_history

flyway_schema_history:
  installed_rank | version | description            | script
  1              | 1       | create users table     | V1__create_users_table.sql
  2              | 2       | create items table     | V2__create_items_table.sql
  3              | 3       | add user role column   | V3__add_user_role_column.sql

Never modify an already-applied migration!
Create a new one instead.
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`ddl-auto: validate`** | Check schema matches entities without modifying — production safe |
| **Flyway** | Database migration tool — versioned SQL files |
| **`V{N}__{description}.sql`** | Migration file naming convention |
| **`flyway_schema_history`** | Table tracking which migrations have been applied |
| **HikariCP** | Default connection pool — fast, production-ready |
| **Never edit applied migrations** | Create a new migration for every change |
| **Environment variables** | Database credentials from `${DB_USERNAME}`, not hardcoded |

**Database migrations are version control for your schema — every change is tracked, ordered, and applied consistently across every environment. No more 'it works on my machine' for databases.**
