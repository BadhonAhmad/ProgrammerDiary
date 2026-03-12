---
title: "What is TypeScript?"
date: "2026-03-10"
tags: ["typescript", "javascript", "programming-languages"]
excerpt: "TypeScript is a strongly typed superset of JavaScript that compiles to plain JavaScript. Learn what it is, how it works, and why it was created."
---

# What is TypeScript?

TypeScript is an **open-source programming language** developed and maintained by Microsoft. It is a **strict syntactical superset of JavaScript** — meaning any valid JavaScript code is also valid TypeScript. TypeScript adds optional static typing and class-based object-oriented programming on top of the language.

## The Simple Definition

> TypeScript = JavaScript + Types + Tooling

Think of TypeScript as JavaScript with a safety net. You write code that looks very similar to JavaScript, but before it runs in the browser or Node.js, it goes through a **compilation step** that:

1. Checks your types and catches errors early
2. Strips away all the TypeScript-specific syntax
3. Outputs plain `.js` files that any environment can run

```
TypeScript (.ts) ──► tsc compiler ──► JavaScript (.js)
```

## A Quick Example

**Without TypeScript (JavaScript):**
```js
function greet(name) {
  return "Hello, " + name.toUpperCase();
}

greet(42); // Runtime error: name.toUpperCase is not a function
```

**With TypeScript:**
```ts
function greet(name: string): string {
  return "Hello, " + name.toUpperCase();
}

greet(42); // ❌ Compile-time error: Argument of type 'number' is not assignable to parameter of type 'string'
```

The error is caught **before** the code ever runs. That's the power of TypeScript.

## Core Concepts

### 1. Static Typing
You can annotate variables, function parameters, and return values with types:
```ts
let age: number = 25;
let username: string = "Nobel";
let isActive: boolean = true;
```

### 2. Type Inference
TypeScript is smart — you don't always have to annotate. It infers types automatically:
```ts
let score = 100;        // inferred as number
let title = "My Post";  // inferred as string
score = "oops";         // ❌ Error: Type 'string' is not assignable to type 'number'
```

### 3. Interfaces & Types
Define the shape of objects for consistent usage across your codebase:
```ts
interface User {
  id: number;
  name: string;
  email: string;
  role?: "admin" | "user"; // optional property with union type
}

function displayUser(user: User) {
  console.log(`${user.name} (${user.email})`);
}
```

### 4. Generics
Write reusable, type-safe code:
```ts
function getFirst<T>(arr: T[]): T {
  return arr[0];
}

const firstNum = getFirst([1, 2, 3]);   // type: number
const firstStr = getFirst(["a", "b"]);  // type: string
```

## How TypeScript Fits into a Project

TypeScript is an **Addon** — it works on top of the JavaScript ecosystem:

- Uses the same `npm` packages
- Works with Node.js, browsers, React, Next.js, Express — any JS environment
- The final output is just JavaScript

You configure it with a `tsconfig.json` file:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "outDir": "./dist"
  }
}
```

## TypeScript vs JavaScript

| Feature | JavaScript | TypeScript |
|---|---|---|
| Typing | Dynamic (runtime) | Static (compile-time) |
| Error detection | At runtime | At compile time |
| IDE support | Limited | Excellent (autocomplete, refactoring) |
| Learning curve | Lower | Slightly higher |
| Runs in browser | Directly | Requires compilation |

## Who Uses TypeScript?

TypeScript has been adopted by virtually every major company and framework:

- **Microsoft** — built it and uses it everywhere
- **Google** — uses it for Angular
- **Meta** — uses it in many internal tools
- **Airbnb, Slack, Asana** — migrated from JS to TS

Next.js (what this blog is built with!), NestJS, Prisma — all TypeScript-first.

## Key Takeaway

TypeScript is not a replacement for JavaScript — it **compiles down to JavaScript**. You get all the flexibility of JS plus the safety of a type system. It's the same language you know, with a powerful layer on top that makes large codebases maintainable, self-documenting, and significantly less prone to bugs.

In the next section, we'll explore **Why TypeScript** — the specific problems it solves that make it worth learning.
