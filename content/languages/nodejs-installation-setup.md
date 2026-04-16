---
title: "Node.js Installation & Setup"
date: "2026-04-16"
tags: ["nodejs", "backend", "setup", "installation"]
excerpt: "Step-by-step guide to installing Node.js, setting up your development environment, creating your first application, and understanding npm."
---

# Node.js Installation & Setup

## What is it?

Setting up a proper Node.js development environment involves installing the runtime, configuring a package manager, choosing a code editor, and understanding the basic project structure. This guide walks you through everything.

## How to Set Up

### 1. Install Node.js

#### Option A: Official Installer (Recommended for Beginners)

Download from [nodejs.org](https://nodejs.org):

- **LTS (Long Term Support)** — Recommended for most users. Stable, well-tested.
- **Current** — Latest features, may have breaking changes.

#### Option B: Using a Version Manager (Recommended for Developers)

Version managers let you install and switch between multiple Node.js versions:

```bash
# Using nvm (Node Version Manager) — macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Install latest LTS
nvm install --lts

# Install specific version
nvm install 20.11.0

# Switch version
nvm use 20

# Set default version
nvm alias default 20

# List installed versions
nvm ls
```

```bash
# Using nvm-windows — Windows
# Download from https://github.com/coreybutler/nvm-windows/releases

nvm install 20.11.0
nvm use 20.11.0
nvm list
```

```bash
# Using fnm (Fast Node Manager) — Cross-platform
# Install fnm
curl -fsSL https://fnm.vercel.app/install | bash

fnm install --lts
fnm use --lts
```

#### Verify Installation

```bash
node --version    # v20.11.0 (or your version)
npm --version     # 10.2.4 (or your version)
```

### 2. Your First Node.js Application

#### Hello World

```javascript
// hello.js
console.log("Hello, Node.js!");

// Run with: node hello.js
```

#### Your First Server

```javascript
// server.js
const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Hello from my first Node.js server!");
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
```

```bash
node server.js
# Output: Server running at http://localhost:3000/
# Open browser → http://localhost:3000
```

### 3. Understanding npm (Node Package Manager)

npm is the default package manager that comes with Node.js.

```bash
# Initialize a new project
npm init
# Creates package.json with prompts

# Skip prompts, use defaults
npm init -y

# Install a package
npm install express          # Add to dependencies
npm install --save-dev jest  # Add to devDependencies
npm install -g nodemon       # Install globally

# Install specific version
npm install express@4.18.2

# Uninstall a package
npm uninstall express

# Update packages
npm update

# List installed packages
npm list
npm list --depth=0  # Top-level only
```

#### package.json — The Heart of Your Project

```json
{
  "name": "my-backend-app",
  "version": "1.0.0",
  "description": "My first Node.js backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "keywords": ["nodejs", "backend"],
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.2"
  }
}
```

#### Understanding Semantic Versioning

```
^4.18.2
│ │  │ │
│ │  │ └── Patch: Bug fixes (4.18.2 → 4.18.3) ✓ Auto-update
│ │  └──── Minor: New features (4.18 → 4.19)    ✓ Auto-update
│ └─────── Major: Breaking changes (4 → 5)      ✗ Manual update
└───────── Caret (^): Allows minor + patch updates

~4.18.2
───────── Tilde (~): Allows patch updates only

4.18.2
───────── Exact version, no auto-updates
```

### 4. Essential npm Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "build": "tsc",
    "test": "jest --coverage",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

```bash
npm run dev     # Development with auto-restart
npm start       # Production start
npm test        # Run tests
npm run lint    # Check code quality
```

### 5. Project Structure Best Practices

```
my-backend-app/
├── src/                    # Source code
│   ├── config/             # Configuration files
│   │   ├── database.js
│   │   └── env.js
│   ├── controllers/        # Route handlers
│   │   └── userController.js
│   ├── middleware/          # Custom middleware
│   │   └── auth.js
│   ├── models/             # Data models
│   │   └── User.js
│   ├── routes/             # Route definitions
│   │   └── userRoutes.js
│   ├── services/           # Business logic
│   │   └── userService.js
│   ├── utils/              # Helper functions
│   │   └── logger.js
│   └── server.js           # Entry point
├── tests/                  # Test files
│   └── user.test.js
├── .env                    # Environment variables
├── .env.example            # Example env file
├── .gitignore              # Git ignore rules
├── package.json            # Dependencies & scripts
└── README.md               # Project documentation
```

### 6. Essential .gitignore

```gitignore
node_modules/
.env
dist/
build/
*.log
.DS_Store
coverage/
```

### 7. Environment Variables with dotenv

```bash
npm install dotenv
```

```bash
# .env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/myapp
JWT_SECRET=your-super-secret-key
NODE_ENV=development
```

```javascript
// src/config/env.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || "development",
};
```

### 8. Recommended Development Tools

| Tool | Purpose | Install |
|------|---------|---------|
| **nodemon** | Auto-restart server on file changes | `npm i -D nodemon` |
| **ESLint** | Linting and code quality | `npm i -D eslint` |
| **Prettier** | Code formatting | `npm i -D prettier` |
| **Jest** | Testing framework | `npm i -D jest` |
| **dotenv** | Environment variables | `npm i dotenv` |

## Why Proper Setup Matters

| Reason | Explanation |
|--------|-------------|
| **Reproducibility** | `package-lock.json` ensures every developer gets the same dependency versions |
| **Security** | `.env` files keep secrets out of version control |
| **Consistency** | ESLint + Prettier ensure all team members write code the same way |
| **Efficiency** | nodemon saves you from manually restarting after every change |
| **Scalability** | A clean project structure makes it easy to add features as the app grows |

> **Interview Question:** _"What is the difference between `dependencies` and `devDependencies`?"_
>
> **dependencies** are packages needed at runtime (express, mongoose, bcrypt). **devDependencies** are packages needed only during development (jest, nodemon, eslint). When you run `npm install --production`, only `dependencies` are installed, keeping the production deployment smaller and more secure.

> **Interview Question:** _"What is `package-lock.json` and why should you commit it?"_
>
> `package-lock.json` locks the exact versions of all dependencies (including transitive ones). It ensures that every developer and every environment (CI/CD, production) installs the exact same dependency tree. Without it, `npm install` might resolve different versions on different machines, causing "works on my machine" bugs.

-> Next: [Node.js Event Loop](/post/languages/nodejs-event-loop)
