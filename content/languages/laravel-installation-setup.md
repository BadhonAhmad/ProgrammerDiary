---
title: "Laravel Installation & Environment Setup"
date: "2025-01-02"
tags: ["laravel", "php", "setup", "composer", "docker"]
excerpt: "Step-by-step guide to installing Laravel, configuring your development environment, and understanding environment files."
---

# Laravel Installation & Environment Setup

Before writing a single line of Laravel code, it is worth understanding *why* setting up a PHP framework is more involved than just downloading some files. Unlike a static HTML page that you can open directly in a browser, a Laravel application needs several things running behind the scenes: a PHP interpreter, a web server, a database, and a package manager. Each of these tools exists for a reason, and understanding those reasons will make the setup process feel logical rather than arbitrary.

## Why Composer Exists (And Why You Can't Just Download Files)

In the JavaScript world, you have npm. In Python, you have pip. In PHP, you have **Composer**. All of these solve the same fundamental problem: modern applications depend on dozens — sometimes hundreds — of third-party packages. Manually downloading each one, placing it in the right folder, and keeping it up to date is impossible at scale. A package manager handles this automatically.

Composer reads a file called `composer.json` that lists every package your project needs. When you run `composer install`, it downloads all of those packages into a `vendor/` folder and generates an autoloader — a mechanism that lets you use any installed class without manually writing `require` or `include` statements. Without Composer, you would be manually downloading zip files from GitHub and managing file paths yourself. Laravel itself is installed through Composer, and every Laravel package, plugin, and tool you will ever use is distributed through it.

## Why Docker? Why Sail?

Here is a problem that every developer eventually hits: your project works perfectly on your machine, but when you deploy it to a server (or when a teammate clones it), something breaks. Maybe the server is running PHP 8.1 while you developed on 8.3. Maybe your local MySQL is configured differently. Maybe a PHP extension is missing. These "works on my machine" problems waste enormous amounts of time.

**Docker** solves this by packaging your entire development environment — PHP, Nginx, MySQL, Redis, everything — into isolated containers that run identically on every machine. Think of it like a shipping container: no matter what truck, ship, or train carries it, the container itself is standardized and its contents are protected from the outside environment.

**Laravel Sail** is a wrapper around Docker specifically designed for Laravel. Instead of learning Docker's complex configuration files, Sail gives you a single command to spin up a complete Laravel environment. You don't need to install PHP, MySQL, or anything else on your machine directly — Sail handles all of it inside containers.

## Option 1: Laravel Herd (Recommended for Mac/Windows)

If Docker sounds like overkill for your situation, **Herd** takes the opposite approach. Instead of containerizing everything, Herd installs PHP and Nginx natively on your machine with zero configuration. It is the fastest path from "I want to learn Laravel" to "I have a running Laravel app."

1. Download from [herd.laravel.com](https://herd.laravel.com)
2. Install and open — that's it
3. Create a new site by placing your project in Herd's parked directory

Herd manages PHP versions for you, handles local DNS (so you can visit `my-app.test` instead of `localhost:8000`), and handles SSL certificates automatically. It is ideal if you just want to start coding without thinking about infrastructure.

## Option 2: Laravel Sail (Docker)

Sail is the best choice if you want an environment that matches production, or if you are working on a team where everyone needs the exact same setup. Every teammate runs the same containers, so there are no "works on my machine" surprises.

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

Notice that every command is prefixed with `./vendor/bin/sail`. This is because Sail runs commands *inside* the Docker container, not on your host machine. Your local machine might not even have PHP installed — Sail uses the PHP version inside the container instead.

### Configuring a Shell Alias

Typing `./vendor/bin/sail` every time is tedious. You can create a shell alias — essentially a keyboard shortcut for your terminal — so that typing `sail` does the same thing:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

Now all Sail commands become much shorter:

```bash
sail up -d
sail artisan migrate
sail npm run dev
```

## Option 3: Manual Installation

If you want full control over every component, or if you are setting up on a machine where Docker and Herd aren't options, you can install everything manually. This approach teaches you what each piece does, which is valuable even if you eventually switch to Sail or Herd.

### Step 1: Install PHP

PHP is the language Laravel is written in. You need version 8.2 or newer for Laravel 11. The installation method depends on your operating system:

```bash
# macOS (via Homebrew)
brew install php

# Ubuntu/Debian
sudo apt update
sudo apt install php8.2 php8.2-cli php8.2-common php8.2-mbstring php8.2-xml php8.2-mysql php8.2-curl php8.2-zip

# Windows — download from php.net or use XAMPP/Laragon

# Verify the installation
php -v    # Should show PHP 8.2+
```

Notice that on Ubuntu, you're not just installing PHP — you're also installing extensions like `mbstring` (for handling multi-byte characters), `xml` (for parsing XML), `mysql` (for database connectivity), `curl` (for making HTTP requests), and `zip` (for handling zip archives). Laravel needs all of these to function. This is exactly the kind of complexity that Sail and Herd eliminate.

### Step 2: Install Composer

As explained earlier, Composer is PHP's package manager. You need it to install Laravel and every third-party package your project will use.

```bash
# macOS / Linux
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Windows — download Composer-Setup.exe from getcomposer.org

# Verify
composer --version
```

### Step 3: Install Node.js

Laravel uses a tool called **Vite** to compile frontend assets — your CSS, JavaScript, and Vue/React components. Vite is itself a Node.js tool, which is why you need Node.js installed even though Laravel is a PHP framework. Modern web development is a mix of languages and tools, and the PHP/JavaScript boundary is one you'll cross frequently.

```bash
# Using nvm (recommended)
nvm install --lts
nvm use --lts

# Verify
node -v
npm -v
```

### Step 4: Create a Laravel Project

With PHP, Composer, and Node.js in place, you can finally create a Laravel project. There are two ways to do this — both are equivalent, but the Laravel installer is slightly faster if you plan to create multiple projects:

```bash
# Via Composer (works everywhere)
composer create-project laravel/laravel my-app

# OR via Laravel installer (requires one-time setup)
composer global require laravel/installer
laravel new my-app
```

Both commands do the same thing: download a fresh Laravel project, install all Composer dependencies, and set up the basic file structure.

### Step 5: Start the Development Server

Now you need to run two processes simultaneously. The first is PHP's built-in development server, which handles incoming HTTP requests. The second is Vite, which watches your frontend files for changes and recompiles them automatically (called "hot module replacement").

```bash
cd my-app

# Start PHP's built-in server
php artisan serve

# In a separate terminal, start Vite for frontend hot-reload
npm install
npm run dev
```

Your app is now running at **http://localhost:8000**. Open it in your browser and you should see the Laravel welcome page.

## The `.env` File — Why Configuration Should Never Be in Code

One of the most important concepts in professional web development is **separating configuration from code**. Think about it: your database password is different on your local machine than it is on the production server. Your app should run in "debug mode" locally (so you see detailed error messages while developing) but never in production (because those error messages can expose sensitive data). If you hardcode these values into your PHP files, you'd have to change them every time you deploy — and sooner or later, someone will accidentally push their database password to a public GitHub repository.

The `.env` file solves this elegantly. It is a simple text file that sits in the root of your project and holds all environment-specific values. Your code reads from this file using the `env()` helper, so the same codebase works across different environments without any changes. The `.env` file is listed in `.gitignore`, which means it is never committed to version control. Instead, you commit a `.env.example` file (with dummy values) as a template so other developers know which variables they need to set.

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

Each line is a key-value pair. `APP_DEBUG=true` means detailed error pages are shown (for local development). `DB_CONNECTION=mysql` tells Laravel which database driver to use. When you deploy to production, you simply create a different `.env` file with production values — your code doesn't change at all.

### Generating the Application Key

```bash
php artisan key:generate
```

This command generates a random encryption key and writes it to your `APP_KEY` value in `.env`. Laravel uses this key for all encryption — hashing passwords, encrypting cookies, generating secure tokens. Without it, nothing that requires encryption will work. This is why you run this command immediately after creating a new project.

### Environment Detection

You can check the current environment in your code and behave differently depending on where the app is running:

```php
// app/Providers/AppServiceProvider.php
public function register(): void
{
    if ($this->app->environment('local')) {
        // Only load debug tools in local development
        // Never in production
    }
}
```

## What Is Artisan and Why Does a Framework Need a CLI?

**Artisan** is Laravel's command-line interface, and it is one of the most productive tools in the framework. But why does a web framework need a CLI at all?

The answer is that many development tasks don't happen through a browser. You need to create new files (controllers, models, migrations), run database schema changes, clear cached files, generate boilerplate code, and run automated tests. Doing all of this manually — creating files, writing boilerplate, copying folder structures — is slow and error-prone. Artisan automates it.

Think of Artisan as a scaffolding machine. Instead of manually creating a controller file, writing the namespace, importing the base Controller class, and setting up the basic methods, you run one command and Artisan generates the entire file in the correct location with the correct structure. This is not just about saving time — it ensures consistency. Every controller created by Artisan follows the same pattern, which means every developer on the team writes controllers the same way.

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

Each of these commands saves you from doing something manually that would take minutes and could introduce mistakes.

### Tinker — Your Interactive Playground

Among Artisan's commands, **Tinker** deserves special mention. It opens an interactive PHP session where you can interact with your entire Laravel application — create database records, test queries, call functions, inspect objects. It is like having a conversation with your app.

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

Instead of writing a temporary route, visiting it in the browser, checking the output, and then deleting the route, you can just open Tinker and test things directly. It is one of those tools that, once you start using it, you wonder how you ever worked without it.

## Database Setup

### Using SQLite (Simplest)

SQLite is a file-based database — it stores everything in a single file on your disk. No separate database server to install, no connections to configure, no passwords to remember. It is perfect for learning Laravel, building prototypes, or small applications that don't need the scalability of MySQL or PostgreSQL.

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

MySQL (or MariaDB) is what most production Laravel applications use. It requires a separate database server running on your machine or a remote host.

```bash
# Create the database
mysql -u root -p
CREATE DATABASE my_app;
EXIT;

# Update .env with your database credentials
# DB_CONNECTION=mysql
# DB_DATABASE=my_app

# Run migrations to create tables
php artisan migrate
```

## Directory Permissions

On Linux and macOS, web servers run as a specific user (often `www-data`). Laravel needs write access to the `storage/` directory (for logs, compiled views, file uploads) and `bootstrap/cache/` (for framework cache files). If these directories are not writable, Laravel will fail silently or throw permission errors:

```bash
chmod -R 775 storage bootstrap/cache
```

## Debug Mode

The `APP_DEBUG` setting in your `.env` file controls how much information Laravel shows when something goes wrong:

```env
APP_DEBUG=true   # Local development — shows detailed errors with stack traces
APP_DEBUG=false  # Production — shows generic error pages to users
```

> **Never set `APP_DEBUG=true` in production!** When debug mode is on, Laravel displays your entire stack trace, environment variables (including database passwords), and application internals on the error page. This is invaluable during development but catastrophic in production — it gives attackers everything they need to compromise your application.

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
