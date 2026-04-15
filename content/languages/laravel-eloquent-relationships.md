---
title: "Laravel Eloquent Relationships — Complete Guide"
date: "2025-01-11"
tags: ["laravel", "eloquent", "relationships", "php", "database"]
excerpt: "Master all Eloquent relationship types — hasOne, hasMany, belongsTo, belongsToMany, polymorphic, and has-many-through with practical examples."
---

# Laravel Eloquent Relationships — Complete Guide

Relationships define how your models connect to each other. Eloquent provides expressive methods to define and query these relationships.

## The 7 Relationship Types

| Type | Method | Example |
|------|--------|---------|
| One to One | `hasOne` | User has one Profile |
| One to Many | `hasMany` | User has many Posts |
| Belongs To | `belongsTo` | Post belongs to User |
| Many to Many | `belongsToMany` | Post has many Tags |
| Has Many Through | `hasManyThrough` | Country has many Posts through User |
| Polymorphic One | `morphOne` | Image for Post or User |
| Polymorphic Many | `morphMany` | Comments on Post or Video |

## One to One

A User has exactly one Profile.

```php
// Migration
Schema::create('profiles', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('bio')->nullable();
    $table->string('avatar')->nullable();
    $table->timestamps();
});

// app/Models/User.php
public function profile()
{
    return $this->hasOne(Profile::class);
}

// app/Models/Profile.php
public function user()
{
    return $this->belongsTo(User::class);
}
```

Usage:

```php
$user->profile;              // Get the profile
$user->profile->bio;         // Access profile attributes
$user->profile()->create([   // Create related profile
    'bio' => 'Hello!',
]);

// withDefault() — return empty model if no relationship exists
public function profile()
{
    return $this->hasOne(Profile::class)->withDefault([
        'bio' => 'No bio yet.',
    ]);
}
```

## One to Many (hasMany)

A User has many Posts.

```php
// app/Models/User.php
public function posts()
{
    return $this->hasMany(Post::class);
}

// app/Models/Post.php
public function user()
{
    return $this->belongsTo(User::class);
}
```

Usage:

```php
// Get all posts by a user
$user->posts;
$user->posts()->where('status', 'published')->get();
$user->posts()->count();

// Create a post for a user
$user->posts()->create([
    'title' => 'New Post',
    'content' => 'Content...',
]);

// Save a post model
$post = new Post(['title' => 'My Post']);
$user->posts()->save($post);

// From the child side
$post->user;            // Get the user
$post->user->name;      // Access user attributes
$post->user()->associate($anotherUser);  // Change the user
$post->save();
```

### Belongs To — Selecting a Specific Column

```php
// Only load specific columns from the related model
public function user()
{
    return $this->belongsTo(User::class)->select(['id', 'name']);
}
```

## Many to Many (belongsToMany)

Posts have many Tags, and Tags belong to many Posts. This requires a **pivot table**.

```php
// Migration — the pivot table
Schema::create('post_tag', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->primary(['post_id', 'tag_id']);  // Composite primary key
    $table->timestamps();
});

// app/Models/Post.php
public function tags()
{
    return $this->belongsToMany(Tag::class);
}

// app/Models/Tag.php
public function posts()
{
    return $this->belongsToMany(Post::class);
}
```

Usage:

```php
// Attach tags to a post
$post->tags()->attach([1, 2, 3]);
$post->tags()->attach($tag);              // Single tag
$post->tags()->attach([1 => ['order' => 1], 2 => ['order' => 2]]); // With pivot data

// Detach tags
$post->tags()->detach([1, 2]);            // Remove specific tags
$post->tags()->detach();                  // Remove all tags

// Sync — replace all tags (detach missing, attach new)
$post->tags()->sync([1, 2, 3]);

// Sync without detaching (only attach new ones)
$post->tags()->syncWithoutDetaching([4, 5]);

// Toggle (attach if not attached, detach if already attached)
$post->tags()->toggle([1, 2]);

// Check if relationship exists
$post->tags()->where('tag_id', 1)->exists();
```

### Pivot Tables with Extra Columns

```php
Schema::create('post_tag', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained()->cascadeOnDelete();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->string('role')->default('general'); // Extra column
    $table->timestamps();
});

// Define with pivot columns
public function tags()
{
    return $this->belongsToMany(Tag::class)
                ->withPivot('role')
                ->withTimestamps();
}

// Access pivot data
foreach ($post->tags as $tag) {
    echo $tag->pivot->role;
    echo $tag->pivot->created_at;
}

// Update pivot data
$post->tags()->updateExistingPivot($tagId, ['role' => 'primary']);
```

## Has Many Through

A Country has many Posts through Users.

```php
// app/Models/Country.php
public function posts()
{
    return $this->hasManyThrough(Post::class, User::class);
}

// Custom keys if non-standard
public function posts()
{
    return $this->hasManyThrough(
        Post::class,       // Final model
        User::class,       // Intermediate model
        'country_id',      // Foreign key on users table
        'user_id',         // Foreign key on posts table
        'id',              // Local key on countries table
        'id'               // Local key on users table
    );
}
```

```php
$country->posts;  // All posts from users in this country
```

## Polymorphic Relationships

Polymorphic relationships allow a model to belong to **more than one type** of parent model.

### One to One Polymorphic

A Profile can belong to either a User or an Admin.

```php
// Migration
Schema::create('profiles', function (Blueprint $table) {
    $table->id();
    $table->morphs('profileable');  // Creates profileable_id + profileable_type
    $table->string('bio');
    $table->timestamps();
});

// app/Models/Profile.php
public function profileable()
{
    return $this->morphTo();
}

// app/Models/User.php
public function profile()
{
    return $this->morphOne(Profile::class, 'profileable');
}

// app/Models/Admin.php
public function profile()
{
    return $this->morphOne(Profile::class, 'profileable');
}
```

```php
$user->profile;           // Get user's profile
$profile->profileable;    // Get the parent (User or Admin)
```

### One to Many Polymorphic

Comments can belong to Posts or Videos.

```php
// Migration
Schema::create('comments', function (Blueprint $table) {
    $table->id();
    $table->morphs('commentable');  // commentable_id, commentable_type
    $table->text('body');
    $table->string('author_name');
    $table->timestamps();
});

// app/Models/Comment.php
public function commentable()
{
    return $this->morphTo();
}

// app/Models/Post.php
public function comments()
{
    return $this->morphMany(Comment::class, 'commentable');
}

// app/Models/Video.php
public function comments()
{
    return $this->morphMany(Comment::class, 'commentable');
}
```

```php
// Add a comment to a post
$post->comments()->create([
    'body' => 'Great post!',
    'author_name' => 'John',
]);

// Get all comments on a post
$post->comments;

// Get the parent model from a comment
$comment->commentable;  // Returns Post or Video instance

// Query polymorphic relationships
$comments = Comment::where('commentable_type', Post::class)->get();
```

### Many to Many Polymorphic

Tags can be applied to Posts and Videos.

```php
// Migration
Schema::create('tags', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->timestamps();
});

Schema::create('taggables', function (Blueprint $table) {
    $table->id();
    $table->foreignId('tag_id')->constrained()->cascadeOnDelete();
    $table->morphs('taggable');  // taggable_id, taggable_type
    $table->timestamps();
});

// app/Models/Tag.php
public function posts()
{
    return $this->morphedByMany(Post::class, 'taggable');
}

public function videos()
{
    return $this->morphedByMany(Video::class, 'taggable');
}

// app/Models/Post.php
public function tags()
{
    return $this->morphToMany(Tag::class, 'taggable');
}
```

```php
// Tag a post
$post->tags()->attach([1, 2, 3]);

// Get all tags for a post
$post->tags;

// Get all posts with a specific tag
$tag->posts;
```

## Relationship Methods vs Properties

```php
// Method — returns the relationship query builder (you can chain queries)
$user->posts()->where('status', 'published')->get();

// Property — executes the query and returns the result (cached)
$user->posts;  // Collection
```

## Eager Loading Relationships

```php
// Load relationships when querying (prevents N+1)
$posts = Post::with('user')->get();

// Multiple relationships
$posts = Post::with(['user', 'category', 'tags'])->get();

// Nested relationships
$posts = Post::with('user.profile')->get();

// Constrained eager loading
$posts = Post::with(['comments' => function ($query) {
    $query->where('approved', true)->latest();
}])->get();

// Lazy eager loading
$posts = Post::all();
$posts->load('user', 'tags');

// Load only if not already loaded
$posts->loadMissing('user');
```

## Best Practices

1. **Always eager load** — Use `with()` to prevent N+1 queries
2. **Define inverse relationships** — Always define both sides
3. **Use `withDefault()`** — For optional relationships to avoid null checks
4. **Use pivot tables** — For many-to-many with extra data
5. **Use `sync()`** — For managing many-to-many relationships cleanly
6. **Constrain eager loading** — Don't load more data than needed
7. **Use polymorphic** — When a model can belong to multiple types of parents
