---
title: "The never Type in TypeScript"
date: "2026-03-12"
tags: ["typescript", "never", "type-system", "exhaustive-checks", "control-flow"]
excerpt: "The never type represents values that never exist — a function that never returns, a code path that is impossible to reach, or an exhaustive check that forces you to handle every case."
---

# The `never` Type in TypeScript

`never` is TypeScript's way of representing **impossibility**. It is the type of a value that can never exist — a code path that can never be reached, a function that can never finish, or a variable that has been narrowed to the point where no type is left.

It sounds abstract. Once you see it in real code, it clicks immediately.

---

## What `never` Actually Means

Every type in TypeScript represents a set of possible values:

- `boolean` → `true` or `false`
- `string` → any string
- `number` → any number
- `unknown` → literally anything
- `never` → **the empty set** — no value at all

A variable of type `never` can hold **nothing**. You can never assign a value to it (except another `never`). If TypeScript narrows a variable to `never`, it is telling you: *"At this point in the code, this variable is impossible to exist."*

---

## Case 1 — Exhaustive Union Handling

This is the most practical use of `never`. Look at this example closely:

```ts
type Role = "admin" | "user";

function redirectBasedOnRole(role: Role): void {
  if (role === "admin") {
    console.log("Redirecting to admin dashboard");
    return;
  }
  if (role === "user") {
    console.log("Redirecting to user dashboard");
    return;
  }

  // TypeScript shows: (parameter) role: never
  role; // ← TypeScript narrows this to never
}
```

Here is what happens step by step:

1. `role` starts as type `"admin" | "user"`
2. After the first `if` handles `"admin"` and `return`s, TypeScript removes `"admin"` from the union → `role` is now `"user"`
3. After the second `if` handles `"user"` and `return`s, TypeScript removes `"user"` too → nothing is left
4. Inside that dead code at the bottom, `role` is typed as `never` — because every possible value has already been handled

### Using this as an Exhaustive Check

You can turn this into a **compile-time safety net** using a helper function:

```ts
function assertNever(value: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
}

type Role = "admin" | "user";

function redirectBasedOnRole(role: Role): void {
  if (role === "admin") {
    console.log("Redirecting to admin dashboard");
    return;
  }
  if (role === "user") {
    console.log("Redirecting to user dashboard");
    return;
  }

  assertNever(role); // ✅ TypeScript confirms role is never here
}
```

Now imagine you add a new role later:

```ts
type Role = "admin" | "user" | "moderator"; // added moderator
```

Instantly, `assertNever(role)` will give a **compile-time error**:

```
Argument of type 'string' is not assignable to parameter of type 'never'.
```

TypeScript is saying: *"You forgot to handle `moderator` — `role` is not fully narrowed to `never` at that point."*

This is how `never` enforces exhaustive pattern matching. Your code cannot compile until every case is handled.

---

## Case 2 — Functions That Never Return

A function typed as `: never` is one that **never reaches the end** — it either throws unconditionally or runs an infinite loop.

### Infinite loop

```ts
function neverReturn(): never {
  while (true) {}
}
```

This function starts and never finishes. It has no return statement. TypeScript assigns the return type `never`.

### Unconditional throw

```ts
function fail(message: string): never {
  throw new Error(message);
}
```

Every time this function is called, it throws. It never returns a value — not even `undefined`. So its return type is `never`.

### Why not `void`?

`void` means "returns, but the return value is meaningless (`undefined`)." `never` means "does not return at all." They are very different:

```ts
function logSomething(): void {
  console.log("done");
  // returns undefined implicitly — this is void
}

function crash(): never {
  throw new Error("fatal"); // throws — execution never continues past here
}
```

---

## Case 3 — Impossible Type Intersections

When you intersect two incompatible types, TypeScript collapses them to `never`:

```ts
type Impossible = string & number;
// type Impossible = never
// A value cannot be both a string and a number simultaneously
```

You will see this occasionally in complex generic code. When a type resolves to `never`, it usually signals a logic error in your type definitions.

---

## `never` in Conditional Types

`never` also appears in **conditional types** to filter out unwanted members:

```ts
type NonNullable<T> = T extends null | undefined ? never : T;

type A = NonNullable<string | null | undefined>;
// type A = string
// null and undefined → never (filtered out)
// string stays
```

When TypeScript distributes a conditional type and a branch produces `never`, that branch disappears from the resulting union. This is how utility types like `NonNullable`, `Exclude`, and `Extract` work internally.

---

## Summary

| Scenario | Result type |
|---|---|
| Function that always throws | `never` |
| Function with `while(true){}` | `never` |
| Union fully narrowed in control flow | Variable becomes `never` |
| Intersection of incompatible types | `never` |
| Conditional type branch that filters out | `never` |

### The Rules

1. **`never` is a subtype of every type** — it is assignable to `string`, `number`, `boolean`, anything. (It's the bottom of the type hierarchy.)
2. **No type is assignable to `never`** (except `never` itself) — you can't give it a value.
3. **A `never` in a union disappears** — `string | never` is just `string`.
4. **Use `assertNever()` to enforce exhaustive handling** — if TypeScript can pass a value to it without error, you have covered every case.
5. **`never` ≠ `void`** — `void` returns undefined; `never` doesn't return at all.
