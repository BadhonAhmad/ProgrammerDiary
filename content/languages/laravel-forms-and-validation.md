---
title: "Laravel Forms & Validation"
date: "2025-01-12"
tags: ["laravel", "forms", "validation", "php", "security"]
excerpt: "Handle user input safely in Laravel — form creation, CSRF protection, validation rules, form requests, and displaying errors."
---

# Laravel Forms & Validation

## Why Server-Side Validation Matters

It is tempting to think that a bit of JavaScript validation on the frontend is enough. It gives instant feedback, feels smooth, and seems to cover all the bases. But here is the problem: JavaScript runs in the browser, which means the user has full control over it. Anyone can open DevTools, delete your validation logic, and submit whatever they want. They can also bypass the browser entirely and fire a `curl` request straight at your endpoint. Frontend validation is a UX improvement, not a security measure. The server is the only place where you can genuinely enforce rules, because it is the one environment you control.

Laravel takes this seriously. When validation fails on the server, Laravel does something clever by default: it redirects back to the previous page, flashes all the old input to the session so the form stays filled out, and attaches the validation errors so you can display them. The user never loses what they typed. This "redirect back with errors and old input" pattern saves you from writing tedious boilerplate and gives users a decent experience even when things go wrong.

## CSRF — The Attack You Did Not See Coming

Imagine you are logged into your bank's website. You visit a forum, and someone has embedded a hidden form that automatically submits a POST request to `bank.com/transfer` with `to=attacker&amount=10000`. Your browser sends the request along with your session cookie, and the bank processes it because as far as it can tell, you made that request. This is Cross-Site Request Forgery (CSRF). The attacker never saw your credentials, never intercepted your cookies, and never hacked anything. They just exploited the fact that your browser automatically attaches cookies to requests.

Laravel defends against this by requiring a CSRF token on every POST form. This is a random string that Laravel generates, stores in the session, and expects to see submitted with the form. A malicious site cannot read this token because of the browser's same-origin policy, so it cannot forge a valid request. The `@csrf` Blade directive injects a hidden input field with this token. If the token is missing or does not match, Laravel rejects the request outright.

```blade
{{-- Every POST form must include @csrf --}}
<form method="POST" action="{{ route('posts.store') }}">
    @csrf

    <div>
        <label for="title">Title</label>
        <input type="text" id="title" name="title"
               value="{{ old('title') }}"
               class="@error('title') is-invalid @enderror">
        @error('title')
            <span class="error">{{ $message }}</span>
        @enderror
    </div>

    <div>
        <label for="content">Content</label>
        <textarea id="content" name="content">{{ old('content') }}</textarea>
        @error('content')
            <span class="error">{{ $message }}</span>
        @enderror
    </div>

    <button type="submit">Create Post</button>
</form>

{{-- PUT/PATCH/DELETE need method spoofing --}}
<form method="POST" action="{{ route('posts.update', $post) }}">
    @csrf
    @method('PUT')
    {{-- fields... --}}
</form>
```

For AJAX requests, you expose the token via a meta tag and send it in a header. The same principle applies: if the header does not match the session token, the request is rejected.

```blade
<meta name="csrf-token" content="{{ csrf_token() }}">

<script>
fetch('/posts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
    },
    body: JSON.stringify({ title: 'My Post' }),
});
</script>
```

## The Problem With Putting Validation in Controllers

When you are starting out, validating right inside the controller method feels natural. You call `$request->validate()`, pass an array of rules, and move on. For a small app with three fields, that is fine. But as your application grows, you end up with the same validation rules scattered across multiple controllers. The `store` and `update` methods for posts need nearly identical rules. An admin controller might need a slightly different version of the same rules. Before long, your controller methods are bloated with validation arrays instead of business logic.

Form Request classes solve this by pulling validation into its own dedicated class. Each form in your application gets its own request object with its own rules, custom error messages, and even its own authorization check. The controller stays thin because by the time the request reaches your controller method, validation has already passed. If it fails, Laravel automatically redirects back with errors before your controller is even called. Think of it as a bouncer at the door of your controller — invalid requests never get inside.

```php
use Illuminate\Http\Request;

// Inline validation — fine for simple cases
public function store(Request $request)
{
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'content' => 'required|string|min:10',
        'category_id' => 'required|exists:categories,id',
        'status' => 'in:draft,published',
        'tags' => 'array',
        'tags.*' => 'exists:tags,id',
        'image' => 'nullable|image|max:2048',
    ]);

    $post = Post::create($validated);

    return to_route('posts.show', $post)
        ->with('success', 'Post created!');
}
```

## Creating a Form Request Class

A Form Request is just a PHP class that extends `FormRequest`. You define the rules, optional custom messages, and an authorization check. Laravel automatically resolves this class from the dependency injection container, runs the validation, and blocks the request if it fails. This means your controller method signature changes from `Request $request` to `StorePostRequest $request`, and you get the validated data by calling `$request->validated()`. Everything else — the redirect, the error flashing, the old input — happens behind the scenes.

Notice the `authorize()` method. This is not about validation; it is about whether the current user is even allowed to make this request. For example, you might check that the user is an author before allowing them to create a post. If this returns `false`, Laravel throws a 403 before any validation runs.

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
            'slug' => 'required|string|max:255|unique:posts',
            'content' => 'required|string|min:20',
            'excerpt' => 'nullable|string|max:300',
            'category_id' => 'required|exists:categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:tags,id',
            'featured_image' => 'nullable|image|max:2048',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date|after:now',
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'A post title is required.',
            'title.unique' => 'This title has already been used.',
            'content.min' => 'Post content must be at least :min characters.',
            'category_id.exists' => 'The selected category does not exist.',
        ];
    }
}
```

```php
// Controller stays clean
public function store(StorePostRequest $request): RedirectResponse
{
    // Validation has already passed at this point
    $validated = $request->validated();

    $post = auth()->user()->posts()->create($validated);

    return to_route('posts.show', $post);
}
```

## Common Validation Rules

Laravel ships with dozens of built-in rules. You do not need to memorize all of them, but understanding the categories helps. There are rules for strings (length, format, patterns), numbers (min, max, between), dates (before, after, format), files (size, MIME type, dimensions for images), and database checks (does this ID exist, is this value unique). Most of the time you will use `required`, `string`, `max`, `email`, `unique`, and `exists`. The rest you look up when you need them.

One rule worth understanding is `Rule::unique()->ignore($this->post)`. When you update a record, the `unique` rule would normally fail because the record's own value already exists in the database. The `ignore` method tells the unique checker to exclude the current record from the check.

```php
// Unique rule that ignores the current record (for updates)
public function rules(): array
{
    return [
        'title' => [
            'required',
            'string',
            'max:255',
            Rule::unique('posts')->ignore($this->post),
        ],
        'email' => Rule::unique('users')->ignore($this->route('user')),
    ];
}
```

Here is a reference of the most commonly used rules grouped by type:

### String and Text

| Rule | What it checks |
|------|---------------|
| `required` | Field must be present and not empty |
| `required_if:field,value` | Required if another field equals value |
| `string` | Must be a string |
| `email` | Must be a valid email |
| `url` | Must be a valid URL |
| `max:255` | Maximum length of 255 |
| `min:10` | Minimum length of 10 |
| `regex:/pattern/` | Must match regex pattern |
| `alpha_dash` | Alphanumeric, dashes, underscores only |

### Numbers

| Rule | What it checks |
|------|---------------|
| `integer` | Must be an integer |
| `numeric` | Must be numeric |
| `between:1,10` | Between 1 and 10 |
| `gt:field` | Greater than another field |

### Dates

| Rule | What it checks |
|------|---------------|
| `date` | Must be a valid date |
| `after:start_date` | Must be after another field's value |
| `before:today` | Must be before today |

### Files

| Rule | What it checks |
|------|---------------|
| `file` | Must be an uploaded file |
| `image` | Must be an image (jpg, png, gif, etc.) |
| `mimes:pdf,doc` | Must have one of these extensions |
| `max:2048` | Max file size in kilobytes |
| `dimensions:min_width=100` | Image dimension constraints |

### Database

| Rule | What it checks |
|------|---------------|
| `exists:table,column` | Value must exist in the database |
| `unique:table,column` | Value must not already exist |

### Other Useful Rules

| Rule | What it checks |
|------|---------------|
| `confirmed` | Must have a matching `field_confirmation` |
| `in:draft,published` | Must be one of the listed values |
| `nullable` | Can be empty (skip other rules if empty) |
| `sometimes` | Only validate if the field is present |
| `array` | Must be a PHP array |
| `boolean` | Must be true, false, 1, 0, "1", or "0" |

## Custom Validation Rules

Sometimes the built-in rules are not enough. Maybe you need to enforce that a password contains at least one uppercase letter, one number, and one special character. You can write this as a closure inline, or extract it into a reusable Rule class. The closure approach is quick and dirty. The Rule class approach is cleaner when you need to reuse the rule across multiple forms or when the logic is complex enough that it deserves its own file.

```php
// Inline closure — quick for one-off use
$request->validate([
    'password' => [
        'required',
        'string',
        'min:8',
        function ($attribute, $value, $fail) {
            if (!preg_match('/[A-Z]/', $value)) {
                $fail("The {$attribute} must contain at least one uppercase letter.");
            }
            if (!preg_match('/[0-9]/', $value)) {
                $fail("The {$attribute} must contain at least one number.");
            }
        },
    ],
]);
```

```bash
php artisan make:rule StrongPassword
```

```php
// app/Rules/StrongPassword.php — reusable across the app
namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class StrongPassword implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strlen($value) < 8) {
            $fail('The :attribute must be at least 8 characters.');
        }
        if (!preg_match('/[A-Z]/', $value)) {
            $fail('The :attribute must contain an uppercase letter.');
        }
        if (!preg_match('/[0-9]/', $value)) {
            $fail('The :attribute must contain a number.');
        }
        if (!preg_match('/[^A-Za-z0-9]/', $value)) {
            $fail('The :attribute must contain a special character.');
        }
    }
}
```

```php
use App\Rules\StrongPassword;

$request->validate([
    'password' => ['required', new StrongPassword],
]);
```

## Displaying Errors in Blade

When validation fails and Laravel redirects back, it flashes the errors to the session. The `$errors` variable is available in every Blade view — you do not need to pass it manually. The `@error` directive lets you show an error for a specific field right next to the input, which is the most user-friendly approach. The `old()` helper repopulates the field with the user's previous input so they do not have to retype everything.

```blade
{{-- Summary of all errors --}}
@if($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

{{-- Inline error next to a field --}}
<input type="text" name="title" value="{{ old('title') }}">
@error('title')
    <span class="text-red-500 text-sm">{{ $message }}</span>
@enderror
```

## Manual Validation (When You Need More Control)

Most of the time, the automatic redirect-back behavior is exactly what you want. But sometimes you need to handle validation failure yourself — maybe you are building an API and want to return a JSON response instead of redirecting, or you need to perform some extra logic before deciding what to do. In those cases, you can create a validator manually using `Validator::make()` and handle the failure yourself.

```php
use Illuminate\Support\Facades\Validator;

$validator = Validator::make($request->all(), [
    'title' => 'required|string|max:255',
    'content' => 'required|string',
]);

if ($validator->fails()) {
    return redirect()->back()
        ->withErrors($validator)
        ->withInput();
}

$validated = $validator->validated();
```
