---
title: "Generics in TypeScript — Write Reusable, Type-Safe Code"
date: "2025-01-23"
tags: ["typescript", "generics", "type-safety", "advanced"]
excerpt: "Master TypeScript generics — generic functions, interfaces, classes, constraints, defaults, and real-world patterns for writing reusable type-safe code."
---

# Generics in TypeScript — Write Reusable, Type-Safe Code

Generics let you write **code that works with multiple types** while keeping full type safety. Instead of writing duplicate functions for each type, you write one function that adapts.

## Why Generics?

Without generics, you'd have to either use `any` (lose type safety) or duplicate code:

```typescript
// BAD — loses type information
function identity(value: any): any {
  return value;
}
const result = identity("hello"); // type is `any` — no autocomplete, no safety

// BAD — duplicated code
function identityString(value: string): string { return value; }
function identityNumber(value: number): number { return value; }
function identityBoolean(value: boolean): boolean { return value; }

// GOOD — generic: one function, all types, full safety
function identity<T>(value: T): T {
  return value;
}
const s = identity("hello");    // type is string
const n = identity(42);         // type is number
const b = identity(true);       // type is boolean
```

## Generic Functions

### Basic Syntax

```typescript
// <T> is a type parameter — a placeholder for a type
function identity<T>(value: T): T {
  return value;
}

// TypeScript infers T from the argument
identity("hello");     // T = string
identity(42);          // T = number

// You can also explicitly specify T
identity<string>("hello");
```

### Multiple Type Parameters

```typescript
function pair<A, B>(first: A, second: B): [A, B] {
  return [first, second];
}

pair("name", 25);       // [string, number]
pair(true, [1, 2]);     // [boolean, number[]]
```

### Real-World Generic Functions

```typescript
// A safe API fetch wrapper
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

// Usage — fully typed response
interface User {
  id: number;
  name: string;
  email: string;
}

const user = await fetchJson<User>("/api/users/1");
console.log(user.name); // TypeScript knows this is a string
```

```typescript
// Array utility: unique elements
function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

unique([1, 2, 2, 3]);              // number[]
unique(["a", "b", "b", "c"]);       // string[]
```

```typescript
// A generic debounce function
function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

## Generic Constraints (`extends`)

Constrain what types a generic can accept:

```typescript
// T must have a .length property
function logLength<T extends { length: number }>(value: T): void {
  console.log(value.length);
}

logLength("hello");        // ✅ string has .length
logLength([1, 2, 3]);      // ✅ array has .length
logLength({ length: 10 }); // ✅ object has .length
logLength(123);            // ❌ number has no .length
```

### Using `keyof` as a Constraint

```typescript
// K must be a key of T
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 25, email: "alice@example.com" };

getProperty(user, "name");  // string ✅
getProperty(user, "age");   // number ✅
getProperty(user, "phone"); // ❌ "phone" is not a key of user
```

### Constraint with Another Generic

```typescript
function merge<T extends object, U extends object>(a: T, b: U): T & U {
  return { ...a, ...b };
}

const merged = merge({ name: "Alice" }, { age: 25 });
// { name: string; age: number }
```

## Generic Interfaces

```typescript
// A generic repository interface
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: Omit<T, "id">): Promise<T>;
  update(id: string, item: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implement for a specific type
interface Post {
  id: string;
  title: string;
  content: string;
  published: boolean;
}

type PostRepository = Repository<Post>;

// Now every method is fully typed:
// findById → Promise<Post | null>
// create → Promise<Post> (expects Omit<Post, "id">)
// update → Promise<Post> (expects Partial<Post>)
```

### Generic Data Structures

```typescript
interface Box<T> {
  value: T;
  map<U>(fn: (value: T) => U): Box<U>;
}

const box: Box<number> = {
  value: 42,
  map(fn) {
    return { value: fn(this.value) };
  },
};

const stringBox = box.map(n => n.toString());  // Box<string>
```

```typescript
// Generic result type (for error handling)
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { ok: false, error: "Division by zero" };
  return { ok: true, value: a / b };
}

const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // number
} else {
  console.log(result.error); // string
}
```

## Generic Classes

```typescript
class DataStore<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }

  getAll(): T[] {
    return [...this.items];
  }

  filter(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  count(): number {
    return this.items.length;
  }
}

// Usage — fully typed store
const userStore = new DataStore<{ name: string; age: number }>();
userStore.add({ name: "Alice", age: 25 });
userStore.add({ name: "Bob", age: 30 });

userStore.get(0);            // { name: string; age: number } | undefined
userStore.filter(u => u.age > 26);  // { name: string; age: number }[]
```

```typescript
// Generic EventEmitter
class EventEmitter<T extends Record<string, any>> {
  private listeners: { [K in keyof T]?: Array<(data: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, callback: (data: T[K]) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event]!.push(callback);
  }

  emit<K extends keyof T>(event: K, data: T[K]): void {
    this.listeners[event]?.forEach(cb => cb(data));
  }
}

// Typed events
interface AppEvents {
  login: { userId: string };
  logout: { reason: string };
  error: { message: string; code: number };
}

const emitter = new EventEmitter<AppEvents>();

emitter.on("login", (data) => {
  console.log(data.userId);  // TypeScript knows the shape
});

emitter.emit("login", { userId: "123" });    // ✅
emitter.emit("login", { userId: 123 });       // ❌ userId must be string
emitter.emit("error", { message: "oops", code: 500 }); // ✅
```

## Default Type Parameters

```typescript
interface PaginatedResponse<T, Meta = { total: number; page: number }> {
  data: T[];
  meta: Meta;
}

// Use default meta type
type UserResponse = PaginatedResponse<User>;
// data: User[], meta: { total: number; page: number }

// Override meta type
type CustomMeta = { total: number; page: number; hasNext: boolean };
type UserResponseCustom = PaginatedResponse<User, CustomMeta>;
```

## Generic Utility Patterns

### The `Validator<T>` Pattern

```typescript
type Validator<T> = (value: unknown) => T;

const stringValidator: Validator<string> = (value) => {
  if (typeof value !== "string") throw new Error("Expected string");
  return value;
};

const numberValidator: Validator<number> = (value) => {
  if (typeof value !== "number") throw new Error("Expected number");
  return value;
};

function arrayOf<T>(itemValidator: Validator<T>): Validator<T[]> {
  return (value) => {
    if (!Array.isArray(value)) throw new Error("Expected array");
    return value.map(itemValidator);
  };
}

// Usage
const stringArrayValidator = arrayOf(stringValidator);
stringArrayValidator(["a", "b"]); // ✅ T[] = string[]
```

### Type-Safe Event Map

```typescript
interface EventMap {
  click: { x: number; y: number };
  keypress: { key: string; ctrl: boolean };
  resize: { width: number; height: number };
}

function listen<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void,
): void {
  // implementation
}

listen("click", (data) => {
  console.log(data.x, data.y);  // TypeScript knows the shape
});

listen("click", (data) => {
  console.log(data.key);  // ❌ key doesn't exist on click event
});
```

## Common Mistakes

### 1. Using `any` Instead of Generics

```typescript
// BAD
function first(items: any[]): any {
  return items[0];
}

// GOOD
function first<T>(items: T[]): T | undefined {
  return items[0];
}
```

### 2. Over-Constraining

```typescript
// BAD — too restrictive, only works with { name: string }
function getName<T extends { name: string }>(item: T): string {
  return item.name;
}

// Consider if you actually need a generic at all:
function getName(item: { name: string }): string {
  return item.name;
}
// Both work the same — structural typing means the non-generic version is fine
```

### 3. Ignoring Inference

```typescript
// You don't always need to specify <T> — TypeScript infers it
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
  return arr.map(fn);
}

// Let TypeScript infer — don't write this:
const result = map<number, string>([1, 2, 3], n => n.toString());

// Just write this — inference handles it:
const result = map([1, 2, 3], n => n.toString());
```

## Best Practices

1. **Use generics when a function/class needs to work with multiple types** — but not when one type is enough
2. **Let TypeScript infer** — Don't explicitly specify `<T>` unless inference fails
3. **Use meaningful names** — `<T>` for single types, `<K, V>` for key-value, `<TInput, TOutput>` for transforms
4. **Constrain with `extends`** — Prevent invalid types, get better autocomplete
5. **Use `keyof`** — For type-safe property access patterns
6. **Start simple** — Don't over-genericize; add type parameters only when needed
7. **Use default type parameters** — To reduce boilerplate for common cases
