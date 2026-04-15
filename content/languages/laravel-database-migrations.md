---
title: "Laravel Database & Migrations"
date: "2025-01-09"
tags: ["laravel", "database", "migrations", "php", "sql"]
excerpt: "Master Laravel database migrations — the version control system for your database schema. Learn to create, modify, and manage tables with confidence."
---

# Laravel Database & Migrations

Migrations are like **Git for your database**. They allow you to define and share your database schema changes, collaborate with your team, and track the evolution of your database structure.

## Database Configuration

Configure your database in `.env`:

```env
# MySQL
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_app
DB_USERNAME=root
DB_PASSWORD=secret

# SQLite (simplest for local dev)
DB_CONNECTION=sqlite

# PostgreSQL
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=my_app
DB_USERNAME=root
DB_PASSWORD=secret
```

## Creating Migrations

```bash
# Create a migration
php artisan make:migration create_posts_table

# With descriptive name (Laravel auto-generates table name)
php artisan make:migration create_posts_table --create=posts

# To modify an existing table
php artisan make:migration add_status_to_posts_table --table=posts

# Create with model (generates both model + migration)
php artisan make:model Post -m
```

## Migration Structure

```php
// database/migrations/2025_01_01_000000_create_posts_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();                          // Auto-incrementing BIGINT primary key
            $table->string('title');               // VARCHAR(255)
            $table->string('slug')->unique();      // VARCHAR(255) with unique index
            $table->text('content')->nullable();   // TEXT, allows NULL
            $table->text('excerpt')->nullable();
            $table->string('status')->default('draft'); // With default value
            $table->boolean('featured')->default(false);
            $table->integer('views')->default(0);
            $table->unsignedBigInteger('user_id');  // Foreign key column
            $table->foreignId('user_id')           // Shorthand for foreign key
                  ->constrained()
                  ->onDelete('cascade');
            $table->foreignId('category_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();
            $table->timestamps();                  // created_at, updated_at
            $table->softDeletes();                 // deleted_at (for soft deletes)
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

## Available Column Types

| Method | Column Type | Description |
|--------|------------|-------------|
| `$table->id()` | BIGINT UNSIGNED | Auto-incrementing primary key |
| `$table->bigIncrements('id')` | BIGINT UNSIGNED | Auto-incrementing ID |
| `$table->string('name', 100)` | VARCHAR(100) | String with optional length |
| `$table->text('content')` | TEXT | Long text |
| `$table->longText('body')` | LONGTEXT | Very long text |
| `$table->integer('votes')` | INTEGER | Integer |
| `$table->bigInteger('views')` | BIGINT | Big integer |
| `$table->boolean('active')` | BOOLEAN / TINYINT | True/false |
| `$table->float('price', 8, 2)` | FLOAT | Floating point |
| `$table->decimal('amount', 10, 2)` | DECIMAL | Exact decimal |
| `$table->date('born_at')` | DATE | Date only |
| `$table->dateTime('published_at')` | DATETIME | Date and time |
| `$table->timestamp('seen_at')` | TIMESTAMP | Timestamp |
| `$table->enum('status', ['a','b'])` | ENUM | Enumerated values |
| `$table->json('settings')` | JSON | JSON data |
| `$table->uuid('uuid')` | UUID | UUID |
| `$table->ipAddress('ip')` | VARCHAR(45) | IP address |
| `$table->macAddress('mac')` | VARCHAR(17) | MAC address |
| `$table->rememberToken()` | VARCHAR(100) | For "remember me" |
| `$table->timestamps()` | TIMESTAMP | created_at, updated_at |
| `$table->softDeletes()` | TIMESTAMP | deleted_at |

## Column Modifiers

```php
$table->string('name')->nullable();           // Allow NULL
$table->string('name')->default('John');       // Default value
$table->string('name')->unique();             // Unique index
$table->string('email')->index();             // Add index
$table->string('name')->first();              // First column in table
$table->string('name')->after('email');       // Place after another column
$table->string('name')->comment('User name'); // Add comment
$table->string('name')->charset('utf8mb4');   // Set charset
$table->string('name')->collation('unicode_ci'); // Set collation
$table->string('name')->storedAs('expression'); // Stored generated column
$table->string('name')->virtualAs('expression'); // Virtual generated column
```

## Indexes

```php
// Unique index
$table->string('email')->unique();

// Composite index
$table->index(['account_id', 'created_at']);

// Named index
$table->unique('email', 'unique_email_index');

// Foreign key constraints
$table->foreignId('user_id')->constrained();                    // References users.id
$table->foreignId('user_id')->constrained('app_users');          // Custom table name
$table->foreignId('user_id')->constrained()->onDelete('cascade'); // Delete with parent
$table->foreignId('user_id')->constrained()->nullOnDelete();      // Set null on delete

// Drop indexes
$table->dropUnique('users_email_unique');
$table->dropIndex(['account_id', 'created_at']);
$table->dropForeign(['user_id']);
```

## Modifying Existing Tables

```php
// Adding columns to existing table
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('meta_title')->nullable()->after('title');
            $table->text('meta_description')->nullable()->after('meta_title');
            $table->string('featured_image')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['meta_title', 'meta_description', 'featured_image']);
        });
    }
};
```

## Renaming & Dropping

```php
// Rename a table
Schema::rename('posts', 'articles');

// Drop a table
Schema::dropIfExists('old_table');

// Rename a column
Schema::table('posts', function (Blueprint $table) {
    $table->renameColumn('body', 'content');
});

// Drop a column
Schema::table('posts', function (Blueprint $table) {
    $table->dropColumn('old_column');
    $table->dropColumn(['column1', 'column2']);
});
```

## Running Migrations

```bash
# Run all pending migrations
php artisan migrate

# Run with seed data
php artisan migrate --seed

# Status of migrations
php artisan migrate:status

# Rollback the last batch of migrations
php artisan migrate:rollback

# Rollback specific number of steps
php artisan migrate:rollback --step=3

# Rollback ALL migrations and re-run
php artisan migrate:fresh

# Same as fresh but also runs seeders
php artisan migrate:fresh --seed

# Rollback all then re-run (doesn't drop non-migration tables)
php artisan migrate:refresh

# Drop all tables, views, and types (like fresh but cleaner)
php artisan migrate:wipe
```

## Migration Best Practices

### Always Write a `down()` Method

```php
public function down(): void
{
    // When adding columns
    Schema::table('posts', function (Blueprint $table) {
        $table->dropColumn('meta_title');
    });

    // When creating tables
    Schema::dropIfExists('posts');
}
```

### Use Separate Migrations for Changes

Don't modify existing migration files that have already been run. Create new ones:

```bash
# Instead of editing create_posts_table.php, do this:
php artisan make:migration add_published_at_to_posts_table --table=posts
```

### Keep Migrations Small and Focused

One migration per logical change:

```
✓ add_published_at_to_posts_table
✓ add_category_id_to_posts_table
✗ add_published_at_and_category_id_and_status_to_posts_table
```

## Seeders — Populating the Database

```bash
php artisan make:seeder PostSeeder
```

```php
// database/seeders/PostSeeder.php
namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Seeder;

class PostSeeder extends Seeder
{
    public function run(): void
    {
        // Create specific records
        Post::create([
            'title' => 'First Post',
            'content' => 'Hello World!',
            'user_id' => User::first()->id,
        ]);

        // Use factories for bulk test data
        Post::factory(50)->create();
    }
}
```

### Main Database Seeder

```php
// database/seeders/DatabaseSeeder.php
namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            PostSeeder::class,
            CommentSeeder::class,
        ]);
    }
}
```

### Running Seeders

```bash
# Run all seeders
php artisan db:seed

# Run a specific seeder
php artisan db:seed --class=PostSeeder

# Fresh migrate and seed
php artisan migrate:fresh --seed
```

## Factories — Generating Test Data

```bash
php artisan make:factory PostFactory
```

```php
// database/factories/PostFactory.php
namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'slug' => fake()->unique()->slug(),
            'content' => fake()->paragraphs(5, true),
            'excerpt' => fake()->paragraph(),
            'status' => fake()->randomElement(['draft', 'published']),
            'user_id' => User::factory(),
            'published_at' => fake()->optional()->dateTimeBetween('-1 year', 'now'),
        ];
    }

    // Define states
    public function published(): Factory
    {
        return $this->state(fn () => [
            'status' => 'published',
            'published_at' => now(),
        ]);
    }

    public function draft(): Factory
    {
        return $this->state(fn () => [
            'status' => 'draft',
            'published_at' => null,
        ]);
    }
}
```

Usage:

```php
Post::factory(10)->create();           // 10 random posts
Post::factory(5)->published()->create(); // 5 published posts
Post::factory()->create(['title' => 'Custom Title']); // Override fields
```

## Best Practices

1. **Never edit committed migrations** — Create new ones to change schema
2. **Always implement `down()`** — So rollbacks work correctly
3. **Use factories** — For generating consistent test data
4. **Seed in development only** — Never seed production accidentally
5. **Use foreign key constraints** — Ensure referential integrity
6. **Index frequently queried columns** — Add indexes for columns used in WHERE, JOIN
7. **Use soft deletes** — When data should be recoverable
