---
title: "Laravel Testing — PHPUnit & Pest"
date: "2025-01-21"
tags: ["laravel", "testing", "phpunit", "pest", "php"]
excerpt: "Write automated tests for your Laravel application — feature tests, unit tests, HTTP tests, database tests, and testing best practices."
---

# Laravel Testing -- PHPUnit & Pest

Why write tests at all? Imagine you have an e-commerce app with 40 routes, 15 controllers, and a dozen middleware. A client asks you to add a "buy now, pay later" option. You change the checkout flow, modify some blade templates, add a new column to the orders table, and update the discount calculation logic. It works on your machine. You deploy. Two hours later you discover that the discount change broke the admin dashboard, the new column caused a 500 error on the order history page, and the existing credit card checkout now sends duplicate confirmation emails. Without tests, the only way to catch these regressions is to manually click through every page of the application after every change. Nobody does that. Tests are your safety net -- they catch regressions automatically and give you the confidence to refactor and add features without fear.

There are two main types of tests. **Unit tests** test a single piece of logic in isolation -- a method on a class, a calculation, a data transformation. They are fast and narrow. **Feature tests** test a whole flow from start to finish -- simulate an HTTP request, run it through routing, middleware, controllers, and the database, and assert that the response is correct. Feature tests are slower but they catch real bugs. The "testing pyramid" says you should have many unit tests at the bottom (fast, focused), fewer feature tests in the middle, and very few end-to-end browser tests at the top. In practice, Laravel developers tend to write mostly feature tests because they give the most bang for the buck -- they test your app the way a user actually experiences it, and they are still fast enough to run in seconds.

## Setup

Laravel ships with PHPUnit configured out of the box. Pest is an alternative test framework with a cleaner, more expressive syntax. Both run the same assertions under the hood -- Pest is essentially a more pleasant way to write the same tests.

```bash
# Run all tests
php artisan test

# Or via PHPUnit
./vendor/bin/phpunit

# Run specific test file
php artisan test --filter=PostTest

# Run a specific test method
php artisan test --filter=test_can_create_post

# Run with coverage
php artisan test --coverage

# Parallel testing (faster)
php artisan test --parallel
```

### Installing Pest (Optional)

```bash
composer require pestphp/pest --dev --with-all-dependencies
php artisan pest:install
```

## Test Structure

Laravel organizes tests into two directories. `tests/Feature/` holds feature tests that exercise the full application stack. `tests/Unit/` holds unit tests for isolated logic. The `TestCase.php` base class is shared by both, and `Pest.php` contains Pest-specific configuration.

```
tests/
├── Feature/              <-- Feature tests (end-to-end)
│   ├── PostTest.php
│   ├── AuthTest.php
│   └── Api/
│       └── PostApiTest.php
├── Unit/                 <-- Unit tests (isolated logic)
│   ├── PostTest.php
│   └── Services/
│       └── PaymentServiceTest.php
├── TestCase.php          <-- Base test case
└── Pest.php              <-- Pest configuration (if using Pest)
```

### Creating Tests

```bash
# Feature test
php artisan make:test PostTest

# Unit test
php artisan make:test PostTest --unit

# Pest test
php artisan make:test PostTest --pest
```

## Feature Tests

Feature tests are where most of your testing effort should go. Each test simulates an HTTP request, hits your routes, runs through middleware and controllers, interacts with the database, and returns a response. You then assert things about that response: the status code, the content, whether data was created in the database. The `RefreshDatabase` trait is critical here -- it resets the database to a clean state before each test so tests do not interfere with each other. Without it, test #1's created user would still be in the database when test #2 runs, leading to unpredictable results.

Notice how the tests below cover both the "happy path" (a user creates a post successfully) and the "unhappy path" (a guest cannot create a post, validation fails, a user cannot edit someone else's post). Testing the unhappy path is just as important as testing the happy path because most security vulnerabilities and bugs live in edge cases, not in the main flow.

```php
// tests/Feature/PostTest.php
namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;  // Reset database after each test

    public function test_guest_can_view_published_posts(): void
    {
        $publishedPost = Post::factory()->create(['status' => 'published']);
        $draftPost = Post::factory()->create(['status' => 'draft']);

        $response = $this->get('/posts');

        $response->assertStatus(200);
        $response->assertSee($publishedPost->title);
        $response->assertDontSee($draftPost->title);
    }

    public function test_authenticated_user_can_create_post(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', [
            'title' => 'My First Post',
            'content' => 'This is the content of my first post.',
            'status' => 'draft',
        ]);

        $response->assertRedirect('/posts');

        $this->assertDatabaseHas('posts', [
            'title' => 'My First Post',
            'user_id' => $user->id,
        ]);
    }

    public function test_guest_cannot_create_post(): void
    {
        $response = $this->post('/posts', [
            'title' => 'Unauthorized Post',
            'content' => 'This should not work.',
        ]);

        $response->assertRedirect('/login');
        $this->assertDatabaseMissing('posts', [
            'title' => 'Unauthorized Post',
        ]);
    }

    public function test_post_requires_title_and_content(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/posts', []);

        $response->assertSessionHasErrors(['title', 'content']);
    }

    public function test_user_can_update_own_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $response = $this->actingAs($user)->put("/posts/{$post->id}", [
            'title' => 'Updated Title',
            'content' => 'Updated content.',
        ]);

        $response->assertRedirect("/posts/{$post->id}");
        $this->assertDatabaseHas('posts', [
            'id' => $post->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_user_cannot_update_others_post(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $owner->id]);

        $response = $this->actingAs($other)->put("/posts/{$post->id}", [
            'title' => 'Hacked Title',
            'content' => 'Hacked content.',
        ]);

        $response->assertForbidden();
    }

    public function test_user_can_delete_own_post(): void
    {
        $user = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->delete("/posts/{$post->id}");

        $this->assertDatabaseMissing('posts', ['id' => $post->id]);
    }
}
```

## API Testing

API tests work the same way as feature tests, but you use `getJson()`, `postJson()`, and similar methods to send requests with JSON headers. The assertions are also JSON-aware: you can check the structure of the response, assert specific values at JSON paths, and verify that validation errors are returned in the expected format. `Sanctum::actingAs()` is the API equivalent of `$this->actingAs()` -- it authenticates the user via an API token instead of a session.

```php
// tests/Feature/Api/PostApiTest.php
namespace Tests\Feature\Api;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_posts(): void
    {
        Post::factory(5)->create(['status' => 'published']);

        $response = $this->getJson('/api/posts');

        $response->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'slug', 'author', 'created_at'],
                ],
            ]);
    }

    public function test_authenticated_user_can_create_post(): void
    {
        $user = Sanctum::actingAs(User::factory()->create());

        $response = $this->postJson('/api/posts', [
            'title' => 'API Post',
            'content' => 'Created via API.',
            'status' => 'draft',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.title', 'API Post');
    }

    public function test_unauthenticated_user_cannot_create_post(): void
    {
        $response = $this->postJson('/api/posts', [
            'title' => 'Unauthorized',
            'content' => 'No auth.',
        ]);

        $response->assertUnauthorized();
    }

    public function test_can_show_post(): void
    {
        $post = Post::factory()->create(['status' => 'published']);

        $response = $this->getJson("/api/posts/{$post->id}");

        $response->assertOk()
            ->assertJsonPath('data.id', $post->id)
            ->assertJsonPath('data.title', $post->title);
    }

    public function test_returns_404_for_missing_post(): void
    {
        $response = $this->getJson('/api/posts/999');

        $response->assertNotFound();
    }
}
```

## Authentication Testing

Authentication is one of the most critical areas to test because bugs here mean security vulnerabilities. These tests verify the full registration and login flow: can a user register, can they log in with correct credentials, do incorrect credentials get rejected, and does logging out actually clear the session?

```php
class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }

    public function test_user_can_login(): void
    {
        $user = User::factory()->create(['password' => bcrypt('password')]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_invalid_credentials_fail(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }
}
```

## Useful Assertion Methods

Laravel provides a rich set of assertions so you can verify almost anything about the response, the database, the session, or the authenticated user. Here is a reference of the most commonly used ones.

```php
// HTTP assertions
$response->assertStatus(200);
$response->assertOk();              // 200
$response->assertCreated();         // 201
$response->assertNotFound();        // 404
$response->assertUnauthorized();    // 401
$response->assertForbidden();       // 403
$response->assertRedirect('/url');

// View assertions
$response->assertViewIs('posts.index');
$response->assertViewHas('posts');

// Session assertions
$response->assertSessionHas('success');
$response->assertSessionHasErrors(['title', 'content']);
$response->assertSessionHasNoErrors();

// Database assertions
$this->assertDatabaseHas('users', ['email' => 'john@example.com']);
$this->assertDatabaseMissing('users', ['email' => 'deleted@example.com']);
$this->assertDatabaseCount('posts', 5);
$this->assertSoftDeleted('posts', ['id' => 1]);

// Auth assertions
$this->assertAuthenticated();
$this->assertAuthenticatedAs($user);
$this->assertGuest();

// JSON assertions
$response->assertJson(['message' => 'Created']);
$response->assertJsonPath('data.title', 'My Post');
$response->assertJsonCount(5, 'data');
$response->assertJsonStructure(['data' => ['id', 'title']]);
$response->assertJsonValidationErrors(['email']);
```

## Pest Syntax (Alternative)

Pest takes the PHPUnit assertions you see above and wraps them in a cleaner syntax. Instead of creating a class with methods prefixed by `test_`, you write `it('can do something', function () { ... })`. The `expect()` function replaces `$this->assertEquals()` and friends. Under the hood, Pest compiles to PHPUnit, so everything that works with PHPUnit works with Pest. It is purely a syntax preference -- some people find Pest more readable, especially when reading through a large test file.

```php
// tests/Feature/PostTest.php (Pest)
uses(RefreshDatabase::class);

it('can list published posts', function () {
    $published = Post::factory()->create(['status' => 'published']);
    $draft = Post::factory()->create(['status' => 'draft']);

    $this->get('/posts')
        ->assertOk()
        ->assertSee($published->title)
        ->assertDontSee($draft->title);
});

it('auth user can create post', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/posts', [
            'title' => 'New Post',
            'content' => 'Content here',
        ])
        ->assertRedirect('/posts');

    expect(Post::count())->toBe(1);
});

it('validates required fields', function () {
    $this->actingAs(User::factory()->create())
        ->post('/posts', [])
        ->assertSessionHasErrors(['title', 'content']);
});
```

## Best Practices

1. **Use `RefreshDatabase`** -- Always reset the database between tests
2. **Use factories** -- Generate test data with factories, not manual inserts
3. **Test behavior, not implementation** -- Test what the user experiences
4. **Test the unhappy path** -- Validation errors, unauthorized access, 404s
5. **Use meaningful test names** -- `test_user_can_create_post`, not `test_post_1`
6. **Write tests first** -- TDD when possible (write test, then implement)
7. **Keep tests independent** -- Each test should work in isolation
8. **Run tests before every commit** -- Catch regressions early
