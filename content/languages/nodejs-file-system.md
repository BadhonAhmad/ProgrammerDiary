---
title: "Node.js File System (fs Module)"
date: "2026-04-16"
tags: ["nodejs", "fs", "file-system", "io"]
excerpt: "Master the Node.js fs module — reading, writing, creating, deleting files and directories with both synchronous and asynchronous methods."
---

# Node.js File System (fs Module)

## What is it?

The **fs (File System) module** is a built-in Node.js core module that provides functions for interacting with the file system. It lets you read, write, create, delete, rename, and watch files and directories.

## How it Works

The fs module provides **three API styles**:
1. **Synchronous** (blocking) — `fs.readFileSync()`, `fs.writeFileSync()`
2. **Callback-based** (async) — `fs.readFile()`, `fs.writeFile()`
3. **Promise-based** (async) — `fs.promises.readFile()`, `fs.promises.writeFile()`

### Reading Files

```javascript
const fs = require("fs");
const fsPromises = require("fs").promises;

// 1. Synchronous (blocks the event loop — avoid in production)
const data = fs.readFileSync("input.txt", "utf8");
console.log(data);

// 2. Callback-based async
fs.readFile("input.txt", "utf8", (err, data) => {
  if (err) throw err;
  console.log(data);
});

// 3. Promise-based async (recommended)
async function readFile() {
  const data = await fsPromises.readFile("input.txt", "utf8");
  console.log(data);
}
readFile();
```

### Writing Files

```javascript
const fs = require("fs");
const fsPromises = require("fs").promises;

// Synchronous
fs.writeFileSync("output.txt", "Hello, World!");

// Callback-based
fs.writeFile("output.txt", "Hello, World!", (err) => {
  if (err) throw err;
  console.log("File written!");
});

// Promise-based (recommended)
async function writeFile() {
  await fsPromises.writeFile("output.txt", "Hello, World!");
  console.log("File written!");
}

// Append to a file
await fsPromises.appendFile("log.txt", "New log entry\n");

// Copy a file
await fsPromises.copyFile("source.txt", "destination.txt");
```

### Working with Directories

```javascript
const fs = require("fs").promises;
const path = require("path");

// Create a directory
await fs.mkdir("uploads");
await fs.mkdir("uploads/images", { recursive: true }); // Create nested dirs

// Read directory contents
const files = await fs.readdir("./src");
console.log(files); // ["app.js", "config", "routes"]

// Read directory with file types
const entries = await fs.readdir("./src", { withFileTypes: true });
entries.forEach((entry) => {
  console.log(`${entry.name} → ${entry.isDirectory() ? "DIR" : "FILE"}`);
});

// Remove empty directory
await fs.rmdir("empty-folder");

// Remove directory with contents (Node.js 14.14+)
await fs.rm("old-folder", { recursive: true, force: true });

// Check if path exists
try {
  await fs.access("config.json");
  console.log("File exists");
} catch {
  console.log("File does not exist");
}
```

### File Information & Operations

```javascript
const fs = require("fs").promises;

// Get file stats
const stats = await fs.stat("package.json");
console.log(stats.isFile());        // true
console.log(stats.isDirectory());   // false
console.log(stats.size);            // File size in bytes
console.log(stats.mtime);           // Last modified time
console.log(stats.birthtime);       // Creation time

// Rename a file
await fs.rename("old-name.txt", "new-name.txt");

// Delete a file
await fs.unlink("unwanted-file.txt");

// Change permissions
await fs.chmod("script.sh", 0o755); // rwxr-xr-x
```

### The path Module (Essential Companion)

```javascript
const path = require("path");

// Join paths (cross-platform safe)
const fullPath = path.join("src", "config", "database.js");
// "src/config/database.js" on Unix, "src\config\database.js" on Windows

// Resolve to absolute path
const absolute = path.resolve("src", "app.js");
// "/Users/you/project/src/app.js"

// Get directory name
path.dirname("/src/config/database.js"); // "/src/config"

// Get file name
path.basename("/src/config/database.js");      // "database.js"
path.basename("/src/config/database.js", ".js"); // "database"

// Get extension
path.extname("database.js");   // ".js"
path.extname("archive.tar.gz"); // ".gz"

// Parse path into components
path.parse("/src/config/database.js");
// { root: '/', dir: '/src/config', base: 'database.js', ext: '.js', name: 'database' }
```

### File Watching

```javascript
const fs = require("fs");

// Watch a file for changes
fs.watch("config.json", (eventType, filename) => {
  console.log(`Event: ${eventType}, File: ${filename}`);
  // Re-read config on change
  const config = JSON.parse(fs.readFileSync("config.json", "utf8"));
  console.log("Updated config:", config);
});

// Watch a directory
fs.watch("./src", { recursive: true }, (eventType, filename) => {
  console.log(`${filename} was ${eventType}`);
});
```

### Practical Example: Configuration Manager

```javascript
const fs = require("fs").promises;
const path = require("path");

class ConfigManager {
  constructor(configPath = "config.json") {
    this.configPath = path.resolve(configPath);
    this.config = null;
  }

  async load() {
    try {
      const data = await fs.readFile(this.configPath, "utf8");
      this.config = JSON.parse(data);
      return this.config;
    } catch (error) {
      if (error.code === "ENOENT") {
        // Config doesn't exist, create default
        this.config = { port: 3000, env: "development" };
        await this.save();
        return this.config;
      }
      throw error;
    }
  }

  async save() {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(this.config, null, 2),
      "utf8"
    );
  }

  get(key) {
    return this.config?.[key];
  }

  async set(key, value) {
    this.config[key] = value;
    await this.save();
  }
}

// Usage
async function main() {
  const config = new ConfigManager();
  await config.load();
  console.log(config.get("port")); // 3000
  await config.set("debug", true);
}

main();
```

### Practical Example: Log Rotator

```javascript
const fs = require("fs").promises;
const path = require("path");

async function rotateLogs(logDir, maxFiles = 5) {
  const files = await fs.readdir(logDir);
  const logFiles = files
    .filter((f) => f.endsWith(".log"))
    .sort()
    .reverse();

  // Delete old log files beyond maxFiles
  for (let i = maxFiles; i < logFiles.length; i++) {
    await fs.unlink(path.join(logDir, logFiles[i]));
    console.log(`Deleted old log: ${logFiles[i]}`);
  }

  // Rename current logs (app.log → app.log.1, app.log.1 → app.log.2, etc.)
  for (const file of logFiles.slice(0, maxFiles)) {
    const match = file.match(/(.+)\.log(\.(\d+))?/);
    if (match) {
      const baseName = match[1];
      const num = match[3] ? parseInt(match[3]) + 1 : 1;
      const newName = `${baseName}.log.${num}`;
      await fs.rename(
        path.join(logDir, file),
        path.join(logDir, newName)
      );
    }
  }

  // Create new empty log file
  await fs.writeFile(path.join(logDir, "app.log"), "");
  console.log("Log rotation complete!");
}

rotateLogs("./logs");
```

## Why the fs Module Matters

| Reason | Explanation |
|--------|-------------|
| **Configuration** | Read config files, .env files, and JSON settings |
| **Logging** | Write application logs to files |
| **File Uploads** | Handle uploaded files and save them to disk |
| **Data Processing** | Read/write data files, CSV processing, report generation |
| **Build Tools** | Most build tools (Webpack, Vite) rely heavily on fs |

### Sync vs Async — When to Use Which

| Scenario | Use Sync | Use Async |
|----------|----------|-----------|
| Application startup (loading config) | Acceptable | Preferred |
| Inside an HTTP request handler | **Never** | Always |
| CLI scripts | Acceptable | Either |
| Build scripts | Acceptable | Either |
| Production server | **Never** | Always |

> **Interview Question:** _"When should you use synchronous fs methods?"_
>
> Synchronous fs methods (`readFileSync`, `writeFileSync`) are acceptable only during **application initialization** (loading config before the server starts) or in **CLI scripts** where blocking is acceptable. Never use them inside request handlers or anywhere that could be called during normal server operation — they block the event loop and make the entire server unresponsive for all users.

> **Interview Question:** _"How do you read a large file without loading it all into memory?"_
>
> Use `fs.createReadStream()` to create a readable stream that processes the file in chunks (default 64KB). You can pipe it to a writable stream, use `for await` iteration, or listen to `data` events. This keeps memory usage constant regardless of file size. Example: `fs.createReadStream("big.log").pipe(transform).pipe(fs.createWriteStream("filtered.log"))`.

-> Next: [Node.js HTTP Module](/post/languages/nodejs-http-module)
