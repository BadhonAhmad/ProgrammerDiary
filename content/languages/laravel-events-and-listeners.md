---
title: "Laravel Events & Listeners — Observer Pattern"
date: "2025-01-19"
tags: ["laravel", "events", "listeners", "observer", "php"]
excerpt: "Decouple your Laravel application using the Event-Listener pattern — fire events when things happen and react with listeners."
---

# Laravel Events & Listeners — Observer Pattern

Picture a user registering on your app. The moment they sign up, five things need to happen: send a welcome email, create their profile, notify the admin on Slack, track the signup in analytics, and enqueue a data import from their invited friends. If you write all of that in one controller method, you end up with a 50-line function that knows about emails, profiles, Slack, analytics, and friend imports. Every time you need to add a new side effect (say, awarding a referral bonus), you open that controller and modify it. That controller becomes a magnet for bugs because changing any one of those concerns risks breaking the others.

Events solve this by inverting the dependency. The controller does one thing: creates the user and fires a `UserRegistered` event. It does not know or care what happens next. Each side effect lives in its own listener class -- one for the email, one for the profile, one for Slack, one for analytics. When you need to add the referral bonus, you create a new listener and register it. The controller never changes. This is the **Observer pattern** in plain English: something happens, and anyone who cares about it gets notified without the thing that happened needing to know who is listening.

The result is code that is easier to maintain, easier to test, and easier to extend. Each listener can be tested in isolation. Slow listeners (like sending a Slack notification) can be queued so they run in the background. And the registration controller stays short and focused on its single responsibility.

## Why Events?

Without events, your code gets tangled -- every new requirement means editing the same method over and over:

```php
// BAD -- everything coupled together
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

With events, each concern is isolated. The controller stays clean, and new behavior is just a new listener:

```php
// GOOD -- fire event, let listeners handle it
public function register(Request $request)
{
    $user = User::create($request->validated());
    event(new UserRegistered($user));
    // That's it. Listeners handle the rest.
}
```

## Creating Events & Listeners

An event is a simple class that holds data. A listener is a class with a `handle()` method that receives the event and does something with it. They are connected through the `EventServiceProvider`, which is essentially a directory that maps "when this event fires, run these listeners."

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

The `$listen` array in `EventServiceProvider` is the wiring. The keys are event classes and the values are arrays of listener classes. When `UserRegistered` fires, Laravel instantiates each listener and calls its `handle()` method in order. This is your single source of truth for "what happens when a user registers."

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

An event class is deliberately simple. It just carries data. Notice there is no logic here -- the event does not know what will happen when it fires. It is just a messenger with a payload.

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

Each listener does exactly one thing. `SendWelcomeEmail` sends an email. `CreateUserProfile` creates a profile. They are small, testable, and replaceable. If you need to change how welcome emails work, you open one file. You do not have to dig through a massive controller wondering if changing this line will break the analytics tracking.

Some listeners implement `ShouldQueue`, which means they run on a queue instead of blocking the request. This is important for slow operations like sending Slack notifications or calling external APIs. The user should not wait for a Slack message to be delivered before seeing the "registration successful" page.

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

You have three ways to fire an event, and they all do the same thing. The `event()` helper is the most concise. The `Event::dispatch()` facade is more explicit. And calling `dispatch()` directly on the event class is the most self-documenting. Pick one style and stick with it.

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

Eloquent models fire their own set of events automatically as they go through their lifecycle -- when a record is created, updated, deleted, or restored. These are different from custom events because they are baked into the framework. You do not fire them manually; Eloquent does it for you. This is incredibly useful for things like auto-generating slugs, syncing search indexes, or cleaning up related files when a record is deleted.

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

You can hook into model events directly inside the model using the `booted()` method. This is fine for one or two simple hooks, but it has a problem: the model class itself starts accumulating event logic. A `Post` model might end up with slug generation, search index syncing, cache clearing, and notification logic all stuffed into `booted()`. That is when you should reach for Observers instead.

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

An Observer is a dedicated class that groups all the event hooks for a single model. Instead of putting five closures inside `booted()`, you create a `PostObserver` class with clearly named methods: `creating()`, `updated()`, `deleted()`, and so on. Each method handles one lifecycle event. This keeps the model clean and makes the observer easy to test. The observer is the same concept as listeners for custom events, but specifically tailored to Eloquent's model lifecycle.

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

A subscriber is a single class that listens to multiple events. This is useful when one conceptual area of your app needs to react to several different events. For example, a `UserEventSubscriber` might listen to `Login`, `Logout`, `PasswordReset`, and `UserVerified` events, centralizing all user-related event handling in one place.

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

1. **Use events to decouple code** -- Don't chain responsibilities in controllers
2. **Queue slow listeners** -- Implement `ShouldQueue` for slow operations
3. **Use observers for model logic** -- Group model events cleanly
4. **Keep listeners focused** -- One responsibility per listener
5. **Use `isDirty()` and `wasChanged()`** -- To detect attribute changes in model events
6. **Name events descriptively** -- `UserRegistered`, `OrderShipped`, `PostPublished`
