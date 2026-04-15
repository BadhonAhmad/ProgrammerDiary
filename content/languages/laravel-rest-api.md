---
title: "Building REST APIs with Laravel"
date: "2025-01-16"
tags: ["laravel", "rest-api", "api", "json", "php"]
excerpt: "Build production-ready RESTful APIs with Laravel — API routes, JSON responses, API resources, pagination, versioning, and error handling."
---

# Building REST APIs with Laravel

## What Makes an API "RESTful"?

REST (Representational State Transfer) is not a framework or a library — it is a set of design principles for how web services should work. A RESTful API treats everything as a "resource" (a post, a user, a comment) and uses standard HTTP methods as verbs: GET to read, POST to create, PUT to replace, PATCH to partially update, DELETE to remove. The URL identifies the resource (`/posts/1`), the HTTP method identifies the action, and the response format is JSON instead of HTML. The key insight is that the same URL `/posts/1` can mean different things depending on the HTTP method — GET retrieves it, PUT updates it, DELETE removes it. This is a cleaner, more predictable design than having separate URLs like `/getPost`, `/updatePost`, and `/deletePost`.

Statelessness is another REST principle. Each request from the client must contain all the information the server needs to process it. The server does not store any session state between requests. This makes REST APIs horizontally scalable — you can add more servers behind a load balancer without worrying about session affinity, because any server can handle any request independently.

## Why Return JSON Instead of HTML?

Traditional web apps return HTML — a full page that the browser renders. APIs return raw data (usually JSON) that the client can use however it wants. A mobile app, a React SPA, and a third-party integration can all consume the same API endpoint and present the data in completely different ways. The server does not care about presentation; it just serves data. This separation between data and presentation is what makes APIs so powerful. One backend can serve a website, an iOS app, an Android app, and a partner's dashboard, all from the same endpoints.

In Laravel, API routes live in `routes/api.php` instead of `routes/web.php`. This is not just a convention — routes in `api.php` automatically get the `/api` prefix and do not include session or CSRF middleware. They are stateless by default, which is exactly what you want for an API.

```php
// routes/api.php
use App\Http\Controllers\Api\PostController;
use Illuminate\Support\Facades\Route;

// Individual routes
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::put('/posts/{post}', [PostController::class, 'update']);
Route::delete('/posts/{post}', [PostController::class, 'destroy']);

// Or use apiResource (excludes create/edit routes that only make sense for HTML forms)
Route::apiResource('posts', PostController::class);

// Nested resources
Route::apiResource('posts.comments', PostCommentController::class);
```

## The Problem API Resources Solve

When you return a model directly from a controller, Laravel serializes all its attributes to JSON. That includes things like `password`, `remember_token`, internal IDs, and any other field that happens to be on the model. This is a security disaster waiting to happen — you cannot just `return User::find(1)` and hope nothing sensitive leaks. Even if you are careful about `$hidden` on the model, the response format is tightly coupled to your database schema. Rename a column in the database, and every client consuming your API breaks.

API Resources solve this by putting a transformation layer between your models and your JSON output. You define exactly which fields to expose, how to format them, and what relationships to include. The client sees a stable, controlled API response that you define, not a raw database dump. If you rename a column internally, you change it in the resource class and the API output stays the same. Resources also let you add computed fields (like `can_update` based on permissions), conditionally include relationships only when they are loaded (to avoid N+1 query leaks), and format dates consistently.

```bash
php artisan make:resource PostResource
php artisan make:resource PostCollection
```

```php
// app/Http/Resources/PostResource.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,

            // Only include full content on the detail endpoint
            'content' => $this->when(
                $request->routeIs('api.posts.show'),
                $this->content
            ),

            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),

            // Relationships — only included if they were loaded
            'author' => new UserResource($this->whenLoaded('user')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'comments_count' => $this->whenCounted('comments'),

            // Computed fields based on authorization
            'can_update' => $request->user()?->can('update', $this->resource),
            'can_delete' => $request->user()?->can('delete', $this->resource),
        ];
    }
}
```

Notice the `whenLoaded()` method. If you naively include relationships in your resource, Laravel will load them from the database even if the controller did not eager-load them, creating additional queries. `whenLoaded()` only includes the relationship data if the controller already loaded it — otherwise it is omitted from the response entirely. This gives the controller control over what data is fetched while keeping the resource flexible.

## Why You Should Version Your API

An API is a contract between your server and every client consuming it. If you change a field name, remove an endpoint, or alter the response structure, every client that depends on that endpoint breaks — and you often have no control over when those clients update. Mobile apps in particular can sit on users' phones for months before they update. Versioning lets you introduce changes under a new URL prefix (`/api/v2/posts`) while keeping the old version (`/api/v1/posts`) alive for existing clients. You deprecate the old version on your own timeline, not when the App Store decides to push an update.

The simplest approach is URL-based versioning: group your routes under a `v1` prefix, with separate controllers for each version. When you need a breaking change, create a `v2` namespace and gradually migrate clients over. Both versions run simultaneously until you are confident everything has moved.

```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('posts', Api\V1\PostController::class);
    Route::apiResource('users', Api\V1\UserController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('posts', Api\V2\PostController::class);
});
```

## Why Pagination Is Essential for APIs

Imagine your `posts` table has 50,000 records. Without pagination, a request to `GET /api/posts` returns all 50,000 records as JSON in a single response. That is a massive payload, slow to generate, slow to transfer, and slow for the client to parse. It also hammers your database with a query that loads everything into memory at once. As your data grows, the problem gets worse linearly — and one day your server runs out of memory and crashes.

Pagination solves this by returning a fixed number of records per page (typically 15-25) along with metadata about the total count, current page, and links to the next and previous pages. The client can request additional pages as needed. Laravel makes this trivial with the `paginate()` method. You should paginate every list endpoint, even if you think the data will always be small — because it will not stay small forever.

```php
// app/Http/Controllers/Api/PostController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $posts = Post::with(['user', 'category', 'tags'])
            ->when($request->search, fn ($q, $search) =>
                $q->where('title', 'like', "%{$search}%")
            )
            ->latest()
            ->paginate($request->per_page ?? 15);

        return PostResource::collection($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $post = $request->user()->posts()->create($request->validated());

        return response()->json([
            'message' => 'Post created successfully',
            'data' => new PostResource($post->load('user', 'tags')),
        ], 201);
    }

    public function show(Post $post): PostResource
    {
        $post->load('user', 'category', 'tags', 'comments');
        return new PostResource($post);
    }

    public function update(StorePostRequest $request, Post $post): PostResource
    {
        $this->authorize('update', $post);
        $post->update($request->validated());
        return new PostResource($post->fresh()->load('user', 'tags'));
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);
        $post->delete();
        return response()->json(['message' => 'Post deleted successfully']);
    }
}
```

For the collection response, a custom `PostCollection` class gives you control over the pagination metadata format — total count, page links, and per-page limits — wrapped in a consistent structure.

```php
// app/Http/Resources/PostCollection.php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

class PostCollection extends ResourceCollection
{
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'total' => $this->total(),
                'count' => $this->count(),
                'per_page' => $this->perPage(),
                'current_page' => $this->currentPage(),
                'total_pages' => $this->lastPage(),
            ],
            'links' => [
                'self' => $this->url($this->currentPage()),
                'first' => $this->url(1),
                'last' => $this->url($this->lastPage()),
                'next' => $this->nextPageUrl(),
                'prev' => $this->previousPageUrl(),
            ],
        ];
    }
}
```

## How API Error Handling Differs From Web Error Handling

In a web application, when something goes wrong you redirect the user to an error page or flash a message. In an API, there are no pages and no redirects — you return a JSON response with an appropriate HTTP status code and a descriptive error message. The client (a mobile app, an SPA, or another server) parses that JSON and decides how to present the error to the user.

HTTP status codes carry meaning in APIs. A 200 means success. A 201 means a resource was created. A 400 means the client sent a bad request. A 401 means the client is not authenticated. A 403 means the client is authenticated but not authorized. A 404 means the resource was not found. A 422 means validation failed and the errors are in the response body. A 500 means something went wrong on the server. Using the right status code is not just good practice — many HTTP clients rely on it to determine how to handle the response.

```php
// Consistent JSON responses for different outcomes
return response()->json(['data' => $post], 200);
return response()->json(['message' => 'Created', 'data' => $post], 201);
return response()->json(null, 204);
return response()->json(['error' => 'Not Found'], 404);
return response()->json(['error' => 'Unauthorized'], 401);
return response()->json(['error' => 'Forbidden'], 403);
return response()->json(['error' => 'Validation failed', 'errors' => $errors], 422);
```

### Centralized Error Handling

Instead of writing error responses manually in every controller, you can handle common exceptions centrally. Laravel's exception handler lets you intercept exceptions and return JSON responses when the request expects JSON (`$request->expectsJson()`). This keeps your controllers clean and ensures a consistent error format across all endpoints.

```php
// In your exception handler
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return $exceptions->render(function (Throwable $e, $request) {
    if ($request->expectsJson()) {
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        if ($e instanceof AuthenticationException) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($e instanceof NotFoundHttpException) {
            return response()->json([
                'message' => 'Resource not found',
            ], 404);
        }

        return response()->json([
            'message' => 'Server error',
        ], 500);
    }
});
```

## A Consistent Response Format

Pick a response format and stick with it across your entire API. Consistency makes the API predictable and easier to consume. A common pattern is: wrap data in a `data` key, include pagination metadata in a `meta` key, provide navigation links in a `links` key, and return errors with a `message` and `errors` key. Once clients learn your format for one endpoint, they know it for all endpoints.

```json
{
    "data": {
        "id": 1,
        "title": "My Post",
        "author": { "id": 1, "name": "John" }
    }
}

{
    "data": [...],
    "meta": {
        "current_page": 1,
        "total": 50,
        "per_page": 15
    },
    "links": {
        "next": "/api/v1/posts?page=2",
        "prev": null
    }
}

{
    "message": "Validation failed",
    "errors": {
        "title": ["The title field is required."],
        "email": ["The email must be a valid email address."]
    }
}
```
