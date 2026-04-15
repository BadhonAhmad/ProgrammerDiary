---
title: "Laravel Eloquent Relationships — Complete Guide"
date: "2025-01-11"
tags: ["laravel", "eloquent", "relationships", "php", "database"]
excerpt: "Master all Eloquent relationship types — hasOne, hasMany, belongsTo, belongsToMany, polymorphic, and has-many-through with practical examples."
---

# Laravel Eloquent Relationships — Complete Guide

## Why Define Relationships in Code When Foreign Keys Already Exist in the Database?

This is a fair question. Your database already has a `user_id` column in the `posts` table, and it already has a foreign key constraint enforcing that relationship at the SQL level. So why write relationship methods on your Eloquent models?

The answer is that foreign keys tell the **database** how tables connect, but they do nothing to help your **PHP code** work with those connections. Without relationship methods, loading a post's author would look something like `$user = User::find($post->user_id)` — manual, error-prone, and scattered across your codebase. With a `belongsTo` relationship defined, you simply write `$post->user` and Eloquent handles the query for you. It also enables eager loading (`Post::with('user')->get()`), which solves the N+1 problem in a way that manual queries cannot. Relationship definitions also give you convenience methods like `$user->posts()->create([...])` which automatically sets the foreign key for you.

In short: foreign keys enforce integrity at the database level. Eloquent relationships make that integrity **usable** in your application code. They are not redundant — they serve a completely different purpose.

## The 7 Relationship Types

| Type | Method | Real-World Analogy |
|------|--------|---------|
| One to One | `hasOne` | A person has one passport |
| One to Many | `hasMany` | An author has many books |
| Belongs To | `belongsTo` | A book belongs to one author |
| Many to Many | `belongsToMany` | A student enrolls in many courses, a course has many students |
| Has Many Through | `hasManyThrough` | A country has many blog posts through its citizens |
| Polymorphic One | `morphOne` | A profile picture for a user OR a company |
| Polymorphic Many | `morphMany` | Comments on a blog post OR a YouTube video |

## One to One — When Something Belongs to Exactly One Other Thing

A one-to-one relationship models situations where a record in one table corresponds to exactly one record in another. Think of a user and their profile — every user has exactly one profile, and that profile belongs to only that user. You could put all the profile fields (bio, avatar, phone number) directly in the users table, but that leads to a bloated table with dozens of columns, many of which are NULL for most users. Splitting them into a separate table keeps things clean.

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

// withDefault() -- return empty model if no relationship exists
public function profile()
{
    return $this->hasOne(Profile::class)->withDefault([
        'bio' => 'No bio yet.',
    ]);
}
```

Compare this to the raw SQL equivalent: `SELECT * FROM profiles WHERE user_id = ?`. It works, but then you have to manually construct the Profile object, handle the case where no profile exists, and repeat this pattern everywhere you need a user's profile. The relationship method does all of that for you.

## One to Many — The Most Common Relationship

One-to-many is the workhorse of database relationships. A user writes many posts. A category contains many products. A playlist has many tracks. The parent table (users) does not store any reference to the child — instead, the child table (posts) holds a `user_id` foreign key pointing back to its parent. This is how relational databases are designed to work: the "many" side always holds the reference.

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

// Create a post for a user -- automatically sets user_id
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

### Belongs To -- Selecting a Specific Column

When you only need a few columns from the related model, you can optimize by specifying which ones to load.

```php
// Only load specific columns from the related model
public function user()
{
    return $this->belongsTo(User::class)->select(['id', 'name']);
}
```

## Many to Many and Pivot Tables — When Both Sides Have Many of Each Other

Many-to-many relationships are fundamentally different from the others because neither side can hold a simple foreign key. A post can have many tags, and a tag can belong to many posts. You cannot add a `tag_id` column to posts (because a post has multiple tags) and you cannot add a `post_id` column to tags (because a tag belongs to multiple posts). The solution is a **pivot table** — a third table that sits in the middle and stores the connections.

Think of it like a friendship. You cannot store "Alice's friends" as a single field on Alice's record, because she has many friends. And you cannot store "people who are friends with Bob" on Bob's record either. Instead, you need a separate list that says "Alice and Bob are friends," "Alice and Charlie are friends." That list is the pivot table.

```php
// Migration -- the pivot table
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

// Sync -- replace all tags (detach missing, attach new)
$post->tags()->sync([1, 2, 3]);

// Sync without detaching (only attach new ones)
$post->tags()->syncWithoutDetaching([4, 5]);

// Toggle (attach if not attached, detach if already attached)
$post->tags()->toggle([1, 2]);

// Check if relationship exists
$post->tags()->where('tag_id', 1)->exists();
```

### Pivot Tables with Extra Columns

Sometimes the connection itself needs to carry information. For example, a user enrolled in a course might have a `role` (student or teacher). This data does not belong on the user table or the course table — it belongs on the pivot table, because it describes the **relationship**, not either entity individually.

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

## Has Many Through — Reaching Two Tables Away

Sometimes you need to access records that are connected through an intermediate table. A country has many users, and those users have many posts. So a country has many posts — but they are connected **through** users. Writing the JOIN for this manually is messy. Eloquent's `hasManyThrough` handles it with a single method call.

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

## Polymorphic Relationships — When Something Can Belong to Different Types of Parents

This is where relationships get interesting. Consider a comment system. Users can leave comments on blog posts, but they can also leave comments on videos, on photos, on podcasts. Without polymorphic relationships, you would need a separate comments table for each content type: `post_comments`, `video_comments`, `photo_comments`. Each table has the exact same structure (body, author, timestamp) — the only difference is which type of content it belongs to. That is a lot of duplication.

Polymorphic relationships solve this by using two columns instead of one to track the parent: `commentable_id` (the ID of the parent) and `commentable_type` (the class name of the parent, like `App\Models\Post` or `App\Models\Video`). A single `comments` table can now serve every content type. When you access `$comment->commentable`, Eloquent looks at the `commentable_type` column, instantiates the correct model class, and returns it. One table, multiple parent types, zero duplication.

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

Comments can belong to Posts or Videos — the classic example.

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

Tags can be applied to Posts and Videos — the same tag table, the same tagging mechanism, but different content types.

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

This distinction trips up a lot of newcomers. Calling `$user->posts()` (method) returns the relationship query builder — you can chain more conditions onto it. Accessing `$user->posts` (property) executes the query immediately and returns the result as a Collection. Use the method when you want to add constraints. Use the property when you just want the data.

```php
// Method -- returns the relationship query builder (you can chain queries)
$user->posts()->where('status', 'published')->get();

// Property -- executes the query and returns the result (cached)
$user->posts;  // Collection
```

## Eager Loading Relationships

Every relationship type benefits from eager loading. Without it, looping through results and accessing relationships triggers a fresh query for each item. With eager loading, all related data is fetched in one or two queries upfront.

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

1. **Always eager load** -- Use `with()` to prevent N+1 queries
2. **Define inverse relationships** -- Always define both sides
3. **Use `withDefault()`** -- For optional relationships to avoid null checks
4. **Use pivot tables** -- For many-to-many with extra data
5. **Use `sync()`** -- For managing many-to-many relationships cleanly
6. **Constrain eager loading** -- Don't load more data than needed
7. **Use polymorphic** -- When a model can belong to multiple types of parents
