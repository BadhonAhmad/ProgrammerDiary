---
title: "Laravel Directory Structure Explained"
date: "2025-01-03"
tags: ["laravel", "php", "architecture", "mvc"]
excerpt: "Understand every folder and file in a Laravel project — what goes where and why."
---

# Laravel Directory Structure Explained

When you create a new Laravel project and open it for the first time, you are greeted by a wall of folders. It can feel overwhelming — where do you even start? But every single directory exists for a reason, and that reason comes down to one principle: **separation of concerns**.

Imagine walking into a kitchen where every tool, ingredient, and appliance is piled into one giant box. You need a whisk, but you have to dig through spatulas, flour, and the toaster to find it. That is what a PHP application looks like without organized structure — database queries mixed with HTML mixed with routing logic mixed with configuration, all in the same files. It works for a small script, but it collapses under the weight of a real application.

Laravel's directory structure is the organized kitchen: everything has its place. Database logic goes in one folder. HTML templates go in another. Routing rules go in their own file. Configuration is separated from code entirely. When you need to change how a page looks, you go straight to the views folder. When you need to add a new database table, you go straight to the migrations folder. You never have to search through unrelated code to find what you are looking for. This structure is not arbitrary — it is the physical manifestation of the MVC pattern and decades of accumulated wisdom about how to organize code.

## The Root Level

Here is the complete top-level structure of a fresh Laravel project:

```
my-app/
├── app/                  ← Your application code
├── bootstrap/            ← Framework bootstrapping files
├── config/               ← Configuration files
├── database/             ← Migrations, seeders, factories
├── public/               ← Web server document root
├── resources/            ← Views, assets, language files
├── routes/               ← All route definitions
├── storage/              ← Logs, compiled files, uploads
├── tests/                ← Automated tests
├── vendor/               ← Composer dependencies (don't edit)
├── .env                  ← Environment variables
├── .env.example          ← Template for .env
├── artisan               ← CLI command entry point
├── composer.json         ← PHP dependencies
├── package.json          ← Node dependencies
├── vite.config.js        ← Frontend build config
└── phpunit.xml           ← Test configuration
```

Let's walk through each one and understand not just *what* it holds, but *why* it needs to exist as a separate concern.

## `app/` — The Heart of Your Application

If the entire Laravel project is a house, `app/` is the living area — it is where you spend almost all your time. This folder contains every piece of custom logic that makes your application unique: your data models, your controllers, your middleware, your business logic. When someone says "I'm working on the Laravel app," they almost certainly mean they are editing files inside `app/`.

The reason this folder exists separately from everything else is simple: it is *your* code. The `vendor/` folder contains other people's code. The `config/` folder contains settings. The `resources/` folder contains templates. But `app/` is where *your* application lives. This separation means you can update Laravel and all its packages (in `vendor/`) without touching your application code, and vice versa.

```
app/
├── Console/
│   └── Commands/         ← Custom Artisan commands
├── Exceptions/
│   └── Handler.php       ← Global exception handling
├── Http/
│   ├── Controllers/      ← Controllers
│   ├── Middleware/        ← HTTP middleware
│   ├── Requests/          ← Form request validation
│   └── Kernel.php         ← HTTP middleware stack
├── Models/               ← Eloquent models
├── Providers/            ← Service providers
├── Policies/             ← Authorization policies
├── Events/               ← Event classes
├── Listeners/            ← Event listeners
├── Jobs/                 ← Queueable jobs
├── Mail/                 ← Mailable classes
├── Notifications/        ← Notification classes
└── Services/             ← (Custom) Business logic
```

Notice how `app/` is itself divided into subdirectories. This is not just neat organization — it is about predictability. When you need to find the controller that handles user registration, you know it lives in `app/Http/Controllers/`. When you need to find the event that fires when an order is placed, you look in `app/Events/`. This predictability means you can open any Laravel project in the world and navigate it immediately.

### Models — Your Data's Voice

A **Model** is a PHP class that represents a database table. But it is more than that — it is the place where you define the *rules* of your data. What fields are fillable? What relationships exist between tables? What happens when a record is deleted? The Model answers all of these questions. Without models, you would write raw SQL queries everywhere, and if the database schema ever changed, you would have to find and update every single query across your entire codebase.

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
}
```

This small class tells Laravel: "There is a database table called `users`, and the only fields that can be mass-assigned are `name`, `email`, and `password`." From this single definition, Laravel can generate queries, validate input, and handle relationships. One class replaces dozens of raw SQL queries.

### Controllers — The Traffic Directors

If a Model is your data and a View is your presentation, the **Controller** is the brain that connects them. When a user visits `/users`, the Controller receives that request, asks the User model for all users, and passes the result to a View to be rendered as HTML. The Controller itself contains no database logic and no HTML — it coordinates.

This separation is powerful because it means you can test your Controller's logic without needing a database (by mocking the Model), and you can change your HTML without touching the Controller. Each layer is independent.

```php
// app/Http/Controllers/UserController.php
namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        return view('users.index', ['users' => User::all()]);
    }
}
```

### Middleware — The Security Guards

**Middleware** sits between the incoming HTTP request and your Controller. Think of it as a security checkpoint at an airport: before you reach your gate (the Controller), you have to pass through security (middleware). Middleware can check if a user is authenticated, verify CSRF tokens, log requests, or redirect users based on conditions. If the middleware rejects the request, the Controller is never reached.

Without middleware, you would have to write authentication checks at the top of every single controller method. That is repetitive and error-prone — forget to add the check to one method, and you have a security vulnerability. Middleware lets you define the check once and apply it to entire groups of routes.

```php
// app/Http/Middleware/EnsureAdmin.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user()?->is_admin !== true) {
            abort(403);
        }
        return $next($request);
    }
}
```

## `routes/` — Where URLs Are Defined

The `routes/` folder is where you tell Laravel: "When someone visits this URL, run this code." This might seem like a small thing, but in raw PHP, URL routing was often handled by the web server (using Apache's `.htaccess` files) or by a messy series of `if/else` statements in a central file. Laravel brings routing into your application code, giving you full control and making it easy to see every URL your application responds to in one place.

Laravel separates routes into different files based on their purpose:

```
routes/
├── web.php        ← Web routes (session auth, CSRF)
├── api.php        ← API routes (token auth, stateless)
├── console.php    ← Artisan command definitions
└── channels.php   ← Broadcast channel authorization
```

`web.php` handles traditional web requests — pages that return HTML, use sessions, and protect against CSRF attacks. `api.php` handles API requests — stateless endpoints that return JSON and use token-based authentication. This separation exists because web routes and API routes have fundamentally different security concerns. Web routes need CSRF protection (to prevent malicious sites from submitting forms on behalf of logged-in users), but API routes don't use sessions at all, so CSRF protection doesn't apply.

```php
// routes/web.php
use App\Http\Controllers\UserController;

Route::get('/', fn () => view('welcome'));
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
```

## `resources/` — Frontend & Views

The `resources/` folder holds everything that is sent to the user's browser: HTML templates, JavaScript files, CSS stylesheets, and language translation files. The word "resources" might seem vague, but the idea is that these are the raw materials your application uses to build what the user sees. They are processed, compiled, or rendered before being sent to the browser.

```
resources/
├── views/              ← Blade templates
│   ├── layouts/        ← Master layouts
│   ├── components/     ← Blade components
│   ├── pages/          ← Page views
│   └── partials/       ← Reusable view fragments
├── js/                 ← JavaScript / TypeScript
│   ├── app.js
│   ├── components/     ← Vue/React components (if using)
│   └── Pages/          ← Inertia pages (if using)
├── css/                ← Stylesheets
│   └── app.css
└── lang/               ← Localization files
    ├── en/
    └── fr/
```

The `views/` directory uses Laravel's Blade templating engine. Blade files look like HTML with some extra syntax (`@if`, `@foreach`, `{{ $variable }}`) that lets you inject dynamic data. The important thing is that views contain *no business logic*. They receive data from the Controller and display it. If you need to calculate something or fetch data from the database, that belongs in the Controller or Model, not the view. Keeping views "dumb" (logic-free) means designers can edit templates without needing to understand PHP programming.

The `js/` and `css/` directories hold your frontend assets. These are processed by Vite (configured in `vite.config.js`) — it compiles TypeScript, bundles modules, and applies CSS preprocessing. The compiled output ends up in `public/`, which is what the browser actually loads.

The `lang/` directory is for internationalization. If your application needs to support multiple languages, you define translation strings here. Instead of hardcoding "Welcome" in your Blade templates, you write `{{ __('messages.welcome') }}` and Laravel looks up the correct translation based on the user's locale.

## `database/` — Data Layer

The `database/` folder is where you manage your database schema and test data. This folder exists separately from `app/Models/` for an important reason: your Model classes define *how your code interacts with data*, while your migrations define *what the database actually looks like*. They are two different concerns.

```
database/
├── migrations/          ← Database schema changes (version controlled)
├── seeders/             ← Test/sample data
├── factories/           ← Model factories for testing
└── database.sqlite      ← SQLite database (if using)
```

### Migrations — Version Control for Your Database

Think of migrations like Git, but for your database schema. In a team environment, how do you communicate that you added a new column to the `posts` table? Without migrations, you would run `ALTER TABLE` on your local database and then tell your teammates to do the same. Someone would forget. Someone would run the wrong ALTER statement. The schemas would drift apart.

Migrations solve this by being PHP files that are committed to version control alongside your code. When a teammate pulls your changes, they run `php artisan migrate` and their local database schema is updated to match yours automatically. Every migration has an `up()` method (what to do when applying the migration) and a `down()` method (how to reverse it), so you can roll back changes if something goes wrong.

```php
// database/migrations/2024_01_01_000000_create_posts_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('content');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->boolean('published')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```

### Factories — Generating Test Data

When you are developing an application, you need data to work with. Manually creating test users and posts through the browser is tedious. **Factories** automate this by defining blueprints for generating fake data. Each factory specifies how to fill a model's attributes using Faker (a library that generates realistic fake data — names, emails, paragraphs, dates).

```php
// database/factories/PostFactory.php
namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class PostFactory extends Factory
{
    protected $model = Post::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(),
            'content' => fake()->paragraphs(3, true),
            'user_id' => User::factory(),
            'published' => fake()->boolean(80),
        ];
    }
}
```

### Seeders — Populating the Database

**Seeders** use factories to populate your database with realistic test data. Instead of creating records one by one, you define how many of each model you want and run a single command. This is especially useful for setting up a fresh development environment or preparing data for automated tests.

```php
// database/seeders/DatabaseSeeder.php
namespace Database\Seeders;

use App\Models\User;
use App\Models\Post;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory(10)->create();
        Post::factory(50)->create();
    }
}
```

## `config/` — Configuration Files

The `config/` folder contains PHP files that return arrays of configuration values. Each file corresponds to a different aspect of the framework: `app.php` for general application settings, `database.php` for database connections, `mail.php` for email configuration, and so on.

Why separate configuration into its own folder instead of scattering it throughout the codebase? Two reasons. First, it makes configuration easy to find and modify — you always know where to look. Second, it enables the environment-specific behavior we discussed earlier. Each config file reads from the `.env` file using the `env()` helper, with sensible defaults as fallbacks. Your code reads from `config()`, which reads from `.env`, which is different on every server. The config folder is the bridge between your environment variables and your application code.

```
config/
├── app.php          ← App name, timezone, locale, providers
├── auth.php         ← Authentication configuration
├── cache.php        ← Cache stores (file, redis, memcached)
├── database.php     ← Database connections
├── filesystems.php  ← File storage disks
├── mail.php         ← Mail driver configuration
├── queue.php        ← Queue connections
├── session.php      ← Session driver and lifetime
└── ...
```

> **Never hardcode configuration values.** Use the `config()` helper or read from the `.env` file:

```php
// Reading config values
$value = config('app.timezone');
$dbDriver = config('database.default');

// Config values pull from .env behind the scenes
// config/app.php: 'timezone' => env('APP_TIMEZONE', 'UTC'),
```

## `public/` — Web Server Root

The `public/` folder is the *only* directory in your entire Laravel project that should be accessible to the outside world. Your web server (Nginx or Apache) is configured to serve files from this directory and this directory only. Every other folder — your application code, configuration, database credentials — is safely outside the public root and cannot be accessed directly by a browser.

This is a critical security design. If someone tries to visit `yoursite.com/.env`, the web server blocks them because `.env` is not inside `public/`. If they try `yoursite.com/app/Models/User.php`, they get nothing because `app/` is outside the public root. The only way into your application is through `public/index.php`, which Laravel controls.

```
public/
├── index.php        ← Entry point for all requests
├── .htaccess        ← Apache rewrite rules
├── robots.txt
└── storage/         ← Symlink to storage/app/public
```

Every HTTP request enters your application through `public/index.php`. This file loads the Composer autoloader, bootstraps the Laravel framework, and hands the request off to the routing system. From there, Laravel takes over — routing the request through middleware, into a controller, and back as a response.

## `storage/` — Runtime Files

The `storage/` folder holds files that Laravel generates at runtime — things your application creates as it runs, not files you write yourself. This includes error logs, compiled Blade templates, session files, file uploads from users, and framework cache files.

Why not put these in `public/`? Because runtime files are not meant to be served directly to browsers (except user uploads, which are exposed through a symlink from `public/storage`). Logs contain sensitive error information. Compiled views are internal templates. Session files contain user authentication data. Keeping all of this outside the public root is another layer of security.

```
storage/
├── app/
│   ├── public/      ← User-uploaded files (avatars, docs)
│   └── private/     ← Private files
├── framework/
│   ├── cache/       ← Compiled cache files
│   ├── sessions/    ← File-based sessions
│   └── views/       ← Compiled Blade templates
└── logs/
    └── laravel.log  ← Application error log
```

> Make sure `storage/` is writable: `chmod -R 775 storage`. If Laravel cannot write to this directory, your application will break — logs cannot be written, views cannot be compiled, and uploads will fail silently.

## `bootstrap/` — Framework Startup

The `bootstrap/` folder contains a small number of files that run during the earliest stage of every request. These files create the Laravel application instance, register service providers, and set up the foundation that everything else depends on. You will rarely need to edit these files, but understanding that they exist helps you appreciate the request lifecycle: every request starts at `public/index.php`, which loads `bootstrap/app.php`, which builds the entire framework before your code runs.

```
bootstrap/
├── app.php          ← Creates the Laravel application instance
├── cache/           ← Framework cache files
└── providers.php    ← Service provider registration (Laravel 11+)
```

## Request Lifecycle — Connecting the Dots

Understanding the directory structure is really about understanding how a request flows through your application. Each directory represents a stage in that flow:

```
HTTP Request
    ↓
public/index.php          (Entry point — the only public file)
    ↓
bootstrap/app.php         (Boot the framework)
    ↓
Routes (routes/web.php)   (Match the URL to a handler)
    ↓
Middleware                (Filter the request — auth, CSRF, etc.)
    ↓
Controller (app/Http/)    (Execute your logic)
    ↓
Model (app/Models/)       (Talk to the database)
    ↓
View (resources/views/)   (Render the HTML response)
    ↓
HTTP Response
```

When you trace this path, the directory structure stops being a random collection of folders and becomes a story. The request enters through `public/`, gets bootstrapped through `bootstrap/`, finds its destination in `routes/`, passes through security checks in `app/Http/Middleware/`, reaches your logic in `app/Http/Controllers/`, fetches data through `app/Models/`, renders a page from `resources/views/`, and any errors along the way are logged to `storage/logs/`. Every folder has a specific role in this journey.

## Key Takeaways

| Directory | Purpose | Edit? |
|-----------|---------|-------|
| `app/` | Your application code | Yes |
| `routes/` | URL definitions | Yes |
| `resources/views/` | HTML templates | Yes |
| `database/migrations/` | Database schema | Yes |
| `config/` | Configuration | Rarely |
| `public/` | Web root | No (auto) |
| `storage/` | Runtime files | No (auto) |
| `vendor/` | Dependencies | Never |
| `bootstrap/` | Framework bootstrap | Rarely |
