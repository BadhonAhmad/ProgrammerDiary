---
title: "Laravel Controllers — Organizing Request Logic"
date: "2025-01-05"
tags: ["laravel", "controllers", "php", "mvc"]
excerpt: "Learn how to create and use controllers in Laravel — basic CRUD controllers, resource controllers, invokable controllers, and dependency injection."
---

# Laravel Controllers — Organizing Request Logic

Controllers group related HTTP request handling logic into a single class. They keep your routes clean and your code organized.

## Creating Controllers

```bash
# Basic controller
php artisan make:controller UserController

# Resource controller (with CRUD methods)
php artisan make:controller PostController --resource

# Resource controller with model binding
php artisan make:controller PostController --resource --model=Post

# API controller (no create/edit methods)
php artisan make:controller PostController --api

# Single-action (invokable) controller
php artisan make:controller ProcessPaymentController --invokable
```

## Basic Controller

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\View\View;

class UserController extends Controller
{
    public function index(): View
    {
        $users = User::all();
        return view('users.index', compact('users'));
    }

    public function show(User $user): View
    {
        return view('users.show', compact('user'));
    }
}
```

Register it in routes:

```php
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{user}', [UserController::class, 'show']);
```

## Resource Controller

A resource controller comes with all CRUD methods pre-defined:

```php
// app/Http/Controllers/PostController.php
namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class PostController extends Controller
{
    // Display a listing
    public function index(): View
    {
        $posts = Post::latest()->paginate(15);
        return view('posts.index', compact('posts'));
    }

    // Show the form for creating a new post
    public function create(): View
    {
        return view('posts.create');
    }

    // Store a newly created post
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'published' => 'boolean',
        ]);

        $post = $request->user()->posts()->create($validated);

        return to_route('posts.show', $post)
            ->with('success', 'Post created successfully!');
    }

    // Display a specific post
    public function show(Post $post): View
    {
        return view('posts.show', compact('post'));
    }

    // Show the form for editing
    public function edit(Post $post): View
    {
        return view('posts.edit', compact('post'));
    }

    // Update a specific post
    public function update(Request $request, Post $post): RedirectResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'published' => 'boolean',
        ]);

        $post->update($validated);

        return to_route('posts.show', $post)
            ->with('success', 'Post updated successfully!');
    }

    // Delete a specific post
    public function destroy(Post $post): RedirectResponse
    {
        $post->delete();

        return to_route('posts.index')
            ->with('success', 'Post deleted successfully!');
    }
}
```

Register with a single route:

```php
Route::resource('posts', PostController::class);
```

## Invokable Controllers (Single Action)

When a controller needs just one method:

```php
// app/Http/Controllers/ProcessPaymentController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;

class ProcessPaymentController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        // Payment processing logic
        $amount = $request->input('amount');

        // Process payment...

        return to_route('dashboard')
            ->with('success', 'Payment processed!');
    }
}
```

```php
// Route registration — no method specified
Route::post('/payments', ProcessPaymentController::class);
```

## Dependency Injection

Laravel automatically resolves dependencies in controller constructors:

```php
use App\Services\PaymentGateway;
use App\Repositories\PostRepository;

class PostController extends Controller
{
    public function __construct(
        private PostRepository $posts,
        private PaymentGateway $payment,
    ) {}

    public function index()
    {
        $posts = $this->posts->all();
        return view('posts.index', compact('posts'));
    }
}
```

### Method Injection

You can also inject dependencies directly into controller methods:

```php
use App\Services\NewsletterService;

public function store(Request $request, NewsletterService $newsletter)
{
    $user = User::create($request->validated());

    $newsletter->subscribe($user->email);

    return to_route('users.index');
}
```

## Controller Middleware

### Via Constructor

```php
class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('admin')->only(['dashboard', 'settings']);
        $this->middleware('throttle:60,1')->only('report');
    }
}
```

### Via Route (Preferred in Laravel 11+)

```php
Route::get('/admin/dashboard', [AdminController::class, 'dashboard'])
    ->middleware(['auth', 'admin']);
```

## Form Request Validation

For complex validation, extract rules into dedicated Form Request classes:

```bash
php artisan make:request StorePostRequest
php artisan make:request UpdatePostRequest
```

```php
// app/Http/Requests/StorePostRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Or: $this->user()->can('create', Post::class)
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255|unique:posts',
            'content' => 'required|string|min:10',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
            'image' => 'nullable|image|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Please enter a post title.',
            'content.min' => 'Post content must be at least 10 characters.',
        ];
    }
}
```

Use it in your controller:

```php
public function store(StorePostRequest $request): RedirectResponse
{
    // Validation has already passed! Use $request->validated()
    $post = Post::create($request->validated());

    return to_route('posts.show', $post);
}
```

## Returning Responses

Controllers can return various response types:

```php
// View response
return view('posts.index', ['posts' => $posts]);

// JSON response
return response()->json(['posts' => $posts], 200);

// Redirect
return redirect('/dashboard');
return to_route('posts.index');
return back()->withInput()->withErrors(['email' => 'Invalid email']);

// Download response
return response()->download($filePath);

// File response (display in browser)
return response()->file($filePath);
```

## API Controller Example

For building APIs, return JSON:

```php
// app/Http/Controllers/Api/PostController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $posts = Post::latest()
            ->paginate($request->input('per_page', 15));

        return PostResource::collection($posts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $post = $request->user()->posts()->create($validated);

        return response()->json([
            'message' => 'Post created successfully',
            'post' => new PostResource($post),
        ], 201);
    }

    public function show(Post $post): PostResource
    {
        return new PostResource($post->load('comments', 'author'));
    }

    public function destroy(Post $post): JsonResponse
    {
        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }
}
```

## Best Practices

1. **Keep controllers thin** — Move business logic to services or actions
2. **Use resource controllers** — For CRUD, always use `--resource`
3. **Use form requests** — For complex validation, extract to request classes
4. **Use type hints** — Always declare return types (`View`, `RedirectResponse`, `JsonResponse`)
5. **Use route model binding** — Type-hint models in method signatures
6. **Avoid logic in routes** — Use controllers instead of closures for anything non-trivial
7. **Use API resources** — Transform models for JSON responses with `JsonResource`
