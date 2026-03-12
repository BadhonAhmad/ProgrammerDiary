---
title: "How TypeScript Works: The Compiler Pipeline"
date: "2026-03-10"
tags: ["typescript", "compiler", "internals", "ast", "type-checker"]
excerpt: "What actually happens when tsc compiles your TypeScript? A deep dive into the full compiler pipeline — Lexer, Parser, AST, Binder, Checker, and Emitter — explained step by step."
---

# How TypeScript Works: The Compiler Pipeline

When you run `tsc` or save a `.ts` file in your editor, something surprisingly sophisticated happens under the hood. TypeScript doesn't just "strip types." It runs your code through a full **compiler pipeline** with distinct stages — each with a specific responsibility.

Here's the complete picture:

```
Your TypeScript Source Code (.ts)
           │
           ▼
      ┌─────────┐
      │  Lexer  │  ── tokenizes source text
      └─────────┘
           │
           ▼
      ┌─────────┐
      │ Parser  │  ── builds syntax tree
      └─────────┘
           │
           ▼
      ┌─────────┐
      │   AST   │  ── Abstract Syntax Tree
      └─────────┘
           │
           ▼
      ┌──────────────────────────────────────┐
      │               Binder                 │
      │  Symbol Tables · Parent Pointers     │
      │  Flow Nodes                          │
      └──────────────────────────────────────┘
           │
           ▼
      ┌──────────────────────────────────────┐
      │              Checker                 │
      │  Syntax Check · Short Circuit        │
      └──────────────────────────────────────┘
           │
           ▼
      ┌─────────┐
      │ Emitter │  ── outputs final files
      └─────────┘
           │
           ▼
   .js   .d.ts   .map
```

---

## Stage 1 — Lexer (Tokenization)

**Input:** Raw source text (a string of characters)
**Output:** A flat list of **tokens**

The Lexer (also called a Scanner) reads your source file character by character and breaks it into the smallest meaningful units called **tokens**.

```ts
const name: string = "Nobel";
```

The Lexer sees this as:

| Token | Type |
|---|---|
| `const` | Keyword |
| `name` | Identifier |
| `:` | ColonToken |
| `string` | Identifier |
| `=` | EqualsToken |
| `"Nobel"` | StringLiteral |
| `;` | SemicolonToken |

At this stage, the compiler has **no idea** if the code makes sense — it just recognises pieces of text.

---

## Stage 2 — Parser

**Input:** Token stream from the Lexer
**Output:** **AST** (Abstract Syntax Tree)

The Parser consumes tokens and arranges them into a **tree structure** that reflects the grammar of TypeScript. It understands things like:

- This group of tokens is a **variable declaration**
- This group is a **function call**
- This group is an **if statement**

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

The Parser builds a tree like:

```
FunctionDeclaration
├── name: "add"
├── parameters:
│   ├── Parameter: a → TypeAnnotation: number
│   └── Parameter: b → TypeAnnotation: number
├── returnType: number
└── body: Block
    └── ReturnStatement
        └── BinaryExpression (a + b)
```

The Parser **only checks syntax** — it ensures the tokens form valid TypeScript grammar. It does **not** check if types are correct.

---

## Stage 3 — AST (Abstract Syntax Tree)

The AST is not a stage itself — it's the **data structure** produced by the Parser, and consumed by everything after it. Every node in the AST is a TypeScript **SyntaxNode** with:

- A `kind` property (what type of node it is)
- References to child nodes
- Position info (line and column) for error reporting

The TypeScript AST is fully inspectable. This is what tools like ESLint, Prettier, ts-morph, and VS Code's IntelliSense all read.

---

## Stage 4 — Binder

**Input:** AST
**Output:** **Symbol Tables**, parent pointers, and **control flow graph**

This is one of the least talked about but most important stages. The Binder walks the AST and builds three things:

### Symbol Tables
A symbol table is a map of every **named entity** (variable, function, class, interface, type alias) to its declaration. This is how TypeScript knows that when you write `user.name`, `user` refers to the variable declared 10 lines above — not some other `user`.

```ts
// Binder creates a Symbol for each:
const user = { name: "Nobel" };  // Symbol: "user"
function greet() {}               // Symbol: "greet"
interface Config {}               // Symbol: "Config"
```

### Parent Pointers
Every AST node gets a `.parent` reference pointing back up the tree. This seems small but is critical — it lets the Checker and language services navigate the tree in **both directions**, not just top-down.

### Flow Nodes (Control Flow Graph)
This is TypeScript's superpower for **narrowing**.

The Binder tracks every `if`, `else`, `return`, `throw`, `&&`, `||`, `??`, and any expression that changes what type a variable could be. It builds a **control flow graph** — a network of nodes representing every possible execution path.

```ts
function process(value: string | null) {
  if (value === null) {
    return; // flow edge: value is null here
  }
  // flow node: value is narrowed to string here
  console.log(value.toUpperCase()); // ✅ safe
}
```

The Binder creates flow nodes that say "at this point in execution, `value` cannot be null." The Checker uses this graph later when validating types.

---

## Stage 5 — Checker

**Input:** AST + Symbols (from Binder) + Control Flow Graph
**Output:** Type information, **diagnostics (errors)**

The Checker is the **largest file in the TypeScript source code** (`checker.ts` is ~50,000 lines). It is where all type validation happens.

### What the Checker does

#### Syntax & Semantic Validation
Beyond the grammar check of the Parser, the Checker validates **meaning**:

```ts
const x: number = "hello"; // ❌ Type 'string' is not assignable to type 'number'
```

#### Type Inference
When you don't annotate, the Checker figures out the type:

```ts
const arr = [1, 2, 3]; // Checker infers: number[]
const first = arr[0];   // Checker infers: number
```

#### Short Circuit Evaluation
The Checker is smart about not wasting time. If it encounters an `any` type, it stops deep-checking that branch — because `any` is a deliberate escape hatch. Similarly, if a value is known to be unreachable (after a `return` or `throw`), the Checker skips it.

This is the **Short Circuit** shown in the diagram: avoid redundant work on paths that can't produce useful information.

#### Flow-based Narrowing
Using the control flow graph built by the Binder:

```ts
function printId(id: number | string) {
  if (typeof id === "string") {
    // Checker reads flow node: id is string here
    console.log(id.toUpperCase()); // ✅
  } else {
    // Checker reads flow node: id is number here
    console.log(id.toFixed(2)); // ✅
  }
}
```

The Checker queries the flow graph at each point to know the **exact type** of every expression at every location.

---

## Stage 6 — Emitter

**Input:** AST + type information from the Checker
**Output:** Final files

The Emitter takes the validated, type-checked AST and **generates output files**. It produces three kinds of output:

### `.js` — JavaScript Output
All TypeScript-specific syntax (type annotations, interfaces, enums, generics) is **stripped out**. What remains is plain JavaScript that any runtime can execute.

```ts
// Input (.ts)
function greet(name: string): string {
  return `Hello, ${name}`;
}
```
```js
// Output (.js)
function greet(name) {
  return `Hello, ${name}`;
}
```

### `.d.ts` — Type Declaration Files
These contain **only the type information** — no implementation code. They allow other TypeScript projects to consume your library with full type safety, even if they only have the compiled `.js` file.

```ts
// Output (.d.ts)
declare function greet(name: string): string;
```

This is how every npm package written in TypeScript (or with `@types/...`) gives you autocomplete and type checking.

### `.map` — Source Map Files
Source maps link positions in the compiled `.js` back to positions in the original `.ts`. This means when your code throws an error at runtime, the stack trace points to **line 42 of your TypeScript file** — not line 17 of the minified JavaScript.

```json
{
  "version": 3,
  "sources": ["src/index.ts"],
  "mappings": "AAAA,SAAS,..."
}
```

---

## The Complete Flow in 30 Seconds

```
"const x: number = 5"
        │
    LEXER splits into tokens:
    [const] [x] [:] [number] [=] [5]
        │
    PARSER builds tree:
    VariableDeclaration{ name: x, type: number, initializer: 5 }
        │
    BINDER records:
    Symbol "x" → VariableDeclaration
    Flow node: x = 5 (type: number)
        │
    CHECKER validates:
    typeof 5 is number ✅
    assignment to number is valid ✅
        │
    EMITTER outputs:
    "const x = 5"  →  .js
    "declare const x: number"  →  .d.ts
```

---

## Why This Matters as a Developer

Understanding the compiler pipeline explains many TypeScript behaviours:

- **Why narrowing works** — the Binder builds the control flow graph; the Checker reads it
- **Why `any` disables checks** — the Checker short-circuits on `any`
- **Why `.d.ts` files exist** — the Emitter separates types from implementation
- **Why TypeScript doesn't affect runtime performance** — the Emitter strips everything; zero type overhead at runtime
- **Why VS Code feels instant** — it runs a persistent version of the Checker in the background (the Language Server), updating diagnostics as you type

The TypeScript compiler isn't magic — it's a well-engineered pipeline where each stage has one clear job.
