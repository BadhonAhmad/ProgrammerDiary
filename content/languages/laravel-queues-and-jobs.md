---
title: "Laravel Queues & Jobs — Background Processing"
date: "2025-01-18"
tags: ["laravel", "queues", "jobs", "background", "php"]
excerpt: "Offload time-consuming tasks to background queues in Laravel — sending emails, processing images, generating reports, and more."
---

# Laravel Queues & Jobs — Background Processing

Queues allow you to **defer time-consuming tasks** — like sending emails, processing images, or generating PDFs — to be processed in the background, keeping your application fast and responsive.

## Configuration

```env
# .env — Queue driver
QUEUE_CONNECTION=database

# Options: sync (no queue), database, redis, sqs, beanstalkd
```

### Database Queue

```bash
php artisan queue:table
php artisan migrate
```

### Redis Queue (Recommended for Production)

```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Creating Jobs

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

```php
// In your job class
public function shouldQueue(): bool
{
    return $this->user->wants_notifications;
}
```

## Job Configuration

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

    // Don't retry — throw on failure
    public bool $failOnTimeout = true;

    // Delete if model no longer exists
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public User $user,
    ) {}
}
```

## Retrying Failed Jobs

```php
// In your job — determine retry delay
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

Keep your queue worker running with Supervisor:

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

Process a batch of jobs and track their progress:

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

1. **Use queues for slow tasks** — Emails, file processing, external API calls
2. **Set `tries` and `timeout`** — Prevent jobs from running forever
3. **Handle failures gracefully** — Use the `failed()` method
4. **Use Supervisor** — Keep workers running in production
5. **Monitor your queues** — Use Horizon (for Redis) or Laravel Pulse
6. **Use batches** — For processing multiple related jobs
7. **Keep jobs small and focused** — One responsibility per job
