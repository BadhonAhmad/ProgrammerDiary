---
title: "Laravel Routing — The Complete Guide"
date: "2025-01-04"
tags: ["laravel", "routing", "php", "backend"]
excerpt: "Master Laravel routing — from basic routes to route groups, named routes, model binding, and API versioning."
---

# Laravel Routing — The Complete Guide

Every web application has the same fundamental problem: when a user types a URL or clicks a link, something on the server has to decide *what code to run*. In raw PHP, this is handled by the file system itself. A request to `/about.php` literally runs the file `about.php`. That sounds simple, but it falls apart quickly. Your URL structure is now locked to your folder structure. Want to rename a file? Your URL changes. Want pretty URLs like `/users/42/profile`? You are hacking together `.htaccess` rules and `$_GET` parsing. There is no central place to see every URL your app responds to.

A routing layer solves all of this. It introduces a single, dedicated file that acts as a map between URLs and the code that handles them. The URL becomes a *design decision*, not a filesystem accident. You can reorganize your code, rename classes, move files around — your URLs stay the same because the route map is the source of truth. Laravel takes this further than most frameworks: routes are expressive and readable, support parameter extraction with regex constraints, and integrate deeply with the rest of the framework (controllers, middleware, model binding, rate limiting). Rather than routing being something you *set up and forget*, in Laravel it becomes a powerful configuration layer you actively work with.

## Basic Routing

Routes are defined in `routes/web.php` (for pages that return HTML) and `routes/api.php` (for JSON endpoints). The simplest route maps a URL to a closure or a controller method. Think of it as telling Laravel: "when someone visits this path, run this code."

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

HTTP has different "verbs" — GET, POST, PUT, DELETE, and so on — each with a distinct purpose. GET is for reading data, POST is for creating, PUT/PATCH for updating, DELETE for removing. Laravel lets you register separate handlers for each verb on the same URL. This is the foundation of RESTful design. A single URL like `/posts` can behave differently depending on whether the browser is asking to *see* posts or *create* one.

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

URLs are not always static. A URL like `/users/42` has a dynamic piece — the user ID. Route parameters let you capture these dynamic segments and pass them into your handler. Laravel extracts them cleanly, so you never manually parse a URL string. The `{id}` in the route definition becomes a variable in your function signature.

```php
Route::get('/users/{id}', function (string $id) {
    return "User ID: {$id}";
});

Route::get('/posts/{post}/comments/{comment}', function (string $post, string $comment) {
    return "Post {$post}, Comment {$comment}";
});
```

### Optional Parameters

Sometimes a parameter is not required. For instance, a language or page number that defaults to something sensible. The `?` syntax tells Laravel the segment can be missing, and you provide a default value.

```php
Route::get('/users/{name?}', function (string $name = 'Guest') {
    return "Hello, {$name}!";
});
```

### Regular Expression Constraints

By default, a route parameter matches any string. But you often need tighter control — user IDs should be numbers, slugs should be alphanumeric. Instead of validating inside your controller, you can attach a regex constraint directly to the route. If the parameter does not match, Laravel skips that route entirely and keeps looking. This means invalid URLs never reach your code.

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

Here is a problem that sounds small but causes real pain: what happens when you change a URL? If you have hardcoded `/users/profile` in dozens of Blade templates, JavaScript files, and redirect calls, you now have to find and update every single one. Miss one, and you have a broken link. Named routes solve this by giving each route an internal name that never changes. You reference the *name*, and Laravel generates the actual URL. If you later rename the URL from `/users/profile` to `/account/profile`, you change it in one place — the route definition — and every `route()` call updates automatically.

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

As your application grows, you end up with routes that share common attributes — the same middleware, the same URL prefix, the same controller. Repeating those attributes on every route is tedious and error-prone. Route groups let you define shared attributes once, and every route inside the group inherits them. This is not just about less typing. It is about *intent*. When you see a group called `admin` with `auth` and `admin` middleware, you immediately understand that everything inside is a protected admin route. The structure communicates meaning.

### Middleware

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/settings', [SettingsController::class, 'index']);
    Route::post('/settings', [SettingsController::class, 'update']);
});
```

### Prefixes

URL prefixes let you nest routes under a common path without repeating it. Combined with name prefixes, you get clean, organized naming conventions that mirror your URL structure.

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

The real power of groups is chaining. You can stack prefix, middleware, and name conventions together. This is how large applications stay manageable — an entire admin section defined in a few lines, with consistent URL structure, naming, and security.

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

When every route in a group points to the same controller, you can specify the controller once on the group itself. This cuts repetition and makes the relationship explicit.

```php
Route::controller(UserController::class)->group(function () {
    Route::get('/users', 'index');
    Route::get('/users/create', 'create');
    Route::post('/users', 'store');
    Route::get('/users/{user}', 'show');
});
```

## Resource Routes

Most web applications are built around CRUD — Create, Read, Update, Delete. For any given resource like "posts" or "users", you need roughly the same seven routes: list all, show a form to create one, store the new one, show a single one, show an edit form, update it, and delete it. Writing these seven routes every single time is pure boilerplate. Resource routes generate all of them from one line. The convention is so standard that Laravel just knows: `Route::resource('posts', PostController::class)` creates all seven, with predictable URLs, method names, and route names.

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

Not every resource needs all seven routes. An API does not need "create" and "edit" forms. A read-only resource only needs `index` and `show`. Laravel lets you include or exclude specific actions, so you only generate what you need. The `apiResource` shortcut is particularly useful — it strips out the HTML form routes, leaving the five routes that make sense for a JSON API.

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

This is one of those features that, once you use it, you cannot go back. Without model binding, every route that deals with a database record follows the same pattern: grab the ID from the URL, call `User::findOrFail($id)`, and handle the 404 if it does not exist. You write this code dozens of times. Model binding eliminates it entirely. When you type-hint a model in your route callback, Laravel automatically fetches the record from the database. If it does not exist, it returns a 404 before your code even runs. Your controller method receives a fully loaded model object, not a raw ID string.

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

By default, Laravel resolves models by their primary key (`id`). But many applications use slugs for public URLs because they are human-readable and SEO-friendly. You can tell Laravel to resolve by any column — either inline in the route definition with `{post:slug}`, or by overriding `getRouteKeyName()` on the model itself. This is the kind of flexibility that makes Laravel feel like it was designed by people who actually build web applications.

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

Sometimes the resolution logic is more complex than a simple database lookup — maybe you need to check permissions, or resolve through a relationship, or apply a global scope differently. Explicit binding lets you write custom resolution logic for any route parameter.

```php
// In App\Providers\RouteServiceProvider or boot method
Route::bind('post', function (string $value) {
    return Post::where('slug', $value)->firstOrFail();
});
```

## Fallback Routes

When no route matches, Laravel returns a generic 404. A fallback route lets you customize that experience — showing a branded error page, suggesting related content, or logging the broken URL for investigation. It is the last resort, caught only after every other route has been tried.

```php
Route::fallback(function () {
    return view('errors.404');
});
```

## Rate Limiting

Public endpoints are vulnerable to abuse. A bot could hit your API thousands of times per second, and without protection, your server happily tries to serve every request until it collapses. Rate limiting restricts how many requests a user or IP can make within a time window. Laravel has this built in. You can apply a simple throttle (60 requests per minute, for example), or define custom rate limiters with complex rules — different limits for authenticated vs anonymous users, for instance.

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

Laravel splits routes into two files by default, and it is worth understanding why. `web.php` is for pages rendered in a browser — it has session handling, CSRF protection, and cookie encryption enabled by default. `api.php` is for stateless JSON endpoints — no sessions, no CSRF tokens, just request in and JSON out. The separation is not just organizational. Each file loads a different middleware stack, which means the routes behave differently at a fundamental level. Putting an API route in `web.php` by accident will cause confusing issues with CSRF tokens and sessions.

| Feature | web.php | api.php |
|---------|---------|---------|
| Session | Yes | No |
| CSRF Protection | Yes | No |
| Cookie Encryption | Yes | No |
| URL Prefix | None | `/api` |
| Auth | Session-based | Token-based |
| Use case | Web pages | JSON APIs |

## Viewing All Routes

When your application grows to hundreds of routes, it is easy to lose track of what URLs exist and which controllers they point to. Laravel's `route:list` command dumps every registered route in a clean table. You can filter by name, path, or method, and even see which middleware is applied. It is one of those commands you will run constantly when debugging routing issues.

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

1. **Use named routes** — `route('posts.show', $post)` instead of `/posts/{$post->id}`. It decouples your code from your URL structure.
2. **Group related routes** — use route groups for shared middleware, prefixes, and naming. It communicates intent and reduces repetition.
3. **Use resource routes** — for standard CRUD, prefer `Route::resource()`. The convention is well-understood and saves boilerplate.
4. **Use model binding** — let Laravel resolve models automatically. It eliminates repetitive `findOrFail` calls.
5. **Keep routes clean** — move complex logic to controllers, not closures. Route files should read like a table of contents, not a novel.
6. **Organize route files** — split large route files and load them in `bootstrap/app.php`. A 500-line `web.php` is a sign you need structure.
