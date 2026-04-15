---
title: "Laravel Authorization — Gates, Policies & Permissions"
date: "2025-01-15"
tags: ["laravel", "authorization", "gates", "policies", "php", "security"]
excerpt: "Control what authenticated users can do — gates, policies, roles, permissions, and the authorize helper in Laravel."
---

# Laravel Authorization — Gates, Policies & Permissions

Authorization determines **what a user is allowed to do**. While authentication asks "who are you?", authorization asks "are you allowed to do this?"

## Gates

Gates are **closure-based** authorization checks. Define them in `App\Providers\AuthServiceProvider`:

```php
// app/Providers/AuthServiceProvider.php
namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Simple gate
        Gate::define('access-admin', function (User $user) {
            return $user->is_admin === true;
        });

        // Gate with model parameter
        Gate::define('update-post', function (User $user, Post $post) {
            return $user->id === $post->user_id;
        });

        // Gate that runs before all other checks
        Gate::before(function (User $user, string $ability) {
            if ($user->is_super_admin) {
                return true; // Super admin can do everything
            }
        });

        // Gate that runs after all other checks
        Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
            // Log authorization checks, etc.
        });
    }
}
```

### Using Gates

```php
// In controllers
if (Gate::allows('update-post', $post)) {
    // User can update this post
}
$post->update($validated);

// Throws 403 if not authorized
Gate::authorize('update-post', $post);
// If we get here, the user is authorized

// Check without user parameter (current user)
Gate::allows('access-admin');    // true/false
Gate::denies('access-admin');    // false/true
Gate::any(['update-post', 'delete-post'], $post);  // Any of these
Gate::none(['update-post', 'delete-post'], $post); // None of these

// For other users (not current)
Gate::forUser($anotherUser)->allows('update-post', $post);
```

### Gates in Blade

```blade
@can('update-post', $post)
    <a href="{{ route('posts.edit', $post) }}" class="btn">Edit Post</a>
@endcan

@cannot('update-post', $post)
    <p>You cannot edit this post.</p>
@endcannot

@canany(['update-post', 'delete-post'], $post)
    <div class="actions">
        {{-- Edit or Delete --}}
    </div>
@endcanany
```

## Policies

Policies are **class-based** authorization rules organized around a model. They're more structured than gates.

### Creating Policies

```bash
# Create a policy
php artisan make:policy PostPolicy

# Create with model binding
php artisan make:policy PostPolicy --model=Post
```

### Policy Class

```php
// app/Policies/PostPolicy.php
namespace App\Policies;

use App\Models\Post;
use App\Models\User;

class PostPolicy
{
    // View any posts (listing)
    public function viewAny(User $user): bool
    {
        return true; // Anyone can see the list
    }

    // View a specific post
    public function view(User $user, Post $post): bool
    {
        return $post->published || $user->id === $post->user_id;
    }

    // Create a new post
    public function create(User $user): bool
    {
        return $user->email_verified_at !== null;
    }

    // Update a post
    public function update(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }

    // Delete a post
    public function delete(User $user, Post $post): bool
    {
        return $user->id === $post->user_id || $user->is_admin;
    }

    // Restore a soft-deleted post
    public function restore(User $user, Post $post): bool
    {
        return $user->is_admin;
    }

    // Permanently delete
    public function forceDelete(User $user, Post $post): bool
    {
        return $user->is_admin;
    }
}
```

### Registering Policies

Laravel auto-discovers policies if the naming matches (Post model → PostPolicy). To register manually:

```php
// app/Providers/AuthServiceProvider.php
protected $policies = [
    Post::class => PostPolicy::class,
];
```

### Using Policies

```php
// In controllers — using the authorize() method (recommended)
public function update(Request $request, Post $post)
{
    $this->authorize('update', $post);  // Auto-throws 403 if not allowed

    $post->update($request->validated());
    return to_route('posts.show', $post);
}

// For create (no model instance yet)
public function create()
{
    $this->authorize('create', Post::class);
    return view('posts.create');
}

// Using the can() method on User
if ($request->user()->can('update', $post)) {
    $post->update($validated);
}

// Check without throwing
$request->user()->cannot('delete', $post);  // true if NOT allowed
```

### Policies in Blade

```blade
@can('update', $post)
    <a href="{{ route('posts.edit', $post) }}">Edit</a>
@endcan

@can('delete', $post)
    <form action="{{ route('posts.destroy', $post) }}" method="POST">
        @csrf @method('DELETE')
        <button type="submit">Delete</button>
    </form>
@endcan

@can('create', App\Models\Post::class)
    <a href="{{ route('posts.create') }}">New Post</a>
@endcan
```

### Policies in Middleware

```php
// Using policy via middleware
Route::put('/posts/{post}', [PostController::class, 'update'])
    ->middleware('can:update,post');

Route::get('/posts/create', [PostController::class, 'create'])
    ->middleware('can:create,App\Models\Post');
```

## Role-Based Authorization

A common pattern is to add roles to users:

### Migration

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('role')->default('reader'); // reader, writer, admin
});
```

### Using Roles with Gates

```php
Gate::define('admin', fn (User $user) => $user->role === 'admin');
Gate::define('editor', fn (User $user) => in_array($user->role, ['admin', 'editor']));
Gate::define('writer', fn (User $user) => in_array($user->role, ['admin', 'editor', 'writer']));
```

### Using Roles with Policies

```php
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

### Using Enums for Roles

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

// User model
protected function casts(): array
{
    return [
        'role' => Role::class,
    ];
}

// Usage
$user->role === Role::Admin;
$user->role->canEdit();
```

## Middleware Authorization

```php
// Custom middleware for roles
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

// In routes
Route::middleware('role:admin')->group(function () {
    Route::get('/admin', [AdminController::class, 'index']);
});
```

## Best Practices

1. **Use Policies for model-specific logic** — More organized than gates for CRUD
2. **Use Gates for general abilities** — Non-model actions like "access admin panel"
3. **Always authorize** — Don't rely on hiding UI elements alone
4. **Use `authorize()` in controllers** — Clean, throws 403 automatically
5. **Use `@can` in Blade** — Show/hide UI based on permissions
6. **Define a `Gate::before`** — For super-admin override
7. **Use enums for roles** — Type-safe and more maintainable
