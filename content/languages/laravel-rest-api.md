---
title: "Building REST APIs with Laravel"
date: "2025-01-16"
tags: ["laravel", "rest-api", "api", "json", "php"]
excerpt: "Build production-ready RESTful APIs with Laravel — API routes, JSON responses, API resources, pagination, versioning, and error handling."
---

# Building REST APIs with Laravel

Laravel is excellent for building RESTful APIs. It provides everything you need — routing, validation, JSON responses, transformers, and authentication.

## API Routes

API routes are defined in `routes/api.php`. They automatically:
- Get the `/api` prefix
- Don't include session/CSRF middleware
- Are stateless by default

```php
// routes/api.php
use App\Http\Controllers\Api\PostController;
use Illuminate\Support\Facades\Route;

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{post}', [PostController::class, 'show']);
Route::put('/posts/{post}', [PostController::class, 'update']);
Route::delete('/posts/{post}', [PostController::class, 'destroy']);

// Or use apiResource (no create/edit routes)
Route::apiResource('posts', PostController::class);

// Nested resources
Route::apiResource('posts.comments', PostCommentController::class);
```

## API Controller

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
            ->when($request->category, fn ($q, $category) =>
                $q->where('category_id', $category)
            )
            ->latest()
            ->paginate($request->per_page ?? 15);

        return PostResource::collection($posts);
    }

    public function store(StorePostRequest $request): JsonResponse
    {
        $post = $request->user()->posts()->create($request->validated());

        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

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

        if ($request->has('tags')) {
            $post->tags()->sync($request->tags);
        }

        return new PostResource($post->fresh()->load('user', 'tags'));
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->authorize('delete', $post);

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }
}
```

## API Resources (Transformers)

Resources control exactly what data your API returns. This is crucial for:
- Hiding internal fields (passwords, internal IDs)
- Transforming data formats
- Adding computed fields
- Including relationships conditionally

```bash
php artisan make:resource PostResource
php artisan make:resource PostCollection  # For custom collection responses
```

### Single Resource

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
            'content' => $this->when(
                $request->routeIs('api.posts.show'), // Only on detail endpoint
                $this->content
            ),
            'status' => $this->status,
            'published_at' => $this->published_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Relationships
            'author' => new UserResource($this->whenLoaded('user')),
            'category' => new CategoryResource($this->whenLoaded('category')),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'comments_count' => $this->whenCounted('comments'),

            // Conditional fields
            'can_update' => $request->user()?->can('update', $this->resource),
            'can_delete' => $request->user()?->can('delete', $this->resource),

            // Links
            'url' => route('api.posts.show', $this->resource),
        ];
    }
}
```

### Resource Collection

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

## JSON Responses

```php
// Success responses
return response()->json(['data' => $post], 200);
return response()->json(['message' => 'Created', 'data' => $post], 201);
return response()->json(['message' => 'Deleted'], 204);
return response()->json(['message' => 'No Content'], 204);

// Error responses
return response()->json(['error' => 'Not Found'], 404);
return response()->json(['error' => 'Unauthorized'], 401);
return response()->json(['error' => 'Forbidden'], 403);
return response()->json(['error' => 'Validation failed', 'errors' => $errors], 422);

// With headers
return response()->json($data, 200, [
    'X-Total-Count' => 100,
    'X-RateLimit-Remaining' => 59,
]);
```

## API Error Handling

### Custom Exception Handler

```php
// In app/Exceptions/Handler.php or bootstrap/app.php
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

## API Versioning

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

## Consistent API Response Format

A well-structured API response:

```json
// Success - Single resource
{
    "data": {
        "id": 1,
        "title": "My Post",
        "author": { "id": 1, "name": "John" }
    }
}

// Success - Collection
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

// Error
{
    "message": "Validation failed",
    "errors": {
        "title": ["The title field is required."],
        "email": ["The email must be a valid email address."]
    }
}
```

## API Best Practices

1. **Use `apiResource` routes** — No create/edit in APIs
2. **Use API Resources** — Always transform output, never return raw models
3. **Use `whenLoaded()`** — Conditionally include relationships
4. **Paginate** — Never return unpaginated lists
5. **Version your API** — `/api/v1/`, `/api/v2/`
6. **Use consistent response format** — `data`, `meta`, `errors`
7. **Return proper HTTP status codes** — 201 for create, 204 for delete, etc.
8. **Validate input** — Use Form Requests for all endpoints
9. **Document your API** — Use tools like Swagger/OpenAPI or Scribe
10. **Rate limit** — Protect your API from abuse
