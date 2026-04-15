---
title: "Laravel Queues & Jobs — Background Processing"
date: "2025-01-18"
tags: ["laravel", "queues", "jobs", "background", "php"]
excerpt: "Offload time-consuming tasks to background queues in Laravel — sending emails, processing images, generating reports, and more."
---

# Laravel Queues & Jobs — Background Processing

Imagine a user uploads a profile photo. Behind the scenes, your app needs to resize it to five different dimensions, generate a thumbnail, upload everything to S3, and then send a confirmation email. If you do all of that inside your controller, the user sits there staring at a spinner for ten seconds. That is the problem queues solve. Instead of making the user wait for every slow task to finish, you hand the work off to a background process and respond immediately. The user gets an instant response, and the heavy lifting happens quietly behind the scenes.

A **job** is just a PHP class that represents one unit of work. It has a `handle()` method where you put the actual logic, and it implements `ShouldQueue`, which is Laravel's way of knowing "don't run this now, put it on the to-do list." The **queue** itself is just a storage mechanism -- it could be a database table, a Redis list, or an Amazon SQS queue. Workers are separate processes that constantly pull jobs off that list and execute them. Think of it like a restaurant kitchen: the waiter drops the order ticket on a rack (the queue), and the cooks (workers) pick up tickets and prepare the food. The waiter does not stand in the kitchen waiting for the meal to be cooked before taking the next customer's order.

## Configuration

```env
# .env -- Queue driver
QUEUE_CONNECTION=database

# Options: sync (no queue), database, redis, sqs, beanstalkd
```

### Database Queue

For local development or low-traffic apps, the database driver is the simplest option. It stores pending jobs in a database table, so there is nothing extra to install. The tradeoff is that reading from and writing to a database is slower than reading from an in-memory store like Redis, so it does not scale as well under heavy load.

```bash
php artisan queue:table
php artisan migrate
```

### Redis Queue (Recommended for Production)

Redis stores jobs in memory, which means reading and writing is extremely fast. If your app processes hundreds or thousands of jobs per minute, Redis will handle it without breaking a sweat. The database driver works fine for smaller apps, but Redis is the standard choice for anything serious.

```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Creating Jobs

A job class is straightforward. The constructor receives whatever data the job needs (a User model, a file path, an order ID), and the `handle()` method does the actual work. The `ShouldQueue` interface is the magic marker -- without it, Laravel runs the job immediately. With it, Laravel pushes the job onto the queue instead.

```bash
php artisan make:job ProcessPodcast
php artisan make:job SendWelcomeEmail
```

```php
// app/Jobs/SendWelcomeEmail.php
namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public User $user,
    ) {}

    public function handle(): void
    {
        Mail::to($this->user)->send(new WelcomeEmail($this->user));
    }
}
```

> **Note:** The `ShouldQueue` interface tells Laravel this job should be pushed to the queue instead of running synchronously.

## Dispatching Jobs

Dispatching a job means "add it to the queue." You can dispatch it immediately, with a delay, on a specific queue, or conditionally. The flexibility here is important because not all jobs are equal. A welcome email can wait a few seconds, but a payment processing job probably needs to run on a dedicated, high-priority queue so it does not get stuck behind 10,000 newsletter emails.

```php
use App\Jobs\SendWelcomeEmail;

// Dispatch a job
SendWelcomeEmail::dispatch($user);

// Dispatch with delay
SendWelcomeEmail::dispatch($user)->delay(now()->addMinutes(10));

// Dispatch to a specific queue
SendWelcomeEmail::dispatch($user)->onQueue('emails');

// Dispatch to a specific connection
SendWelcomeEmail::dispatch($user)->onConnection('redis');

// Dispatch only if a condition is true
SendWelcomeEmail::dispatchIf($user->subscribed, $user);

// Dispatch unless a condition is true
SendWelcomeEmail::dispatchUnless($user->already_welcomed, $user);

// Dispatch synchronously (bypass queue)
SendWelcomeEmail::dispatchSync($user);

// Dispatch after the response is sent to the browser
SendWelcomeEmail::dispatchAfterResponse($user);
```

### Conditional Dispatching

Sometimes you want to decide at the job level whether it should actually be queued. For example, a user who has disabled notifications should not clog up the queue with a job that will do nothing.

```php
// In your job class
public function shouldQueue(): bool
{
    return $this->user->wants_notifications;
}
```

## Job Configuration

Jobs fail. A third-party API goes down, a file gets deleted before the job runs, the database connection drops. That is why every job should declare how many times it can retry, how long it is allowed to run before being killed, and what to do when it gives up entirely. Without these settings, a broken job will either retry forever or fail silently, and neither of those is acceptable in production.

```php
class SendWelcomeEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Queue name
    public string $queue = 'emails';

    // Connection name
    public string $connection = 'redis';

    // Max attempts before failing
    public int $tries = 3;

    // Max exceptions before failing
    public int $maxExceptions = 3;

    // Timeout in seconds
    public int $timeout = 120;

    // Retry after (seconds)
    public int $backoff = 30;

    // Don't retry -- throw on failure
    public bool $failOnTimeout = true;

    // Delete if model no longer exists
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public User $user,
    ) {}
}
```

## Retrying Failed Jobs

The retry strategy matters more than most people think. If a job fails because an external API is temporarily down, retrying immediately will just fail again. Exponential backoff -- waiting longer between each retry -- gives the external service time to recover. And the `failed()` method is your last chance to do something useful: log the error, notify the team, or refund a customer.

```php
// In your job -- determine retry delay
public function backoff(): array
{
    return [30, 60, 120]; // 30s, 1min, 2min between retries
}

// Determine if the job should retry
public function retryUntil(): DateTime
{
    return now()->addHours(2); // Give up after 2 hours
}

// Handle a failure
public function failed(\Throwable $exception): void
{
    // Log, notify, or clean up
    Log::error("Welcome email failed for {$this->user->email}: {$exception->getMessage()}");
}
```

### Managing Failed Jobs

Laravel stores failed jobs in a database table so you can inspect them, understand what went wrong, and retry them manually. This is your safety net. Without it, failed jobs just disappear into the void.

```bash
# View failed jobs
php artisan queue:failed

# Retry a specific failed job
php artisan queue:retry 5

# Retry all failed jobs
php artisan queue:retry all

# Retry jobs from a specific queue
php artisan queue:retry --queue=emails

# Forget (delete) a failed job
php artisan queue:forget 5

# Flush all failed jobs
php artisan queue:flush
```

## Running the Queue Worker

You might be tempted to just run `php artisan queue:work` in a terminal window and call it a day. That works on your local machine, but in production it is a terrible idea. If the server restarts, the process dies and never comes back. If the worker hits a memory leak (which PHP is prone to over long-running processes), it slowly consumes all available RAM. Workers need to be managed by something that watches them, restarts them when they crash, and keeps them alive 24/7.

```bash
# Start processing jobs
php artisan queue:work

# Process a specific queue
php artisan queue:work --queue=emails,default

# Daemon mode (recommended for production)
php artisan queue:work --daemon

# Set memory limit
php artisan queue:work --memory=256

# Set timeout
php artisan queue:work --timeout=60

# Max jobs before restarting
php artisan queue:work --max-jobs=1000

# Process one job and exit
php artisan queue:work --once

# Listen for new jobs (less efficient, restarts framework each time)
php artisan queue:listen
```

### Supervisor (Production)

Supervisor is a process monitor for Linux. Its only job is to make sure your queue worker stays running. If the worker crashes, Supervisor restarts it within seconds. If the server reboots, Supervisor starts the worker automatically. You configure it once and then you never think about it again. Without Supervisor (or something like it), your queues will eventually stop working and you will not know until users start complaining.

```ini
# /etc/supervisor/conf.d/laravel-worker.conf
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/user/my-app/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
redirect_stderr=true
stdout_logfile=/home/user/my-app/storage/logs/worker.log
stopwaitsecs=3600
```

## Job Batching

Sometimes you have a group of related jobs that need to be tracked together. Think of importing a CSV file with 1,000 rows: each row becomes a separate job, but you want to know when all 1,000 are done, how many failed, and show a progress bar to the user. Job batching gives you exactly that. It groups jobs together, tracks progress, and lets you run callbacks when the entire batch succeeds, when the first job fails, or when everything finishes regardless of outcome.

```bash
composer require laravel/batch
php artisan migrate
```

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ProcessPodcast(Podcast::find(1)),
    new ProcessPodcast(Podcast::find(2)),
    new ProcessPodcast(Podcast::find(3)),
])->then(function (Batch $batch) {
    // All jobs completed successfully
})->catch(function (Batch $batch, Throwable $e) {
    // First job failure
})->finally(function (Batch $batch) {
    // Always runs
})->name('Process Podcasts')->dispatch();

// Check batch progress
$batch->progress();     // 0-100
$batch->pendingJobs;    // Remaining
$batch->processedJobs;  // Completed
$batch->failedJobs;     // Failed
$batch->totalJobs;      // Total
$batch->finished();     // true/false
```

## Practical Examples

### Image Processing Job

This is the classic queue use case. Image manipulation is CPU-intensive and slow. Doing it synchronously means every user who uploads a photo waits several seconds for the response. With a queued job, the upload completes instantly, and the resizing happens in the background. The user sees a placeholder image for a few seconds, then the processed images appear.

```php
class ProcessImageUpload implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 300;

    public function __construct(
        public string $imagePath,
    ) {}

    public function handle(): void
    {
        $image = Image::make(Storage::path($this->imagePath));

        // Create thumbnail
        $image->fit(300, 300);
        Storage::put('thumbnails/' . basename($this->imagePath), $image->encode());

        // Create medium size
        $image = Image::make(Storage::path($this->imagePath));
        $image->resize(800, null, fn ($constraint) => $constraint->aspectRatio());
        Storage::put('medium/' . basename($this->imagePath), $image->encode());
    }
}
```

### Send Notification Job

```php
class SendWeeklyNewsletter implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $subscribers = User::where('subscribed', true)->get();

        foreach ($subscribers as $user) {
            Mail::to($user)->send(new WeeklyNewsletter($user));
        }
    }
}

// Schedule weekly
// app/Console/Kernel.php
protected function schedule(Schedule $schedule): void
{
    $schedule->job(new SendWeeklyNewsletter)->weekly()->mondays()->at('09:00');
}
```

## Best Practices

1. **Use queues for slow tasks** -- Emails, file processing, external API calls
2. **Set `tries` and `timeout`** -- Prevent jobs from running forever
3. **Handle failures gracefully** -- Use the `failed()` method
4. **Use Supervisor** -- Keep workers running in production
5. **Monitor your queues** -- Use Horizon (for Redis) or Laravel pulse
6. **Use batches** -- For processing multiple related jobs
7. **Keep jobs small and focused** -- One responsibility per job
