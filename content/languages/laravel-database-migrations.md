---
title: "Laravel Database & Migrations"
date: "2025-01-09"
tags: ["laravel", "database", "migrations", "php", "sql"]
excerpt: "Master Laravel database migrations — the version control system for your database schema. Learn to create, modify, and manage tables with confidence."
---

# Laravel Database & Migrations

## Why Migrations Exist

Before migrations came along, managing a database across a team was genuinely painful. You would write some SQL to create a table on your local machine, and then... what? Email the SQL file to your teammates? Paste it into a shared document? Maybe you kept a folder of `.sql` files and hoped everyone ran them in the right order. More often than not, someone would forget to run a script, and suddenly their local app would crash because a column was missing. Production deployments were even scarier — you would manually run ALTER TABLE commands on a live database, praying you did not typo a column name.

Migrations solve this by treating your database schema like code. Every change — creating a table, adding a column, renaming a field — is captured in a versioned file that lives right alongside your application code. When a teammate pulls your branch, they run `php artisan migrate` and their database matches yours instantly. No emails, no guesswork, no "it works on my machine." Laravel even tracks which migrations have already run in a special `migrations` table, so it knows exactly what to apply and what to skip. It is essentially Git for your database.

## The Up/Down Concept — Why Reversibility Matters

Every migration has two methods: `up()` and `down()`. The `up` method describes what to do when the migration runs (create a table, add a column). The `down` method describes how to undo it (drop the table, remove the column). This reversibility is not just a nice feature — it is critical for safe development. Imagine you deploy a migration to production that adds a column, and thirty minutes later you realize it breaks something. Without a `down` method, you are manually writing SQL to undo the damage. With one, you just run `php artisan migrate:rollback` and everything reverts cleanly.

Think of it like undo in a text editor. You would not want an editor that only lets you type but never backspace. Migrations work the same way — every forward step must have a corresponding backward step.

## Database Configuration

Before running any migrations, Laravel needs to know which database to talk to. You configure this in the `.env` file — keep your credentials out of version control.

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

Laravel provides artisan commands to generate migration files. The naming convention matters — Laravel uses the migration name to figure out what you intend to do (create a table, add columns, etc.).

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

## Writing a Migration — The Blueprint

When you open a migration file, you use the `Blueprint` object to describe your table structure. This is a PHP-based schema builder — instead of writing raw SQL like `VARCHAR(255) NOT NULL`, you write `$table->string('name')`. The benefit is enormous: your schema definition is now database-agnostic. The same migration can generate MySQL, PostgreSQL, or SQLite syntax depending on your config.

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

Laravel provides a column type method for almost every database column type you will need. Here is a reference of the most commonly used ones.

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

Beyond just defining the type, you can chain modifiers to control nullable, defaults, ordering, and more.

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

## Indexes and Foreign Keys

Indexes are what make your database fast. Without them, the database has to scan every single row to find what you are looking for — imagine finding a word in a book without an index. Foreign keys enforce that relationships stay valid at the database level. If a post references user ID 5, a foreign key prevents you from deleting user 5 and leaving an orphaned post behind.

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

After you have shipped a migration, you should never go back and edit it. Other developers (and your production server) have already run it. Instead, create a new migration that describes the change. This is the same principle as not rewriting Git history — you move forward, you do not edit the past.

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

These are the commands you will use daily. `migrate` applies pending migrations. `rollback` undoes the last batch. `fresh` drops everything and starts from scratch — useful in development, dangerous in production.

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

## Factories and Seeders — Why Your Database Needs Realistic Data

An empty database is useless for development. You need data to build features, test edge cases, and see how your UI actually looks. But inserting data manually through phpMyAdmin or writing one-off SQL INSERT statements is tedious and unsustainable. That is where factories and seeders come in.

**Factories** define blueprints for generating fake but realistic data. You tell a factory that a post has a title (a random sentence), content (a few paragraphs), and a status (draft or published). Every time you call the factory, it generates a new unique post. **Seeders** use those factories (or manual data) to populate your database in a structured way. The result: any developer on your team can run `php artisan migrate:fresh --seed` and instantly have a fully populated, realistic local database.

### Seeders — Populating the Database

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

The `DatabaseSeeder` is the entry point. When you run `php artisan db:seed`, Laravel starts here and calls whichever seeders you have listed.

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

Factories use the Faker library under the hood to generate realistic-looking data — real names, real email formats, real paragraphs of text. You can also define "states" like `published()` or `draft()` to create posts in specific conditions. This is far more maintainable than hardcoding test data.

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
