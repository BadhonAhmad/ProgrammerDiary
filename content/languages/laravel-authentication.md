---
title: "Laravel Authentication — Login, Register & Sessions"
date: "2025-01-14"
tags: ["laravel", "authentication", "login", "security", "php"]
excerpt: "Implement authentication in Laravel — from quick scaffolding with Breeze and Jetstream to manual auth, password reset, email verification, and social login."
---

# Laravel Authentication — Login, Register & Sessions

Authentication verifies **who a user is**. Laravel makes it incredibly easy with built-in scaffolding tools.

## Quick Start: Laravel Breeze

Breeze is the simplest way to add authentication. It gives you login, register, password reset, email verification, and profile management.

```bash
# Install Breeze
composer require laravel/breeze --dev

# Install with Blade templates (simplest)
php artisan breeze:install blade

# Or with Vue
php artisan breeze:install vue

# Or with React
php artisan breeze:install react

# Run migrations (creates users, password_reset_tokens tables)
php artisan migrate

# Install frontend dependencies
npm install
npm run build
```

That's it! You now have:
- `/register` — User registration
- `/login` — User login
- `/forgot-password` — Password reset link
- `/reset-password` — Password reset form
- `/verify-email` — Email verification
- `/confirm-password` — Password confirmation
- `/profile` — Profile management

## Laravel Jetstream (More Features)

Jetstream is a more full-featured auth scaffolding:

```bash
composer require laravel/jetstream

# With Livewire (full-stack)
php artisan jetstream:install livewire

# With Inertia.js (SPA-like)
php artisan jetstream:install inertia

php artisan migrate
npm install && npm run build
```

Jetstream includes everything Breeze has, plus:
- Two-factor authentication
- API token management (for SPA/mobile apps)
- Team management
- Session management

## The Auth System Under the Hood

### User Model

```php
// app/Models/User.php (already exists in Laravel)
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $fillable = [
        'name', 'email', 'password',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',  // Auto-hash on assignment
        ];
    }
}
```

### Manual Authentication

If you don't want scaffolding, implement auth manually:

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

// Register
public function register(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|string|min:8|confirmed',
    ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);

    Auth::login($user);

    return redirect()->route('dashboard');
}

// Login
public function login(Request $request)
{
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required',
    ]);

    if (Auth::attempt($credentials, $request->boolean('remember'))) {
        $request->session()->regenerate(); // Prevent session fixation
        return redirect()->intended('dashboard');
    }

    return back()->withErrors([
        'email' => 'The provided credentials do not match our records.',
    ])->onlyInput('email');
}

// Logout
public function logout(Request $request)
{
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();
    return redirect('/');
}
```

### Auth Helper Functions

```php
// Get the authenticated user
$user = auth()->user();
$user = Auth::user();

// Check if logged in
if (auth()->check()) {
    // User is logged in
}

// Get the user ID
$id = auth()->id();

// Login a specific user
Auth::login($user);
Auth::loginUsingId(1);

// Login once (no session/cookie)
Auth::once($credentials);

// Logout
Auth::logout();

// Attempt authentication
if (Auth::attempt(['email' => $email, 'password' => $password])) {
    // Authentication passed
}

// Attempt with additional conditions
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => true])) {
    // Active user authenticated
}
```

### Routes with Auth Middleware

```php
// Protect routes
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
});

// Guest-only routes (redirect logged-in users away)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});
```

## Password Reset

Laravel provides built-in password reset functionality:

```php
use Illuminate\Support\Facades\Password;

// Send reset link
public function sendResetLink(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink(
        $request->only('email')
    );

    return $status === Password::RESET_LINK_SENT
        ? back()->with('status', __($status))
        : back()->withErrors(['email' => __($status)]);
}

// Reset password
public function resetPassword(Request $request)
{
    $request->validate([
        'token' => 'required',
        'email' => 'required|email',
        'password' => 'required|min:8|confirmed',
    ]);

    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function (User $user, string $password) {
            $user->forceFill([
                'password' => Hash::make($password),
            ])->setRememberToken(Str::random(60));
            $user->save();
        }
    );

    return $status === Password::PASSWORD_RESET
        ? redirect()->route('login')->with('status', __($status))
        : back()->withErrors(['email' => __($status)]);
}
```

## Email Verification

```php
// User model must implement MustVerifyEmail
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}

// Protect routes that require verified email
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// Manually send verification email
$user->sendEmailVerificationNotification();

// Check if verified
$user->hasVerifiedEmail();
$user->markEmailAsVerified();
```

## Password Confirmation

For sensitive actions, require password re-entry:

```php
// Route
Route::middleware(['auth', 'password.confirm'])->group(function () {
    Route::get('/settings/delete', [SettingsController::class, 'confirmDelete']);
    Route::delete('/settings/account', [SettingsController::class, 'destroy']);
});
```

```blade
{{-- Link to confirm password --}}
<a href="{{ route('password.confirm') }}">Delete Account</a>
```

## Social Authentication (OAuth)

Use **Laravel Socialite** for OAuth (Google, GitHub, Facebook, etc.):

```bash
composer require laravel/socialite
```

```env
# .env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
GITHUB_REDIRECT_URI=http://localhost:8000/auth/github/callback
```

```php
// Routes
Route::get('/auth/github', [GitHubController::class, 'redirect']);
Route::get('/auth/github/callback', [GitHubController::class, 'callback']);

// Controller
use Laravel\Socialite\Facades\Socialite;

class GitHubController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('github')->redirect();
    }

    public function callback()
    {
        $githubUser = Socialite::driver('github')->user();

        $user = User::updateOrCreate([
            'github_id' => $githubUser->id,
        ], [
            'name' => $githubUser->name,
            'email' => $githubUser->email,
            'github_token' => $githubUser->token,
            'avatar' => $githubUser->avatar,
        ]);

        Auth::login($user);

        return redirect('/dashboard');
    }
}
```

## Blade Auth Directives

```blade
@auth
    <p>Welcome, {{ auth()->user()->name }}!</p>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
@endguest

{{-- Check specific guard --}}
@auth('admin')
    <p>Admin Panel</p>
@endauth
```

## Best Practices

1. **Use Breeze or Jetstream** — Don't reinvent auth unless you need to
2. **Always regenerate sessions** — After login to prevent session fixation
3. **Hash passwords** — Use `Hash::make()` or the `hashed` cast
4. **Use `auth` middleware** — Protect routes that need authentication
5. **Use `verified` middleware** — Require email verification for sensitive routes
6. **Use HTTPS in production** — Auth tokens must travel over encrypted connections
7. **Rate limit login attempts** — Prevent brute-force attacks
