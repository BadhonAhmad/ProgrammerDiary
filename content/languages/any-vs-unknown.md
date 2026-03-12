---
title: "any vs unknown in TypeScript"
date: "2026-03-12"
tags: ["typescript", "any", "unknown", "type-safety", "type-narrowing"]
excerpt: "Both 'any' and 'unknown' accept every type — but they behave very differently. Understanding the difference is key to writing safe TypeScript."
---

# `any` vs `unknown` in TypeScript

Both `any` and `unknown` can hold a value of any type. But they have a fundamental difference in how TypeScript lets you **use** that value afterward.

---

## `any` — The Escape Hatch

`any` completely opts out of the type system. TypeScript stops checking anything about that value. You can assign anything to it, and you can do anything with it — call methods, access properties, index it — without a single error.

```ts
let value: any;

value = "chai";
value = [1, 2, 3];
value.toUpperCase(); // ✅ TypeScript says nothing — no error
```

Even after reassigning `value` to an array `[1, 2, 3]`, TypeScript happily lets you call `.toUpperCase()` on it — a method that doesn't exist on arrays. **No compile-time error. No warning.**

At runtime, this will crash:
```
TypeError: value.toUpperCase is not a function
```

TypeScript trusted you completely and gave you no protection whatsoever.

### When `any` shows up

- Legacy JavaScript migrated to TypeScript
- Third-party libraries with no type definitions
- `JSON.parse()` return value
- Explicit `let x: any` declarations you write yourself

---

## `unknown` — The Safe Alternative

`unknown` also accepts every type, but TypeScript **refuses to let you do anything with it** until you narrow it to something specific.

```ts
let newValue: unknown;

newValue = "chai";
newValue = [1, 2, 3];
newValue = 2.5;
```

All those assignments are fine — `unknown` accepts everything.

But the moment you try to use `newValue`:

```ts
newValue.toUpperCase();
// ❌ Error: Object is of type 'unknown'
```

TypeScript won't allow calling methods on an `unknown` value. You must first **prove** what type it is through narrowing.

### Narrowing `unknown` with a type guard

```ts
if (typeof newValue === "string") {
  newValue.toUpperCase(); // ✅ TypeScript knows it's a string here
}
```

Inside the `if` block, TypeScript narrows `newValue` from `unknown` to `string` — and only then permits `.toUpperCase()`. Outside that block, it remains `unknown` and nothing is permitted.

---

## Side-by-Side

```ts
// ── any ──────────────────────────────────────────
let value: any;
value = "chai";
value = [1, 2, 3];
value.toUpperCase(); // ✅ compiles — 💥 crashes at runtime

// ── unknown ──────────────────────────────────────
let newValue: unknown;
newValue = "chai";
newValue = [1, 2, 3];
newValue = 2.5;

newValue.toUpperCase();
// ❌ Error: Object is of type 'unknown'

if (typeof newValue === "string") {
  newValue.toUpperCase(); // ✅ safe — narrowed to string
}
```

---

## The Key Difference

| | `any` | `unknown` |
|---|---|---|
| Accepts all types | ✅ | ✅ |
| Lets you call methods freely | ✅ (no check) | ❌ (must narrow first) |
| Type-safe | ❌ | ✅ |
| Disables the type checker | ✅ | ❌ |
| Requires narrowing before use | ❌ | ✅ |

Think of it this way:

- **`any`** says: *"I don't care what this is — let me do whatever I want."*
- **`unknown`** says: *"I don't know what this is — prove it to me before I let you use it."*

---

## When to Use Each

### Use `unknown` when you genuinely don't know the type yet

```ts
async function fetchData(url: string): Promise<unknown> {
  const res = await fetch(url);
  return res.json(); // could be anything
}

const data = await fetchData("/api/user");

// Must narrow before using:
if (typeof data === "object" && data !== null && "name" in data) {
  console.log((data as { name: string }).name);
}
```

`unknown` forces whoever consumes the value to handle every possible case before acting on it.

### Use `any` only as a last resort

- Migrating a large JS codebase to TS incrementally
- Working with a third-party library that has no `@types/` package
- Throwaway scripts or prototypes

Avoid `any` in production code — every `any` is a hole in your type safety where real bugs can hide silently.

---

## The Practical Rule

> Prefer `unknown` over `any` whenever you need a "could be anything" type.

`unknown` keeps TypeScript honest. It forces you to prove a value's type before acting on it — which is exactly what defensive, reliable code does anyway.

If you find yourself reaching for `any` to silence an error, stop and ask: *can I use `unknown` and a type guard instead?* Usually the answer is yes.
