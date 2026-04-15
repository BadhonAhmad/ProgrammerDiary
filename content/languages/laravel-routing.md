---
title: "Laravel Routing — The Complete Guide"
date: "2025-01-04"
tags: ["laravel", "routing", "php", "backend"]
excerpt: "Master Laravel routing — from basic routes to route groups, named routes, model binding, and API versioning."
---

# Laravel Routing — The Complete Guide

Routes define how your application responds to HTTP requests. They are the **entry point** of every request in Laravel.

## Basic Routing

Routes are defined in `routes/web.php` (web) and `routes/api.php` (API).

```php
// routes/web.php
use Illuminate\Support\Facades\Route;

// Basic GET route
Route::get('/hello', function () {
    return 'Hello, World!';
});

// Returning a view
Route::get('/', function () {
    return view('welcome');
});

// Using a controller
Route::get('/users', [UserController::class, 'index']);
```

## Available Route Methods

Laravel supports all HTTP methods:

```php
Route::get('/posts', [PostController::class, 'index']);       // Read (list)
Route::get('/posts/{id}', [PostController::class, 'show']);   // Read (single)
Route::post('/posts', [PostController::class, 'store']);       // Create
Route::put('/posts/{id}', [PostController::class, 'update']);  // Full update
Route::patch('/posts/{id}', [PostController::class, 'update']); // Partial update
Route::delete('/posts/{id}', [PostController::class, 'destroy']); // Delete

// Match multiple methods
Route::match(['get', 'post'], '/contact', [ContactController::class, 'handle']);

// Any HTTP method
Route::any('/fallback', [FallbackController::class, 'handle']);
```

## Route Parameters

### Required Parameters

```php
Route::get('/users/{id}', function (string $id) {
    return "User ID: {$id}";
});

Route::get('/posts/{post}/comments/{comment}', function (string $post, string $comment) {
    return "Post {$post}, Comment {$comment}";
});
```

### Optional Parameters

```php
Route::get('/users/{name?}', function (string $name = 'Guest') {
    return "Hello, {$name}!";
});
```

### Regular Expression Constraints

```php
// ID must be numeric
Route::get('/users/{id}', function (int $id) {
    return User::findOrFail($id);
})->where('id', '[0-9]+');

// Name must be alphabetic
Route::get('/users/{name}', function (string $name) {
    return User::where('name', $name)->firstOrFail();
})->where('name', '[A-Za-z]+');

// Multiple constraints
Route::get('/posts/{post}/comments/{comment}', function ($post, $comment) {
    // ...
})->where(['post' => '[0-9]+', 'comment' => '[0-9]+']);

// Helper methods for common patterns
Route::get('/users/{id}', ...)->whereNumber('id');
Route::get('/users/{name}', ...)->whereAlpha('name');
Route::get('/users/{slug}', ...)->whereAlphaNumeric('slug');
Route::get('/users/{uuid}', ...)->whereUuid('uuid');
```

## Named Routes

Named routes let you generate URLs or redirects without hardcoding paths:

```php
// Defining a named route
Route::get('/users/profile', [UserController::class, 'profile'])->name('users.profile');

// Generating a URL
$url = route('users.profile');          // /users/profile
$url = route('users.show', ['id' => 1]); // /users/1

// In Blade templates
<a href="{{ route('users.profile') }}">Profile</a>

// Redirecting to a named route
return redirect()->route('users.profile');
return to_route('users.profile');  // Shortcut (Laravel 9+)
```

## Route Groups

Groups let you share attributes across multiple routes without repetition.

### Middleware

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);
});
```

### Prefixes

```php
// URL prefix: /admin/users, /admin/posts, etc.
Route::prefix('admin')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/posts', [AdminPostController::class, 'index']);
});

// Name prefix: admin.users.index, admin.posts.index
Route::name('admin.')->group(function () {
    Route::get('/admin/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::get('/admin/posts', [AdminPostController::class, 'index'])->name('posts.index');
});
```

### Combining Group Attributes

```php
Route::prefix('admin')
    ->middleware(['auth', 'admin'])
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
        Route::resource('/users', AdminUserController::class);
        Route::resource('/posts', AdminPostController::class);
    });
```

### Controller Prefix

```php
Route::controller(UserController::class)->group(function () {
    Route::get('/users', 'index');
    Route::get('/users/create', 'create');
    Route::post('/users', 'store');
    Route::get('/users/{user}', 'show');
});
```

## Resource Routes

For CRUD operations, resource routes generate all the routes you need in one line:

```php
Route::resource('posts', PostController::class);
```

This single line creates:

| Method | URI | Action | Route Name |
|--------|-----|--------|------------|
| GET | `/posts` | index | posts.index |
| GET | `/posts/create` | create | posts.create |
| POST | `/posts` | store | posts.store |
| GET | `/posts/{post}` | show | posts.show |
| GET | `/posts/{post}/edit` | edit | posts.edit |
| PUT/PATCH | `/posts/{post}` | update | posts.update |
| DELETE | `/posts/{post}` | destroy | posts.destroy |

### Limiting Resource Routes

```php
// Only specific routes
Route::resource('posts', PostController::class)->only([
    'index', 'show'
]);

// Exclude specific routes
Route::resource('posts', PostController::class)->except([
    'create', 'edit'
]);

// API resource (excludes create and edit — no HTML forms in APIs)
Route::apiResource('posts', PostController::class);

// Nested resources
Route::resource('posts.comments', PostCommentController::class);
// GET /posts/{post}/comments, /posts/{post}/comments/{comment}, etc.
```

## Route Model Binding

Instead of manually fetching models, Laravel can do it automatically:

### Implicit Binding

```php
// Laravel automatically fetches the User by ID
Route::get('/users/{user}', function (User $user) {
    return view('users.show', compact('user'));
});

// Uses the column specified in getRouteKeyName() — defaults to 'id'
Route::get('/posts/{post:slug}', function (Post $post) {
    return view('posts.show', compact('post'));
});
```

### Custom Key

```php
// In your model
class Post extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}

// Now {post} will resolve by slug automatically
Route::get('/posts/{post}', function (Post $post) {
    return $post;
});
```

### Explicit Binding

```php
// In App\Providers\RouteServiceProvider or boot method
Route::bind('post', function (string $value) {
    return Post::where('slug', $value)->firstOrFail();
});
```

## Fallback Routes

Handle 404s gracefully:

```php
Route::fallback(function () {
    return view('errors.404');
});
```

## Rate Limiting

Protect routes from abuse:

```php
// Built-in throttling
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/api/posts', [PostController::class, 'index']);
});

// Named rate limiter (define in App\Providers\AppServiceProvider)
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('api', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
});

// Use it
Route::middleware('throttle:api')->group(function () {
    // API routes...
});
```

## web.php vs api.php

| Feature | web.php | api.php |
|---------|---------|---------|
| Session | Yes | No |
| CSRF Protection | Yes | No |
| Cookie Encryption | Yes | No |
| URL Prefix | None | `/api` |
| Auth | Session-based | Token-based |
| Use case | Web pages | JSON APIs |

## Viewing All Routes

```bash
# List all routes
php artisan route:list

# Filter by name
php artisan route:list --name=posts

# Filter by path
php artisan route:list --path=api

# Show middleware
php artisan route:list -v

# JSON output
php artisan route:list --json
```

## Best Practices

1. **Use named routes** — `route('posts.show', $post)` instead of `/posts/{$post->id}`
2. **Group related routes** — use route groups for shared middleware, prefixes
3. **Use resource routes** — for standard CRUD, prefer `Route::resource()`
4. **Use model binding** — let Laravel resolve models automatically
5. **Keep routes clean** — move complex logic to controllers, not closures
6. **Organize route files** — split large route files and load them in `bootstrap/app.php`
