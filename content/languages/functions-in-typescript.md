---
title: "Functions in TypeScript: Parameters, Return Types, and Signatures"
date: "2026-03-12"
tags: ["typescript", "functions", "void", "default-params", "optional-params", "return-types"]
excerpt: "Functions are where TypeScript earns its keep. Typed parameters, return type annotations, optional and default values, and inline object signatures — everything you need to write safe, self-documenting functions."
---

# Functions in TypeScript: Parameters, Return Types, and Signatures

In JavaScript, functions give you no guarantees. You can call `createChai()` without an order, pass the wrong types, or ignore the return value — and nothing stops you. TypeScript locks all of this down at compile time.

---

## Return Type Annotations

You can explicitly tell TypeScript what a function returns:

```ts
function logChai(): void {
  console.log("Chai is ready");
}
```

### `void` — The "Returns Nothing" Type

`void` means the function **does not return a meaningful value**. It may return `undefined` implicitly, but the caller shouldn't depend on any return value.

```ts
function logChai(): void {
  console.log("Chai is ready");
  // no return statement — or return; with no value
}
```

If you accidentally return something, TypeScript catches it:

```ts
function logChai(): void {
  return "Chai is ready";  // ❌ Error: Type 'string' is not assignable to type 'void'
}
```

### Other common return types

```ts
function getPrice(): number {
  return 25;
}

function getName(): string {
  return "Masala Chai";
}

function isHot(): boolean {
  return true;
}
```

> TypeScript can usually **infer** the return type from the `return` statement — but writing it explicitly makes your intent clear and prevents accidental type widening.

---

## Optional Parameters

Add `?` after a parameter name to make it optional:

```ts
// Without ? — type is required, undefined not allowed
function orderChai(type: string) { }

// With ? — type becomes string | undefined
function orderChai(type?: string) { }

orderChai("Masala");  // ✅
orderChai();          // ✅ — type is undefined inside the function
```

Inside the function, an optional parameter is `string | undefined` — TypeScript forces you to handle both cases:

```ts
function orderChai(type?: string) {
  // Must narrow before using as string
  const chaiType = type ?? "Masala";  // default to "Masala" if undefined
  console.log(`Ordering ${chaiType} chai`);
}
```

---

## Default Parameters

A cleaner alternative to optional parameters — provide a **default value** directly in the signature:

```ts
function orderChai(type: string = "Masala") {
  console.log(`Ordering ${type} chai`);
}

orderChai("Tulsi");   // → "Ordering Tulsi chai"
orderChai();          // → "Ordering Masala chai"  (default kicks in)
```

With a default value, the parameter type stays `string` (not `string | undefined`) — TypeScript knows it will always have a value inside the function. This is cleaner than optional + manual fallback.

### Optional vs Default — When to use which

| Scenario | Use |
|---|---|
| Parameter is genuinely optional and you'll check for it | `param?: string` |
| Parameter has a sensible fallback value | `param: string = "default"` |
| You want to force callers to be explicit | neither — make it required |

---

## Inline Object Parameter Types

Instead of defining a separate type, you can describe an object's shape directly in the parameter:

```ts
function createChai(order: {
  type: string;
  sugar: number;
  size: "small" | "large";
}): number {
  return 4;
}
```

This function:
- Accepts an object with exactly three properties
- `size` must be the literal `"small"` or `"large"` — not any string
- Returns a `number`

You call it like this:

```ts
createChai({ type: "Ginger", sugar: 2, size: "large" });  // ✅
createChai({ type: "Ginger", sugar: 2, size: "medium" }); // ❌ "medium" not in union
createChai({ type: "Ginger", sugar: 2 });                 // ❌ missing size
```

For complex objects used in multiple places, extract them into a named type:

```ts
type ChaiOrder = {
  type: string;
  sugar: number;
  size: "small" | "large";
};

function createChai(order: ChaiOrder): number {
  return 4;
}
```

Both approaches compile to the same thing — use inline shapes for one-off parameters, named types when the shape is reused.

---

## Typing the Return Value Together

Putting it all together — a fully typed function signature:

```ts
function createChai(order: {
  type: string;
  sugar: number;
  size: "small" | "large";
}): number {
  console.log(`Creating ${order.size} ${order.type} with ${order.sugar} spoonfuls`);
  return order.sugar * 2;  // some computation
}
```

The return type `: number` is explicit. TypeScript will error if you accidentally return a string or forget to return.

---

## Arrow Functions

All the same rules apply to arrow functions:

```ts
const logChai = (): void => {
  console.log("Chai is ready");
};

const orderChai = (type: string = "Masala"): void => {
  console.log(`Ordering ${type}`);
};

const createChai = (order: { type: string; sugar: number }): number => {
  return order.sugar;
};
```

---

## Function Type Signatures

You can describe a function's type for use in variables or parameters:

```ts
// Type alias for a function that takes a string and returns void
type ChaiLogger = (message: string) => void;

const log: ChaiLogger = (msg) => console.log(msg);

// Function that accepts another function as parameter (callback)
function process(order: string, callback: (result: string) => void): void {
  const result = `Processed: ${order}`;
  callback(result);
}

process("Masala Chai", (r) => console.log(r));
```

---

## Summary

| Feature | Syntax | Purpose |
|---|---|---|
| Return type | `function f(): number` | Declare what the function returns |
| `void` return | `function f(): void` | Function produces no return value |
| Optional param | `param?: string` | Caller may omit; type is `string \| undefined` |
| Default param | `param: string = "x"` | Caller may omit; type stays `string` |
| Inline object param | `(order: { size: string })` | Shape check without a named type |
| Function type | `type F = (x: string) => number` | Describe a function's signature as a type |

TypeScript functions are self-documenting contracts — the signature tells you exactly what goes in and what comes out, with no surprises.
