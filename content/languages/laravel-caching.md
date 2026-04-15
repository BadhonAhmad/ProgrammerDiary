---
title: "Laravel Caching — Speed Up Your Application"
date: "2025-01-20"
tags: ["laravel", "caching", "performance", "redis", "php"]
excerpt: "Learn how to use Laravel's caching system — cache drivers, storing data, cache tags, route caching, and performance optimization strategies."
---

# Laravel Caching — Speed Up Your Application

Think of caching like a memo pad on your desk. If someone asks you "what is 17 times 34?" you calculate it once and write down the answer: 578. Next time someone asks the same question, you just read the answer from your memo pad instead of doing the math again. That is caching in a nutshell -- you did the expensive work once, stored the result, and served the stored result on future requests. In a web application, "expensive work" usually means a database query, an API call, or a complex calculation that takes tens or hundreds of milliseconds.

But caching is not free. The memo pad analogy has a catch: what if the answer changes? What if you cached the list of published blog posts, and then someone publishes a new post? Your cached list is now wrong -- it is **stale**. This is the **cache invalidation problem**, and it is genuinely one of the hardest problems in software engineering. Cache too aggressively and your users see outdated data. Cache too timidly and you gain nothing. The art of caching is finding the right balance: cache things that change rarely, invalidate the cache when the underlying data changes, and set expiration times (TTL) as a safety net for the cases you forget to invalidate manually.

Laravel gives you a unified API for caching that works the same way regardless of whether you store cache in files, a database, Redis, or Memcached. You write your cache calls once, and switching the backend is just a config change.

## Cache Configuration

The `CACHE_STORE` env variable decides where your cached data lives. For local development, the `file` driver is fine -- it writes cached data to files on disk. For production, you want Redis, which stores everything in memory and is orders of magnitude faster. The `array` driver stores data in a PHP array that disappears when the request ends, which sounds useless but is actually perfect for testing.

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

Why Redis over the file driver? Speed. Reading from a file on disk involves disk I/O, which is slow. Reading from Redis involves memory access, which is measured in microseconds. When your app serves hundreds of requests per second and each request checks the cache multiple times, that difference compounds dramatically. Redis also supports cache tags, atomic increment/decrement, and pub/sub -- features the file driver simply cannot offer.

```env
CACHE_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Basic Cache Operations

The basic API is straightforward: `put` stores a value, `get` retrieves it, `forget` removes it, and `flush` clears everything. You can set a TTL (time-to-live) so the cache automatically expires after a certain duration. The `add` method only stores if the key does not already exist, which is useful for preventing race conditions.

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

If there is one cache method you should memorize, it is `remember()`. It combines the "check if cached" and "compute if not" logic into a single call. Without `remember()`, every cache usage looks like this: check if the key exists, if yes return it, if no compute the value, store it, then return it. That is five lines of boilerplate. `remember()` collapses all of that into one call. It is the single most useful method in Laravel's cache API.

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

Sometimes you want to use a different cache backend for specific data. For example, you might cache database query results in Redis but cache configuration data in the file driver. Laravel lets you specify the store on the fly.

```php
// Use a specific store
Cache::store('redis')->put('key', 'value', 600);
Cache::store('file')->get('key');
Cache::store('redis')->forget('key');
```

## Cache Tags (Redis Only)

Cache tags let you group related cache entries together so you can clear them all at once. Without tags, if you have cached "user 1's posts," "user 2's posts," "all published posts," and "user 1's draft posts," you would have to know and forget each key individually when a post changes. With tags, you tag all of them with `posts`, and then `Cache::tags(['posts'])->flush()` clears every entry related to posts in one call. This is a Redis-only feature because it requires the underlying store to maintain an index of which keys belong to which tags.

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

Atomic increment and decrement are surprisingly useful. They let you update a counter in the cache without reading the value first, incrementing in PHP, and writing it back. That read-modify-write cycle is a race condition waiting to happen when two requests hit simultaneously. Atomic operations solve this because the increment happens in a single step at the cache store level.

```php
// Atomic increment/decrement (useful for counters)
Cache::increment('page_views');
Cache::increment('page_views', 5);
Cache::decrement('stock_count');
Cache::decrement('stock_count', 3);
```

## Practical Caching Patterns

### Cache Database Queries

The repository pattern with caching is a clean approach. Your repository methods always call `remember()`, so the first request hits the database and subsequent requests hit the cache. The `clearPostCache()` method is called whenever a post is created, updated, or deleted, keeping the cache fresh. This is the "check or compute" pattern applied consistently.

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

This is the practical answer to the cache invalidation problem. By hooking into model observers, you automatically clear the relevant cache entries whenever data changes. A post gets updated -- the cache for that specific post, the list of published posts, and the user's posts are all cleared. No stale data. The observer becomes the single place where you define "when this data changes, what caches need to be cleared?"

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

For API endpoints that return lists of data, caching the entire response can dramatically reduce database load. The trick is making the cache key unique per set of query parameters, so `GET /api/posts?category=tech` and `GET /api/posts?category=science` get separate cache entries. Hashing the full URL is a simple way to achieve this.

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

Every HTTP request that hits your Laravel app, the framework has to parse all your route files, resolve middleware, and build the route collection. That takes time. On a large app with hundreds of routes, it can add up. Route caching compiles all your routes into a single PHP array that can be loaded instantly. The catch: it only works if you do not use closures in your routes, because closures cannot be serialized.

```bash
# Cache routes (production only)
php artisan route:cache

# Clear route cache
php artisan route:clear
```

> **Note:** Don't use route caching during development -- changes won't be reflected until you clear the cache.

## Config Caching

Similarly, Laravel reads every config file and every `.env` variable on each request. Config caching merges all of those into a single file that loads in one shot. After caching config, Laravel stops reading `.env` entirely, which is why you must use `config()` instead of `env()` in your application code. The `env()` function only works inside config files. Use it anywhere else and it will return `null` in production.

```bash
# Cache all config files into one (production)
php artisan config:cache

# Clear config cache
php artisan config:clear
```

> **Important:** After running `config:cache`, the `.env` file is no longer loaded. Always use `config()` instead of `env()` in your code (except in config files).

## View Caching

Blade templates are compiled into plain PHP the first time they are used. In production, you can pre-compile all views so no user ever has to wait for a Blade compile step.

```bash
# Clear compiled views
php artisan view:clear

# Cache views (auto-happens in production)
php artisan view:cache
```

## The optimize Command

`php artisan optimize` is the "do everything" command that runs route caching, config caching, and view caching in one step. Run it after every deployment to production.

```bash
# Run all caching optimizations
php artisan optimize

# Clear all caches
php artisan optimize:clear
```

## Cache Helper Function

The global `cache()` helper is a shortcut that does the same thing as the `Cache` facade. Use whichever you prefer.

```php
// Global cache() helper (same as Cache facade)
$value = cache('key');
cache(['key' => 'value'], 3600);
cache()->remember('key', 3600, fn () => expensiveQuery());
```

## Best Practices

1. **Use Redis in production** -- Much faster than file-based caching
2. **Cache expensive queries** -- But don't cache everything blindly
3. **Invalidate on write** -- Always clear cache when data changes
4. **Use `remember()`** -- The most common and useful cache pattern
5. **Use unique cache keys** -- Include relevant identifiers in keys
6. **Set reasonable TTLs** -- Not too long (stale data), not too short (no benefit)
7. **Cache route/config in production** -- Use `php artisan optimize`
8. **Use `config()` not `env()`** -- After config caching, `env()` returns null
