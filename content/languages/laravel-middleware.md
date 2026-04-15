---
title: "Laravel Middleware — Filtering HTTP Requests"
date: "2025-01-06"
tags: ["laravel", "middleware", "php", "security"]
excerpt: "Understand Laravel middleware — how to create, register, and use middleware to filter, inspect, and transform HTTP requests and responses."
---

# Laravel Middleware — Filtering HTTP Requests

Middleware acts as a series of **layers** that HTTP requests pass through before reaching your application — and responses pass through on the way out. Think of them as security checkpoints.

```
Request → [Middleware A] → [Middleware B] → [Controller] → Response
                    ↓              ↓              ↓
              (can modify/    (can modify/    (generates
               block)         block)         response)
```

## Creating Middleware

```bash
php artisan make:middleware EnsureTokenIsValid
```

This creates `app/Http/Middleware/EnsureTokenIsValid.php`:

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTokenIsValid
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->header('X-API-Token') !== config('app.api_token')) {
            return response('Unauthorized', 401);
        }

        return $next($request);  // Pass request to next middleware
    }
}
```

## Before & After Middleware

Middleware can run **before** or **after** the request:

```php
class BeforeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // This runs BEFORE the request hits the controller
        if (!$request->hasHeader('Authorization')) {
            abort(401);
        }

        return $next($request);
    }
}

class AfterMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);  // Let the request proceed first

        // This runs AFTER the controller returns a response
        $response->header('X-Custom-Header', 'My Value');

        return $response;
    }
}
```

## Registering Middleware

### Method 1: Via Route (Recommended for Custom Middleware)

```php
// Inline class name
Route::get('/admin', [AdminController::class, 'dashboard'])
    ->middleware(EnsureTokenIsValid::class);

// Using middleware alias
Route::get('/admin', [AdminController::class, 'dashboard'])
    ->middleware('token.valid');
```

### Method 2: Global Middleware

Runs on **every** HTTP request. Register in `bootstrap/app.php`:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append([
        EnsureTokenIsValid::class,
    ]);
})
```

### Method 3: Group Middleware

Apply to groups of routes:

```php
// In bootstrap/app.php or a service provider
$middleware->appendToGroup('web', [
    EnsureTokenIsValid::class,
]);

$middleware->prependToGroup('api', [
    ThrottleRequests::class,
]);
```

### Middleware Aliases

Assign short names to middleware classes:

```php
// In bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'token.valid' => EnsureTokenIsValid::class,
        'admin' => EnsureUserIsAdmin::class,
        'subscribed' => EnsureSubscribed::class,
    ]);
})
```

Then use the alias in routes:

```php
Route::get('/premium', [PremiumController::class, 'index'])
    ->middleware('subscribed');
```

## Built-in Middleware

Laravel ships with many middleware out of the box:

| Middleware | Purpose |
|-----------|---------|
| `auth` | Redirect unauthenticated users to login |
| `auth.basic` | HTTP Basic Authentication |
| `guest` | Redirect authenticated users away |
| `verified` | Require email verification |
| `throttle` | Rate limiting |
| `csrf` | CSRF protection (web routes) |
| `subscribed` | Check if user has an active subscription |
| `signed` | Validate signed URLs |
| `can` | Authorization via gates/policies |

## Multiple Middleware

```php
// Multiple middleware as array
Route::get('/admin/users', [AdminUserController::class, 'index'])
    ->middleware(['auth', 'admin', 'throttle:60,1']);

// Via route group
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/admin/users', [AdminUserController::class, 'index']);
    Route::get('/admin/settings', [AdminSettingController::class, 'index']);
});
```

## Middleware Parameters

Pass parameters to middleware:

```php
// Middleware that checks user roles
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if ($request->user()?->role !== $role) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
```

```php
// Pass parameter via route
Route::get('/admin', [AdminController::class, 'dashboard'])
    ->middleware('role:admin');

Route::get('/editor', [EditorController::class, 'dashboard'])
    ->middleware('role:editor');
```

## Excluding Middleware

```php
// Exclude specific middleware from a route
Route::get('/webhook', [WebhookController::class, 'handle'])
    ->withoutMiddleware([VerifyCsrfToken::class]);

// Or skip all middleware
Route::get('/health', fn () => response()->json(['status' => 'ok']))
    ->skipMiddleware();
```

## Practical Middleware Examples

### CORS Middleware

```php
class HandleCors
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Access-Control-Allow-Origin', '*');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return $response;
    }
}
```

### Locale Middleware

```php
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($locale = $request->header('Accept-Language')) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
```

### API Key Middleware

```php
class ValidateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');

        if (!$apiKey || !ApiKey::where('key', hash('sha256', $apiKey))->exists()) {
            return response()->json(['error' => 'Invalid API key'], 401);
        }

        return $next($request);
    }
}
```

### Maintenance Mode Middleware

```php
class CheckMaintenance
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isDownForMaintenance()) {
            if ($request->user()?->is_admin) {
                return $next($request);  // Admins can still access
            }
            return response()->view('maintenance', [], 503);
        }

        return $next($request);
    }
}
```

## Middleware Priority

The order middleware runs matters. Laravel defines default priorities:

1. `StartSession` — Start session
2. `ShareErrorsFromSession` — Share validation errors
3. `Auth` — Authenticate user
4. `Throttle` — Rate limiting
5. `SubstituteBindings` — Route model binding
6. Custom middleware

You can customize priority:

```php
$middleware->priority([
    \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
    \Illuminate\Routing\Middleware\SubstituteBindings::class,
    MyCustomMiddleware::class,
]);
```

## Terminable Middleware

Run code **after the response has been sent** to the browser (for tasks like logging):

```php
class LogRequestDuration
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('start_time', microtime(true));
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $duration = microtime(true) - $request->attributes->get('start_time');
        Log::info("Request to {$request->path()} took {$duration}s");
    }
}
```

## Best Practices

1. **Keep middleware focused** — One responsibility per middleware
2. **Use middleware for cross-cutting concerns** — auth, logging, CORS, rate limiting
3. **Don't put business logic in middleware** — that belongs in controllers/services
4. **Register via routes for specific cases** — use route middleware for targeted filtering
5. **Use groups for common patterns** — group middleware that applies to many routes
6. **Name your middleware** — use aliases for readability in route definitions
