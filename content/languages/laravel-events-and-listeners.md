---
title: "Laravel Events & Listeners — Observer Pattern"
date: "2025-01-19"
tags: ["laravel", "events", "listeners", "observer", "php"]
excerpt: "Decouple your Laravel application using the Event-Listener pattern — fire events when things happen and react with listeners."
---

# Laravel Events & Listeners — Observer Pattern

Events provide a simple **observer pattern** implementation. They let you subscribe to and listen for events that occur in your application, keeping your code **decoupled and maintainable**.

## Why Events?

Without events, your code gets tangled:

```php
// BAD — everything coupled together
public function register(Request $request)
{
    $user = User::create($request->validated());
    Mail::to($user)->send(new WelcomeEmail());     // Email
    $user->profile()->create([]);                   // Profile
    Slack::notify("New user: {$user->name}");       // Notification
    Analytics::track('user_registered');             // Analytics
    // Adding more? Keep editing this method...
}
```

With events, each concern is isolated:

```php
// GOOD — fire event, let listeners handle it
public function register(Request $request)
{
    $user = User::create($request->validated());
    event(new UserRegistered($user));
    // That's it. Listeners handle the rest.
}
```

## Creating Events & Listeners

```bash
# Create event
php artisan make:event UserRegistered

# Create listener
php artisan make:listener SendWelcomeEmail --event=UserRegistered
php artisan make:listener CreateUserProfile --event=UserRegistered

# Generate from EventServiceProvider
# Add events/listeners, then run:
php artisan event:generate
```

## Registering Events & Listeners

```php
// app/Providers/EventServiceProvider.php
namespace App\Providers;

use App\Events\UserRegistered;
use App\Listeners\SendWelcomeEmail;
use App\Listeners\CreateUserProfile;
use App\Listeners\NotifyAdminViaSlack;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        UserRegistered::class => [
            SendWelcomeEmail::class,
            CreateUserProfile::class,
            NotifyAdminViaSlack::class,
        ],

        \App\Events\PostPublished::class => [
            \App\Listeners\NotifySubscribers::class,
            \App\Listeners\UpdateSearchIndex::class,
            \App\Listeners\GenerateSocialMediaPost::class,
        ],
    ];
}
```

## Event Class

```php
// app/Events/UserRegistered.php
namespace App\Events;

use App\Models\User;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserRegistered
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public User $user,
    ) {}
}
```

## Listener Classes

```php
// app/Listeners/SendWelcomeEmail.php
namespace App\Listeners;

use App\Events\UserRegistered;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeEmail;

class SendWelcomeEmail
{
    public function handle(UserRegistered $event): void
    {
        Mail::to($event->user)->send(new WelcomeEmail($event->user));
    }
}

// app/Listeners/CreateUserProfile.php
namespace App\Listeners;

use App\Events\UserRegistered;

class CreateUserProfile
{
    public function handle(UserRegistered $event): void
    {
        $event->user->profile()->create([
            'bio' => 'New member',
            'avatar' => 'default-avatar.png',
        ]);
    }
}

// Queued listener (runs in background)
namespace App\Listeners;

use App\Events\UserRegistered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class NotifyAdminViaSlack implements ShouldQueue
{
    use InteractsWithQueue;

    public function handle(UserRegistered $event): void
    {
        // Send Slack notification (slow, so we queue it)
        // Slack::notify("New user: {$event->user->name}");
    }
}
```

## Dispatching Events

```php
use App\Events\UserRegistered;
use App\Events\PostPublished;

// Method 1: event() helper
event(new UserRegistered($user));

// Method 2: Event facade
use Illuminate\Support\Facades\Event;
Event::dispatch(new UserRegistered($user));

// Method 3: Using the event's dispatch method
UserRegistered::dispatch($user);
```

## Eloquent Model Events

Eloquent models fire events automatically throughout their lifecycle:

| Event | When It Fires |
|-------|---------------|
| `retrieved` | After fetching from database |
| `creating` | Before creating (first time) |
| `created` | After creating |
| `updating` | Before updating |
| `updated` | After updating |
| `saving` | Before creating or updating |
| `saved` | After creating or updating |
| `deleting` | Before deleting |
| `deleted` | After deleting |
| `restoring` | Before restoring soft delete |
| `restored` | After restoring soft delete |
| `replicating` | When replicating a model |

### Using Model Events

```php
// app/Models/Post.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected static function booted(): void
    {
        // Auto-generate slug when creating
        static::creating(function (Post $post) {
            $post->slug = Str::slug($post->title);
        });

        // Log when a post is published
        static::updated(function (Post $post) {
            if ($post->isDirty('status') && $post->status === 'published') {
                event(new PostPublished($post));
            }
        });

        // Delete associated images when post is deleted
        static::deleting(function (Post $post) {
            foreach ($post->images as $image) {
                Storage::delete($image->path);
            }
        });
    }
}
```

### Eloquent Observers

Observers group all model event logic into a single class:

```bash
php artisan make:observer PostObserver --model=Post
```

```php
// app/Observers/PostObserver.php
namespace App\Observers;

use App\Models\Post;
use Illuminate\Support\Str;

class PostObserver
{
    public function creating(Post $post): void
    {
        $post->slug = Str::slug($post->title);
    }

    public function created(Post $post): void
    {
        // Log activity
        activity()->log("Post '{$post->title}' was created");
    }

    public function updating(Post $post): void
    {
        if ($post->isDirty('title')) {
            $post->slug = Str::slug($post->title);
        }
    }

    public function updated(Post $post): void
    {
        if ($post->wasChanged('status') && $post->status === 'published') {
            event(new PostPublished($post));
        }
    }

    public function deleted(Post $post): void
    {
        // Clean up related resources
        $post->images->each->delete();
    }

    public function restored(Post $post): void
    {
        //
    }

    public function forceDeleted(Post $post): void
    {
        $post->images()->forceDelete();
    }
}
```

Register the observer:

```php
// App\Providers\EventServiceProvider
public function boot(): void
{
    Post::observe(PostObserver::class);
}

// Or in App\Providers\AppServiceProvider
use App\Models\Post;
use App\Observers\PostObserver;

public function boot(): void
{
    Post::observe(PostObserver::class);
}
```

## Event Subscribers

A subscriber can listen to multiple events in one class:

```php
// app/Listeners/UserEventSubscriber.php
namespace App\Listeners;

use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Events\Dispatcher;

class UserEventSubscriber
{
    public function handleUserLogin(Login $event): void
    {
        // Log last login
        $event->user->update(['last_login_at' => now()]);
    }

    public function handleUserLogout(Logout $event): void
    {
        // Clear sessions, etc.
    }

    public function subscribe(Dispatcher $events): array
    {
        return [
            Login::class => 'handleUserLogin',
            Logout::class => 'handleUserLogout',
        ];
    }
}
```

```php
// Register in EventServiceProvider
protected $subscribe = [
    UserEventSubscriber::class,
];
```

## Best Practices

1. **Use events to decouple code** — Don't chain responsibilities in controllers
2. **Queue slow listeners** — Implement `ShouldQueue` for slow operations
3. **Use observers for model logic** — Group model events cleanly
4. **Keep listeners focused** — One responsibility per listener
5. **Use `isDirty()` and `wasChanged()`** — To detect attribute changes in model events
6. **Name events descriptively** — `UserRegistered`, `OrderShipped`, `PostPublished`
