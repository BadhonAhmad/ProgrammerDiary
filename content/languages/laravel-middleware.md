---
title: "Laravel Middleware — Filtering HTTP Requests"
date: "2025-01-06"
tags: ["laravel", "middleware", "php", "security"]
excerpt: "Understand Laravel middleware — how to create, register, and use middleware to filter, inspect, and transform HTTP requests and responses."
---

# Laravel Middleware — Filtering HTTP Requests

Imagine walking into an office building. Before you reach your destination, you pass through a series of checkpoints: the front desk checks your ID, security scans your bag, the receptionist confirms your appointment. Each checkpoint can either let you through or turn you away. Middleware works exactly like this for HTTP requests. Every request arriving at your Laravel application passes through a stack of middleware layers before it reaches your controller, and the response passes back through them on the way out. Each layer can inspect the request, modify it, reject it entirely, or add information to it.

Why does this matter? Because without middleware, every controller method that needs protection would have to start with the same boilerplate: check if the user is logged in, check their role, verify the CSRF token, rate-limit the request, log the access. That is a lot of repeated code, and worse, it mixes *infrastructure concerns* with *business logic*. Your `DashboardController` should not be responsible for checking authentication — it should assume the user is already authenticated and focus on loading dashboard data. Middleware extracts these cross-cutting concerns into separate, reusable layers. Add `auth` middleware once to a route group, and every controller inside can safely assume the user is logged in. This is not just cleaner code — it is a fundamentally better architecture, because each piece has a single, well-defined job.

```
Request -> [Middleware A] -> [Middleware B] -> [Controller] -> Response
                    |              |              |
              (can modify/    (can modify/    (generates
               block)         block)         response)
```

## Creating Middleware

Middleware is just a PHP class with a `handle` method. That method receives the current request and a `$next` closure, which represents the *next* middleware in the chain (or the controller, if this is the last middleware). If you call `$next($request)`, the request proceeds. If you return a response early (like a 401 Unauthorized), the request stops here and never reaches the controller. This simple mechanism gives middleware enormous power: it can guard, transform, or short-circuit any request.

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

## Before and After Middleware

The placement of your logic relative to `$next($request)` determines whether the middleware acts *before* or *after* the controller. This is a crucial distinction. If your code runs before calling `$next()`, it executes before the controller — ideal for authentication checks, input sanitization, or request logging. If you call `$next()` first and capture its return value, your code runs *after* the controller has generated a response — useful for adding headers, compressing output, or modifying the response. The beauty is that the same `handle` method supports both patterns. You can even do both: modify the request on the way in, let the controller run, then modify the response on the way out.

Think of the middleware stack like an onion. The request travels inward through each layer, hits the controller at the center, and the response travels back outward through the same layers in reverse order.

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

Creating a middleware class is only half the job — you also have to tell Laravel when to use it. There are three levels of registration, each serving a different purpose. **Global middleware** runs on every single request — use this for logging, CORS handling, or request profiling that should never be skipped. **Group middleware** runs on all routes in a group (like all `web` routes or all `api` routes) — this is where session handling and CSRF protection live. **Route middleware** is attached to specific routes or route groups — this is the most common pattern for custom middleware like role checks or feature flags.

### Method 1: Via Route (Recommended for Custom Middleware)

For middleware that only applies to specific endpoints, register it directly on the route. You can use the full class name or a short alias.

```php
// Inline class name
Route::get('/admin', [AdminController::class, 'dashboard'])
    ->middleware(EnsureTokenIsValid::class);

// Using middleware alias
Route::get('/admin', [AdminController::class, 'dashboard'])
    ->middleware('token.valid');
```

### Method 2: Global Middleware

Global middleware runs on *every* HTTP request your application receives, regardless of which route matches. Use this sparingly — it affects performance on every single request, including static health checks and webhooks.

```php
// Register in bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append([
        EnsureTokenIsValid::class,
    ]);
})
```

### Method 3: Group Middleware

Group middleware applies to entire categories of routes. Laravel has two built-in groups: `web` (session-backed browser requests) and `api` (stateless JSON endpoints). Adding middleware to a group means every route in that group passes through it. This is the right choice for concerns that apply broadly — like adding rate limiting to all API routes.

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

Typing out full class names in every route definition is verbose and fragile. Middleware aliases let you assign a short, memorable name to a middleware class. Define the alias once, and use the short name everywhere. This also makes refactoring easier — if you rename or move the middleware class, you only update the alias registration.

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

Laravel ships with a rich set of middleware for common web application needs. These handle the security and infrastructure concerns that virtually every application shares. You get authentication, CSRF protection, rate limiting, and more out of the box. Understanding what each one does is important — applying the wrong middleware (or forgetting one) can create security holes or broken functionality.

| Middleware | Purpose |
|-----------|---------|
| `auth` | Redirect unauthenticated users to login |
| `auth.basic` | HTTP Basic Authentication |
| `guest` | Redirect authenticated users away (e.g., away from the login page) |
| `verified` | Require email verification |
| `throttle` | Rate limiting |
| `csrf` | CSRF protection (web routes) |
| `subscribed` | Check if user has an active subscription |
| `signed` | Validate signed URLs |
| `can` | Authorization via gates/policies |

## Multiple Middleware

Real-world routes often need several layers of protection. An admin dashboard needs authentication, admin role verification, and maybe rate limiting. Middleware stacks are applied in the order you list them, forming a pipeline. The first middleware in the list is the outermost layer — it runs first on the way in and last on the way out. Route groups are particularly useful here: you can define a common middleware stack once and apply it to every route inside.

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

Sometimes a middleware needs to know more than just "should I let this through?" For example, a role-checking middleware needs to know *which* role to check for. Laravel lets you pass parameters to middleware by appending them after a colon in the route definition. These parameters are passed as additional arguments to the `handle` method. This pattern makes middleware incredibly flexible — one `EnsureUserHasRole` class can check for any role, rather than needing separate middleware for `admin`, `editor`, `moderator`, and so on.

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

Sometimes you need to *undo* middleware that is applied globally or by a group. The classic example is a webhook endpoint that receives POST requests from an external service. CSRF middleware (which is applied to all web routes) will block these requests because the external service does not send a CSRF token. The `withoutMiddleware` method lets you opt specific routes out of middleware that would otherwise apply. Similarly, `skipMiddleware()` bypasses all middleware for a route — useful for health check endpoints that need to be as lightweight as possible.

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

Cross-Origin Resource Sharing (CORS) is a browser security feature that blocks web pages from making requests to a different domain than the one that served the page. If your frontend at `app.example.com` needs to call your API at `api.example.com`, the browser will block the request unless the API includes the right headers. CORS middleware adds those headers to every response, telling the browser "yes, this origin is allowed." This is an after-middleware pattern — it modifies the response on the way out.

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

Internationalized applications need to know which language to use for each request. A common pattern is to read the `Accept-Language` header from the request and set the application locale accordingly. This is a before-middleware — it sets up context that the rest of the request lifecycle (controllers, views, validation messages) will rely on.

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

For APIs that serve third-party developers, authentication often works differently than browser-based apps. Instead of sessions and cookies, developers send an API key in a header. This middleware validates that key before the request reaches any controller. If the key is missing or invalid, the request is rejected immediately. Notice the hashing — API keys should never be stored in plaintext, so the middleware hashes the incoming key before looking it up.

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

When you need to take your application offline for updates, you want most users to see a maintenance page while admins can still access the site to verify the changes. This middleware checks the application's maintenance state and the user's role. Regular users get a 503 Service Unavailable response, while admins pass through. This is a good example of middleware making a decision based on *both* application state and request context.

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

The order in which middleware runs matters more than you might think. If authentication middleware runs *after* your role-checking middleware, the role check will fail because no user is logged in yet. If session middleware runs *after* your authentication check, auth will fail because there is no session to read from. Laravel defines a sensible default priority order — sessions before auth, auth before authorization, and so on. If you register custom middleware that depends on another middleware having already run, you can customize the priority to ensure correct ordering.

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

Some tasks are expensive — writing to a log file, sending analytics, updating statistics — and you do not want the user to wait for them. Terminable middleware solves this with a `terminate` method that runs *after the response has been sent to the browser*. The user gets their page immediately, and the cleanup work happens in the background. It is important to understand that this is not true asynchronous processing — the PHP process is still occupied — but it does mean the user-perceived latency is unaffected. The `handle` method records the start time, the `terminate` method calculates the duration and logs it. The user never waits for that log write.

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

## Middleware vs Controller Logic — When to Use Which

A common question is: should this check go in middleware or in the controller? Here is a simple rule of thumb. If the check applies to *many routes* and is about *infrastructure* (authentication, authorization, rate limiting, CORS, logging, input sanitization), put it in middleware. If the check is specific to *one action* and involves *business rules* (does this user own this post? has this order been shipped? is this coupon still valid?), put it in the controller or in a Form Request's `authorize` method. Middleware should not know about your business domain. If your middleware is checking `$request->user()->subscription->isActive()`, that logic probably belongs closer to the controller or in a policy.

## Best Practices

1. **Keep middleware focused** — one responsibility per middleware. A middleware that checks authentication *and* logs requests *and* sets locale is doing too much. Split it into three.
2. **Use middleware for cross-cutting concerns** — auth, logging, CORS, rate limiting. These are concerns that span the entire application, not specific features.
3. **Do not put business logic in middleware** — that belongs in controllers, services, or actions. Middleware should not be querying your domain models or making business decisions.
4. **Register via routes for specific cases** — use route middleware for targeted filtering. Only use global middleware when every single request truly needs it.
5. **Use groups for common patterns** — group middleware that applies to many routes. This is more maintainable than attaching the same middleware to 50 individual routes.
6. **Name your middleware** — use aliases for readability in route definitions. `'admin'` is clearer than `EnsureUserIsAdmin::class` when scanning a route file.
