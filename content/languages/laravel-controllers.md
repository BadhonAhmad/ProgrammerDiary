---
title: "Laravel Controllers — Organizing Request Logic"
date: "2025-01-05"
tags: ["laravel", "controllers", "php", "mvc"]
excerpt: "Learn how to create and use controllers in Laravel — basic CRUD controllers, resource controllers, invokable controllers, and dependency injection."
---

# Laravel Controllers — Organizing Request Logic

You *can* put all your application logic inside route closures. Laravel allows it, and for tiny projects it even works fine. But as your app grows, something ugly happens: your `routes/web.php` file becomes a thousand-line dumping ground of database queries, validation rules, authorization checks, and response formatting. There is no separation between "what URL was requested" and "what happens when it is requested." That coupling makes the code hard to test (how do you unit test a closure?), hard to reuse (two routes need the same logic? copy-paste it), and hard to navigate (where is the code that handles user registration — in which route, on which line?).

Controllers exist to solve exactly this. A controller is a PHP class whose methods correspond to actions a user can take. The route says *when* to run the code; the controller holds *what* the code does. This separation follows a principle called Single Responsibility — the route file is responsible for URL mapping, and the controller is responsible for handling the request. Each controller typically manages one resource (a `UserController` handles user-related requests, a `PostController` handles posts). This predictability means that when you see a URL `/posts/42/edit`, you know immediately where to look: `PostController@edit`. Controllers are also testable — you can instantiate one, call a method with a mock request, and assert the response, all without touching HTTP.

## Creating Controllers

Laravel provides Artisan commands to generate controller scaffolding. The basic command creates an empty controller class. The `--resource` flag pre-fills it with the seven standard CRUD methods (index, create, store, show, edit, update, destroy). The `--api` flag does the same but omits the HTML form methods (create, edit), since APIs do not serve forms. There is also `--invokable` for controllers that handle exactly one action — useful when an operation is complex enough to deserve its own class but does not fit the CRUD pattern.

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

A basic controller is just a class that extends Laravel's base `Controller`. Each public method represents an action — it receives the request data (via dependency injection or route parameters), does its work, and returns a response. The route file wires a URL to a specific method. Notice how clean this is: the route definition is one line, and the logic lives in a dedicated, testable class.

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

Most of the time, a controller manages a single database resource with standard CRUD operations. Resource controllers codify this pattern. When you create one with `--resource`, Laravel generates all seven methods with the correct signatures and a comment explaining what each one should do. The naming convention is not arbitrary — `index` lists all items, `create` shows a creation form, `store` persists the new item, `show` displays one item, `edit` shows an edit form, `update` persists changes, and `destroy` deletes. This convention is shared across the entire Laravel ecosystem. Other developers can look at your `PostController` and immediately know what each method does without reading a single line of code.

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

Not every action fits neatly into CRUD. Some operations are single, atomic tasks: process a payment, export a CSV, send a notification. Creating a full resource controller for one method feels wrong. Invokable controllers solve this — they have a single `__invoke` method, and you register them by class name alone. They are perfect when an action is complex enough to deserve its own class (with its own dependencies and tests) but does not need the full CRUD scaffold.

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

This is one of the most powerful concepts in modern PHP, and Laravel makes it nearly invisible. Dependency injection means that instead of *creating* the objects your code needs (a database repository, a payment gateway, an email service), you *declare* them as parameters — and Laravel's service container figures out how to build them and hands them to you. Why does this matter? Because it decouples your controller from specific implementations. Your `PostController` does not need to know how to construct a `PostRepository` or which payment provider to use. It just says "I need one of these" and receives it. This makes swapping implementations trivial (switch from Stripe to PayPal? change one line in the container, zero changes in the controller) and testing straightforward (inject a mock during tests).

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

Constructor injection is great for dependencies the whole controller needs. But sometimes only one method needs a particular service. Method injection lets you declare dependencies on individual methods. Laravel resolves them the same way — it inspects the type hints and provides the instances. This keeps your constructor lean and makes it obvious which methods depend on which services.

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

Controllers often need protection — only authenticated users can access certain methods, or specific roles are required. You can apply middleware directly in the controller's constructor, which was the traditional approach. However, the modern convention (especially in Laravel 11+) is to apply middleware at the route level instead. This keeps all middleware configuration in one place (the route file) rather than scattering it across controllers. Whichever approach you choose, the concept is the same: middleware wraps your controller method, running checks *before* the method executes.

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

Inline validation with `$request->validate()` works fine for simple rules. But real applications often have complex validation: a post might need ten rules, custom error messages, and authorization checks. Embedding all of this in a controller method makes the method bloated and mixes two different concerns (validation logic vs request handling logic). It also means you cannot reuse the same rules in another controller or in an API endpoint.

Form Request classes extract validation into dedicated objects. Each Form Request has an `authorize` method (can this user even make this request?), a `rules` method (what makes the data valid?), and optional `messages` (what should the error messages say?). When you type-hint a Form Request in your controller method, Laravel runs all of this *before* your method executes. If validation fails, it automatically redirects back with errors (for web requests) or returns a 422 JSON response (for API requests). Your controller method only runs if everything is valid. The validated data is then available via `$request->validated()` — a clean, whitelisted array you can safely pass to `create()` or `update()`. This pattern keeps your controllers thin, your validation reusable, and your authorization logic centralized.

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

Controllers can return a variety of response types, and Laravel handles the details. Return a string, and Laravel wraps it in a full HTTP response. Return a view, and Laravel renders the Blade template. Return an array, and Laravel converts it to JSON. For more control, you can use the `response()` helper to set status codes, headers, cookies, and more. This flexibility means your controller focuses on *what* to return, not the mechanics of HTTP.

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

Building an API? The controller structure is similar, but the responses are different. Instead of returning Blade views and redirects, you return JSON. Laravel's API Resources (classes that transform models into JSON arrays) keep this transformation clean and consistent. The controller stays focused on orchestrating the flow — fetch data, maybe apply filters or pagination, and hand it to the resource for formatting. This separation means you can change your JSON structure in one place (the resource class) without touching the controller.

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

1. **Keep controllers thin** — controllers should coordinate, not compute. Move business logic to service classes, action objects, or repositories. A controller method longer than 20 lines is a code smell.
2. **Use resource controllers** — for any standard CRUD resource, use `--resource`. The convention is universal and eliminates decision fatigue.
3. **Use form requests** — when validation rules exceed three or four lines, extract them. Your controller should not know the details of what makes data valid.
4. **Use type hints** — always declare return types (`View`, `RedirectResponse`, `JsonResponse`). They serve as documentation and catch bugs.
5. **Use route model binding** — type-hint models in method signatures. Let Laravel fetch the record, so your method receives a model instead of an ID.
6. **Avoid logic in routes** — use controllers instead of closures for anything non-trivial. Closures cannot be referenced by name, cannot be tested in isolation, and bloat the route file.
7. **Use API resources** — transform models for JSON responses with `JsonResource`. Never return raw models from API endpoints — you might accidentally expose sensitive fields.
