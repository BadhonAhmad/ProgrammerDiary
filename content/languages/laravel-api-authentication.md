---
title: "Laravel API Authentication — Sanctum & Passport"
date: "2025-01-17"
tags: ["laravel", "api", "authentication", "sanctum", "tokens", "php"]
excerpt: "Secure your Laravel APIs with token-based authentication using Sanctum and Passport — issuing tokens, protecting routes, and SPA authentication."
---

# Laravel API Authentication — Sanctum & Passport

## Why APIs Cannot Use Cookies and Sessions

Traditional web authentication relies on cookies and sessions. The user logs in, the server creates a session and sends a cookie to the browser, and the browser automatically includes that cookie with every subsequent request. This works because browsers are designed to handle cookies automatically. But APIs serve more than just browsers — they serve mobile apps, desktop applications, other servers, and SPAs running on different domains. Mobile apps do not have a built-in cookie jar. Cross-origin SPAs cannot send cookies to a different domain without running into CORS issues. And sessions are stateful — the server has to remember who is logged in, which breaks the stateless nature of REST APIs.

This is why APIs use tokens instead. A token is a piece of data (usually a long random string) that proves the client's identity. The client obtains a token by sending credentials (email and password) to a login endpoint. The server validates the credentials and returns the token. From that point on, the client includes the token in an `Authorization: Bearer <token>` header with every request. The server validates the token on each request and identifies the user. No cookies, no sessions, no server-side state to manage. The token itself carries all the information needed.

## How Token-Based Authentication Works Conceptually

Think of a token like a hotel keycard. You go to the front desk (the login endpoint), prove who you are with your ID (email and password), and the desk gives you a keycard (the token). For the rest of your stay, you use the keycard to access your room, the gym, the pool — you never need to show your ID again. When you check out (logout), the hotel deactivates the keycard. If you lose the keycard, someone else could use it, which is why tokens should have expiration times and should be revoked when compromised.

There are two types of tokens in common use. Self-contained tokens (like JWTs) contain all the user information encoded within the token itself — the server does not need to look anything up in a database to validate them. Reference tokens (what Sanctum uses) are random strings stored in a database, mapped to a user. The server looks up the token in the database on each request to identify the user. Each approach has tradeoffs: JWTs are faster (no database lookup) but harder to revoke, while reference tokens are easier to revoke and inspect but require a database query per request.

## Laravel Sanctum — Simple Token Auth for Most Apps

Sanctum is Laravel's recommended solution for API authentication. It is lightweight, easy to set up, and handles two distinct scenarios: token-based authentication for mobile apps and third-party clients, and cookie-based SPA authentication for JavaScript frontends on the same domain. You do not need to choose between these — Sanctum supports both simultaneously.

For token-based auth (mobile apps, third-party clients), the flow is straightforward. The user sends their credentials to a login endpoint, Sanctum generates a token, stores its hash in the database, and returns the plain text token to the client. The client stores this token (in local storage, keychain, or secure storage on mobile) and sends it with every request. When the user logs out, the token is deleted from the database and cannot be used again.

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### Issuing and Using Tokens

The login endpoint validates credentials and returns a plain text token. Notice that we pass a `device_name` when creating the token. This lets users see which devices have active tokens (e.g., "iPhone 15", "Chrome on MacBook") and revoke specific ones if a device is lost or compromised — similar to how GitHub shows your active sessions.

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Login — exchange credentials for a token
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required',
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $user->createToken($request->device_name)->plainTextToken;
    // Returns something like: "1|abc123def456..."
}

// Logout — revoke the current token
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json(['message' => 'Logged out']);
}
```

The client sends the token in the `Authorization` header with every request:

```bash
curl -H "Authorization: Bearer 1|abc123def456..." \
     https://your-app.com/api/posts
```

```javascript
// JavaScript
const response = await fetch('/api/posts', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    },
});
```

### Token Abilities (Scopes)

Not all tokens should have the same level of access. A mobile app might need full read and write permissions, but a third-party integration might only need read access. Token abilities (also called scopes) let you limit what each token can do. You specify abilities when creating the token, and check them in your controllers or middleware. If a token does not have the required ability, the request is denied.

```php
// Create a token with limited abilities
$token = $user->createToken('my-app', ['post:read', 'post:write'])->plainTextToken;

// Check abilities in controllers
if ($request->user()->tokenCan('post:write')) {
    $post = Post::create($validated);
}

// Or enforce via middleware
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('abilities:post:read');   // Must have this ability

Route::post('/posts', [PostController::class, 'store'])
    ->middleware('ability:post:write');    // Must have ALL listed abilities
```

### Protecting API Routes

Use the `auth:sanctum` middleware to protect routes that require authentication. This tells Laravel to look for a valid Sanctum token in the request headers and authenticate the user if one is found.

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('posts', PostController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

### Managing Tokens

Users should be able to see and manage their active tokens, just like managing active sessions in Google or GitHub. You can list all tokens for a user, revoke individual tokens, or revoke everything (which effectively logs the user out on all devices). This is why the `device_name` matters — it provides context for which token belongs to which device.

```php
// List all active tokens
$user->tokens;

// Inspect the current token
$user->currentAccessToken();
$user->currentAccessToken()->name;       // e.g., "iPhone 15"
$user->currentAccessToken()->abilities;  // e.g., ["post:read", "post:write"]

// Revoke a specific token (logout from one device)
$user->tokens()->where('id', $tokenId)->delete();

// Revoke all tokens (logout from everywhere)
$user->tokens()->delete();

// Revoke all except the current one
$user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
```

## SPA Authentication — Different From Mobile Auth

Here is a subtlety that trips people up. If your React or Vue SPA runs on the same domain as your Laravel API (e.g., `myapp.com` for both the SPA and the API), you actually do not need tokens at all. Sanctum can use Laravel's standard cookie-based session authentication for SPAs. This might seem contradictory after everything said about tokens, but the key difference is that same-origin SPAs can send cookies, so the traditional session approach works fine and is actually more secure — the cookie is `HttpOnly` (JavaScript cannot read it) and protected by CSRF tokens.

The flow is: first, the SPA requests a CSRF cookie from Sanctum, then it sends the login credentials. Sanctum sets a session cookie, and all subsequent requests from the SPA automatically include it. No token management, no local storage, no risk of XSS stealing the token. But this only works when the SPA and API share the same top-level domain. For cross-domain setups or mobile apps, you fall back to token auth.

```php
// config/sanctum.php — define which domains are considered "same origin"
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
    env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

```javascript
// SPA frontend flow (React/Vue on same domain)
// 1. Get CSRF cookie
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });

// 2. Login — sets a session cookie
await fetch('/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
});

// 3. Subsequent requests automatically include the session cookie
await fetch('/api/user', { credentials: 'include' });
```

## When You Need Passport (and OAuth2)

Sanctum covers most authentication scenarios: SPAs, mobile apps, and simple token-based APIs. But if you need to let third-party applications access your users' data through your API, you need OAuth2. Think of it like "Log in with Google" — but in reverse. You are building the service that other apps connect to. Your users authorize a third-party app to access their data on your platform, and your API issues tokens to that third-party app on the user's behalf. This is what Laravel Passport provides.

OAuth2 defines several "grant types" for different scenarios. The Authorization Code grant is for third-party web apps — the user is redirected to your site to approve access, then redirected back with a code that the app exchanges for a token. The Client Credentials grant is for server-to-server communication — no user is involved, just two machines authenticating. The Password grant is for first-party apps you trust with the user's credentials directly (though this is increasingly discouraged in favor of more secure flows). You only need Passport if one of these scenarios applies to you. For everything else, Sanctum is simpler and sufficient.

```bash
composer require laravel/passport
php artisan migrate
php artisan passport:install
```

```php
// app/Models/User.php — swap in Passport's trait
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
}
```

### OAuth2 Grant Types in Practice

The Password Grant is the simplest OAuth2 flow. The client sends the user's credentials directly to the token endpoint and receives an access token and refresh token. This is only appropriate for first-party applications that you control, where the user trusts the app with their password. Never use this for third-party apps.

```php
// Password Grant — for your own first-party apps
$http = new GuzzleHttp\Client;
$response = $http->post(url('/oauth/token'), [
    'form_params' => [
        'grant_type' => 'password',
        'client_id' => config('services.passport.client_id'),
        'client_secret' => config('services.passport.client_secret'),
        'username' => $request->email,
        'password' => $request->password,
        'scope' => '',
    ],
]);
// Returns: { "access_token": "...", "refresh_token": "...", "expires_in": 31536000 }
```

The Client Credentials Grant is for machine-to-machine communication. No user is involved — two servers authenticate using a client ID and secret, and the server issues a token with the permissions of the client, not any specific user.

```php
// Client Credentials Grant — machine to machine
$response = $http->post(url('/oauth/token'), [
    'form_params' => [
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'scope' => '',
    ],
]);
```

The Authorization Code Grant is the full OAuth2 flow for third-party apps. The user is redirected to your authorization page, they approve or deny the request, and the third-party app receives a code it can exchange for a token. This is the most secure flow because the third-party app never sees the user's credentials.

```php
// Authorization Code Grant — for third-party apps
// Step 1: Redirect the user to approve access
Route::get('/redirect', function () {
    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://example.com/callback',
        'response_type' => 'code',
        'scope' => '',
    ]);
    return redirect('/oauth/authorize?' . $query);
});

// Step 2: Handle the callback with the authorization code
Route::get('/callback', function (Request $request) {
    $response = (new GuzzleHttp\Client)->post(url('/oauth/token'), [
        'form_params' => [
            'grant_type' => 'authorization_code',
            'client_id' => 'client-id',
            'client_secret' => 'client-secret',
            'redirect_uri' => 'http://example.com/callback',
            'code' => $request->code,
        ],
    ]);
});
```

### Token Scopes in Passport

Just like Sanctum abilities, Passport supports scopes to limit what a token can access. You define the available scopes in your `AuthServiceProvider`, and the client requests specific scopes during authorization. This gives users visibility into what data a third-party app is requesting access to.

```php
// Define available scopes
Passport::tokensCan([
    'read-posts' => 'Read blog posts',
    'write-posts' => 'Create and edit blog posts',
    'admin' => 'Full administrative access',
]);

Passport::setDefaultScope(['read-posts']);
```

```php
// Check scopes in controllers or middleware
$request->user()->tokenCan('read-posts');

// Or via middleware
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('scope:read-posts');
```

## Sanctum vs Passport — Which One?

The rule of thumb is simple. If you are building an API consumed by your own SPA, mobile app, or simple third-party clients, use Sanctum. If you are building an OAuth2 provider that lets other developers build applications on top of your platform, use Passport. Many applications never need Passport. Do not reach for it just because OAuth2 sounds more enterprise-y — the added complexity is only justified when you actually need to authorize third-party applications.

| Feature | Sanctum | Passport |
|---------|---------|----------|
| Setup | Simple | Complex |
| Token auth | Yes | Yes |
| SPA auth (cookie-based) | Yes | No |
| Full OAuth2 server | No | Yes |
| Third-party app authorization | Basic | Full support |
| Best for | Most apps | OAuth2 providers |
