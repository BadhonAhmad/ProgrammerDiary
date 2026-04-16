---
title: "Node.js Modules & Require"
date: "2026-04-16"
tags: ["nodejs", "modules", "commonjs", "esm", "require"]
excerpt: "Understand how Node.js modules work — CommonJS (require/module.exports) vs ES Modules (import/export), module resolution, and creating your own modules."
---

# Node.js Modules & Require

## What is it?

A **module** is a self-contained unit of code that encapsulates related functionality. Node.js has a built-in **module system** that lets you split your code into separate files and reuse them across your project. Each file in Node.js is treated as a separate module.

Node.js supports **two module systems**:
1. **CommonJS (CJS)** — The original, uses `require()` and `module.exports`
2. **ES Modules (ESM)** — The modern standard, uses `import` and `export`

## How it Works

### CommonJS Modules (Default)

Every Node.js file is a CommonJS module by default. Node.js wraps each file in a function that provides `module`, `exports`, `require`, `__filename`, and `__dirname`:

```javascript
// What Node.js actually does with your file:
(function (exports, require, module, __filename, __dirname) {
  // Your code goes here
  const express = require("express");
  module.exports = { /* ... */ };
});
```

#### Exporting from a Module

```javascript
// math.js — Exporting multiple values

// Method 1: Assign to module.exports (replaces entire exports object)
module.exports = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
};

// Method 2: Add properties to exports
exports.multiply = (a, b) => a * b;
exports.divide = (a, b) => a / b;

// Method 3: Export a single function/class
module.exports = function add(a, b) {
  return a + b;
};

// Method 4: Export a class
class Calculator {
  add(a, b) { return a + b; }
  subtract(a, b) { return a - b; }
}
module.exports = Calculator;
```

#### Importing a Module

```javascript
// app.js

// Import entire module
const math = require("./math");
console.log(math.add(2, 3)); // 5

// Destructure specific exports
const { multiply, divide } = require("./math");
console.log(multiply(4, 5)); // 20

// Import a single function/class
const add = require("./math");
const Calculator = require("./math");
```

#### Module Resolution Order

When you `require("something")`, Node.js looks for it in this order:

```
1. Core Modules      → require("fs"), require("http"), require("path")
2. File Modules      → require("./utils"), require("../config/db")
3. node_modules      → require("express"), require("lodash")
4. Global node_modules → Last resort
```

```javascript
// Core module — built into Node.js
const fs = require("fs");

// File module — relative path required
const userRouter = require("./routes/userRoutes");
const dbConfig = require("../config/database");

// npm package — from node_modules
const express = require("express");
const mongoose = require("mongoose");

// Folder module — looks for index.js in the folder
const controllers = require("./controllers"); // Loads ./controllers/index.js
```

### ES Modules (ESM)

Modern JavaScript's module system, enabled by adding `"type": "module"` to `package.json`:

```json
// package.json
{
  "type": "module"
}
```

#### Named Exports & Imports

```javascript
// math.mjs (or .js if "type": "module")

// Named exports
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

export function multiply(a, b) {
  return a * b;
}

export class Calculator {
  divide(a, b) { return a / b; }
}
```

```javascript
// app.mjs

// Import specific exports
import { add, subtract } from "./math.mjs";

// Import with alias
import { multiply as mul } from "./math.mjs";

// Import everything
import * as math from "./math.mjs";
console.log(math.add(1, 2));
```

#### Default Exports

```javascript
// logger.mjs
export default class Logger {
  log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}
```

```javascript
// app.mjs
import Logger from "./logger.mjs"; // No braces for default import

const logger = new Logger();
logger.log("App started");
```

### CommonJS vs ES Modules Comparison

| Feature | CommonJS (CJS) | ES Modules (ESM) |
|---------|----------------|-------------------|
| **Import** | `require("module")` | `import x from "module"` |
| **Export** | `module.exports = x` | `export default x` |
| **Loading** | Synchronous | Asynchronous |
| **When evaluated** | At runtime (first `require`) | At parse time (static) |
| **Tree-shaking** | Not supported | Supported (dead code elimination) |
| **Top-level await** | Not supported | Supported |
| **File extension** | `.js` (default), `.cjs` | `.mjs` or `.js` with `"type": "module"` |
| **Node.js support** | Full (default) | Full (since Node 14) |
| **Browser support** | No | Yes |
| **Conditional imports** | Yes (dynamic `require`) | Yes (dynamic `import()`) |

### Core Modules

Node.js comes with built-in modules that don't need installation:

```javascript
const fs = require("fs");           // File system operations
const http = require("http");       // HTTP server/client
const https = require("https");     // HTTPS server/client
const path = require("path");       // File path utilities
const os = require("os");           // Operating system info
const url = require("url");         // URL parsing
const crypto = require("crypto");   // Cryptographic functions
const util = require("util");       // Utility functions
const events = require("events");   // Event emitter
const stream = require("stream");   // Streaming data
const buffer = require("buffer");   // Binary data
const child_process = require("child_process"); // Spawn processes
const cluster = require("cluster"); // Multi-process
const worker_threads = require("worker_threads"); // Worker threads
```

### Organizing Modules — A Practical Pattern

```
src/
├── modules/
│   ├── user/
│   │   ├── index.js        ← Re-exports everything
│   │   ├── controller.js
│   │   ├── service.js
│   │   └── model.js
│   └── order/
│       ├── index.js
│       ├── controller.js
│       └── service.js
```

```javascript
// src/modules/user/index.js
const userController = require("./controller");
const userService = require("./service");
const User = require("./model");

module.exports = {
  controller: userController,
  service: userService,
  Model: User,
};
```

```javascript
// src/app.js
const { controller: userCtrl } = require("./modules/user");
const { controller: orderCtrl } = require("./modules/order");
```

## Why Modules Matter

| Reason | Explanation |
|--------|-------------|
| **Code Organization** | Split large applications into manageable, focused files |
| **Reusability** | Write once, use across multiple files and projects |
| **Encapsulation** | Only exported values are accessible — everything else is private |
| **Maintainability** | Easier to find, fix, and test code in small, isolated modules |
| **Namespace Isolation** | Each module has its own scope — no global variable pollution |
| **Team Collaboration** | Different developers can work on different modules without conflicts |

> **Interview Question:** _"What is the difference between `exports` and `module.exports`?"_
>
> `exports` is a shorthand reference to `module.exports`. You can add properties to `exports` (`exports.foo = bar`), but if you reassign it (`exports = { foo: bar }`), it breaks the reference and your exports won't work. Always use `module.exports` when replacing the entire exports object. `module.exports` is what `require()` actually returns.

> **Interview Question:** _"What is the difference between CommonJS and ES Modules?"_
>
> CJS uses `require()`/`module.exports` and loads synchronously at runtime. ESM uses `import`/`export` and loads asynchronously at parse time. ESM supports tree-shaking (dead code elimination), top-level await, and works in browsers. CJS is Node.js default, supports dynamic conditional imports, and caches modules on first load. In practice, use ESM for new projects, CJS for legacy compatibility.

-> Next: [Node.js npm & Package Management](/post/languages/nodejs-npm-and-package-management)
