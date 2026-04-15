---
title: "Advanced Types — Mapped, Conditional & Template Literal Types"
date: "2025-01-25"
tags: ["typescript", "advanced", "mapped-types", "conditional-types", "type-level"]
excerpt: "Go beyond basic types — master mapped types, conditional types, template literal types, infer, and type-level programming patterns in TypeScript."
---

# Advanced Types — Mapped, Conditional & Template Literal Types

TypeScript's type system is **Turing-complete** — you can compute types, transform them, and build complex abstractions. This is type-level programming, and it's what makes TypeScript truly powerful.

## Mapped Types

Mapped types create new types by **transforming every property** of an existing type.

### Basic Syntax

```typescript
// The pattern: { [K in keyof T]: NewType }
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Optional<T> = {
  [K in keyof T]?: T[K];
};

interface User {
  name: string;
  age: number;
  email: string;
}

type ReadonlyUser = Readonly<User>;
// { readonly name: string; readonly age: number; readonly email: string }

type OptionalUser = Optional<User>;
// { name?: string; age?: number; email?: string }
```

### How Mapped Types Work

```typescript
// Step by step — what happens when you write:
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

// 1. keyof T → "name" | "age" | "email"
// 2. K in ... → iterate over each key
// 3. T[K] → the type of that key
// 4. ? → make it optional

// Result for User:
// {
//   name?: string;
//   age?: number;
//   email?: string;
// }
```

### Transforming Values

```typescript
// Make every property nullable
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null; email: string | null }

// Wrap every property in a Promise
type Promisified<T> = {
  [K in keyof T]: Promise<T[K]>;
};

type PromisifiedUser = Promisified<User>;
// { name: Promise<string>; age: Promise<number>; email: Promise<string> }

// Make every property a getter function
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type UserGetters = Getters<User>;
// {
//   getName: () => string;
//   getAge: () => number;
//   getEmail: () => string;
// }
```

### Filtering Properties with `as` (Key Remapping)

```typescript
// Remove specific properties
type RemoveKind<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type UserWithoutEmail = RemoveKind<User, "email">;
// { name: string; age: number }

// Pick only string properties
type StringProperties<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

type UserStrings = StringProperties<User>;
// { name: string; email: string }  (age removed — it's a number)

// Pick only number properties
type NumberProperties<T> = {
  [K in keyof T as T[K] extends number ? K : never]: T[K];
};

type UserNumbers = NumberProperties<User>;
// { age: number }
```

## Conditional Types

Conditional types choose a type based on a **condition**, like a ternary for types:

```typescript
T extends U ? X : Y
// If T is assignable to U → use X, else use Y
```

### Basic Conditional Types

```typescript
type IsString<T> = T extends string ? "yes" : "no";

type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"
type C = IsString<"hello">; // "yes" (literal string extends string)

// Practical: unwrap array type
type UnwrapArray<T> = T extends Array<infer U> ? U : T;

type D = UnwrapArray<string[]>;  // string
type E = UnwrapArray<number>;    // number (not an array, return as-is)

// Practical: unwrap Promise
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type F = Awaited<Promise<string>>;         // string
type G = Awaited<Promise<Promise<number>>>; // number (recursively unwraps)
type H = Awaited<string>;                   // string (not a promise)
```

### Distributive Conditional Types

When a conditional type operates on a **union**, it distributes across each member:

```typescript
type ToArray<T> = T extends any ? T[] : never;

type I = ToArray<string | number>;
// Distributes: ToArray<string> | ToArray<number>
// Result: string[] | number[]

// Without distribution (wrap in a tuple):
type ToArrayNoDist<T> = [T] extends [any] ? T[] : never;

type J = ToArrayNoDist<string | number>;
// Result: (string | number)[]
```

### Practical Conditional Types

```typescript
// Extract function return type
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;

function getUser() {
  return { name: "Alice", age: 25 };
}

type UserReturn = ReturnOf<typeof getUser>;
// { name: string; age: number }

// Extract function parameters
type ParamsOf<T> = T extends (...args: infer P) => any ? P : never;

function greet(name: string, greeting: string) { return `${greeting}, ${name}`; }

type GreetParams = ParamsOf<typeof greet>;
// [string, string]

// Extract Promise resolved type
typeResolved<T> = T extends Promise<infer U> ? U : T;

type K = Resolved<Promise<{ id: number }>>; // { id: number }
```

## The `infer` Keyword

`infer` declares a **type variable** inside a conditional type — it lets TypeScript figure out the type:

```typescript
// Extract the element type from an array
type ElementOf<T> = T extends (infer E)[] ? E : never;

type L = ElementOf<string[]>;   // string
type M = ElementOf<number[]>;   // number

// Extract first function parameter
type FirstParam<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type N = FirstParam<(name: string, age: number) => void>; // string

// Multiple infer positions
type FunctionParts<T> = T extends (...args: infer Args) => infer Return
  ? { args: Args; return: Return }
  : never;

type Parts = FunctionParts<(x: number, y: string) => boolean>;
// { args: [number, string]; return: boolean }
```

### Infer in Nested Patterns

```typescript
// Deep unwrap: extract the innermost type from nested Promises/arrays
type DeepValue<T> =
  T extends Promise<infer U> ? DeepValue<U> :
  T extends (infer U)[] ? DeepValue<U> :
  T;

type O = DeepValue<Promise<Promise<string[]>>>; // string
```

## Template Literal Types

Template literal types let you manipulate **string types** using template syntax:

```typescript
type EventName = "click" | "focus" | "blur";

// Add "on" prefix
type EventHandler = `on${Capitalize<EventName>}`;
// "onClick" | "onFocus" | "onBlur"

// CSS unit types
type CSSUnit = "px" | "em" | "rem" | "%" | "vh" | "vw";
type CSSValue = `${number}${CSSUnit}`;
// "10px", "1.5rem", "100%", etc.

// Route patterns
type Method = "GET" | "POST" | "PUT" | "DELETE";
type APIRoute = `/api/${string}`;
type Endpoint = `${Method} ${APIRoute}`;
// "GET /api/users", "POST /api/posts", etc.
```

### Built-in String Manipulation Types

```typescript
// Uppercase
type S1 = Uppercase<"hello">;        // "HELLO"

// Lowercase
type S2 = Lowercase<"HELLO">;        // "hello"

// Capitalize
type S3 = Capitalize<"hello">;        // "Hello"

// Uncapitalize
type S4 = Uncapitalize<"HelloWorld">; // "helloWorld"
```

### Practical Template Literal Example

```typescript
// Type-safe event emitter
type EventMap = {
  click: { x: number; y: number };
  change: { value: string };
  submit: { form: HTMLFormElement };
};

type OnEvent<T extends string> = `on${Capitalize<T>}`;
type EventHandler<T> = T extends keyof EventMap ? (data: EventMap[T]) => void : never;

function on<T extends keyof EventMap>(
  event: T,
  handler: (data: EventMap[T]) => void,
): void {
  // implementation
}

on("click", (data) => {
  data.x; // number ✅
  data.y; // number ✅
});
```

## Combining Everything

### Type-Safe API Client

```typescript
// Define your API routes
interface Routes {
  "GET /users": { response: User[]; query?: { limit: number } };
  "GET /users/:id": { response: User; params: { id: string } };
  "POST /users": { response: User; body: Omit<User, "id"> };
  "PUT /users/:id": { response: User; params: { id: string }; body: Partial<User> };
  "DELETE /users/:id": { response: void; params: { id: string } };
}

type Route = keyof Routes;

// Extract method and path from route string
type MethodOf<R extends Route> = R extends `${infer M} ${string}` ? M : never;
type PathOf<R extends Route> = R extends `${string} ${infer P}` ? P : never;

// Type-safe fetch function
async function api<R extends Route>(
  route: R,
  options: Omit<Routes[R], "response"> extends Record<string, never>
    ? undefined
    : Omit<Routes[R], "response">,
): Promise<Routes[R]["response"]> {
  // implementation
  return {} as Routes[R]["response"];
}

// Usage — fully typed
const users = await api("GET /users", undefined);
// users: User[]

const user = await api("GET /users/:id", { params: { id: "1" } });
// user: User

const newUser = await api("POST /users", {
  body: { name: "Alice", email: "alice@example.com" },
});
// newUser: User
```

### Deep Partial & Deep Required

```typescript
// DeepPartial — make everything optional, recursively
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Array<infer U>
      ? Array<DeepPartial<U>>
      : DeepPartial<T[K]>
    : T[K];
};

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      username: string;
      password: string;
    };
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
}

type PartialConfig = DeepPartial<Config>;
// Everything is optional at every level:
// { database?: { host?: string; port?: number; credentials?: { ... } }; ... }
```

### Branded Types (Nominal Typing)

```typescript
// Create "branded" types that TypeScript treats as distinct
type Brand<T, B> = T & { __brand: B };

type USD = Brand<number, "USD">;
type EUR = Brand<number, "EUR">;

function usd(amount: number): USD {
  return amount as USD;
}

function eur(amount: number): EUR {
  return amount as EUR;
}

function processPayment(amount: USD): void {
  console.log(`Processing $${amount}`);
}

const price = usd(100);
processPayment(price);     // ✅

const euroPrice = eur(100);
processPayment(euroPrice); // ❌ EUR is not assignable to USD
```

## Best Practices

1. **Use built-in utility types first** — `Partial`, `Required`, `Pick`, `Omit`, `Record` — before writing custom mapped types
2. **Use `infer` to extract types** — Don't manually duplicate type information
3. **Use template literals for string patterns** — Event names, CSS values, route patterns
4. **Keep it readable** — Complex type expressions should have comments
5. **Test your types** — Use `expect<Type>` patterns or the `@ts-expect-error` directive
6. **Don't over-engineer** — Use advanced types when they solve real problems, not to show off
