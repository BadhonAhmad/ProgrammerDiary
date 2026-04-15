---
title: "Laravel Eloquent ORM — Mastering Database Queries"
date: "2025-01-10"
tags: ["laravel", "eloquent", "orm", "php", "database"]
excerpt: "Deep dive into Laravel's Eloquent ORM — models, queries, accessors, mutators, scopes, and advanced querying techniques."
---

# Laravel Eloquent ORM — Mastering Database Queries

## What Is an ORM and Why Does It Exist?

An ORM (Object-Relational Mapper) exists because of a fundamental mismatch: your application thinks in objects, but your database thinks in tables and rows. Without an ORM, every time you want to save a user, you write `INSERT INTO users (name, email) VALUES (...)`. When you want to fetch a user, you write `SELECT * FROM users WHERE id = 1`, and then manually convert the result rows into PHP objects. It works, but it gets old fast — especially when your queries become complex with joins, grouping, and subqueries. You end up with SQL strings scattered across your entire codebase, impossible to test or reuse.

Eloquent is Laravel's answer to this problem. It follows the **ActiveRecord pattern**, which means each model class maps directly to a database table, and each instance of that class represents a single row. You interact with your database using PHP methods and properties instead of raw SQL: `Post::where('status', 'published')->get()` instead of writing a query string. The key difference from some other ORMs (like Hibernate in Java or Doctrine in PHP) is that ActiveRecord puts the data access methods directly on the model itself. A `Post` model knows how to save itself, query itself, and define its own relationships. It is a simpler, more intuitive approach — some might say opinionated — but it makes everyday database work feel natural.

## Models — Your Data in Object Form

A model is where it all starts. Every database table you want to interact with gets a corresponding model class. Laravel can auto-detect the table name from the class name (`Post` becomes `posts`), but you can override anything you need to.

### Creating Models

```bash
# Create a model
php artisan make:model Post

# Create with migration
php artisan make:model Post -m

# Create with migration, factory, seeder, and controller
php artisan make:model Post -mfsc

# Create with everything + resource controller
php artisan make:model Post -a
```

### Model Anatomy

There are a few important properties to understand here. `$fillable` is about security — it whitelists which fields can be mass-assigned, preventing users from sneaking in fields they should not be allowed to set (more on that below). `$casts` handles type conversion automatically, so a `published_at` column comes out as a Carbon date object instead of a plain string. `$attributes` sets default values when a new model is created.

```php
// app/Models/Post.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Post extends Model
{
    use SoftDeletes;  // Enables soft deletes (deleted_at column)

    // Table name (auto-detected from class name, but you can override)
    protected $table = 'posts';

    // Mass-assignable fields
    protected $fillable = [
        'title',
        'slug',
        'content',
        'excerpt',
        'status',
        'user_id',
        'category_id',
        'published_at',
    ];

    // Or use $guarded to block specific fields (alternative to $fillable)
    // protected $guarded = ['id'];

    // Attribute casting
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'is_featured' => 'boolean',
            'settings' => 'array',         // JSON column -> PHP array
            'tags' => 'collection',         // JSON -> Collection
            'options' => AsEnumCollection::class, // Enum collection
        ];
    }

    // Default values
    protected $attributes = [
        'status' => 'draft',
        'views' => 0,
    ];
}
```

## Mass Assignment — A Security Vulnerability and How `$fillable` Stops It

Here is a scenario that used to break real applications: you have a form where users can update their profile (name, email). Your controller does `User::create($request->all())`. A malicious user inspects the form submission, adds `is_admin => true` to the request payload, and suddenly they have admin privileges. This is the **mass assignment vulnerability**, and it happened because you were blindly trusting user input to set database columns.

Laravel protects you with `$fillable` (whitelist approach) or `$guarded` (blacklist approach). Only the fields listed in `$fillable` can be set through mass assignment methods like `create()` and `update()`. Any extra fields in the request are silently ignored. It is a small configuration that prevents a significant security hole.

## Basic CRUD

Once your model is set up, everyday operations become simple method calls.

### Create

```php
// Method 1: create() with mass assignment
$post = Post::create([
    'title' => 'My First Post',
    'content' => 'Hello World!',
    'user_id' => 1,
]);

// Method 2: Create and save
$post = new Post;
$post->title = 'My Post';
$post->content = 'Content here';
$post->save();

// Method 3: firstOrCreate (find or create)
$post = Post::firstOrCreate(
    ['slug' => 'my-post'],           // Search criteria
    ['title' => 'My Post', 'content' => '...']  // Values if creating
);

// Method 4: updateOrCreate
$post = Post::updateOrCreate(
    ['slug' => 'my-post'],           // Search criteria
    ['title' => 'Updated Title']     // Values to update/create
);
```

### Read

```php
// Get all records
$posts = Post::all();

// Find by primary key
$post = Post::find(1);
$post = Post::findOrFail(1);  // Throws 404 if not found

// Find by column
$post = Post::where('slug', 'my-post')->first();
$post = Post::where('slug', 'my-post')->firstOrFail();

// Get multiple
$posts = Post::where('status', 'published')->get();

// Chunk processing (for large datasets)
Post::chunk(200, function ($posts) {
    foreach ($posts as $post) {
        // Process each post
    }
});

// Cursor (memory-efficient iteration)
foreach (Post::cursor() as $post) {
    // Processes one at a time, minimal memory
}
```

### Update

```php
// Update a model instance
$post = Post::find(1);
$post->title = 'Updated Title';
$post->save();

// Mass update
Post::where('status', 'draft')->update(['status' => 'archived']);

// Update via mass assignment
$post->update(['title' => 'New Title', 'status' => 'published']);
```

### Delete

Soft deletes deserve a mention here. Instead of actually removing a row from the database, soft deletes set a `deleted_at` timestamp. The row still exists, but Eloquent automatically filters it out of queries. This is like moving a file to the trash instead of permanently deleting it — you can recover it if you made a mistake.

```php
// Delete a single instance
$post = Post::find(1);
$post->delete();

// Delete by primary key
Post::destroy(1);
Post::destroy([1, 2, 3]);

// Delete by query
Post::where('views', 0)->delete();

// Soft deletes (if using SoftDeletes trait)
$post->delete();     // Sets deleted_at timestamp
$post->forceDelete(); // Permanently deletes
$post->restore();     // Restores soft-deleted record

// Query including soft-deleted
Post::withTrashed()->get();
Post::onlyTrashed()->get();
```

## Querying — Building Queries Without SQL Strings

Eloquent's query builder lets you construct complex queries by chaining methods instead of concatenating SQL strings. Each method call returns the query builder itself, so you can keep adding conditions. This fluent interface means your queries are composable, testable, and database-agnostic.

### WHERE Clauses

```php
// Basic where
Post::where('status', 'published')->get();
Post::where('views', '>', 100)->get();
Post::where('created_at', '>=', now()->subWeek())->get();

// Multiple conditions (AND)
Post::where('status', 'published')
    ->where('views', '>', 100)
    ->get();

// OR conditions
Post::where('status', 'published')
    ->orWhere('featured', true)
    ->get();

// WHERE IN
Post::whereIn('status', ['published', 'featured'])->get();
Post::whereNotIn('status', ['draft', 'archived'])->get();

// WHERE NULL
Post::whereNull('published_at')->get();
Post::whereNotNull('published_at')->get();

// WHERE BETWEEN
Post::whereBetween('views', [100, 1000])->get();

// WHERE EXISTS
Post::whereExists(function ($query) {
    $query->selectRaw(1)
          ->from('comments')
          ->whereColumn('comments.post_id', 'posts.id');
})->get();

// JSON column querying
User::where('settings->theme', 'dark')->get();
User::where('settings->notifications->email', true)->get();
```

### Ordering, Limiting, Grouping

```php
// Order by
Post::orderBy('created_at', 'desc')->get();
Post::latest()->get();           // Same as orderBy('created_at', 'desc')
Post::oldest()->get();           // Same as orderBy('created_at', 'asc')
Post::inRandomOrder()->get();    // Random order

// Limit & offset
Post::take(10)->get();
Post::skip(10)->take(10)->get(); // Pagination: page 2, 10 per page

// Group by & having
Post::selectRaw('status, count(*) as total')
    ->groupBy('status')
    ->having('total', '>', 10)
    ->get();

// Select specific columns
Post::select('id', 'title', 'slug')->get();
Post::select('title as post_title')->get();

// Distinct
Post::select('category_id')->distinct()->get();
```

### Aggregates

```php
Post::count();                                    // Total count
Post::where('status', 'published')->count();      // Filtered count
Post::max('views');                               // Maximum value
Post::min('views');                               // Minimum value
Post::avg('views');                               // Average
Post::sum('views');                               // Sum
Post::average('views');                           // Alias for avg

// exists() / doesntExist()
Post::where('slug', 'my-post')->exists();         // true/false
Post::where('status', 'archived')->doesntExist(); // true/false
```

## Accessors and Mutators — Centralized Data Transformation

Have you ever stored a user's name in lowercase in the database but wanted to display it title-cased everywhere? You could call `ucwords($user->name)` in every Blade template, but that is fragile — you will forget one eventually. Accessors solve this by letting you define the transformation once, right on the model. Whenever you read `$user->name`, the accessor runs automatically. Mutators work the same way but for writing — set `$user->password = 'secret'` and the mutator hashes it before it ever hits the database.

The beauty here is centralization. The formatting or transformation logic lives in exactly one place. If the rule changes (maybe you switch from bcrypt to Argon2 for passwords), you update one mutator instead of hunting through your entire codebase.

### Accessors (Reading)

```php
class Post extends Model
{
    // Modern approach (Laravel 9+)
    protected function title(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucwords($value),
        );
    }

    // Computed accessor (no column in DB)
    protected function excerptOrContent(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->excerpt ?? Str::limit($this->content, 150),
        );
    }

    // Access full URL for a path
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn () => route('posts.show', $this->slug),
        );
    }
}

// Usage
$post->title;           // "My Great Post" (auto-capitalized)
$post->excerptOrContent; // Returns excerpt or truncated content
```

### Mutators (Writing)

```php
class User extends Model
{
    // Auto-hash passwords
    protected function password(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => bcrypt($value),
        );
    }

    // Auto-generate slug from title
    protected function title(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => ucwords($value),
            set: fn (string $value) => [
                'title' => $value,
                'slug' => Str::slug($value),
            ],
        );
    }

    // Normalize email
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => strtolower(trim($value)),
        );
    }
}

// Usage
$user->password = 'secret123';  // Auto-hashed
$post->title = 'my new post';  // Sets title + auto-generates slug
```

## Query Scopes — Reusable Query Logic

Imagine you have a blog where "published posts" means `status = 'published' AND published_at IS NOT NULL`. You will need this exact query in your homepage controller, your RSS feed, your sitemap generator, and your API endpoint. Without scopes, you copy-paste that `where` chain everywhere. When the definition of "published" changes (maybe you add a `deleted_at IS NULL` check), you now have to find and update every copy. That is a bug waiting to happen.

Query scopes let you extract that logic into a method on the model. Define `scopePublished` once, then call `Post::published()` wherever you need it. If the business rule changes, you change it in one place and every caller is instantly updated.

```php
class Post extends Model
{
    // Local scope
    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at');
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public function scopePopular($query, int $minViews = 1000)
    {
        return $query->where('views', '>=', $minViews);
    }

    // Dynamic scope
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }
}

// Usage
Post::published()->get();
Post::published()->featured()->get();
Post::popular(500)->get();
Post::ofType('tutorial')->published()->get();
```

## Pagination

```php
// Basic pagination
$posts = Post::paginate(15);              // 15 per page
$posts = Post::simplePaginate(15);        // Lighter query (no total count)
$posts = Post::cursorPaginate(15);        // Cursor-based (best for large datasets)

// Paginate filtered results
$posts = Post::where('status', 'published')->paginate(15);

// In Blade
{{ $posts->links() }}

// Custom pagination view
{{ $posts->links('vendor.pagination.custom') }}

// Pagination object properties
$posts->total();       // Total records
$posts->count();       // Items on current page
$posts->currentPage(); // Current page number
$posts->lastPage();    // Last page number
$posts->perPage();     // Items per page
$posts->items();       // Array of items on page
```

## Eager Loading — Solving the N+1 Problem

The N+1 problem is one of the most common and sneaky performance issues in web applications. Here is how it happens: you load 50 posts with `Post::all()` (1 query). Then in your Blade template, you display `$post->user->name` for each post. Eloquent has to run a separate query to fetch each post's user — that is 50 more queries. You started with 1 query and ended up with 51. For 1,000 posts, you would run 1,001 queries. The page becomes painfully slow, and the database gets hammered.

Eager loading solves this by loading all related models upfront in a single additional query. `Post::with('user')->get()` runs exactly 2 queries total — one for posts, one for all the related users. The performance difference is dramatic, especially as your data grows. As a rule of thumb: if you are going to access a relationship in a loop, always eager load it.

```php
// BAD -- N+1 query problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->user->name;  // Runs a query for EACH post!
}

// GOOD -- Eager loading (2 queries total)
$posts = Post::with('user')->get();
foreach ($posts as $post) {
    echo $post->user->name;  // No extra query!
}

// Multiple relationships
$posts = Post::with(['user', 'category', 'tags'])->get();

// Nested eager loading
$posts = Post::with('comments.user')->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest()->limit(5);
}])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('user', 'category');  // Load after the fact

// Count related models
$posts = Post::withCount('comments')->get();
foreach ($posts as $post) {
    echo $post->comments_count;
}

// Multiple counts
$posts = Post::withCount(['comments', 'likes'])->get();

// Conditional counts
$posts = Post::withCount(['comments as pending_count' => function ($query) {
    $query->where('approved', false);
}])->get();
```

## Best Practices

1. **Use `$fillable` or `$guarded`** -- Always protect against mass assignment
2. **Use `findOrFail()`** -- For user-facing lookups, auto-returns 404
3. **Eager load relationships** -- Always use `with()` to prevent N+1 queries
4. **Use query scopes** -- For reusable query logic
5. **Use accessors/mutators** -- For computed or transformed attributes
6. **Use `chunk()` or `cursor()`** -- When processing large datasets
7. **Use `casts`** -- For automatic type conversion (dates, JSON, booleans)
