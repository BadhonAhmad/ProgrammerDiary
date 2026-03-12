---
title: "Union Types and the `any` Type in TypeScript"
date: "2026-03-11"
tags: ["typescript", "union-types", "any", "type-system", "literal-types"]
excerpt: "A variable doesn't always have to be just one type. Union types let a value be one of several possible types. And `any`? That's what happens when TypeScript gives up — and why you should avoid it."
---

# Union Types and the `any` Type in TypeScript

## The `any` Type — TypeScript Giving Up

When you declare a variable **without assigning a value and without an annotation**, TypeScript has nothing to look at. It has no way to infer the type. So it falls back to a special type called `any`.

```ts
let currentorder;
// TypeScript infers: any
```

`any` means **"I have no idea what this is — it could be anything"**. TypeScript completely stops checking that variable. You can assign a string, a number, an object — anything — and TypeScript will not complain.

```ts
let currentorder;

currentorder = "28";   // fine
currentorder = 42;     // also fine
currentorder = true;   // also fine — TypeScript doesn't care anymore
```

This is bad. You've lost all type safety on that variable.

### Why `any` is dangerous

```ts
let currentorder;

currentorder = "28";
console.log(currentorder.toUpperCase()); // works, it's a string

currentorder = 42;
console.log(currentorder.toUpperCase()); // ❌ Runtime crash — numbers don't have toUpperCase
```

TypeScript won't warn you about this because `any` disables all checking. The bug only shows up at runtime.

> **Rule:** Avoid `any` whenever possible. If a variable starts without a value, always annotate it so TypeScript knows what it will eventually hold.

---

## Union Types — "It Can Be This OR That"

A **union type** lets you tell TypeScript that a value can be one of several types. You write union types with the `|` (pipe) symbol between the types.

```ts
let currentorder: string | undefined;
```

This tells TypeScript: "`currentorder` will either be a `string` or `undefined` — nothing else."

Now look at the difference:

```ts
// ❌ Without annotation — TypeScript infers `any`, no safety
let currentorder;

// ✅ With union annotation — TypeScript knows the exact possibilities
let currentorder: string | undefined;
```

### A Real Example

```ts
const orders = ['12', '20', '28', '42'];
let currentorder: string | undefined;

for (let order of orders) {
  if (order === '28') {
    currentorder = order;  // ✅ assigning a string — valid
    break;
  }
  currentorder = '11';     // ✅ also a string — valid
}

console.log(currentorder); // could be '28', '11', or undefined
```

Here, `currentorder` legitimately starts as `undefined` (no match found yet) and might end up as a `string`. The union type `string | undefined` captures both possibilities precisely.

### Common Union Types

```ts
let id: string | number;          // can be "user_42" or just 42
let response: string | null;      // can be a value or explicitly nothing
let input: string | undefined;    // can be a value or not provided at all
let subs: number | string = '1M'; // starts as '1M' (string), could later be 1000000 (number)
```

---

## Literal Union Types — Locking Down Exact Values

You don't have to union together general types like `string` and `number`. You can also union together **specific literal values** — exact strings or numbers a variable is allowed to be.

```ts
let apiRequestStatus: 'pending' | 'success' | 'error' = 'pending';
```

This means `apiRequestStatus` can **only** ever be `'pending'`, `'success'`, or `'error'` — not any random string.

```ts
apiRequestStatus = 'success';   // ✅
apiRequestStatus = 'error';     // ✅
apiRequestStatus = 'loading';   // ❌ Error: Type '"loading"' is not assignable to type '"pending" | "success" | "error"'
```

### Airline Seat Example

```ts
let airlineSeat: 'aisle' | 'window' | 'middle' = 'aisle';
```

Now when you try to assign a new value, your editor knows exactly what values are valid and gives you autocomplete:

```
airlineSeat = '|
               ├ aisle
               ├ middle
               └ window
```

TypeScript shows you the exact three options. You can't accidentally type `'isle'` or `'center'` — it will be caught immediately as a compile error.

```ts
airlineSeat = 'window';   // ✅
airlineSeat = 'center';   // ❌ Error: Type '"center"' is not assignable
```

### Why Literal Unions are Powerful

```ts
// ❌ Too wide — any string is allowed, bugs sneak through
let status: string = 'pending';
status = 'sucess'; // typo — TypeScript doesn't catch it

// ✅ Locked down — only exact values work
let status: 'pending' | 'success' | 'error' = 'pending';
status = 'sucess'; // ❌ Caught immediately — "sucess" is not a valid value
```

This pattern is used constantly in real-world TypeScript: API states, UI modes, config options, button variants — any time a value can only be one of a known set of options.

---

## Quick Comparison

| | `any` | Union Type | Literal Union |
|---|---|---|---|
| **Safety** | None — all checks disabled | Checked within allowed types | Exact values enforced |
| **Autocomplete** | None | Partial | Full — shows exact options |
| **Use case** | Avoid it | Value can be multiple types | Value must be one of fixed values |
| **Example** | `let x;` | `string \| number` | `'pending' \| 'success' \| 'error'` |

---

## Summary

- **`any`** is what TypeScript assigns when it has no information. It disables type checking entirely. Avoid it by always annotating uninitialized variables.
- **Union types** (`string | undefined`, `number | string`) let a variable legally hold one of several types — all while keeping full type safety.
- **Literal union types** (`'aisle' | 'window' | 'middle'`) lock a variable down to a finite set of exact values, and give you powerful autocomplete in your editor.
