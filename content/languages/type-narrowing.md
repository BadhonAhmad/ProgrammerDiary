---
title: "Type Narrowing in TypeScript"
date: "2026-03-11"
tags: ["typescript", "type-narrowing", "type-guards", "unknown", "instanceof", "typeof"]
excerpt: "TypeScript can't always know the exact type of a value at runtime — especially when it's a union. Type narrowing is how you help TypeScript zoom in from a wide type to a specific one using runtime checks."
---

# Type Narrowing in TypeScript

When a variable has a union type like `string | number`, TypeScript doesn't know which one it is at any given moment. **Type narrowing** is the process of using runtime checks to tell TypeScript — inside a specific branch of code — exactly what type a value is.

---

## The `unknown` Type — Safer Than `any`

Before diving into narrowing, it's worth understanding `unknown` — the type that *forces* you to narrow before using a value.

The `any` type is the most-capable type in TypeScript. It encompasses every possible value, but it **disables all type checking** on that variable. TypeScript won't complain no matter what you do with it:

```ts
let foo: any = 10;

// All of these will throw errors, but TypeScript
// won't complain since `foo` has the type `any`
foo.x.prop;
foo.y.prop;
foo.z;
foo();
new foo();
```

This is dangerous — you lose all safety.

`unknown` is the safer alternative. Like `any`, it can hold any value. But unlike `any`, TypeScript **requires you to check the type** before you can use it:

```ts
let value: unknown = "hello";

value.toUpperCase();
// ❌ Error: Object is of type 'unknown'

if (typeof value === "string") {
  value.toUpperCase();  // ✅ Safe — TypeScript knows it's a string here
}
```

> **Rule:** Prefer `unknown` over `any` when you don't know the type upfront. It forces you to narrow before use, keeping your code safe.

---

## `any` vs `unknown` — Key Differences

Both `any` and `unknown` can hold a value of any type. The difference is what TypeScript **lets you do** with them afterwards.

| Feature | `any` | `unknown` |
|---|---|---|
| Can hold any value | ✅ Yes | ✅ Yes |
| Type checking enforced | ❌ No — all checks disabled | ✅ Yes — must narrow first |
| Access properties freely | ✅ No error | ❌ Error until narrowed |
| Call as a function | ✅ No error | ❌ Error until narrowed |
| Assignable to other types | ✅ Yes — assigns to anything | ❌ Only assignable to `any` or `unknown` |
| Safe to use | ❌ No — runtime crashes possible | ✅ Yes — forces safe usage |
| When to use | Migrating JS code, last resort | API responses, dynamic input |

### Side-by-Side Example

```ts
// ── any ─────────────────────────────────────────────────────
let a: any = "hello";

a.toUpperCase();        // ✅ no error
a.nonExistentMethod();  // ✅ no error — TypeScript is completely silent
a = 42;
a * 10;                 // ✅ no error — even though it was "hello" before


// ── unknown ─────────────────────────────────────────────────
let u: unknown = "hello";

u.toUpperCase();        // ❌ Error: Object is of type 'unknown'
u.nonExistentMethod();  // ❌ Error: Object is of type 'unknown'

// You must narrow first:
if (typeof u === "string") {
  u.toUpperCase();      // ✅ Safe — TypeScript confirmed it's a string
}

u = 42;
if (typeof u === "number") {
  u * 10;               // ✅ Safe — TypeScript confirmed it's a number
}
```

### Assignability Difference

```ts
let anyVal: any = "test";
let unknownVal: unknown = "test";

let str: string;

str = anyVal;     // ✅ `any` assigns to any type freely — dangerous
str = unknownVal; // ❌ Error: Type 'unknown' is not assignable to type 'string'
                  // You must narrow `unknownVal` first
```

`any` bypasses the entire type system — it slides into any variable without complaint. `unknown` refuses to, which forces you to prove what type it actually is.

### In Practice — Handling API Responses

```ts
// ❌ Using `any` — no protection
async function fetchUser(): Promise<any> {
  const res = await fetch('/api/user');
  const data = await res.json();
  return data;
}

const user = await fetchUser();
console.log(user.naem); // typo — TypeScript doesn't catch it


// ✅ Using `unknown` — forces validation
async function fetchUser(): Promise<unknown> {
  const res = await fetch('/api/user');
  return res.json();
}

const user = await fetchUser();
console.log(user.name); // ❌ Error: Object is of type 'unknown'

// Must validate first:
if (
  typeof user === "object" &&
  user !== null &&
  "name" in user
) {
  console.log((user as { name: string }).name); // ✅ Safe
}
```

> **Bottom line:** `any` tells TypeScript "stop helping me". `unknown` tells TypeScript "I don't know the type yet, but I'll prove it before I use it."

---

## Narrowing with `typeof`

The most common way to narrow a type is using JavaScript's built-in `typeof` operator inside an `if` check. TypeScript understands `typeof` and uses it to narrow the type in each branch.

```ts
function orderChai(size: "small" | "medium" | "large" | number) {
  if (size === "small") {
    return `small cutting chai...`;
  }
  if (size === "medium" || size === "large") {
    return `make extra chai`;
  }
  return `chai order #${size}`;
}
```

Here TypeScript *narrows* the type as you go:
- Inside `if (size === "small")` — TypeScript knows `size` is exactly `"small"`
- Inside `if (size === "medium" || size === "large")` — TypeScript knows it's one of those two literals
- At the final `return` — the only remaining possibility is `number`

### `typeof` with Primitives

```ts
function formatValue(val: string | number): string {
  if (typeof val === "string") {
    return val.toUpperCase();   // val is string here
  }
  return val.toFixed(2);        // val is number here
}
```

`typeof` works for: `"string"`, `"number"`, `"boolean"`, `"bigint"`, `"symbol"`, `"undefined"`, `"function"`, `"object"`.

---

## Type Predicates — Custom Type Guard Functions

Sometimes a simple `typeof` check isn't enough. When you're working with objects, you need to inspect the *shape* of the value. TypeScript lets you write a **type guard function** that returns a **type predicate**.

A type predicate has the form `parameterName is Type` as the return type. If the function returns `true`, TypeScript narrows the parameter to that type in the calling code.

### Defining a Type and Its Guard

```ts
type ChaiOrder = {
  type: string;
  sugar: number;
};

function isChaiOrder(obj: any): obj is ChaiOrder {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.type === "string" &&
    typeof obj.sugar === "number"
  );
}
```

Breaking this down:
- `obj: any` — accepts any value (works with `unknown` too with a cast)
- `: obj is ChaiOrder` — the **type predicate**: if this returns `true`, TypeScript treats `obj` as `ChaiOrder` in the caller
- The body checks that `obj` is a non-null object with the right property types

### Using the Type Guard

```ts
function serveOrder(item: ChaiOrder | string) {
  if (isChaiOrder(item)) {
    // TypeScript narrows: item is ChaiOrder here
    return `Serving ${item.type} chai with ${item.sugar} sugar`;
  }
  // TypeScript narrows: item is string here
  return `Serving custom chai: ${item}`;
}
```

Without `isChaiOrder`, TypeScript would not let you access `item.type` or `item.sugar` — because when the type is `ChaiOrder | string`, it can't guarantee those properties exist. The type guard function narrows it down safely.

### Why Not Just Use `any` Everywhere?

```ts
// ❌ No guard — TypeScript lets this through with `any`, bugs at runtime
function serveOrder(item: any) {
  return `Serving ${item.type} chai`; // might be undefined if item is a string
}

// ✅ With guard — TypeScript enforces correctness
function serveOrder(item: ChaiOrder | string) {
  if (isChaiOrder(item)) {
    return `Serving ${item.type} chai with ${item.sugar} sugar`;
  }
  return `Serving custom chai: ${item}`;
}
```

---

## Narrowing with `instanceof`

When you're working with **classes**, `instanceof` is the right tool. It checks whether a value is an instance of a particular class, and TypeScript uses that to narrow the type.

```ts
class KulhadChai {
  serve() {
    return `Serving Kulhad Chai`;
  }
}

class Cutting {
  serve() {
    return `Serving cutting Chai`;
  }
}

function serve(chai: KulhadChai | Cutting) {
  if (chai instanceof KulhadChai) {
    return chai.serve();  // TypeScript knows: chai is KulhadChai here
  }
  return chai.serve();    // TypeScript knows: chai is Cutting here
}
```

The `instanceof` check tells TypeScript which class the value belongs to. This is especially useful when two classes have different methods or properties and you need to handle each case differently:

```ts
class KulhadChai {
  material = "clay";
  serve() {
    return `Serving Kulhad Chai in ${this.material} cup`;
  }
}

class Cutting {
  size = "half";
  serve() {
    return `Serving cutting Chai (${this.size} glass)`;
  }
}

function serve(chai: KulhadChai | Cutting) {
  if (chai instanceof KulhadChai) {
    console.log(chai.material);   // ✅ Only accessible here — TypeScript knows it's KulhadChai
    return chai.serve();
  }
  console.log(chai.size);         // ✅ Only accessible here — TypeScript knows it's Cutting
  return chai.serve();
}
```

Without the `instanceof` check, TypeScript would complain that `material` and `size` don't exist on both types. Narrowing makes it safe.

---

## Narrowing Techniques at a Glance

| Technique | Best For | Example |
|---|---|---|
| `typeof` | Primitives (`string`, `number`, `boolean`) | `typeof x === "string"` |
| `instanceof` | Class instances | `x instanceof MyClass` |
| Type predicate (custom guard) | Object shapes / complex checks | `function isX(obj): obj is X` |
| Equality check (`===`) | Literal union types | `if (size === "small")` |
| Truthiness check | Filtering `null` / `undefined` | `if (value)` |

---

## Summary

- **`unknown`** is safer than `any` — it accepts any value but forces you to narrow before using it
- **`typeof` narrowing** works for primitives and tells TypeScript the exact type inside each branch
- **Type predicates** (`obj is ChaiOrder`) let you write custom guard functions that narrow complex object shapes
- **`instanceof` narrowing** works when values are class instances, letting TypeScript know which class's properties and methods are available
