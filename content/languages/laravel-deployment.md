---
title: "Laravel Deployment & Best Practices"
date: "2025-01-22"
tags: ["laravel", "deployment", "production", "server", "php"]
excerpt: "Deploy Laravel to production with confidence — server setup, environment configuration, optimization, monitoring, and security best practices."
---

# Laravel Deployment & Best Practices

Deployment is the moment of truth. Everything worked perfectly on your laptop -- you had `APP_DEBUG=true`, your database was SQLite, your queue driver was `sync`, and your cache was the `file` driver. Now you are pushing to a real server where strangers will use your app, and everything that was convenient in development becomes a liability. Debug mode leaks stack traces with your database credentials. The file cache driver cannot handle concurrent requests. The `sync` queue driver blocks every HTTP request while emails are being sent. Deployment is scary because the gap between "works on my machine" and "works in production" is where most surprises live.

The key difference between development and production is that **in development, convenience matters most, and in production, performance, security, and reliability matter most.** In development you want verbose errors, auto-reloading, and zero optimization. In production you want errors hidden from users, cached routes and config, minimal logging, and processes that restart themselves when they crash. Every choice in this guide exists because someone learned the hard way what happens when you skip it.

## Pre-Deployment Checklist

Before deploying, run through this checklist. Every item exists because skipping it has caused real production incidents.

```bash
# 1. Run all tests
php artisan test

# 2. Check for debug mode (should be false in production)
# APP_DEBUG=false in .env

# 3. Optimize autoloader (no dev dependencies)
composer install --optimize-autoloader --no-dev

# 4. Run optimizations
php artisan optimize
```

## Server Requirements

- **PHP >= 8.2** (Laravel 11)
- **Extensions:** BCMath, Ctype, cURL, DOM, Fileinfo, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML
- **Web server:** Nginx (recommended) or Apache
- **Database:** MySQL 8+ / PostgreSQL 12+ / SQLite
- **Redis** (recommended for cache/queues)

## Nginx Configuration

Why Nginx instead of having PHP serve requests directly? Nginx is a **reverse proxy** -- it sits in front of PHP-FPM and handles the things PHP is bad at: serving static files (images, CSS, JS), managing SSL/TLS, buffering slow clients, and handling concurrent connections efficiently. PHP-FPM handles the dynamic requests that actually need PHP code to execute. The `try_files` directive is the most important line in this config: it tells Nginx to look for a static file first, then a directory, and if neither exists, pass the request to `index.php` (which is Laravel's entry point). This is how Laravel's routing works -- every URL that does not match a physical file gets handled by Laravel.

```nginx
server {
    listen 80;
    server_name example.com;
    root /home/forge/example.com/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## Environment Configuration

The production `.env` file is fundamentally different from your local one. `APP_DEBUG=false` is the single most important setting -- with it set to `true`, any error page will show your database credentials, API keys, and application internals to anyone who triggers an error. The cache, queue, and session drivers all switch to Redis because the file and database drivers cannot handle production traffic. Log level is set to `warning` to avoid filling up your disk with debug messages.

```env
# .env (Production)
APP_NAME="My App"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false                          # NEVER true in production
APP_URL=https://example.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=production_db
DB_USERNAME=app_user
DB_PASSWORD=strong-random-password

CACHE_STORE=redis                        # Use Redis
QUEUE_CONNECTION=redis                   # Use Redis for queues
SESSION_DRIVER=redis                     # Use Redis for sessions

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

LOG_CHANNEL=daily                        # Daily log rotation
LOG_LEVEL=warning                        # Only warnings and above
```

## Optimization Commands

Laravel does a lot of work on every request in development: scanning route files, reading config files, compiling Blade templates. In production, you can pre-compute all of this so every request skips those steps. `php artisan optimize` does all of it in one command. Run it after every deployment.

```bash
# Cache config
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Cache events
php artisan event:cache

# Run all optimizations at once
php artisan optimize

# Optimize Composer autoloader
composer install --optimize-autoloader --no-dev

# Install frontend assets
npm ci && npm run build
```

## Database Migration

The `--force` flag is required in production because Laravel normally asks "are you sure?" before running migrations, and in an automated deployment pipeline there is no human to answer that question.

```bash
# Run migrations
php artisan migrate --force

# The --force flag is required in production to prevent accidental runs
```

## Deployment Methods

### Method 1: Laravel Forge (Easiest)

Forge is a server management tool created by the Laravel team. It provisions servers, configures Nginx, installs SSL certificates, and handles deployments automatically. You connect your GitHub repository, configure the deployment script, and enable "Quick Deploy" -- every push to `main` triggers a deployment. Forge is not free, but the time it saves is significant, especially if you are not a sysadmin.

Default Forge deployment script:

```bash
cd /home/forge/example.com
git pull origin main
composer install --no-interaction --prefer-dist --optimize-autoloader
php artisan migrate --force
php artisan optimize
npm ci && npm run build
(php artisan queue:restart &) 2>/dev/null
echo "Deployment complete!"
```

### Method 2: Laravel Vapor (Serverless)

Vapor deploys your Laravel app to AWS Lambda, which means you do not manage servers at all. It auto-scales, you pay only for what you use, and deployment is a single command. The tradeoff is that serverless has constraints: long-running processes do not work the same way, cold starts add latency, and debugging is harder.

```bash
composer require laravel/vapor-cli
vapor login
vapor deploy production
```

### Method 3: Manual Deployment (VPS)

Manual deployment means SSH-ing into your server and running commands. It works, but it is error-prone. You forget to run migrations, or you run them twice, or you forget to clear the cache. Every step is a chance to make a mistake. This is fine for learning, but for anything serious you should automate it.

```bash
# SSH into your server
ssh user@your-server

# Pull latest code
cd /home/user/my-app
git pull origin main

# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Run migrations
php artisan migrate --force

# Optimize
php artisan optimize

# Restart queue workers
php artisan queue:restart

# Clear any caches that might be stale
php artisan optimize:clear && php artisan optimize
```

### Method 4: GitHub Actions CI/CD

CI/CD (Continuous Integration / Continuous Deployment) is the professional approach. Every time you push code, a pipeline runs automatically: install dependencies, run tests, and if everything passes, deploy to the server. The key benefit is that a broken test or a failing build never reaches production. The deployment only happens if the tests pass. This is the difference between "deploy and hope" and "deploy with confidence."

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
          extensions: mbstring, xml, mysql

      - name: Install Dependencies
        run: composer install --optimize-autoloader --no-dev

      - name: Run Tests
        run: php artisan test

      - name: Deploy to Server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /home/user/my-app
            git pull origin main
            composer install --optimize-autoloader --no-dev
            php artisan migrate --force
            php artisan optimize
            npm ci && npm run build
            php artisan queue:restart
```

## Queue Workers in Production

As discussed in the Queues guide, you cannot just run `php artisan queue:work` in a terminal and walk away. Supervisor is a process monitor that keeps your queue workers alive. If a worker crashes (memory limit, unhandled exception, server restart), Supervisor brings it back up within seconds. `numprocs=2` means Supervisor runs two worker processes simultaneously, so your queues can process jobs in parallel.

```bash
# Install Supervisor
sudo apt install supervisor

# Create config
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /home/user/my-app/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
redirect_stderr=true
stdout_logfile=/home/user/my-app/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start laravel-worker:*
```

## Scheduled Tasks (Cron)

Laravel's task scheduler is a replacement for the traditional crontab with a dozen entries. Instead of managing multiple cron jobs, you add a single cron entry that triggers Laravel's scheduler every minute, and then you define all your scheduled tasks in PHP code. The scheduler is more expressive, easier to version-control, and keeps all timing logic in one place.

```bash
# Add to crontab
* * * * * cd /home/user/my-app && php artisan schedule:run >> /dev/null 2>&1
```

Laravel's scheduler handles the rest:

```php
// routes/console.php or app/Console/Kernel.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('emails:send')->dailyAt('08:00');
Schedule->job(new SendWeeklyNewsletter)->weekly()->mondays();
Schedule->command('telescope:prune')->daily();
```

## Security Best Practices

### 1. APP_DEBUG Must Be False

This deserves repeating because it is the most common and most dangerous mistake. With debug mode on, Laravel displays full stack traces that include environment variables, database queries, and application code. An attacker can deliberately trigger an error to see all of this.

```env
APP_DEBUG=false  # ALWAYS in production
```

### 2. Use HTTPS

HTTPS is not optional. Without it, every piece of data traveling between the user and your server -- passwords, session cookies, personal information -- is sent in plain text that anyone on the network can read.

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 3. Protect Sensitive Files

The Nginx config blocks access to hidden files (files starting with a dot, like `.env`). The `public/` directory is the **only** directory that should be accessible from the web. Everything else -- your application code, your `.env` file, your storage directory -- should be outside the web root.

```nginx
# Block access to hidden files
location ~ /\.(?!well-known).* {
    deny all;
}
```

The `public/` directory should be the **only** publicly accessible directory.

### 4. Set Proper Permissions

If the `storage/` directory is not writable, Laravel cannot write logs, compile Blade templates, or store uploaded files. If it is writable by everyone, that is a security risk. The permissions below give the web server (`www-data`) write access to the directories it needs while keeping everything else read-only for other users.

```bash
chmod -R 755 /home/user/my-app
chmod -R 775 /home/user/my-app/storage
chmod -R 775 /home/user/my-app/bootstrap/cache
chown -R www-data:www-data /home/user/my-app
```

### 5. Rate Limiting

Rate limiting protects your app from abuse. Without it, an attacker can write a script that hits your login endpoint 10,000 times per second, trying every possible password. The `throttle` middleware limits how many requests an IP address can make in a given time window.

```php
// Rate limit API routes
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('posts', PostController::class);
});

// Rate limit login attempts
Route::middleware('throttle:5,1')->post('/login', [LoginController::class, 'login']);
```

### 6. Keep Dependencies Updated

Security vulnerabilities are discovered in packages all the time. `composer audit` checks your dependencies against a known vulnerability database and tells you if anything needs updating.

```bash
# Check for security vulnerabilities
composer audit

# Update dependencies
composer update
npm audit
```

## Monitoring & Logging

### Log Configuration

In development you log everything because you want maximum visibility. In production you log only warnings and errors, because logging every debug message fills up your disk and makes it harder to find the signal in the noise. Daily log rotation ensures old logs are automatically cleaned up.

```env
LOG_CHANNEL=daily
LOG_LEVEL=warning
LOG_DAYS=14    # Keep logs for 14 days
```

### Health Checks

A health check endpoint is a simple URL that returns "ok" if the app is running and can connect to the database. Monitoring tools (or a simple cron job) hit this endpoint every minute and alert you if it stops responding. It is the simplest form of production monitoring and every app should have one.

```php
// routes/web.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'database' => DB::connection()->getPdo() ? 'connected' : 'error',
    ]);
});
```

### Monitoring Tools

- **Laravel Telescope** -- Debug assistant (local only)
- **Laravel Pulse** -- Performance monitoring
- **Laravel Horizon** -- Queue monitoring (Redis)
- **Sentry / Bugsnag** -- Error tracking
- **New Relic / Blackfire** -- Performance profiling

## Production Checklist Summary

| Item | Status |
|------|--------|
| `APP_DEBUG=false` | Required |
| `APP_KEY` set | Required |
| HTTPS enabled | Required |
| `storage/` writable | Required |
| `optimize` ran | Required |
| Queue workers running | If using queues |
| Cron job configured | If using scheduler |
| Database backups | Recommended |
| Error monitoring | Recommended |
| CDN for assets | Recommended |
| Log rotation configured | Recommended |

## Best Practices

1. **Automate deployment** -- Use Forge, Vapor, or CI/CD pipelines
2. **Use zero-downtime deployment** -- Maintain active connections during deploy
3. **Monitor everything** -- Errors, performance, queue health
4. **Backup your database** -- Daily automated backups
5. **Use environment variables** -- Never hardcode secrets
6. **Keep dependencies updated** -- Regular `composer update` + security audit
7. **Test before deploying** -- Run your test suite on every push
8. **Use Redis** -- For cache, sessions, and queues in production
