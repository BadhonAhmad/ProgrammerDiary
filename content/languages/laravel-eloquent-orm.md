---
title: "Laravel Eloquent ORM — Mastering Database Queries"
date: "2025-01-10"
tags: ["laravel", "eloquent", "orm", "php", "database"]
excerpt: "Deep dive into Laravel's Eloquent ORM — models, queries, accessors, mutators, scopes, and advanced querying techniques."
---

# Laravel Eloquent ORM — Mastering Database Queries

Eloquent is Laravel's ActiveRecord ORM. Each model class maps to a database table, and each instance represents a row. It makes database interaction **beautiful and expressive**.

## Creating Models

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

## Model Anatomy

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
            'settings' => 'array',         // JSON column → PHP array
            'tags' => 'collection',         // JSON → Collection
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

## Basic CRUD

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

## Querying

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

## Accessors & Mutators

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

## Query Scopes

Scopes let you define reusable query constraints:

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

## Eager Loading (Prevent N+1)

The N+1 problem is one of the most common performance issues:

```php
// BAD — N+1 query problem
$posts = Post::all();
foreach ($posts as $post) {
    echo $post->user->name;  // Runs a query for EACH post!
}

// GOOD — Eager loading (2 queries total)
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

1. **Use `$fillable` or `$guarded`** — Always protect against mass assignment
2. **Use `findOrFail()`** — For user-facing lookups, auto-returns 404
3. **Eager load relationships** — Always use `with()` to prevent N+1 queries
4. **Use query scopes** — For reusable query logic
5. **Use accessors/mutators** — For computed or transformed attributes
6. **Use `chunk()` or `cursor()`** — When processing large datasets
7. **Use `casts`** — For automatic type conversion (dates, JSON, booleans)
