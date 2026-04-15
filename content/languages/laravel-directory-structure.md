---
title: "Laravel Directory Structure Explained"
date: "2025-01-03"
tags: ["laravel", "php", "architecture", "mvc"]
excerpt: "Understand every folder and file in a Laravel project — what goes where and why."
---

# Laravel Directory Structure Explained

When you create a new Laravel project, you get a well-organized directory structure. Understanding it is crucial before writing any code.

## The Root Level

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

## `app/` — The Heart of Your Application

This is where most of your code lives.

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

### Key Concepts

**Models** represent database tables:

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $fillable = ['name', 'email', 'password'];
}
```

**Controllers** handle HTTP requests:

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

**Middleware** filter HTTP requests:

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

```
routes/
├── web.php        ← Web routes (session auth, CSRF)
├── api.php        ← API routes (token auth, stateless)
├── console.php    ← Artisan command definitions
└── channels.php   ← Broadcast channel authorization
```

```php
// routes/web.php
use App\Http\Controllers\UserController;

Route::get('/', fn () => view('welcome'));
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);
```

## `resources/` — Frontend & Views

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

## `database/` — Data Layer

```
database/
├── migrations/          ← Database schema changes (version controlled)
├── seeders/             ← Test/sample data
├── factories/           ← Model factories for testing
└── database.sqlite      ← SQLite database (if using)
```

**Migrations** are like Git for your database:

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

**Factories** generate test data:

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

**Seeders** populate the database:

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

```
config/
├── app.php          ← App name, timezone, locale, providers
├── auth.php         ← Authentication configuration
├ cache.php          ← Cache stores (file, redis, memcached)
├── database.php     ← Database connections
├── filesystems.php  ← File storage disks
├── mail.php         ← Mail driver configuration
├── queue.php        ← Queue connections
├── session.php      ← Session driver and lifetime
└── ...
```

> **Never hardcode configuration values.** Use `config()` helper or `.env` file:

```php
// Reading config
$value = config('app.timezone');
$dbDriver = config('database.default');

// Config values pull from .env
// config/app.php: 'timezone' => env('APP_TIMEZONE', 'UTC'),
```

## `public/` — Web Server Root

```
public/
├── index.php        ← Entry point for all requests
├── .htaccess        ← Apache rewrite rules
├── robots.txt
└── storage/         ← Symlink to storage/app/public
```

This is the **only directory that should be publicly accessible**. Your web server (Nginx/Apache) should point here.

## `storage/` — Runtime Files

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

> Make sure `storage/` is writable: `chmod -R 775 storage`

## `bootstrap/` — Framework Startup

```
bootstrap/
├── app.php          ← Creates the Laravel application instance
├── cache/           ← Framework cache files
└── providers.php    ← Service provider registration (Laravel 11+)
```

## Request Lifecycle (Simplified)

Understanding the directory structure helps you trace how a request flows:

```
HTTP Request
    ↓
public/index.php          (Entry point)
    ↓
bootstrap/app.php         (Boot the application)
    ↓
Routes (routes/web.php)   (Match URL to route)
    ↓
Middleware                (Filter request)
    ↓
Controller                (Handle logic)
    ↓
Model                     (Database interaction)
    ↓
View (resources/views/)   (Render response)
    ↓
HTTP Response
```

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
