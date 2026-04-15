---
title: "Laravel Blade Templates — The Complete Guide"
date: "2025-01-07"
tags: ["laravel", "blade", "templates", "php", "frontend"]
excerpt: "Master Laravel's Blade templating engine — layouts, components, directives, stacks, and everything you need to build dynamic views."
---

# Laravel Blade Templates — The Complete Guide

Blade is Laravel's powerful templating engine. Unlike other PHP templating engines, Blade **doesn't restrict you from using plain PHP** in your views. It compiles Blade templates into plain PHP code that's cached until modified.

## Displaying Data

```blade
{{-- Basic output (auto-escaped for XSS) --}}
<h1>{{ $title }}</h1>

{{-- Unescaped output — USE WITH CAUTION --}}
<p>{!! $rawHtml !!}</p>

{{-- Default values --}}
<h1>{{ $title ?? 'Default Title' }}</h1>

{{-- Shorthand for isset --}}
{{ $name or 'Guest' }}
```

## Blade Directives

### Conditionals

```blade
{{-- if/else --}}
@if($user->isAdmin())
    <span class="badge">Admin</span>
@elseif($user->isModerator())
    <span class="badge">Moderator</span>
@else
    <span class="badge">Member</span>
@endif

{{-- unless (opposite of if) --}}
@unless($post->published)
    <span>Draft</span>
@endunless

{{-- isset / empty --}}
@isset($records)
    <p>Records exist!</p>
@endisset

@empty($posts)
    <p>No posts found.</p>
@endempty

{{-- Authentication --}}
@auth
    <p>Welcome, {{ auth()->user()->name }}</p>
@endauth

@guest
    <p>Please <a href="/login">log in</a>.</p>
@endguest

{{-- Check specific guard --}}
@auth('admin')
    <p>Welcome, Admin!</p>
@endauth

{{-- Production / environment --}}
@production
    <script>analytics.track('page_view');</script>
@endproduction

@env('local')
    <p class="debug-info">Debug mode active</p>
@endenv
```

### Loops

```blade
{{-- for loop --}}
@for($i = 0; $i < 10; $i++)
    <p>Item {{ $i }}</p>
@endfor

{{-- foreach --}}
@foreach($posts as $post)
    <article>
        <h2>{{ $post->title }}</h2>
        <p>{{ $post->excerpt }}</p>
    </article>
@endforeach

{{-- foreach with empty check --}}
@forelse($posts as $post)
    <article>
        <h2>{{ $post->title }}</h2>
    </article>
@empty
    <p>No posts found.</p>
@endforelse

{{-- while --}}
@while(true)
    <p>Infinite loop! (Don't actually do this)</p>
@endwhile

{{-- Loop variables (available inside @foreach) --}}
@foreach($users as $user)
    @if($loop->first)
        <div class="first-item">
    @endif

    <p>{{ $loop->iteration }}. {{ $user->name }}</p>

    @if($loop->last)
        </div>
    @endif
@endforeach
```

**Loop variable methods:**

| Property | Description |
|----------|-------------|
| `$loop->index` | Current index (0-based) |
| `$loop->iteration` | Current iteration (1-based) |
| `$loop->remaining` | Items remaining |
| `$loop->count` | Total items |
| `$loop->first` | Is first item? |
| `$loop->last` | Is last item? |
| `$loop->even` | Is even iteration? |
| `$loop->odd` | Is odd iteration? |
| `$loop->depth` | Nesting depth |
| `$loop->parent` | Parent loop variable |

## Layouts with @yield and @section

### Defining a Layout

```blade
{{-- resources/views/layouts/app.blade.php --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'My App')</title>
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    @stack('styles')
</head>
<body>
    <nav>
        <a href="/">Home</a>
        <a href="/posts">Posts</a>
    </nav>

    <main>
        @yield('content')
    </main>

    <footer>
        @section('footer')
            <p>&copy; {{ date('Y') }} My App</p>
        @show
    </footer>

    @stack('scripts')
    <script src="{{ asset('js/app.js') }}"></script>
</body>
</html>
```

### Extending a Layout

```blade
{{-- resources/views/posts/index.blade.php --}}
@extends('layouts.app')

@section('title', 'All Posts')

@section('content')
    <h1>All Posts</h1>

    @foreach($posts as $post)
        <article>
            <h2>{{ $post->title }}</h2>
            <p>{{ $post->excerpt }}</p>
            <a href="{{ route('posts.show', $post) }}">Read more</a>
        </article>
    @endforeach
@endsection
```

## Blade Components

Components are a cleaner, more reusable alternative to `@include`.

### Creating a Component

```bash
php artisan make:component Alert
```

This creates:
- `app/View/Components/Alert.php` — Component class
- `resources/views/components/alert.blade.php` — Component view

### Component Class

```php
// app/View/Components/Alert.php
namespace App\View\Components;

use Closure;
use Illuminate\Contracts\View\View;
use Illuminate\View\Component;

class Alert extends Component
{
    public function __construct(
        public string $type = 'info',
        public string $message = '',
    ) {}

    public function render(): View|Closure|string
    {
        return view('components.alert');
    }
}
```

### Component View

```blade
{{-- resources/views/components/alert.blade.php --}}
<div {{ $attributes->merge(['class' => 'alert alert-' . $type]) }}>
    @if($type === 'danger')
        <span class="icon">⚠</span>
    @endif

    {{ $message }}

    {{ $slot }}  {{-- Default slot content --}}
</div>
```

### Using Components

```blade
{{-- Basic usage --}}
<x-alert type="success" message="Post created!" />

{{-- With slot content --}}
<x-alert type="warning">
    <strong>Warning!</strong> Your session will expire in 5 minutes.
</x-alert>

{{-- Anonymous components (no class, just a view) --}}
{{-- Create: resources/views/components/card.blade.php --}}
<x-card title="Post Title">
    <p>Card content here</p>

    <x-slot:name>
        Footer content
    </x-slot:name>
</x-card>
```

### Named Slots

```blade
{{-- resources/views/components/modal.blade.php --}}
<div class="modal">
    <div class="modal-header">
        {{ $title ?? 'Modal' }}
    </div>
    <div class="modal-body">
        {{ $slot }}
    </div>
    <div class="modal-footer">
        {{ $footer ?? '' }}
    </div>
</div>

{{-- Usage --}}
<x-modal>
    <x-slot:title>
        <h2>Delete Post?</h2>
    </x-slot:title>

    <p>Are you sure you want to delete this post?</p>

    <x-slot:footer>
        <button class="btn-cancel">Cancel</button>
        <button class="btn-danger">Delete</button>
    </x-slot:footer>
</x-modal>
```

## @include — Reusable View Partials

```blade
{{-- Include a partial --}}
@include('partials.header')

{{-- Pass data to included view --}}
@include('partials.post-card', ['post' => $post])

{{-- Include if exists (won't error if file missing) --}}
@includeIf('partials.ad-banner')

{{-- Include based on condition --}}
@includeWhen($user->isAdmin(), 'partials.admin-tools')
@includeFirst(['custom.header', 'partials.header'])
```

## Stacks

Stacks let you push content from child views into parent layouts:

```blade
{{-- In layout --}}
<head>
    @stack('styles')
</head>
<body>
    @stack('scripts')
</body>

{{-- In child view --}}
@push('styles')
    <link rel="stylesheet" href="{{ asset('css/chart.css') }}">
@endpush

@push('scripts')
    <script src="{{ asset('js/chart.js') }}"></script>
@endpush

{{-- prepend instead of push (adds to beginning) --}}
@prepend('scripts')
    <script>This loads first!</script>
@endprepend
```

## Useful Helpers in Blade

```blade
{{-- CSRF token --}}
<form method="POST">
    @csrf
    ...
</form>

{{-- Method spoofing (PUT, PATCH, DELETE) --}}
<form method="POST">
    @csrf
    @method('PUT')
    ...
</form>

{{-- Error messages --}}
<input type="text" name="email" value="{{ old('email') }}">
@error('email')
    <span class="error">{{ $message }}</span>
@enderror

{{-- Include JavaScript data --}}
@json($users)
<script>
    const users = @json($users);
</script>

{{-- URL helpers --}}
{{ url('/posts') }}          {{-- Absolute URL --}}
{{ asset('css/app.css') }}   {{-- Asset URL --}}
{{ route('posts.show', $post) }} {{-- Named route URL --}}
{{ secure_url('/login') }}   {{-- HTTPS URL --}}
```

## Displaying Raw PHP

```blade
@php
    $total = 0;
    foreach ($items as $item) {
        $total += $item->price * $item->quantity;
    }
@endphp

<p>Total: ${{ number_format($total, 2) }}</p>
```

## Custom Blade Directives

Register custom directives in `AppServiceProvider`:

```php
use Illuminate\Support\Facades\Blade;

public function boot(): void
{
    Blade::directive('datetime', function (string $expression) {
        return "<?php echo ($expression)->format('M d, Y'); ?>";
    });

    Blade::if('admin', function () {
        return auth()->check() && auth()->user()->is_admin;
    });
}
```

Usage:

```blade
<p>Created: @datetime($post->created_at)</p>

@admin
    <a href="/admin">Admin Panel</a>
@endadmin
```

## Best Practices

1. **Use components over includes** — Components are more powerful and self-contained
2. **Keep Blade simple** — Move complex logic to controllers or view composers
3. **Use layouts** — Don't repeat HTML structure across pages
4. **Use `{{ }}` not `{!! !!}`** — Always escape unless you need raw HTML
5. **Leverage stacks** — For page-specific CSS/JS in child views
6. **Name your views clearly** — `posts.index`, `posts.show`, `layouts.app`, `components.alert`
