---
title: "Laravel Forms & Validation"
date: "2025-01-12"
tags: ["laravel", "forms", "validation", "php", "security"]
excerpt: "Handle user input safely in Laravel — form creation, CSRF protection, validation rules, form requests, and displaying errors."
---

# Laravel Forms & Validation

Every web application needs to accept and validate user input. Laravel provides a powerful, expressive validation system that keeps your data clean and your code readable.

## Creating Forms in Blade

```blade
{{-- Basic form --}}
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

    <div>
        <label for="category_id">Category</label>
        <select id="category_id" name="category_id">
            @foreach($categories as $category)
                <option value="{{ $category->id }}"
                    {{ old('category_id') == $category->id ? 'selected' : '' }}>
                    {{ $category->name }}
                </option>
            @endforeach
        </select>
    </div>

    <button type="submit">Create Post</button>
</form>

{{-- PUT/PATCH/DELETE forms --}}
<form method="POST" action="{{ route('posts.update', $post) }}">
    @csrf
    @method('PUT')
    {{-- fields... --}}
</form>

<form method="POST" action="{{ route('posts.destroy', $post) }}">
    @csrf
    @method('DELETE')
    <button type="submit">Delete</button>
</form>
```

> **Note:** HTML forms only support GET and POST. Use `@method('PUT')` or `@method('DELETE')` to spoof the HTTP method.

## CSRF Protection

Laravel automatically protects against **Cross-Site Request Forgery** attacks. Every POST form must include a CSRF token:

```blade
{{-- This is required in every POST form --}}
@csrf

{{-- Or manually --}}
<input type="hidden" name="_token" value="{{ csrf_token() }}">

{{-- For AJAX requests, include the token in headers --}}
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

## Validation — The Basics

### Validate in Controller

```php
use Illuminate\Http\Request;

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

If validation fails, Laravel **automatically redirects back** with:
- All input flashed to the session (available via `old()`)
- All validation errors available via `$errors`

### Stop on First Failure

```php
$request->validateWithBag('post', [
    'title' => 'required|string',
    'content' => 'required|string',
], stopOnFirstFailure: true);
```

## Validation Rules Reference

### String & Text Rules

| Rule | Description |
|------|-------------|
| `required` | Field must be present and not empty |
| `required_if:field,value` | Required if another field equals value |
| `required_unless:field,value` | Required unless another field equals value |
| `required_with:field` | Required if another field is present |
| `required_without:field` | Required if another field is not present |
| `string` | Must be a string |
| `email` | Must be a valid email |
| `url` | Must be a valid URL |
| `ip` | Must be a valid IP address |
| `max:255` | Maximum length of 255 |
| `min:10` | Minimum length of 10 |
| `alpha` | Only alphabetic characters |
| `alpha_num` | Only alphanumeric characters |
| `alpha_dash` | Alphanumeric, dashes, underscores |
| `regex:/pattern/` | Must match regex pattern |
| `starts_with:foo` | Must start with "foo" |
| `ends_with:bar` | Must end with "bar" |

### Number Rules

| Rule | Description |
|------|-------------|
| `integer` | Must be an integer |
| `numeric` | Must be numeric |
| `min:0` | Minimum value of 0 |
| `max:100` | Maximum value of 100 |
| `gt:field` | Greater than another field |
| `gte:field` | Greater than or equal |
| `lt:field` | Less than another field |
| `between:1,10` | Between 1 and 10 |

### Date Rules

| Rule | Description |
|------|-------------|
| `date` | Must be a valid date |
| `date_format:Y-m-d` | Must match format |
| `before:today` | Before today |
| `before_or_equal:today` | Before or equal to today |
| `after:start_date` | After another field |
| `after_or_equal:start_date` | After or equal |

### File Rules

| Rule | Description |
|------|-------------|
| `file` | Must be an uploaded file |
| `image` | Must be an image (jpg, png, gif, etc.) |
| `mimes:jpg,png,pdf` | Must have one of these extensions |
| `mimetypes:text/plain` | Must have this MIME type |
| `max:2048` | Max size in KB |
| `dimensions:min_width=100` | Image dimensions (for images) |

### Database Rules

| Rule | Description |
|------|-------------|
| `exists:table,column` | Must exist in the database |
| `unique:table,column` | Must be unique in the database |
| `exists:categories,id` | Must exist in categories table |

### Other Rules

| Rule | Description |
|------|-------------|
| `confirmed` | Must have a matching `field_confirmation` |
| `same:field` | Must match another field's value |
| `different:field` | Must be different from another field |
| `in:draft,published` | Must be one of the listed values |
| `not_in:admin,root` | Must not be one of the listed values |
| `nullable` | Can be empty/null |
| `sometimes` | Only validate if field is present |
| `array` | Must be a PHP array |
| `json` | Must be valid JSON |
| `boolean` | Must be true, false, 1, 0, "1", or "0" |

## Form Request Classes

For complex validation, extract to dedicated request classes:

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

    public function attributes(): array
    {
        return [
            'category_id' => 'category',
            'featured_image' => 'featured image',
        ];
    }
}
```

Use in controller:

```php
public function store(StorePostRequest $request): RedirectResponse
{
    // Validation has already passed!
    $validated = $request->validated();

    $post = auth()->user()->posts()->create($validated);

    return to_route('posts.show', $post);
}
```

### Unique Rule with Ignore (for Updates)

```php
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

## Custom Validation Rules

### Using Closures

```php
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

### Custom Rule Objects

```bash
php artisan make:rule StrongPassword
```

```php
// app/Rules/StrongPassword.php
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

```blade
{{-- Check if there are any errors --}}
@if($errors->any())
    <div class="alert alert-danger">
        <ul>
            @foreach($errors->all() as $error)
                <li>{{ $error }}</li>
            @endforeach
        </ul>
    </div>
@endif

{{-- Error for a specific field --}}
<input type="text" name="title" value="{{ old('title') }}">
@error('title')
    <span class="text-red-500 text-sm">{{ $message }}</span>
@enderror

{{-- Error bags (for multiple forms on one page) --}}
@if($errors->postForm->any())
    {{-- errors for the post form --}}
@endif
```

## Manual Validation

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

## Best Practices

1. **Always validate** — Never trust user input
2. **Use Form Requests** — For complex validation logic
3. **Use `@csrf`** — On every form to prevent CSRF attacks
4. **Use `old()`** — To repopulate forms after validation failure
5. **Use custom messages** — For user-friendly error messages
6. **Validate file uploads** — Always set `max` size and allowed types
7. **Use `Rule::unique()->ignore()`** — For unique validation on update
