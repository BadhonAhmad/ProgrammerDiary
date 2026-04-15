---
title: "Laravel Blade Templates — The Complete Guide"
date: "2025-01-07"
tags: ["laravel", "blade", "templates", "php", "frontend"]
excerpt: "Master Laravel's Blade templating engine — layouts, components, directives, stacks, and everything you need to build dynamic views."
---

# Laravel Blade Templates — The Complete Guide

Blade is Laravel's powerful templating engine. Unlike other PHP templating engines, Blade **doesn't restrict you from using plain PHP** in your views. It compiles Blade templates into plain PHP code that's cached until modified.

## Why Blade Exists at All

Before templating engines, PHP developers wrote HTML by sprinkling raw PHP tags everywhere — `<?php echo $title; ?>` mixed with `<?php if ($user): ?>` blocks. It worked, but it was messy, error-prone, and dangerously insecure. One forgotten `htmlspecialchars()` call and you had an XSS vulnerability. The logic and the markup became tangled spaghetti that nobody wanted to maintain.

Blade was created to solve a specific problem: **how do you let developers build dynamic HTML without letting them shoot themselves in the foot?** It gives you a clean, readable syntax that looks like HTML, not like programming. Behind the scenes, every `{{ $title }}` gets compiled into `<?php echo e($title); ?>` — and that little `e()` function automatically escapes HTML entities. You'd have to go out of your way *not* to escape output, which flips the security model from "remember to be safe" to "safe by default." That's a massive win for teams where not everyone is a security expert.

The other big idea is compilation. Blade doesn't interpret your templates at runtime like some engines do. Instead, it takes your `.blade.php` file, translates every `@if`, `@foreach`, and `{{ }}` into plain PHP, and caches the result. The first request after a change is slightly slower, but every subsequent request runs at the speed of raw PHP — because that's literally what's executing. You get the ergonomics of a templating language with zero performance penalty.

## Displaying Data

Blade's `{{ }}` syntax is the most fundamental thing it offers, and it's worth understanding what happens behind the scenes. When you write `{{ $title }}`, Blade compiles it to `<?php echo e($title); ?>`. The `e()` function is Laravel's HTML encoder — it converts `<` to `&lt;`, `>` to `&gt;`, `"` to `&quot;`, and so on. This means if a user types `<script>alert('xss')</script>` as their name, it renders as visible text on the page rather than executing as JavaScript. That's why `{{ }}` should be your default for 99% of output.

Sometimes you genuinely need raw HTML — maybe you're rendering a rich-text editor's output or an admin-written HTML snippet. That's what `{!! !!}` is for, but treat it like a sharp knife: use it deliberately, and only when you trust the source. The `??` operator lets you provide fallback values, which is cleaner than wrapping everything in `isset()` checks.

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

Think of Blade directives as a more readable skin over raw PHP control structures. Instead of the awkward `<?php if ($condition): ?> ... <?php endif; ?>` dance, you get `@if` ... `@endif` — it reads like pseudocode and doesn't clutter your HTML with angle-bracket soup. But the real power is the *domain-specific* directives like `@auth`, `@guest`, `@production`, and `@env`. These aren't just syntax sugar — they encapsulate common checks that every web app needs. Instead of writing `@if(auth()->check())` over and over, you write `@auth` and everyone immediately understands the intent.

The `@unless` directive is a personal favorite — it's the same as `@if(! ...)`, but reads more naturally in English. "Unless this post is published, show the draft badge" flows better than "if not published." Small thing, but your future self reading the code at 2 AM will thank you.

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

Blade's loop directives wrap PHP's `foreach`, `for`, and `while` in the same cleaner syntax, but the standout feature is the `$loop` variable. Inside any `@foreach`, Laravel automatically injects an object that knows everything about the current iteration — am I on the first item? The last? Am I in a nested loop? This sounds trivial until you've written `if ($i === 0)` and `if ($i === count($items) - 1)` for the hundredth time. The `$loop` variable eliminates all that boilerplate.

The `@forelse` directive deserves special attention. How many times have you written `@if($posts->count()) ... @foreach ... @endforeach ... @else ... @endif`? It's one of the most common patterns in web development — "loop over these items, but if there are none, show a fallback message." `@forelse` collapses that entire pattern into a single, readable construct.

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

Imagine you're building a 50-page website and every single page shares the same `<head>`, navigation bar, and footer. Without layouts, you'd copy-paste that shared HTML into every file. When the nav changes, you'd update 50 files. This is the exact problem layouts solve: **define the skeleton once, fill in the unique parts per page.**

The mechanism is elegantly simple. A layout uses `@yield('content')` to say "put the page-specific content here" — it's like a placeholder or a slot. Then child views use `@extends('layouts.app')` to declare "I belong to this layout" and `@section('content')` to say "here's what goes in that placeholder." Think of it like a form letter: the layout is the template with blanks, and each page fills in the blanks differently.

The `@show` directive you'll see in layouts is a subtle but important detail. It means "end this section AND render it right here." It's used for sections that have a default value in the layout itself (like a footer with a copyright notice) but can still be overridden by child views. Without `@show`, a `@section` just defines content that waits to be rendered by a `@yield` somewhere else.

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

Components are Laravel's modern answer to a fundamental problem in front-end development: **how do you create reusable pieces of UI that carry their own logic?** Before components, the main tool was `@include`, which is basically "paste this other file here." Includes work, but they have no concept of their own state, their own validation, or their own attributes. They're just file inserts.

Components change the game by pairing a PHP class with a Blade view. The class acts as a mini-controller for that piece of UI — it accepts props (typed, validated parameters), handles any setup logic, and passes computed data to the view. This means your alert component knows it needs a `type` and a `message`, and the class can enforce defaults and types. You get the same separation of concerns that MVC gives your whole app, but at the granularity of individual UI elements. It's like going from include files to proper objects.

Anonymous components (no class, just a view file) are the lighter version. They're perfect for simpler pieces — a card, a badge, a stat widget — where you don't need a full class but still want the `<x-component>` tag syntax, attribute merging, and slot support. The `@props` directive in the view file lets you declare which attributes are expected, giving you documentation and defaults without the overhead of a class.

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

Slots solve a problem that's surprisingly annoying without them: **how do you pass multiple separate chunks of content into a component?** Think of a modal — it needs a title area, a body area, and a footer with buttons. Without named slots, you'd use weird workarounds like passing HTML strings as variables or having the component peek into session data. Named slots make this clean: the component defines where each slot renders, and the parent view fills each slot with whatever markup it wants.

The default slot (`$slot`) catches everything that isn't explicitly placed in a named slot. This means simple components with just one content area don't need any slot naming at all — you just put content between the opening and closing tags. But when complexity grows and you need separate regions, named slots are there without requiring any structural changes to your approach.

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

Includes are the simplest form of view reuse — think of them as "paste this file here." They're still useful for quick partials that don't warrant a full component: a shared navbar, a recurring ad banner, a sidebar filter. The key difference from components is that includes are just file inserts with no class backing them, no prop validation, no attribute merging. They receive data through an explicit array you pass as the second argument.

Laravel provides a few smart variants: `@includeIf` won't crash if the file doesn't exist (useful for optional feature modules), `@includeWhen` conditionally includes based on a boolean (cleaner than wrapping in an `@if`), and `@includeFirst` tries multiple views in order and uses the first one found (great for theme overrides where a custom version takes priority over the default).

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

Stacks solve a specific and surprisingly painful problem: **how does a child view inject page-specific CSS or JavaScript into the `<head>` or bottom of `<body>`?** The layout owns those areas, but individual pages often need their own dependencies — a chart library on the analytics page, a date picker on the form page, specific CSS for a unique layout.

Without stacks, you'd either load everything on every page (wasteful) or conditionally check the current route in the layout (fragile and ugly). Stacks give you a clean inversion of control: the layout defines a `@stack('scripts')` placeholder, and any view or component can `@push` content into it. The child view doesn't need to know about the layout's structure, and the layout doesn't need to know about the child's needs. They communicate through this named channel. `@prepend` lets you push to the front of the stack — useful when something needs to load before other items already pushed.

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

These helpers are the everyday utilities that make Blade feel like a complete toolkit rather than just a templating syntax. `@csrf` generates a hidden token field that protects your forms from cross-site request forgery — without it, any malicious site could submit forms on behalf of a logged-in user. `@method('PUT')` is necessary because HTML forms only support GET and POST; Laravel uses method spoofing to let you pretend a POST is actually a PUT, PATCH, or DELETE.

The `old()` helper is a small but delightful piece of user experience engineering. When a form validation fails and the user is sent back, `old('email')` re-fills the email field with what they typed so they don't have to re-enter it. The `@error` directive shows the validation message right next to the relevant field. Together, they make form error handling almost automatic.

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

Sometimes you need a quick calculation or variable setup that doesn't warrant a separate method in your controller or component class. The `@php` directive lets you run arbitrary PHP inside your Blade view. But here's the thing — every time you reach for `@php`, ask yourself: "should this logic live somewhere else?" If it's formatting, it might belong in a model accessor. If it's computation, it might belong in the controller. Views should be mostly about presentation, and heavy `@php` blocks are a code smell that your view is doing too much.

That said, small calculations like totaling up cart items or formatting a complex string are perfectly fine to keep in the view. The guideline isn't "never use @php" but rather "if your @php block is more than a few lines, reconsider where that logic belongs."

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

Custom directives let you extend Blade's vocabulary with your own domain-specific syntax. If you find yourself writing the same pattern repeatedly — a particular date format, a permission check, a feature flag — you can wrap it into a clean `@datetime($date)` or `@admin` directive. Under the hood, you're defining a string replacement: your directive's callback returns a PHP code string that Blade swaps in during compilation.

Custom `Blade::if` directives are especially useful. Instead of littering your views with `@if(auth()->check() && auth()->user()->is_admin)`, you register `Blade::if('admin', ...)` once and then use `@admin` / `@endadmin` everywhere. It's a readability improvement for your entire team, and if the admin-check logic ever changes, you update it in one place.

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
