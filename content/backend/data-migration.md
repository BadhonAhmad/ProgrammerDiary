---
title: "Data Migration: Move Data Without Breaking Everything"
date: "2026-04-17"
tags: ["backend", "migration", "database", "Prisma", "schema", "deployment"]
excerpt: "Learn how database migrations let you evolve your schema safely — adding tables, renaming columns, and transforming data without downtime or data loss."
---

# Data Migration: Move Data Without Breaking Everything

You need to rename the `name` column to `full_name`. You run `ALTER TABLE users RENAME COLUMN name TO full_name`. The query succeeds. Your app crashes instantly — every query still references `name`. Rolling back isn't easy. This is why migrations exist.

## What is Data Migration?

**Database migration** is the process of changing your database schema (structure) in a controlled, trackable, and reversible way. Migrations handle:

- Adding, renaming, or dropping tables and columns
- Changing data types
- Creating indexes and constraints
- Transforming existing data to match new schema rules
- Rolling back changes when something goes wrong

```text
Migration 001: Create users table
Migration 002: Add email column to users
Migration 003: Rename name → full_name
Migration 004: Split full_name into first_name + last_name
Migration 005: Add index on email column
```

Each migration is a **versioned, timestamped file** that describes one schema change. Migrations run in order — every environment (dev, staging, production) applies the same sequence.

## Why Does It Matter?

❌ **Problem:** You and your teammate both modify the database directly. You add a `phone` column. They add an `address` column. Your local database has `phone` but not `address`. Theirs has `address` but not `phone`. Production has neither. Code that works locally crashes in production. There's no record of what changed or when.

Or worse: you change a column type in production without a migration. The `ALTER TABLE` locks the table for 10 minutes on 5 million rows. Users can't log in. There's no rollback plan.

✅ **Solution:** Migrations are code. They're versioned, reviewed, tested, and applied consistently everywhere. Every developer gets the same database schema. Production changes are predictable and reversible.

## How Migrations Work

### The Migration File

A migration file has two parts: **up** (apply the change) and **down** (reverse it).

```text
// migrations/001_create_users_table.js

exports.up = async (db) => {
  await db.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").notNullable().unique();
    table.timestamp("created_at").defaultTo(db.fn.now());
  });
};

exports.down = async (db) => {
  await db.schema.dropTable("users");
};
```

### Migration Lifecycle

```text
1. Create migration file:  npx prisma migrate dev --name add_phone_column
2. Write the change:        Add column, rename, transform data
3. Test locally:            Run migration, verify schema
4. Commit:                  Migration file goes into git
5. Deploy:                  CI/CD runs migration against staging/production
6. Rollback (if needed):    Run the down migration

Database tracks applied migrations:
  ┌─────────────────────────────────────────┐
  │ _prisma_migrations (or schema_migrations)│
  ├──────────────────┬──────────────────────┤
  │ migration_name   | finished_at          │
  ├──────────────────┼──────────────────────┤
  │ 001_create_users | 2024-03-10 10:00:00  │
  │ 002_add_email    | 2024-03-12 14:30:00  │
  │ 003_add_phone    | (pending)            │
  └──────────────────┴──────────────────────┘
```

## Migrations with Prisma

### Schema-First Approach

Prisma uses a **declarative schema** — you describe the desired state, Prisma figures out the migration.

```text
// schema.prisma

model User {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  phone     String?  @db.VarChar(20)    // ← New field added
  createdAt DateTime @default(now())
  posts     Post[]
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String   @db.VarChar(200)
  content   String?
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

### Creating and Running Migrations

```text
# Create migration from schema changes
npx prisma migrate dev --name add_phone_to_users

# This:
# 1. Compares schema.prisma with current database
# 2. Creates a new SQL migration file
# 3. Applies it to your dev database
# 4. Regenerates the Prisma client

# Apply migrations in production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (dev only — drops all data)
npx prisma migrate reset
```

### Generated Migration File

```text
-- prisma/migrations/20240315103000_add_phone_to_users/migration.sql

-- AlterTable
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
```

### Custom Migrations (Data Transformations)

Sometimes you need to transform data, not just schema:

```text
npx prisma migrate dev --name split_name --create-only
```

This creates the migration file without running it. Edit it manually:

```text
-- Step 1: Add new columns
ALTER TABLE "User" ADD COLUMN "first_name" TEXT;
ALTER TABLE "User" ADD COLUMN "last_name" TEXT;

-- Step 2: Migrate data from old column
UPDATE "User" SET
  "first_name" = split_part("name", ' ', 1),
  "last_name" = CASE
    WHEN position(' ' in "name") > 0
    THEN substring("name" from position(' ' in "name") + 1)
    ELSE ''
  END;

-- Step 3: Make new columns NOT NULL
ALTER TABLE "User" ALTER COLUMN "first_name" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "last_name" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "User" DROP COLUMN "name";
```

## Migrations with Knex.js

Knex is a SQL query builder with built-in migration support.

```text
// knexfile.js
module.exports = {
  client: "postgresql",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "./migrations",
  },
};
```

```text
// migrations/20240315103000_add_phone_to_users.js

exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.string("phone", 20).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.dropColumn("phone");
  });
};
```

```text
# Run migrations
npx knex migrate:latest

# Rollback last batch
npx knex migrate:rollback

# Create new migration
npx knex migrate:make add_phone_to_users

# Check status
npx knex migrate:status
```

## Safe Migration Patterns

### Pattern 1: Expand and Contract (Zero-Downtime)

For breaking changes like renaming or removing columns, use a multi-step approach:

```text
Step 1: Add new column alongside old one
  ALTER TABLE users ADD COLUMN full_name VARCHAR(200);

Step 2: Deploy code that writes to BOTH columns
  // App writes to name AND full_name

Step 3: Backfill existing data
  UPDATE users SET full_name = name WHERE full_name IS NULL;

Step 4: Deploy code that reads from NEW column only
  // App reads from full_name only

Step 5: Remove old column (in a later migration)
  ALTER TABLE users DROP COLUMN name;
```

This ensures zero downtime — at no point is the app reading a column that doesn't exist.

### Pattern 2: Additive First, Destructive Later

```text
Safe (additive):
  ✅ Adding a nullable column
  ✅ Adding a new table
  ✅ Adding an index (with CONCURRENTLY)
  ✅ Adding a new row/value to an enum

Risky (destructive):
  ⚠️ Dropping a column (breaks running code)
  ⚠️ Renaming a column (breaks running queries)
  ⚠️ Changing a column type (may lock table)
  ⚠️ Adding NOT NULL without default (breaks inserts)
```

**Rule:** Add first, deploy, verify, then remove in a separate migration.

### Pattern 3: Large Table Migrations

Adding a column to a table with 50 million rows can lock it for minutes:

```text
-- Bad — locks the table
ALTER TABLE large_table ADD COLUMN new_col TEXT NOT NULL DEFAULT '';

-- Better — add nullable, backfill in batches, then add constraint
ALTER TABLE large_table ADD COLUMN new_col TEXT;

-- Backfill in batches (application code or script)
-- UPDATE large_table SET new_col = '' WHERE id BETWEEN 1 AND 100000;
-- UPDATE large_table SET new_col = '' WHERE id BETWEEN 100001 AND 200000;
-- ... etc

-- Then add NOT NULL constraint
ALTER TABLE large_table ALTER COLUMN new_col SET NOT NULL;
ALTER TABLE large_table ALTER COLUMN new_col SET DEFAULT '';
```

```text
-- PostgreSQL: Add index without locking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
-- "CONCURRENTLY" lets reads and writes continue during index creation
```

## Migration Best Practices

### ✅ Always Test Migrations

Run migrations against a copy of production data before deploying:

```text
# Dump production schema (not data)
pg_dump --schema-only production_db > schema.sql

# Create test database
createdb test_migration
psql test_migration < schema.sql

# Run migration against test database
npx prisma migrate deploy
```

### ✅ Keep Migrations Small

One migration = one logical change. Don't combine "add users table" + "add posts table" + "seed data" in one file.

### ✅ Never Edit Committed Migrations

Once a migration runs in any environment, don't modify it. Create a new migration instead. Editing applied migrations causes divergence between environments.

### ✅ Use Transactions

Most migration tools wrap each migration in a transaction. If it fails halfway, it rolls back:

```text
// Knex — transactions by default
exports.up = function (knex) {
  return knex.schema.alterTable("users", (table) => {
    table.string("email");  // If this fails, everything rolls back
    table.string("phone");  // This won't run if email fails
  });
};
```

### ✅ Seed Data Separately

Seed scripts populate initial or test data. Keep them separate from schema migrations:

```text
// prisma/seed.ts
async function main() {
  await prisma.role.createMany({
    data: [
      { name: "user" },
      { name: "editor" },
      { name: "admin" },
    ],
    skipDuplicates: true,
  });
}
```

## Common Migration Mistakes

### ❌ Running Migrations Manually in Production

Migrations should run automatically as part of CI/CD. Manual SQL in production is unreviewed, untracked, and irreversible.

### ❌ Dropping Columns Before Code Is Updated

If your code still reads `name` but you've dropped the column — crash. Always deploy code that doesn't reference the old column **before** dropping it.

### ❌ No Down Migration

Without a rollback, a failed migration means restoring from backup. Always write `down`:

```text
exports.up = async (db) => {
  await db.schema.alterTable("users", (t) => {
    t.string("phone");
  });
};

exports.down = async (db) => {
  await db.schema.alterTable("users", (t) => {
    t.dropColumn("phone");
  });
};
```

### ❌ Ignoring Migration Order

Migrations run sequentially. Migration 005 depends on the table created in Migration 002. Never reorder or skip migrations.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Migration** | Versioned, trackable database schema change |
| **Up / Down** | Apply change / reverse change |
| **Prisma Migrate** | Auto-generates SQL from schema.prisma changes |
| **Knex migrations** | Programmatic up/down functions |
| **Expand & Contract** | Zero-downtime pattern: add new, migrate, remove old |
| **CONCURRENTLY** | PostgreSQL index creation without table lock |
| **Never edit applied migrations** | Create new ones instead |
| **Seed separately** | Data population ≠ schema changes |
| **Test on production copy** | Verify migrations against real schema before deploying |
| **CI/CD integration** | Migrations run automatically, never manually |

**A migration is a commitment. Write it carefully, test it thoroughly, and always have a way back.**
