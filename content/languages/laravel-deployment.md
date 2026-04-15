---
title: "Laravel Deployment & Best Practices"
date: "2025-01-22"
tags: ["laravel", "deployment", "production", "server", "php"]
excerpt: "Deploy Laravel to production with confidence — server setup, environment configuration, optimization, monitoring, and security best practices."
---

# Laravel Deployment & Best Practices

Taking Laravel from local development to production requires careful preparation. This guide covers everything you need to deploy a fast, secure, and reliable application.

## Pre-Deployment Checklist

Before deploying, ensure:

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

Run these after every deployment:

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

```bash
# Run migrations
php artisan migrate --force

# The --force flag is required in production to prevent accidental runs
```

## Deployment Methods

### Method 1: Laravel Forge (Easiest)

Forge manages your servers and deploys automatically:

1. Connect your GitHub/GitLab repository
2. Configure deployment script (Forge generates it)
3. Enable "Quick Deploy" — auto-deploys on push to main

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

Deploy to AWS Lambda:

```bash
composer require laravel/vapor-cli
vapor login
vapor deploy production
```

### Method 3: Manual Deployment (VPS)

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

```env
APP_DEBUG=false  # ALWAYS in production
```

### 2. Use HTTPS

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
}
```

### 3. Protect Sensitive Files

```nginx
# Block access to hidden files
location ~ /\.(?!well-known).* {
    deny all;
}
```

The `public/` directory should be the **only** publicly accessible directory.

### 4. Set Proper Permissions

```bash
chmod -R 755 /home/user/my-app
chmod -R 775 /home/user/my-app/storage
chmod -R 775 /home/user/my-app/bootstrap/cache
chown -R www-data:www-data /home/user/my-app
```

### 5. Rate Limiting

```php
// Rate limit API routes
Route::middleware('throttle:60,1')->group(function () {
    Route::apiResource('posts', PostController::class);
});

// Rate limit login attempts
Route::middleware('throttle:5,1')->post('/login', [LoginController::class, 'login']);
```

### 6. Keep Dependencies Updated

```bash
# Check for security vulnerabilities
composer audit

# Update dependencies
composer update
npm audit
```

## Monitoring & Logging

### Log Configuration

```env
LOG_CHANNEL=daily
LOG_LEVEL=warning
LOG_DAYS=14    # Keep logs for 14 days
```

### Health Checks

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

- **Laravel Telescope** — Debug assistant (local only)
- **Laravel Pulse** — Performance monitoring
- **Laravel Horizon** — Queue monitoring (Redis)
- **Sentry / Bugsnag** — Error tracking
- **New Relic / Blackfire** — Performance profiling

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

1. **Automate deployment** — Use Forge, Vapor, or CI/CD pipelines
2. **Use zero-downtime deployment** — Maintain active connections during deploy
3. **Monitor everything** — Errors, performance, queue health
4. **Backup your database** — Daily automated backups
5. **Use environment variables** — Never hardcode secrets
6. **Keep dependencies updated** — Regular `composer update` + security audit
7. **Test before deploying** — Run your test suite on every push
8. **Use Redis** — For cache, sessions, and queues in production
