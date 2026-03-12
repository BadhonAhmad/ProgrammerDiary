---
title: "Tuples and Enums in TypeScript"
date: "2026-03-12"
tags: ["typescript", "tuples", "enums", "const-enum", "arrays"]
excerpt: "Arrays hold many values of the same type. Tuples hold a fixed number of values with specific types at specific positions. Enums name a set of numeric or string constants so you never use magic values again."
---

# Tuples and Enums in TypeScript

## Part 1 — Tuples

A regular array in TypeScript is typed as `string[]` or `number[]` — any length, all elements of the same type. A **tuple** is different: it has a **fixed length** and each **position has its own type**.

### Basic tuple

```ts
const userInfo = ["Hitesh", 100, true];
// TypeScript infers: (string | number | boolean)[]
// All three positions are allowed to be any of these types — not ideal
```

With an explicit tuple type:

```ts
const userInfo: [string, number, boolean] = ["Hitesh", 100, true];
// Position 0 must be string
// Position 1 must be number
// Position 2 must be boolean
```

Now TypeScript enforces the order. Swapping `100` and `"Hitesh"` would be a compile error.

### Readonly tuples

Mark a tuple `readonly` to prevent it from being mutated:

```ts
const location: readonly [number, number] = [28.66, 32.22];

location[0] = 30;  // ❌ Error: Cannot assign to '0' because it is a read-only tuple
```

This is perfect for coordinates, RGB values, or any fixed pair that should never change.

### Named tuple elements

TypeScript lets you label tuple positions for better readability — the labels are purely documentation:

```ts
const chaiItems: [name: string, price: number] = ["Masala", 25];

// You still access by index:
console.log(chaiItems[0]);  // "Masala"
console.log(chaiItems[1]);  // 25
```

The label `name:` and `price:` show up in IDE tooltips, making the tuple's purpose clear without needing a comment.

### The push problem

Tuples have a known quirk: `push()` bypasses the length check at runtime.

```ts
let t: [string, number] = ["chai", 10];

t.push("extra");  // ⚠️ TypeScript allows this (known limitation)
console.log(t);   // ["chai", 10, "extra"] — now length 3
```

TypeScript's type system doesn't catch this. The fix is to use `readonly`:

```ts
const t: readonly [string, number] = ["chai", 10];
t.push("extra");  // ❌ Error: Property 'push' does not exist on type 'readonly [string, number]'
```

If the tuple must be mutable, just be careful with `push`. Prefer `readonly` whenever the tuple is meant to stay fixed.

### When to use tuples

- **Coordinates**: `[latitude: number, longitude: number]`
- **Database row entries**: `[id: number, name: string, active: boolean]`
- **CSV parsing**: fixed-column records
- **React `useState`**: the `[value, setter]` pair is a tuple
- **Function returning multiple values**: instead of an object for simple pairs

```ts
function getMinMax(nums: number[]): [min: number, max: number] {
  return [Math.min(...nums), Math.max(...nums)];
}

const [min, max] = getMinMax([3, 1, 7, 2]);
```

---

## Part 2 — Enums

In JavaScript, people often write:

```ts
if (status === 1) { ... }   // What is 1? Nobody knows.
if (type === "masala") { ... }
```

Magic numbers and magic strings are hard to read and easy to mistype. **Enums** solve this by giving names to a set of related constants.

### Numeric enum (auto-incrementing)

```ts
enum CupSize {
  SMALL,    // 0
  MEDIUM,   // 1
  LARGE     // 2
}

const size = CupSize.LARGE;  // value is 2, but you read it as CupSize.LARGE
console.log(size);           // 2
```

By default, values start at `0` and increment by `1`. You never need to remember the numbers — you always use the name.

### Custom starting value

```ts
enum Status {
  PENDING   = 100,
  SERVED,     // 101 (auto-increments from 100)
  CANCELLED   // 102
}
```

Setting the first value to `100` shifts all subsequent values accordingly. Useful when enum values need to match external codes (HTTP status codes, DB column values, etc.).

### String enum

```ts
enum ChaiType {
  MASALA = "masala",
  GINGER = "ginger"
}
```

String enums don't auto-increment — every member must be explicitly assigned. The benefit: the compiled JavaScript is readable and values match what you'd store in a database or send over an API.

```ts
function brewChai(type: ChaiType) {
  console.log(`Brewing ${type}`);
}

brewChai(ChaiType.MASALA);  // → "Brewing masala"
brewChai("masala");          // ❌ Error: Argument of type '"masala"' is not assignable to parameter of type 'ChaiType'
```

Even though `ChaiType.MASALA` has value `"masala"`, TypeScript enforces you use the enum name — not the raw string. This prevents typos and makes refactoring safe.

### `const enum` — Zero-cost enums

```ts
const enum Sugars {
  LOW    = 1,
  MEDIUM = 2,
  HIGH   = 3
}

const mySugar = Sugars.MEDIUM;
```

`const enum` is inlined at compile time — no JavaScript object is emitted. The compiled output becomes:

```js
const mySugar = 2;  // Sugars.MEDIUM replaced directly with its value
```

Use `const enum` when:
- You only need forward references (not reverse-mapping)
- You want zero runtime overhead
- The enum values won't be iterated over

Do not use `const enum` across module boundaries (library code), as it can cause issues with separate compilation.

---

## Numeric Enum Reverse Mapping

Regular (non-const) numeric enums support **reverse mapping** — you can look up the name from the value:

```ts
enum Status {
  PENDING = 100,
  SERVED,
  CANCELLED
}

console.log(Status[100]);  // "PENDING"
console.log(Status[101]);  // "SERVED"
```

String enums do NOT have reverse mapping.

---

## Enum vs Union Type — When to Use Which

A common question: should you use an enum or a union type for a set of values?

```ts
// Option A: Enum
enum Direction { UP = "UP", DOWN = "DOWN", LEFT = "LEFT", RIGHT = "RIGHT" }

// Option B: Union type
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
```

| Factor | Enum | Union type |
|---|---|---|
| Compile-time safety | ✅ | ✅ |
| Runtime object exists | ✅ (iterable, reversible) | ❌ (erased) |
| Grouping related constants | ✅ Explicit | ❌ Just strings |
| Works with `switch` exhaustively | ✅ | ✅ |
| Used in class/OOP contexts | ✅ Natural fit | ❌ Awkward |
| Serialization (API, DB) | ⚠️ Need string enum | ✅ Direct |

**Rule of thumb:**
- Use **string union types** for simple string-constrained parameters (`type Size = "small" | "large"`)
- Use **enums** when the set of values is a meaningful domain concept with behavior attached, or when you need the runtime object (iteration, reverse mapping)

---

## Summary

| Feature | Syntax | Key Point |
|---|---|---|
| Basic tuple | `[string, number]` | Fixed length, position-specific types |
| Readonly tuple | `readonly [number, number]` | Prevents mutation, blocks `push` |
| Named tuple | `[name: string, price: number]` | Labels for IDE tooltips only |
| Numeric enum | `enum X { A, B, C }` | Auto-increments from 0 |
| Custom start enum | `enum X { A = 100, B, C }` | Values shift from starting number |
| String enum | `enum X { A = "a" }` | Readable runtime values, no auto-increment |
| `const enum` | `const enum X { A = 1 }` | Inlined at compile time, no runtime object |
