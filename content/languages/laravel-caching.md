---
title: "Laravel Caching — Speed Up Your Application"
date: "2025-01-20"
tags: ["laravel", "caching", "performance", "redis", "php"]
excerpt: "Learn how to use Laravel's caching system — cache drivers, storing data, cache tags, route caching, and performance optimization strategies."
---

# Laravel Caching — Speed Up Your Application

Caching stores expensive computation results so they can be retrieved quickly on future requests. Laravel provides a unified API for various caching backends.

## Cache Configuration

```env
# .env
CACHE_STORE=file    # file, database, redis, memcached, array, dynamodb
```

```php
// config/cache.php
'stores' => [
    'file' => [
        'driver' => 'file',
        'path' => storage_path('framework/cache/data'),
    ],

    'database' => [
        'driver' => 'database',
        'table' => 'cache',
        'connection' => null,
    ],

    'redis' => [
        'driver' => 'redis',
        'connection' => 'cache',
    ],

    'memcached' => [
        'driver' => 'memcached',
        'servers' => [
            ['host' => '127.0.0.1', 'port' => 11211],
        ],
    ],

    'array' => [
        'driver' => 'array',
        'serialize' => false,
    ],
],
```

### Redis (Recommended for Production)

```env
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Basic Cache Operations

```php
use Illuminate\Support\Facades\Cache;

// Store a value (forever)
Cache::put('key', 'value');
Cache::put('key', 'value', 3600);                // 3600 seconds (1 hour)
Cache::put('key', 'value', now()->addHours(1));   // Carbon interval
Cache::put('key', 'value', now()->addDays(7));

// Store if doesn't exist
Cache::add('key', 'value');  // Returns true if added, false if already exists

// Get a value
$value = Cache::get('key');

// Get with default value
$value = Cache::get('key', 'default');
$value = Cache::get('key', function () {
    return expensiveComputation();
});

// Check if exists
if (Cache::has('key')) {
    // Key exists
}

// Get and delete (atomic pop)
$value = Cache::pull('key');

// Delete
Cache::forget('key');
Cache::delete('key');

// Delete multiple
Cache::forget(['key1', 'key2']);

// Clear entire cache
Cache::flush();
Cache::clear();

// Get multiple values
$values = Cache::many(['key1', 'key2', 'key3']);

// Store multiple values
Cache::putMany(['key1' => 'val1', 'key2' => 'val2'], 3600);
```

## The `remember()` Pattern

This is the **most useful** cache method — get from cache or compute and store:

```php
// Basic remember
$posts = Cache::remember('posts.all', 3600, function () {
    return Post::with('user', 'tags')->published()->get();
});

// rememberForever
$config = Cache::rememberForever('app.config', function () {
    return Setting::all()->pluck('value', 'key');
});

// Remember with dynamic key
$userPosts = Cache::remember("user.{$userId}.posts", 3600, function () use ($userId) {
    return Post::where('user_id', $userId)->get();
});
```

## Using a Specific Cache Store

```php
// Use a specific store
Cache::store('redis')->put('key', 'value', 600);
Cache::store('file')->get('key');
Cache::store('redis')->forget('key');
```

## Cache Tags (Redis Only)

Group related cache items and clear them together:

```php
// Store with tags
Cache::tags(['posts', 'popular'])->put('popular-posts', $posts, 3600);
Cache::tags(['posts', 'user-1'])->put("user-1-posts", $userPosts, 3600);

// Retrieve with tags
$posts = Cache::tags(['posts', 'popular'])->get('popular-posts');

// Flush a specific tag (clears ALL items with that tag)
Cache::tags(['posts'])->flush();

// Flush multiple tags
Cache::tags(['posts', 'user-1'])->flush();
```

## Incrementing & Decrementing

```php
// Atomic increment/decrement (useful for counters)
Cache::increment('page_views');
Cache::increment('page_views', 5);
Cache::decrement('stock_count');
Cache::decrement('stock_count', 3);
```

## Practical Caching Patterns

### Cache Database Queries

```php
// Repository pattern with caching
class PostRepository
{
    public function getPublished(): Collection
    {
        return Cache::remember('posts.published', 3600, function () {
            return Post::with(['user', 'category', 'tags'])
                ->where('status', 'published')
                ->orderBy('published_at', 'desc')
                ->get();
        });
    }

    public function findBySlug(string $slug): ?Post
    {
        return Cache::remember("post.{$slug}", 3600, function () use ($slug) {
            return Post::with(['user', 'comments'])
                ->where('slug', $slug)
                ->firstOrFail();
        });
    }

    public function clearPostCache(Post $post): void
    {
        Cache::forget("post.{$post->slug}");
        Cache::forget('posts.published');
        Cache::forget("user.{$post->user_id}.posts");
    }
}
```

### Cache Invalidation in Observers

```php
// app/Observers/PostObserver.php
class PostObserver
{
    public function created(Post $post): void
    {
        Cache::forget('posts.published');
        Cache::forget("user.{$post->user_id}.posts");
        Cache::forget('posts.count');
    }

    public function updated(Post $post): void
    {
        Cache::forget("post.{$post->slug}");
        Cache::forget('posts.published');
    }

    public function deleted(Post $post): void
    {
        Cache::forget("post.{$post->slug}");
        Cache::forget('posts.published');
        Cache::forget('posts.count');
    }
}
```

### Cache API Responses

```php
public function index(Request $request)
{
    $cacheKey = 'api.posts.' . md5($request->fullUrl());

    $posts = Cache::remember($cacheKey, 300, function () use ($request) {
        return Post::with(['user', 'tags'])
            ->when($request->category, fn ($q, $cat) => $q->where('category_id', $cat))
            ->latest()
            ->paginate($request->per_page ?? 15);
    });

    return PostResource::collection($posts);
}
```

## Route Caching

Cache your route definitions for a significant performance boost:

```bash
# Cache routes (production only)
php artisan route:cache

# Clear route cache
php artisan route:clear
```

> **Note:** Don't use route caching during development — changes won't be reflected until you clear the cache.

## Config Caching

```bash
# Cache all config files into one (production)
php artisan config:cache

# Clear config cache
php artisan config:clear
```

> **Important:** After running `config:cache`, the `.env` file is no longer loaded. Always use `config()` instead of `env()` in your code (except in config files).

## View Caching

```bash
# Clear compiled views
php artisan view:clear

# Cache views (auto-happens in production)
php artisan view:cache
```

## The optimize Command

```bash
# Run all caching optimizations
php artisan optimize

# Clear all caches
php artisan optimize:clear
```

## Cache Helper Function

```php
// Global cache() helper (same as Cache facade)
$value = cache('key');
cache(['key' => 'value'], 3600);
cache()->remember('key', 3600, fn () => expensiveQuery());
```

## Best Practices

1. **Use Redis in production** — Much faster than file-based caching
2. **Cache expensive queries** — But don't cache everything blindly
3. **Invalidate on write** — Always clear cache when data changes
4. **Use `remember()`** — The most common and useful cache pattern
5. **Use unique cache keys** — Include relevant identifiers in keys
6. **Set reasonable TTLs** — Not too long (stale data), not too short (no benefit)
7. **Cache route/config in production** — Use `php artisan optimize`
8. **Use `config()` not `env()`** — After config caching, `env()` returns null
