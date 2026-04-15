---
title: "Laravel API Authentication — Sanctum & Passport"
date: "2025-01-17"
tags: ["laravel", "api", "authentication", "sanctum", "tokens", "php"]
excerpt: "Secure your Laravel APIs with token-based authentication using Sanctum and Passport — issuing tokens, protecting routes, and SPA authentication."
---

# Laravel API Authentication — Sanctum & Passport

Unlike web authentication (cookies/sessions), APIs use **tokens** for stateless authentication. Laravel offers two main packages for this.

## Laravel Sanctum (Recommended)

Sanctum is a lightweight authentication system for SPAs, mobile apps, and simple token-based APIs.

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### How Sanctum Works

Sanctum offers two modes:
1. **SPA Authentication** — Cookie-based, for frontends on the same domain
2. **API Tokens** — Token-based, for mobile apps and third-party clients

### API Token Authentication

Users get API tokens that they include in request headers.

#### Issue Tokens

```php
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

// Login and issue token
public function login(Request $request)
{
    $request->validate([
        'email' => 'required|email',
        'password' => 'required',
        'device_name' => 'required',  // Name of the device/app
    ]);

    $user = User::where('email', $request->email)->first();

    if (!$user || !Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    return $user->createToken($request->device_name)->plainTextToken;
    // Returns: "1|abc123def456..."
}

// Register and issue token
public function register(Request $request)
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users',
        'password' => 'required|string|min:8|confirmed',
        'device_name' => 'required',
    ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);

    return $user->createToken($validated['device_name'])->plainTextToken;
}

// Logout (revoke current token)
public function logout(Request $request)
{
    $request->user()->currentAccessToken()->delete();

    return response()->json(['message' => 'Logged out']);
}
```

#### Token Abilities (Scopes)

```php
// Create token with specific abilities
$token = $user->createToken('my-app', ['post:read', 'post:write'])->plainTextToken;

// Check abilities in controllers
if ($request->user()->tokenCan('post:write')) {
    $post = Post::create($validated);
}

// Or in middleware
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('abilities:post:read');

Route::post('/posts', [PostController::class, 'store'])
    ->middleware('ability:post:write');  // Must have ALL listed abilities
```

#### Protect API Routes

```php
// routes/api.php
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::apiResource('posts', PostController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
});
```

#### Using the Token

```bash
# Include token in API requests
curl -H "Authorization: Bearer 1|abc123def456..." \
     https://your-app.com/api/posts
```

```javascript
// JavaScript/Fetch
const response = await fetch('/api/posts', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
    },
});

// Axios
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

#### Token Management

```php
// List all tokens for a user
$user->tokens;

// Get token details
$user->currentAccessToken();
$user->currentAccessToken()->name;       // "my-app"
$user->currentAccessToken()->abilities;  // ["post:read", "post:write"]

// Revoke a specific token
$user->tokens()->where('id', $tokenId)->delete();

// Revoke all tokens (logout everywhere)
$user->tokens()->delete();

// Revoke all tokens except current
$user->tokens()->where('id', '!=', $user->currentAccessToken()->id)->delete();
```

### SPA Authentication

For single-page apps (React, Vue) on the same domain as your Laravel API:

```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000,::1',
    env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

```javascript
// Frontend (React/Vue)
// Login
await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
await fetch('/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
});

// Subsequent requests use cookies automatically
await fetch('/api/user', { credentials: 'include' });
```

## Laravel Passport (OAuth2)

Passport provides a full OAuth2 server implementation. Use it when you need:
- Third-party app authorization
- Complex OAuth2 flows
- OAuth2 grant types (authorization code, client credentials, etc.)

```bash
composer require laravel/passport
php artisan migrate
php artisan passport:install
```

```php
// app/Models/User.php
use Laravel\Passport\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;
}
```

### Protect Routes with Passport

```php
Route::middleware('auth:api')->get('/user', function (Request $request) {
    return $request->user();
});
```

### OAuth2 Grant Types

#### Password Grant (First-Party Apps)

```php
// Issue token
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

#### Client Credentials Grant (Machine to Machine)

```php
$response = $http->post(url('/oauth/token'), [
    'form_params' => [
        'grant_type' => 'client_credentials',
        'client_id' => $clientId,
        'client_secret' => $clientSecret,
        'scope' => '',
    ],
]);
```

#### Authorization Code Grant (Third-Party Apps)

```php
// Redirect user to authorization page
Route::get('/redirect', function () {
    $query = http_build_query([
        'client_id' => 'client-id',
        'redirect_uri' => 'http://example.com/callback',
        'response_type' => 'code',
        'scope' => '',
    ]);
    return redirect('/oauth/authorize?' . $query);
});

// Handle callback
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

### Token Scopes

```php
// AuthServiceProvider boot method
Passport::tokensCan([
    'read-posts' => 'Read blog posts',
    'write-posts' => 'Create and edit blog posts',
    'admin' => 'Full administrative access',
]);

Passport::setDefaultScope(['read-posts']);
```

```php
// Check scopes in middleware
Route::get('/posts', [PostController::class, 'index'])
    ->middleware('scope:read-posts');

// Check in controllers
$request->user()->tokenCan('read-posts');
```

## Sanctum vs Passport

| Feature | Sanctum | Passport |
|---------|---------|----------|
| Setup complexity | Simple | Complex |
| Token auth | Yes | Yes |
| SPA auth | Yes | No |
| OAuth2 server | No | Yes |
| Third-party apps | Basic | Full support |
| Use case | Most apps | OAuth2 provider |

## Best Practices

1. **Use Sanctum unless you need OAuth2** — It's simpler and covers most use cases
2. **Hash tokens** — Store only hashed tokens in the database
3. **Use token abilities** — Limit what each token can do
4. **Set token expiration** — Don't let tokens live forever
5. **Use HTTPS** — Tokens must travel over encrypted connections
6. **Revoke tokens on logout** — Don't just delete client-side
7. **Rate limit auth endpoints** — Prevent brute-force login attempts
