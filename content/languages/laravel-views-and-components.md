---
title: "Laravel Views & Component Architecture"
date: "2025-01-08"
tags: ["laravel", "views", "components", "php", "frontend"]
excerpt: "Learn how to organize Laravel views, pass data to templates, use view composers, and build reusable component patterns."
---

# Laravel Views & Component Architecture

Views are the "V" in MVC — they handle **what the user sees**. Laravel provides a rich system for organizing and rendering views.

## Why Views Exist — The Problem MVC's V Solves

In the early days of web development, there was no clean separation between the code that fetched data and the code that rendered it. PHP files would open a database connection, run a query, loop through results, and echo HTML — all in the same file. It worked for a contact form, but it fell apart the moment your app grew beyond a handful of pages. You'd change a database column name and have to hunt through HTML files to fix the echo statements. You'd want to redesign the site and have to carefully avoid breaking the SQL queries buried inside the markup.

MVC's "View" layer exists to prevent this mess. The rule is simple: **views know about HTML, but they don't know where data comes from.** Your controller fetches the posts from the database, your view receives those posts as variables, and the view's only job is to turn those variables into HTML. This separation means a designer can redesign the entire site without touching a single line of PHP logic, and a backend developer can swap the database from MySQL to PostgreSQL without touching a single template file. Each person works in their domain without stepping on the other's.

Laravel's view system goes beyond basic file rendering. It adds a layer of organization — layouts, sections, components, stacks — that mirrors how front-end developers actually think about pages. A real page isn't one blob of HTML; it's a layout with a nav, a content area with cards, a sidebar with widgets, page-specific scripts. Laravel's view primitives let you express that structure directly rather than fighting against a flat file system.

## Creating & Returning Views

At its core, returning a view is straightforward: you tell Laravel which template to render and what data to give it. The `view()` helper is a function that returns an instance of Laravel's View object, and that object knows how to find the template file (by converting dot notation like `posts.index` into a file path like `resources/views/posts/index.blade.php`) and pass variables into it.

There are several syntaxes for passing data, and they all do the same thing. The array syntax `['posts' => $posts]` is the most explicit and readable. PHP's `compact()` function is a shortcut that creates an array from variable names — handy when your variable names already match your template variable names. The `with()` method lets you chain data additions, which some people find more fluent. Pick one style and stick with it; mixing all three in the same project confuses teammates.

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

The directory structure under `resources/views/` isn't arbitrary — it follows a convention that maps directly to how your app is structured. Each resource (posts, users, comments) gets its own folder, and the files inside follow the action naming convention: `index` for lists, `show` for detail pages, `create` and `edit` for forms. When another developer opens your project and sees `posts/show.blade.php`, they immediately know what it renders without opening the file.

The `layouts/`, `components/`, and `partials/` folders hold shared UI. Layouts define the page skeleton. Components are self-contained, reusable UI elements with their own logic. Partials are simpler includes — chunks of HTML that repeat across pages but don't need their own class. This hierarchy matters because it tells you where to look when something breaks: page-specific problem? Check the resource folder. Shared UI problem? Check components or partials. Structural problem? Check layouts.

```
resources/views/
├── layouts/
│   ├── app.blade.php          <- Main layout
│   ├── admin.blade.php        <- Admin layout
│   └── email.blade.php        <- Email layout
├── components/
│   ├── alert.blade.php        <- Alert component
│   ├── card.blade.php         <- Card component
│   ├── forms/
│   │   ├── input.blade.php
│   │   └── select.blade.php
│   └── nav/
│       └── navbar.blade.php
├── posts/
│   ├── index.blade.php        <- List posts
│   ├── show.blade.php         <- Single post
│   ├── create.blade.php       <- Create form
│   └── edit.blade.php         <- Edit form
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

Data flows into views in one direction: from the controller to the template. This is a deliberate design choice. In some older frameworks, templates could directly access global state, session data, or even run database queries. That freedom led to templates that were impossible to test and hard to debug, because the data could come from anywhere. Laravel's approach forces you to be explicit about what data a view receives, which makes views predictable and testable.

The array syntax is generally preferred in modern Laravel code because it's self-documenting. When you read `return view('posts.index', ['posts' => $posts, 'title' => 'All Posts'])`, you know exactly what variables the template expects. The `compact()` approach is shorter but hides the variable names inside PHP's string-to-variable magic, which can be confusing if you're not familiar with PHP's `compact()` function.

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

View composers solve one of the most annoying DRY violations in web development: **data that many views need but that shouldn't live in every controller method.** The classic example is a navigation bar that displays categories. Every page shows the navbar, so every page needs the categories. Without view composers, you'd either query categories in every controller method (repetitive and error-prone — forget one and the navbar breaks) or use a global variable (fragile and untestable).

View composers give you a clean middle ground. You register a callback that says "every time the `layouts.app` view is rendered, attach these categories to it." The data is loaded only when needed, it's attached automatically, and your controllers stay focused on their specific responsibilities. `View::share()` is the bluntest tool — it attaches data to *every* view, which is appropriate for truly universal data like the app name. `View::composer()` is more surgical — it targets specific views, so you're not querying data for pages that don't need it.

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

View creators are similar to composers but differ in timing: **composers run right before the view is rendered, while creators run the moment the view is instantiated.** This distinction matters when other code might modify the view between instantiation and rendering. In practice, you'll use composers far more often — the delayed execution is usually what you want. Creators are the tool to reach for when you need to set up data that other parts of the rendering pipeline might depend on.

```php
View::creator('posts.index', function ($view) {
    $view->with('count', Post::count());
});
```

## A Complete View Example

Let's build a blog post listing page — this brings together all the concepts into something real. The page extends a layout for its skeleton, uses a component for each post card, pushes page-specific CSS via stacks, and handles the empty-state gracefully. This is how a well-structured Laravel view actually looks in production.

Notice the separation of concerns: the layout knows about the page structure (head, nav, footer), the index view knows about the post listing (search, grid, pagination), and the post-card component knows about rendering a single post. Each piece does one thing, and if you need to change how a post card looks, you edit one file — the component — and every page that uses post cards updates automatically.

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

This anonymous component demonstrates a key idea: the component is self-contained. It declares its props (just `post` in this case), handles its own formatting (date formatting, string truncation), and renders a complete card. Any page that needs to display a post card just writes `<x-post-card :post="$post" />` and gets a consistent, maintained-in-one-place card. If the design changes — maybe tags move above the excerpt — you edit this single file and every card across the entire site updates.

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

Validation error handling in Laravel views is designed to make a terrible UX pattern (form submission fails, user loses everything they typed) almost effortless to prevent. The `$errors` variable is automatically available in every view after a form submission — you don't have to pass it manually. The `old()` helper repopulates form fields with the user's previous input, and the `@error` directive lets you show the specific validation message next to the relevant field.

This system works because Laravel flashes the validation errors and old input to the session on redirect. When the view renders, it pulls them back out. It's seamless enough that you can add proper error handling to a form in about two minutes, which means there's no excuse for forms that don't show errors or that wipe user input on failure.

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

Flash messages are the companion to validation errors — they handle the success and info notifications. "Post created successfully," "Your password has been changed," "Settings saved." These are one-time messages that exist in the session for exactly one request and then disappear. This makes them perfect for the redirect-after-action pattern: your controller does something, flashes a message, redirects to the next page, and the message appears once and vanishes on the next navigation.

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

Custom error pages are one of those things that users notice when they're bad and appreciate when they're good. A default "404 Not Found" is jarring; a styled one that matches your site's design, offers a search box, and suggests popular pages turns a dead end into a gentle detour. Laravel lets you override every HTTP error page with your own Blade templates.

```bash
php artisan vendor:publish --tag=laravel-errors
```

This creates `resources/views/errors/` with customizable templates:

```
resources/views/errors/
├── 401.blade.php    <- Unauthorized
├── 403.blade.php    <- Forbidden
├── 404.blade.php    <- Not Found
├── 419.blade.php    <- Page Expired (CSRF)
├── 429.blade.php    <- Too Many Requests
└── 500.blade.php    <- Server Error
```

## Best Practices

1. **Use consistent naming** — `resource.action` (e.g., `posts.index`, `posts.show`)
2. **Keep views thin** — Complex logic belongs in controllers, not templates
3. **Use components** — For reusable UI elements (cards, modals, alerts)
4. **Use layouts** — Never repeat HTML boilerplate across pages
5. **Use view composers** — For data shared across many views (navigation, settings)
6. **Use stacks** — For page-specific assets (CSS/JS)
7. **Escape output** — Use `{{ }}` by default, `{!! !!}` only when necessary
