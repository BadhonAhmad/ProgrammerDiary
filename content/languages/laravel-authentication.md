---
title: "Laravel Authentication — Login, Register & Sessions"
date: "2025-01-14"
tags: ["laravel", "authentication", "login", "security", "php"]
excerpt: "Implement authentication in Laravel — from quick scaffolding with Breeze and Jetstream to manual auth, password reset, email verification, and social login."
---

# Laravel Authentication — Login, Register & Sessions

## Why Authentication Is Hard to Build From Scratch

Authentication looks simple on the surface: the user submits an email and password, you check the database, and you let them in. But that is just the happy path. A real authentication system needs to handle password hashing (never store plain text), session management (how does the server remember the user between requests?), "remember me" functionality (persistent cookies that survive browser closes), password reset via email (generating tokens, sending emails, expiring them), email verification (proving the user owns the email), session fixation prevention (regenerating session IDs after login), brute force protection (rate limiting failed attempts), and proper logout (invalidating the session everywhere). Each of these has edge cases and security implications. Get one wrong and you have a vulnerability.

This is why Laravel provides scaffolding tools like Breeze and Jetstream. They give you a complete, battle-tested authentication system out of the box — controllers, views, routes, migrations, and all the security best practices baked in. You are not cutting corners by using them; you are standing on the shoulders of security experts who have already thought through the edge cases.

## Session-Based vs Token-Based Authentication

Before diving into code, it helps to understand the two fundamental approaches to authentication. Session-based auth is what traditional web apps use: the user logs in, the server creates a session and sends back a cookie with a session ID, and every subsequent request includes that cookie so the server knows who is making the request. The server stores the session data (in a file, database, or Redis). This works well for web apps where the frontend and backend share the same domain.

Token-based auth is what APIs use. Instead of a cookie, the server gives the client a token (a long random string) after login. The client includes this token in an `Authorization` header with every request. The server does not store any session data — it validates the token on each request and identifies the user from it. This is stateless, meaning the server does not need to remember anything between requests. This makes it ideal for mobile apps and SPAs that communicate with an API, because cookies do not work well across different domains or platforms.

## What Breeze and Jetstream Actually Give You

Laravel Breeze is the simplest scaffolding option. It generates minimal Blade, Vue, or React views for login, registration, password reset, email verification, and profile management. It is intentionally lightweight — you get all the essential auth features without opinionated extras, and the generated code is straightforward enough to read and modify.

Laravel Jetstream is the heavier option. It includes everything Breeze has, plus two-factor authentication, API token management (useful for SPA or mobile clients), team management (multi-tenant apps), and session management (view and revoke active sessions). Jetstream uses either Livewire (for a full-stack Laravel experience) or Inertia.js (for an SPA-like experience with Vue or React). Choose Breeze when you want simplicity and full control. Choose Jetstream when you need the extra features out of the box.

```bash
# Breeze — minimal auth scaffolding
composer require laravel/breeze --dev
php artisan breeze:install blade   # Or: vue, react
php artisan migrate
npm install && npm run build

# Jetstream — full-featured auth with teams, 2FA, API tokens
composer require laravel/jetstream
php artisan jetstream:install livewire   # Or: inertia
php artisan migrate
npm install && npm run build
```

After installing Breeze, you get these routes automatically:
- `/register` — User registration
- `/login` — User login
- `/forgot-password` — Password reset request
- `/reset-password` — Password reset form
- `/verify-email` — Email verification
- `/confirm-password` — Password confirmation for sensitive actions
- `/profile` — Profile management

## How Authentication Actually Works Under the Hood

Breeze and Jetstream are convenience wrappers. Understanding what they actually do is important because eventually you will need to customize the behavior or debug an issue. The core of Laravel's authentication is the `Auth` facade (or `auth()` helper), the `User` model (which extends `Authenticatable`), and the session/cookie middleware.

When you call `Auth::attempt(['email' => $email, 'password' => $password])`, Laravel does not just look up the user in the database. It retrieves the user by email, then uses the `Hash` facade to compare the submitted password against the stored hash using bcrypt or argon2. Password hashes are one-way — even if someone accesses your database, they cannot reverse the hash back to the original password. If the hash matches, Laravel creates a session, regenerates the session ID (to prevent session fixation attacks), and stores the user's ID in the session. On every subsequent request, the `auth` middleware reads the session, looks up the user, and makes them available via `auth()->user()`.

```php
// app/Models/User.php — the User model comes with auth features built in
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
            'password' => 'hashed',  // Auto-hashes when you set the password
        ];
    }
}
```

## Manual Authentication — Building It Yourself

If you choose not to use Breeze or Jetstream, or if you need a custom auth flow, you can implement authentication manually. The key pieces are: hash the password on registration, attempt to verify credentials on login, regenerate the session after successful login, and invalidate the session on logout. This is essentially what Breeze does behind the scenes, written out explicitly.

```php
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

// Registration
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
        $request->session()->regenerate(); // Prevents session fixation
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
    $request->session()->regenerateToken(); // New CSRF token
    return redirect('/');
}
```

Notice the `$request->session()->regenerate()` call after a successful login. This is critical for security. Without it, an attacker who manages to obtain a user's session ID before they log in could use that same session ID after login to impersonate the user. Regenerating the session ID creates a brand new session, making the old one useless.

## The Auth Helper and Facade

Once a user is logged in, you need to access their information throughout your application. Laravel provides several ways to do this. The `auth()` helper and `Auth` facade both give you access to the currently authenticated user, let you check if someone is logged in, log users in or out programmatically, and even attempt authentication with additional conditions (like checking that the user's account is active).

```php
// Get the authenticated user
$user = auth()->user();

// Check if someone is logged in
if (auth()->check()) {
    // User is logged in
}

// Get just the ID (avoids a database query if you only need the ID)
$id = auth()->id();

// Log in a specific user programmatically
Auth::login($user);
Auth::loginUsingId(1);

// Check credentials without actually logging in
Auth::once($credentials);

// Attempt with extra conditions (e.g., user must be active)
if (Auth::attempt(['email' => $email, 'password' => $password, 'active' => true])) {
    // Active user authenticated
}
```

## Protecting Routes With Middleware

Authentication is useless if you do not enforce it. The `auth` middleware ensures that only logged-in users can access certain routes. If an unauthenticated user tries to visit a protected route, Laravel redirects them to the login page (for web routes) or returns a 401 error (for API routes). The `guest` middleware does the opposite — it redirects logged-in users away, which is useful for the login and register pages (there is no reason a logged-in user should see those).

```php
// Routes that require authentication
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
});

// Routes only for guests (not logged in)
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'show'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});
```

## Password Reset

Password reset is a feature that every app needs but nobody enjoys building. It involves generating a unique token, storing it in the database, emailing it to the user as a link, verifying the token when they click it, allowing them to set a new password, and then expiring the token so it cannot be reused. Laravel handles all of this with the `Password` facade and a few database migrations. The `password_reset_tokens` table stores the tokens with expiration timestamps.

```php
use Illuminate\Support\Facades\Password;

// Send a reset link via email
public function sendResetLink(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $status = Password::sendResetLink($request->only('email'));

    return $status === Password::RESET_LINK_SENT
        ? back()->with('status', __($status))
        : back()->withErrors(['email' => __($status)]);
}

// Reset the password using the token from the email
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

Email verification proves that the user actually owns the email address they signed up with. Without it, someone could register with your email address and impersonate you. To enable it, the `User` model implements the `MustVerifyEmail` interface. Laravel then automatically sends a verification email when the user registers, provides a route for them to click the verification link, and gives you the `verified` middleware to restrict access to verified users only.

```php
// Add the interface to the User model
use Illuminate\Contracts\Auth\MustVerifyEmail;

class User extends Authenticatable implements MustVerifyEmail
{
    // ...
}

// Protect routes that require a verified email
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
});

// Manually check or trigger verification
$user->hasVerifiedEmail();
$user->markEmailAsVerified();
$user->sendEmailVerificationNotification();
```

## Password Confirmation

Some actions are sensitive enough that you want to re-verify the user's identity even though they are already logged in — things like deleting an account, changing the email address, or making a large purchase. Laravel provides a `password.confirm` middleware that forces the user to re-enter their password before proceeding. It stores a timestamp in the session so they do not have to re-enter it for every single request — just once per timeout period (configurable, default is 3 hours).

```php
Route::middleware(['auth', 'password.confirm'])->group(function () {
    Route::get('/settings/delete', [SettingsController::class, 'confirmDelete']);
    Route::delete('/settings/account', [SettingsController::class, 'destroy']);
});
```

## Social Authentication With OAuth

Not every user wants to create yet another username and password. Social login lets them sign in with their existing Google, GitHub, or Facebook account. Laravel Socialite handles the OAuth flow — redirecting the user to the provider, handling the callback, and extracting the user's profile information. You then find or create a local user account linked to their social profile. The key thing to understand is that you never see or handle the user's password from the social provider — the provider handles authentication and just tells you "this person is who they claim to be."

```bash
composer require laravel/socialite
```

```php
use Laravel\Socialite\Facades\Socialite;

// Redirect to the OAuth provider
Route::get('/auth/github', [GitHubController::class, 'redirect']);
Route::get('/auth/github/callback', [GitHubController::class, 'callback']);

class GitHubController extends Controller
{
    public function redirect()
    {
        return Socialite::driver('github')->redirect();
    }

    public function callback()
    {
        $githubUser = Socialite::driver('github')->user();

        // Find or create a local user linked to this GitHub account
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

In your Blade views, you often need to show different content depending on whether the user is logged in or what type of user they are. Laravel provides the `@auth` and `@guest` directives for this, which are cleaner and more readable than wrapping everything in `if(auth()->check())`.

```blade
@auth
    <p>Welcome, {{ auth()->user()->name }}!</p>
@endauth

@guest
    <a href="{{ route('login') }}">Login</a>
@endguest

{{-- You can also check against a specific guard --}}
@auth('admin')
    <p>Admin Panel</p>
@endauth
```
