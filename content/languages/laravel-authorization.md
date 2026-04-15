---
title: "Laravel Authorization — Gates, Policies & Permissions"
date: "2025-01-15"
tags: ["laravel", "authorization", "gates", "policies", "php", "security"]
excerpt: "Control what authenticated users can do — gates, policies, roles, permissions, and the authorize helper in Laravel."
---

# Laravel Authorization — Gates, Policies & Permissions

## Authentication vs Authorization — They Are Not the Same Thing

These two terms get confused all the time, but they answer completely different questions. Authentication asks "who are you?" — it is the login process that verifies your identity using an email and password. Authorization asks "what are you allowed to do?" — it is the process of checking whether you, now that we know who you are, have permission to perform a specific action. A user might be authenticated (logged in) but not authorized to delete someone else's post, access the admin panel, or edit a product they did not create. You need both, and they serve different purposes.

A common mistake is relying on the UI to enforce permissions — hiding the "Delete" button from users who should not be able to delete something. But hiding a button does not prevent someone from sending a DELETE request directly. Authorization must happen on the server, in your controllers or routes, regardless of what the frontend shows.

## Why Not Just Use If-Statements?

When your app is small, a simple `if ($user->is_admin)` check scattered through your controllers feels fine. But then you add moderators, who can edit but not delete. Then you add team owners, who can manage their own team's content. Then you add a subscription tier that gates certain features. Before long, you have authorization logic duplicated across dozens of controllers, and changing one rule means hunting through every file to find all the places you wrote that if-statement. It becomes fragile and error-prone.

Laravel's authorization system gives you a central, reusable place to define these rules. You write the rule once, and use it everywhere — in controllers, Blade templates, and middleware. When the rule changes, you change it in one place and it takes effect across the entire application. This is the same principle as extracting a repeated calculation into a function: single source of truth, easy to maintain, impossible to forget to update.

## Gates — Simple Closure-Based Rules

Gates are the simplest form of authorization in Laravel. You define a gate as a closure (an anonymous function) in your `AuthServiceProvider`. The closure receives the current user and optionally a model instance, and returns `true` or `false`. Gates are great for general abilities that are not tied to a specific model — things like "can this user access the admin panel?" or "is this user a premium subscriber?"

Think of gates as simple yes/no questions. They are quick to set up, easy to understand, and perfect for one-off checks. But they live in a single service provider, so if your authorization logic grows complex, that file can become a dumping ground. That is when you reach for Policies instead.

```php
// app/Providers/AuthServiceProvider.php
namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // A simple yes/no gate — no model involved
        Gate::define('access-admin', function (User $user) {
            return $user->is_admin === true;
        });

        // A gate that checks a specific model instance
        Gate::define('update-post', function (User $user, Post $post) {
            return $user->id === $post->user_id;
        });

        // Gate::before runs before all other gate checks — useful for super admins
        Gate::before(function (User $user, string $ability) {
            if ($user->is_super_admin) {
                return true; // Super admin bypasses everything
            }
        });
    }
}
```

### Using Gates in Code and Blade

Once a gate is defined, you can check it in three ways: `Gate::allows()` returns a boolean, `Gate::authorize()` throws a 403 error if the check fails, and the `@can` Blade directive lets you conditionally render UI elements. Use `allows()` when you want to branch your logic, `authorize()` when you want to block access entirely, and `@can` in your views.

```php
// In controllers — check and branch
if (Gate::allows('update-post', $post)) {
    $post->update($validated);
}

// In controllers — block with 403 if not authorized
Gate::authorize('update-post', $post);
// If execution reaches here, the user is authorized

// Boolean checks
Gate::allows('access-admin');     // true or false
Gate::denies('access-admin');     // opposite
```

```blade
{{-- In Blade — conditionally show UI --}}
@can('update-post', $post)
    <a href="{{ route('posts.edit', $post) }}" class="btn">Edit Post</a>
@endcan

@cannot('update-post', $post)
    <p>You cannot edit this post.</p>
@endcannot
```

## Policies — Organized, Model-Specific Authorization

Policies are the natural next step when your authorization logic revolves around a specific model. Instead of defining loose closures in a service provider, you create a dedicated class with methods for each action: `view`, `create`, `update`, `delete`, `restore`, `forceDelete`. Each method receives the current user and (for most actions) the model instance being operated on. This keeps all the rules for a Post in one file, all the rules for a Comment in another, and so on. It is organized, discoverable, and easy to test.

Laravel auto-discovers policies by convention: `Post` model maps to `PostPolicy`, `User` model maps to `UserPolicy`. If you follow this naming pattern, you do not even need to register the policy manually. The mapping between the model and its policy is resolved automatically when you call `$this->authorize('update', $post)` — Laravel sees that `$post` is a `Post` model, finds the `PostPolicy`, and calls the `update` method.

```bash
php artisan make:policy PostPolicy --model=Post
```

```php
// app/Policies/PostPolicy.php
namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    // Can the user view the listing page?
    public function viewAny(User $user): bool
    {
        return true; // Anyone authenticated can see the list
    }

    // Can the user view this specific post?
    public function view(User $user, Post $post): bool
    {
        return $post->published || $user->id === $post->user_id;
    }

    // Can the user create a post at all?
    public function create(User $user): bool
    {
        return $user->email_verified_at !== null;
    }

    // Can the user edit this specific post?
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }

    // Can the user delete this specific post?
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }
}
```

### Using Policies in Controllers and Views

The most common way to use a policy is `$this->authorize('update', $post)` in a controller. This resolves the policy class automatically and throws a 403 if the check fails. You can also use `$user->can('update', $post)` for a boolean check, the `@can` Blade directive in views, or even middleware on your routes.

```php
// Controller — auto-throws 403 if not allowed
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);

    $post->update($request->validated());
    return to_route('posts.show', $post);
}

// For create, there is no model instance yet — pass the class name
public function create()
{
    $this->authorize('create', Post::class);
    return view('posts.create');
}

// Boolean check
if ($request->user()->can('update', $post)) {
    $post->update($validated);
}
```

```blade
{{-- Blade --}}
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan

@can('delete', $post)
    <form action="{{ route('posts.destroy', $post) }}" method="POST">
        @csrf @method('DELETE')
        <button type="submit">Delete</button>
    </form>
@endcan
```

```php
// Middleware — authorize at the route level
Route::put('/posts/{post}', [PostController::class, 'update'])
    ->middleware('can:update,post');

Route::get('/posts/create', [PostController::class, 'create'])
    ->middleware('can:create,App\Models\Post');
```

## Roles vs Individual Permissions

When it comes to organizing who can do what, you have two main approaches: roles and permissions. Roles group related permissions together — an "admin" role might include the ability to create, edit, and delete anything, while an "editor" role can edit but not delete, and a "writer" role can only edit their own content. Permissions are granular individual checks — "can delete posts", "can manage users", "can view reports". In practice, most applications use both: users are assigned roles, and roles are mapped to permissions.

The simplest implementation is a `role` column on the users table. For more complex scenarios — where users might have multiple roles, or where you need to assign permissions to individual users regardless of role — you would use a many-to-many relationship with a `roles` table and a `permissions` table. Packages like Spatie Laravel Permission handle this pattern. Start simple with a role column, and only add the complexity of a full permission system when you actually need it.

```php
// Simple role-based check using a gate
Gate::define('admin', fn (User $user) => $user->role === 'admin');
Gate::define('editor', fn (User $user) => in_array($user->role, ['admin', 'editor']));
Gate::define('writer', fn (User $user) => in_array($user->role, ['admin', 'editor', 'writer']));
```

```php
// Role-based logic inside a Policy
class PostPolicy
{
    public function update(User $user, Post $post): bool
    {
        return match($user->role) {
            'admin' => true,
            'editor' => true,
            'writer' => $user->id === $post->user_id,
            default => false,
        };
    }
}
```

### Using Enums for Type-Safe Roles

PHP 8.1 enums are a great fit for roles. Instead of passing around magic strings like `'admin'` and hoping you spelled it right everywhere, you define an enum with all valid roles. The database stores the string, but your application code works with enum cases — `$user->role === Role::Admin`. If you ever mistype a role, your IDE will catch it immediately instead of silently failing at runtime.

```php
// app/Enums/Role.php
enum Role: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Writer = 'writer';
    case Reader = 'reader';

    public function canEdit(): bool
    {
        return match($this) {
            self::Admin, self::Editor => true,
            default => false,
        };
    }
}

// In the User model, cast the role column to the enum
protected function casts(): array
{
    return [
        'role' => Role::class,
    ];
}

// Now you can compare against enum cases
$user->role === Role::Admin;
$user->role->canEdit();
```

## Custom Middleware for Role Checks

Sometimes you want to protect entire route groups based on a role, without writing authorization logic in every controller method. Custom middleware handles this cleanly. The middleware checks the user's role before the request reaches the controller, and returns a 403 if the role does not match. This is useful for admin panels or dashboard routes where every endpoint requires the same role.

```php
// Custom middleware
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if ($request->user()?->role !== $role) {
            abort(403);
        }
        return $next($request);
    }
}

// Apply to routes
Route::middleware('role:admin')->group(function () {
    Route::get('/admin', [AdminController::class, 'index']);
});
```
