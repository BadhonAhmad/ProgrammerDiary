---
title: "Laravel Installation & Environment Setup"
date: "2025-01-02"
tags: ["laravel", "php", "setup", "composer", "docker"]
excerpt: "Step-by-step guide to installing Laravel, configuring your development environment, and understanding environment files."
---

# Laravel Installation & Environment Setup

Before writing Laravel code, you need a proper development environment. Let's set it up from scratch.

## Option 1: Laravel Herd (Recommended for Mac/Windows)

**Herd** is the fastest way to get started. It includes PHP, Nginx, and everything you need.

1. Download from [herd.laravel.com](https://herd.laravel.com)
2. Install and open — that's it
3. Create a new site by placing your project in Herd's parked directory

## Option 2: Laravel Sail (Docker)

**Sail** is a lightweight command-line interface for interacting with Laravel's default Docker configuration.

```bash
# Create a new Laravel project using Sail
curl -s https://laravel.build/my-app | bash

# Navigate to the project
cd my-app

# Start the Docker containers
./vendor/bin/sail up -d

# Run Artisan commands via Sail
./vendor/bin/sail artisan --version
```

### Configuring a Shell Alias

Typing `./vendor/bin/sail` every time is tedious. Add an alias:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

Now you can use:

```bash
sail up -d
sail artisan migrate
sail npm run dev
```

## Option 3: Manual Installation

### Step 1: Install PHP

```bash
# macOS (via Homebrew)
brew install php

# Ubuntu/Debian
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mbstring php8.2-xml php8.2-mysql php8.2-curl php8.2-zip

# Windows — download from php.net or use XAMPP/Laragon

# Verify
php -v    # Should show PHP 8.2+
```

### Step 2: Install Composer

Composer is PHP's package manager — like npm for PHP.

```bash
# macOS / Linux
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Windows — download Composer-Setup.exe from getcomposer.org

# Verify
composer --version
```

### Step 3: Install Node.js

Laravel uses Vite for asset compilation, which requires Node.js.

```bash
# Using nvm (recommended)
nvm install --lts
nvm use --lts

# Verify
node -v
npm -v
```

### Step 4: Create a Laravel Project

```bash
# Via Composer
composer create-project laravel/laravel my-app

# OR via Laravel installer
composer global require laravel/installer
laravel new my-app
```

### Step 5: Start the Development Server

```bash
cd my-app

# Start PHP's built-in server
php artisan serve

# In a separate terminal, start Vite for frontend hot-reload
npm install
npm run dev
```

Your app is now running at **http://localhost:8000**.

## The `.env` File

Laravel uses `.env` files for environment-specific configuration. This file is **never committed to Git**.

```env
APP_NAME="My App"
APP_ENV=local
APP_KEY=base64:generated-key-here
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=my_app
DB_USERNAME=root
DB_PASSWORD=secret

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
```

### Generating the Application Key

```bash
php artisan key:generate
```

This sets `APP_KEY` in your `.env`. It's used for encryption and must be set before your app works properly.

### Environment Detection

Laravel automatically detects the environment:

```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    if ($this->app->environment('local')) {
        // Debug bar, telescope, etc.
    }
}
```

## Database Setup

### Using SQLite (Simplest)

```env
DB_CONNECTION=sqlite
# DB_DATABASE is optional — defaults to database/database.sqlite
```

```bash
# Create the SQLite file
touch database/database.sqlite
php artisan migrate
```

### Using MySQL

```bash
# Create the database
mysql -u root -p
CREATE DATABASE my_app;
EXIT;

# Update .env
# DB_CONNECTION=mysql
# DB_DATABASE=my_app

# Run migrations
php artisan migrate
```

## Common Artisan Commands

Artisan is Laravel's command-line interface. You'll use it constantly:

```bash
# Start dev server
php artisan serve

# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate

# Rollback the last migration
php artisan migrate:rollback

# Create a controller
php artisan make:controller UserController

# Create a model with migration
php artisan make:model Post -m

# Create a middleware
php artisan make:middleware EnsureTokenIsValid

# Clear cached files
php artisan optimize:clear

# List all routes
php artisan route:list

# Tinker — interactive REPL
php artisan tinker
```

## Helpful Tinker Examples

Tinker is a powerful REPL for interacting with your Laravel app:

```bash
php artisan tinker
```

```php
// Create a user
User::create(['name' => 'John', 'email' => 'john@example.com', 'password' => bcrypt('password')]);

// Query users
User::all();
User::where('name', 'John')->first();

// Test a route
route('login');
url('/dashboard');
```

## Directory Permissions

On Linux/Mac, ensure the storage and bootstrap/cache directories are writable:

```bash
chmod -R 775 storage bootstrap/cache
```

## Debug Mode

In your `.env` file:

```env
APP_DEBUG=true   # Local development — shows detailed errors
APP_DEBUG=false  # Production — shows generic error pages
```

> **Never set `APP_DEBUG=true` in production!** It exposes sensitive configuration values, passwords, and application internals.

## Troubleshooting Common Issues

| Problem | Solution |
|---------|----------|
| `Class not found` errors | Run `composer dump-autoload` |
| Blank page / 500 error | Check `storage/logs/laravel.log` |
| Permission denied | `chmod -R 775 storage bootstrap/cache` |
| `APP_KEY` not set | Run `php artisan key:generate` |
| Node modules missing | Run `npm install` |
| Vite not compiling | Run `npm run dev` in a separate terminal |
| Port 8000 in use | Use `php artisan serve --port=8080` |
