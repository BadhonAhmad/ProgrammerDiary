---
title: "Laravel Views & Component Architecture"
date: "2025-01-08"
tags: ["laravel", "views", "components", "php", "frontend"]
excerpt: "Learn how to organize Laravel views, pass data to templates, use view composers, and build reusable component patterns."
---

# Laravel Views & Component Architecture

Views are the "V" in MVC — they handle **what the user sees**. Laravel provides a rich system for organizing and rendering views.

## Creating & Returning Views

```php
// From a controller
return view('posts.index');
return view('posts.index', ['posts' => $posts]);

// Using the View facade
use Illuminate\Support\Facades\View;
return View::make('posts.index', ['posts' => $posts]);

// Using helper with compact()
return view('posts.show', compact('post'));

// First available view
return view()->first(['custom.theme', 'posts.show'], ['post' => $post]);
```

## View File Organization

```
resources/views/
├── layouts/
│   ├── app.blade.php          ← Main layout
│   ├── admin.blade.php        ← Admin layout
│   └── email.blade.php        ← Email layout
├── components/
│   ├── alert.blade.php        ← Alert component
│   ├── card.blade.php         ← Card component
│   ├── forms/
│   │   ├── input.blade.php
│   │   └── select.blade.php
│   └── nav/
│       └── navbar.blade.php
├── posts/
│   ├── index.blade.php        ← List posts
│   ├── show.blade.php         ← Single post
│   ├── create.blade.php       ← Create form
│   └── edit.blade.php         ← Edit form
├── partials/
│   ├── header.blade.php
│   ├── footer.blade.php
│   └── sidebar.blade.php
└── errors/
    ├── 404.blade.php
    └── 500.blade.php
```

## Passing Data to Views

### From Controllers

```php
// Method 1: Array
return view('posts.index', [
    'posts' => Post::latest()->paginate(15),
    'title' => 'All Posts',
]);

// Method 2: compact()
$posts = Post::latest()->paginate(15);
$title = 'All Posts';
return view('posts.index', compact('posts', 'title'));

// Method 3: with()
return view('posts.index')->with('posts', $posts)->with('title', 'All Posts');
```

### View Composers (Shared Data)

When you need data available in **every instance** of a view:

```php
// App\Providers\AppServiceProvider or ViewServiceProvider
use Illuminate\Support\Facades\View;
use App\Models\Category;

public function boot(): void
{
    // Share with ALL views
    View::share('appName', config('app.name'));

    // Share with a specific view
    View::composer('posts.*', function ($view) {
        $view->with('categories', Category::all());
    });

    // Using a dedicated class
    View::composer('layouts.app', NavigationComposer::class);

    // Multiple views
    View::composer(['posts.index', 'posts.show'], function ($view) {
        $view->with('popularPosts', Post::popular()->take(5)->get());
    });
}
```

### View Creator

Like composers, but run **immediately** when the view is instantiated (before the controller runs):

```php
View::creator('posts.index', function ($view) {
    $view->with('count', Post::count());
});
```

## A Complete View Example

Let's build a blog post listing page:

### Layout (`resources/views/layouts/app.blade.php`)

```blade
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', config('app.name'))</title>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body class="bg-gray-100">
    @include('partials.navbar')

    <div class="container mx-auto px-4">
        @yield('content')
    </div>

    @include('partials.footer')
    @stack('scripts')
</body>
</html>
```

### Post Index View (`resources/views/posts/index.blade.php`)

```blade
@extends('layouts.app')

@section('title', 'All Posts')

@push('styles')
    <link rel="stylesheet" href="{{ asset('css/posts.css') }}">
@endpush

@section('content')
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">All Posts</h1>
        @auth
            <a href="{{ route('posts.create') }}" class="btn btn-primary">
                New Post
            </a>
        @endauth
    </div>

    {{-- Search & Filters --}}
    <form method="GET" action="{{ route('posts.index') }}" class="mb-6">
        <input type="text" name="search" value="{{ request('search') }}"
               placeholder="Search posts..." class="input">
        <select name="category" class="input">
            <option value="">All Categories</option>
            @foreach($categories as $category)
                <option value="{{ $category->id }}"
                    {{ request('category') == $category->id ? 'selected' : '' }}>
                    {{ $category->name }}
                </option>
            @endforeach
        </select>
        <button type="submit" class="btn">Filter</button>
    </form>

    {{-- Posts Grid --}}
    @forelse($posts as $post)
        <x-post-card :post="$post" />
    @empty
        <div class="text-center py-12">
            <p class="text-gray-500 text-lg">No posts found.</p>
            <a href="{{ route('posts.create') }}" class="btn btn-primary mt-4">
                Write your first post
            </a>
        </div>
    @endforelse

    {{-- Pagination --}}
    <div class="mt-8">
        {{ $posts->links() }}
    </div>
@endsection
```

### Post Card Component (`resources/views/components/post-card.blade.php`)

```blade
@props(['post'])

<article class="card mb-4 hover:shadow-lg transition-shadow">
    <div class="card-body">
        <div class="flex items-center gap-2 mb-2">
            <img src="{{ $post->author->avatar }}" alt="{{ $post->author->name }}"
                 class="w-8 h-8 rounded-full">
            <span class="text-sm text-gray-600">{{ $post->author->name }}</span>
            <span class="text-sm text-gray-400">•</span>
            <time class="text-sm text-gray-400">
                {{ $post->created_at->format('M d, Y') }}
            </time>
        </div>

        <h2 class="text-xl font-semibold">
            <a href="{{ route('posts.show', $post) }}" class="hover:text-blue-600">
                {{ $post->title }}
            </a>
        </h2>

        <p class="text-gray-600 mt-2">{{ Str::limit($post->excerpt, 150) }}</p>

        <div class="flex items-center gap-2 mt-4">
            @foreach($post->tags as $tag)
                <span class="tag">{{ $tag->name }}</span>
            @endforeach
        </div>
    </div>
</article>
```

## View Errors

Display validation errors in your views:

```blade
{{-- All errors --}}
@if($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

{{-- Specific field error --}}
<input type="text" name="title" value="{{ old('title') }}"
       class="{{ $errors->has('title') ? 'border-red-500' : '' }}">

@error('title')
    <span class="text-red-500 text-sm">{{ $message }}</span>
@enderror
```

## Flash Messages

Display one-time success/error messages:

```blade
{{-- In your view --}}
@if(session('success'))
    <x-alert type="success" :message="session('success')" />
@endif

@if(session('error'))
    <x-alert type="danger" :message="session('error')" />
@endif
```

## HTTP Errors

Create custom error pages:

```bash
php artisan vendor:publish --tag=laravel-errors
```

This creates `resources/views/errors/` with customizable templates:

```
resources/views/errors/
├── 401.blade.php    ← Unauthorized
├── 403.blade.php    ← Forbidden
├── 404.blade.php    ← Not Found
├── 419.blade.php    ← Page Expired (CSRF)
├── 429.blade.php    ← Too Many Requests
└── 500.blade.php    ← Server Error
```

## Best Practices

1. **Use consistent naming** — `resource.action` (e.g., `posts.index`, `posts.show`)
2. **Keep views thin** — Complex logic belongs in controllers, not templates
3. **Use components** — For reusable UI elements (cards, modals, alerts)
4. **Use layouts** — Never repeat HTML boilerplate across pages
5. **Use view composers** — For data shared across many views (navigation, settings)
6. **Use stacks** — For page-specific assets (CSS/JS)
7. **Escape output** — Use `{{ }}` by default, `{!! !!}` only when necessary
