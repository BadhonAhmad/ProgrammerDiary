---
title: "Laravel File Uploads & Storage"
date: "2025-01-13"
tags: ["laravel", "file-upload", "storage", "php"]
excerpt: "Handle file uploads in Laravel — configuration, uploading files, storage disks, file validation, and best practices for managing user uploads."
---

# Laravel File Uploads & Storage

Laravel provides a powerful filesystem abstraction via **Flysystem**, making it easy to store files locally, on Amazon S3, or other cloud storage — all with the same API.

## Storage Configuration

Configure storage disks in `config/filesystems.php` (or via `.env`):

```env
# Default disk
FILESYSTEM_DISK=local

# Amazon S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=my-bucket
```

```php
// config/filesystems.php
'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app'),
        'throw' => false,
    ],

    'public' => [
        'driver' => 'local',
        'root' => storage_path('app/public'),
        'url' => env('APP_URL').'/storage',
        'visibility' => 'public',
    ],

    's3' => [
        'driver' => 's3',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION'),
        'bucket' => env('AWS_BUCKET'),
    ],
],
```

### Creating the Storage Link

For the `public` disk to be accessible from the web:

```bash
php artisan storage:link
```

This creates a symlink: `public/storage` → `storage/app/public`

## Basic File Upload

### Controller

```php
use Illuminate\Http\Request;

public function store(Request $request)
{
    $request->validate([
        'avatar' => 'required|image|max:2048', // max 2MB
    ]);

    $path = $request->file('avatar')->store('avatars', 'public');

    // $path = "avatars/random-string.jpg"

    $user = $request->user();
    $user->avatar = $path;
    $user->save();

    return back()->with('success', 'Avatar uploaded!');
}
```

### Blade Form

```blade
<form method="POST" action="{{ route('avatar.store') }}" enctype="multipart/form-data">
    @csrf
    <input type="file" name="avatar" accept="image/*">
    @error('avatar')
        <span class="error">{{ $message }}</span>
    @enderror
    <button type="submit">Upload</button>
</form>
```

> **Important:** File upload forms must include `enctype="multipart/form-data"`.

## File Validation Rules

```php
$request->validate([
    // Basic file validation
    'document' => 'required|file',

    // Image validation
    'avatar' => 'required|image|max:2048',  // jpg, png, gif, svg, webp

    // Specific MIME types
    'resume' => 'required|mimes:pdf,doc,docx|max:5120',

    // MIME type by content (more secure)
    'file' => 'required|mimetypes:application/pdf,text/plain',

    // Image dimensions
    'cover' => 'required|image|dimensions:min_width=800,min_height=400,max_width=2000,max_height=1000',

    // Aspect ratio
    'photo' => 'image|dimensions:ratio=3/2',
]);

// Common file validation rules
'image'          // Must be an image file
'file'           // Must be a file upload
'mimes:pdf,doc'  // File extension must match
'mimetypes:...'  // MIME type must match
'max:2048'       // Max file size in KB
'dimensions:...' // Image dimension constraints
```

## The `store()` Method

```php
// Store with auto-generated filename
$path = $request->file('avatar')->store('avatars');
// → avatars/abc123def456.jpg

// Store on a specific disk
$path = $request->file('avatar')->store('avatars', 's3');

// Store with a custom filename
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->user()->id . '.jpg',
    'public'
);

// Store with original filename (not recommended — collisions!)
$path = $request->file('avatar')->storeAs(
    'avatars',
    $request->file('avatar')->getClientOriginalName(),
    'public'
);
```

## The Storage Facade

```php
use Illuminate\Support\Facades\Storage;

// Write a file
Storage::disk('public')->put('path/file.txt', $content);

// Read a file
$content = Storage::get('path/file.txt');

// Check if exists
Storage::disk('public')->exists('avatars/photo.jpg');

// Delete a file
Storage::disk('public')->delete('avatars/old-photo.jpg');

// Delete multiple files
Storage::delete(['file1.jpg', 'file2.jpg']);

// Copy / Move
Storage::copy('old/path.jpg', 'new/path.jpg');
Storage::move('old/path.jpg', 'new/path.jpg');

// Get file URL
$url = Storage::url('avatars/photo.jpg');
// → /storage/avatars/photo.jpg (for public disk)

// Get temporary URL (for S3)
$url = Storage::temporaryUrl('file.jpg', now()->addMinutes(5));

// Get file size
$size = Storage::size('path/file.txt');

// Get last modified time
$time = Storage::lastModified('path/file.txt');

// List files in a directory
$files = Storage::files('avatars');              // Files only
$files = Storage::allFiles('avatars');           // Files recursively
$dirs = Storage::directories('avatars');         // Directories only

// Create / Delete directory
Storage::makeDirectory('new-dir');
Storage::deleteDirectory('old-dir');
```

## Practical Example: Profile Avatar

```php
// app/Http/Controllers/ProfileController.php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048|dimensions:min_width=100,min_height=100',
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar && Storage::disk('public')->exists($user->avatar)) {
            Storage::disk('public')->delete($user->avatar);
        }

        // Store new avatar
        $path = $request->file('avatar')->store('avatars', 'public');

        // Update user record
        $user->update(['avatar' => $path]);

        return back()->with('success', 'Avatar updated successfully!');
    }
}
```

Display in Blade:

```blade
@if($user->avatar)
    <img src="{{ Storage::url($user->avatar) }}" alt="Avatar">
@else
    <img src="{{ asset('images/default-avatar.png') }}" alt="Default Avatar">
@endif
```

## Multiple File Uploads

```php
public function storeImages(Request $request)
{
    $request->validate([
        'images' => 'required|array|max:5',        // Max 5 files
        'images.*' => 'image|max:2048',             // Each file must be an image
    ]);

    $paths = [];
    foreach ($request->file('images') as $image) {
        $paths[] = $image->store('gallery', 'public');
    }

    $post->images()->createMany(
        collect($paths)->map(fn ($path) => ['path' => $path])
    );

    return back()->with('success', 'Images uploaded!');
}
```

```blade
<form method="POST" action="{{ route('images.store') }}" enctype="multipart/form-data">
    @csrf
    <input type="file" name="images[]" multiple accept="image/*">
    <button type="submit">Upload Images</button>
</form>
```

## Uploading to Amazon S3

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=my-laravel-bucket
```

```php
// Upload to S3
$path = $request->file('document')->store('documents', 's3');

// Get a temporary URL (secure, time-limited)
$url = Storage::disk('s3')->temporaryUrl($path, now()->addHour());

// Make file publicly accessible
Storage::disk('s3')->setVisibility($path, 'public');
$url = Storage::disk('s3')->url($path);
```

## Best Practices

1. **Always validate file types and sizes** — Never trust uploaded files
2. **Use the `public` disk** — For files that need web access
3. **Use `store()` over `storeAs()`** — Auto-generated names prevent collisions
4. **Delete old files** — When replacing uploads, delete the previous file
5. **Use cloud storage for production** — S3, etc. for scalability
6. **Set `enctype="multipart/form-data"`** — Required for file uploads in forms
7. **Don't trust client-side validation only** — Always validate server-side
8. **Use `Storage::url()`** — For generating URLs instead of hardcoding paths
