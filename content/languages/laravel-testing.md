---
title: "Laravel Testing — PHPUnit & Pest"
date: "2025-01-21"
tags: ["laravel", "testing", "phpunit", "pest", "php"]
excerpt: "Write automated tests for your Laravel application — feature tests, unit tests, HTTP tests, database tests, and testing best practices."
---

# Laravel Testing — PHPUnit & Pest

Testing ensures your application works correctly and gives you confidence to make changes without breaking things. Laravel is built with testing in mind.

## Setup

Laravel uses **PHPUnit** by default. **Pest** is a elegant alternative with a cleaner syntax.

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

```
tests/
├── Feature/              ← Feature tests (end-to-end)
│   ├── PostTest.php
│   ├── AuthTest.php
│   └── Api/
│       └── PostApiTest.php
├── Unit/                 ← Unit tests (isolated logic)
│   ├── PostTest.php
│   └── Services/
│       └── PaymentServiceTest.php
├── TestCase.php          ← Base test case
└── Pest.php              ← Pest configuration (if using Pest)
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

Feature tests make HTTP requests to your application and test the full stack:

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

Pest provides a cleaner, more readable syntax:

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

1. **Use `RefreshDatabase`** — Always reset the database between tests
2. **Use factories** — Generate test data with factories, not manual inserts
3. **Test behavior, not implementation** — Test what the user experiences
4. **Test the unhappy path** — Validation errors, unauthorized access, 404s
5. **Use meaningful test names** — `test_user_can_create_post`, not `test_post_1`
6. **Write tests first** — TDD when possible (write test, then implement)
7. **Keep tests independent** — Each test should work in isolation
8. **Run tests before every commit** — Catch regressions early
