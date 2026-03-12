---
title: "Interfaces in TypeScript: Why They Exist and When to Use Them"
date: "2026-03-12"
tags: ["typescript", "interfaces", "types", "oop", "classes"]
excerpt: "Type aliases can describe almost anything — so why does TypeScript also have interfaces? Because interfaces were built specifically for object shapes and class contracts, and that distinction matters more than you think."
---

# Interfaces in TypeScript: Why They Exist and When to Use Them

Before learning interfaces, you probably already know `type` aliases:

```ts
type TeaRecipe = {
  water: number;
  milk: number;
};
```

That works perfectly. So why does TypeScript also give you this?

```ts
interface TeaRecipe {
  water: number;
  milk: number;
}
```

Both look the same. Both work the same for basic object shapes. So what's the point of `interface`?

---

## The Core Reason: Classes and `implements`

Interfaces were born from **Object-Oriented Programming**. The original purpose was to act as a **contract** that a class must fulfill.

```ts
interface TeaRecipe {
  water: number;
  milk: number;
}

class MasalaChai implements TeaRecipe {
  water = 100;
  milk = 50;
}
```

The `implements` keyword says: *"This class promises to have all the properties and methods defined in the interface."*

If you forget a property, TypeScript catches it immediately:

```ts
class MasalaChai implements TeaRecipe {
  water = 100;
  // ❌ Error: Property 'milk' is missing in type 'MasalaChai'
}
```

This is enforced at compile time — you can't ship incomplete implementations.

---

## Why Not Use a Type Alias for `implements`?

Here's the catch shown in the image:

```ts
// ❌ This is a union type — NOT an object shape
type CupSize = "small" | "large";

class Chai implements CupSize {
  // Error ts(2422): A class can only implement an object type
  // or intersection of object types with statically known members.
}
```

TypeScript **refuses** to let a class implement a union type or a primitive type alias. These are not object contracts — they're value constraints.

But if you define it as an interface (an object shape):

```ts
// ✅ This is an object shape — perfectly implementable
interface CupSize {
  size: "small" | "large";
}

class Chai implements CupSize {
  size: "small" | "large" = "large";  // ✅ Contract fulfilled
}
```

Now it works. An interface always describes an **object's shape**, so a class can always implement it.

---

## The Key Difference: Interface vs Type Alias

| Feature | `interface` | `type` |
|---|---|---|
| Describes object shapes | ✅ | ✅ |
| Can describe primitives | ❌ | ✅ (`type ID = string`) |
| Can describe union types | ❌ | ✅ (`type X = A \| B`) |
| Can describe tuples | ❌ | ✅ (`type Point = [number, number]`) |
| Class `implements` | ✅ Always works | ⚠️ Only for object types |
| Declaration merging | ✅ | ❌ |
| Extends other interfaces | ✅ | ✅ (via `&`) |

---

## Declaration Merging — A Unique Interface Superpower

Interfaces can be **declared multiple times** and TypeScript merges them automatically:

```ts
interface User {
  name: string;
}

interface User {
  age: number;
}

// TypeScript merges both into:
// interface User { name: string; age: number; }

const u: User = { name: "Nobel", age: 22 };  // ✅
```

With `type`, this causes an error:

```ts
type User = { name: string };
type User = { age: number };  // ❌ Error: Duplicate identifier 'User'
```

This is why most **library type definitions** (like `@types/express`) use interfaces — they can be extended by users without touching the original source.

---

## Extending Interfaces

Interfaces can inherit from other interfaces using `extends`:

```ts
interface Beverage {
  name: string;
  temperature: "hot" | "cold";
}

interface TeaRecipe extends Beverage {
  water: number;
  milk: number;
}

class MasalaChai implements TeaRecipe {
  name = "Masala Chai";
  temperature: "hot" | "cold" = "hot";
  water = 100;
  milk = 50;
}
```

A class can implement **multiple interfaces** at once:

```ts
interface Printable {
  print(): void;
}

interface Serializable {
  toJSON(): string;
}

class Order implements Printable, Serializable {
  print() { console.log("Printing order..."); }
  toJSON() { return JSON.stringify(this); }
}
```

This is how TypeScript models real-world OOP design patterns.

---

## Interface for Function Shapes

Interfaces aren't only for objects with properties — they can describe function signatures too:

```ts
interface Transformer {
  (input: string): string;
}

const toUpperCase: Transformer = (s) => s.toUpperCase();
const trim: Transformer = (s) => s.trim();
```

And callable objects with additional properties:

```ts
interface Logger {
  (message: string): void;    // call signature
  level: "info" | "error";   // property
}
```

---

## When to Use Interface vs Type

**Use `interface` when:**
- You're describing the shape of an **object or class**
- You're writing code that others will **extend or implement** (libraries, design patterns)
- You want **declaration merging** across multiple files
- You're using OOP patterns with `implements`

**Use `type` when:**
- You need **unions** (`type Status = "active" | "inactive"`)
- You need **tuples** (`type Point = [number, number]`)
- You need **primitive aliases** (`type ID = string`)
- You're writing a **computed type** using conditionals or mapped types

In practice: for plain object shapes in application code, either works. But the moment you write `implements`, reach for `interface`.

---

## Real-World Example: A Repository Pattern

```ts
// Define the contract as an interface
interface UserRepository {
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: number): Promise<void>;
}

// Implement for PostgreSQL
class PostgresUserRepository implements UserRepository {
  async findById(id: number) { /* SQL query */ }
  async save(user: User) { /* INSERT/UPDATE */ }
  async delete(id: number) { /* DELETE */ }
}

// Implement for testing (in-memory mock)
class InMemoryUserRepository implements UserRepository {
  private store = new Map<number, User>();

  async findById(id: number) { return this.store.get(id) ?? null; }
  async save(user: User) { this.store.set(user.id, user); }
  async delete(id: number) { this.store.delete(id); }
}
```

Both classes fulfill the same interface. Your service layer accepts `UserRepository` and doesn't care which implementation it gets — this is called **dependency inversion**, one of the SOLID principles.

---

## Summary

Interfaces exist because TypeScript needed a first-class way to define **object contracts** that classes can fulfill.

| Rule | Explanation |
|---|---|
| Classes use `implements` with interfaces | Only object shapes can be implemented |
| `type` unions can't be implemented | A class can't "implement" `"small" \| "large"` |
| Interfaces support declaration merging | Useful for library extensibility |
| Interfaces extend with `extends` | Cleaner than type intersections for OOP |
| Use `interface` for class contracts | Use `type` for unions, tuples, computed types |

The short answer: **interfaces were made for classes**. Types were made for everything else. When TypeScript added `type` aliases, it made many use cases overlap — but `implements` and declaration merging are still things only interfaces do cleanly.
