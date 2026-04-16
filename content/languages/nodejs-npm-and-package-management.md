---
title: "Node.js npm & Package Management"
date: "2026-04-16"
tags: ["nodejs", "npm", "package-management", "dependencies"]
excerpt: "Master npm, yarn, and pnpm — understand package.json, semantic versioning, dependency management, and publishing your own packages."
---

# Node.js npm & Package Management

## What is it?

**npm** (Node Package Manager) is the default package manager for Node.js. It consists of:
1. **A command-line tool** — for installing, updating, and managing packages
2. **A registry** — the world's largest software registry with 2+ million packages at [npmjs.com](https://npmjs.com)
3. **A website** — for browsing and discovering packages

Alternatives: **Yarn** (by Meta) and **pnpm** (faster, disk-efficient).

## How it Works

### package.json — The Manifest File

Every Node.js project has a `package.json` at its root. It describes the project and its dependencies:

```json
{
  "name": "my-backend-api",
  "version": "1.0.0",
  "description": "A RESTful API built with Node.js",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --coverage",
    "lint": "eslint src/",
    "build": "tsc && node dist/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "eslint": "^8.56.0",
    "prettier": "^3.1.1"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "keywords": ["api", "express", "mongodb"],
  "author": "Your Name",
  "license": "ISC",
  "repository": {
    "type": "git",
    "url": "https://github.com/username/repo.git"
  }
}
```

### Semantic Versioning (SemVer)

Every package version follows `MAJOR.MINOR.PATCH`:

```
1.2.3
│ │ │
│ │ └── PATCH: Bug fixes, backward compatible
│ └──── MINOR: New features, backward compatible
└────── MAJOR: Breaking changes, NOT backward compatible
```

#### Version Ranges in package.json

| Symbol | Example | Meaning |
|--------|---------|---------|
| `^` (Caret) | `^1.2.3` | Allows `>=1.2.3 <2.0.0` (minor + patch) |
| `~` (Tilde) | `~1.2.3` | Allows `>=1.2.3 <1.3.0` (patch only) |
| `*` (Asterisk) | `*` | Any version (dangerous!) |
| `>=` | `>=1.2.3` | Greater than or equal |
| Exact | `1.2.3` | Only this exact version |

### Essential npm Commands

```bash
# Project setup
npm init                        # Interactive setup
npm init -y                     # Quick setup with defaults

# Installing packages
npm install express             # Install and add to dependencies
npm install express@4.18.2      # Install specific version
npm install -D jest             # Install as devDependency
npm install -g nodemon          # Install globally (system-wide)

# Managing packages
npm uninstall express           # Remove package
npm update                      # Update all packages within semver range
npm update express              # Update specific package
npm outdated                    # Show which packages are outdated

# Information
npm list                        # Show installed packages (tree)
npm list --depth=0              # Top-level only
npm view express versions       # Show all available versions
npm view express                # Show package info

# Running scripts
npm start                       # Runs "start" script
npm run dev                     # Runs "dev" script
npm test                        # Runs "test" script
npm run lint                    # Runs "lint" script

# Security
npm audit                       # Check for known vulnerabilities
npm audit fix                   # Auto-fix vulnerabilities
```

### package-lock.json — The Lock File

When you run `npm install`, npm generates `package-lock.json`:

```json
{
  "name": "my-backend-api",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": { "dependencies": { "express": "^4.18.2" } },
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-..."
    }
  }
}
```

**Why it's critical:**
- Locks exact versions of ALL dependencies (including nested/transitive ones)
- Ensures every team member and CI/CD gets identical dependency trees
- Contains integrity hashes for security verification
- **Always commit it to Git!**

### npm vs Yarn vs pnpm

| Feature | npm | Yarn | pnpm |
|---------|-----|------|------|
| **Install Speed** | Slow | Fast | Fastest |
| **Disk Usage** | High (each project has node_modules) | High | Low (shared store via symlinks) |
| **Lock File** | `package-lock.json` | `yarn.lock` | `pnpm-lock.yaml` |
| **Workspaces** | Yes | Yes | Yes |
| **Offline Install** | Partial | Yes | Yes |
| **Strictness** | Default hoisting | Default hoisting | Strict isolation |

```bash
# Yarn
yarn init -y
yarn add express
yarn add -D jest
yarn remove express
yarn install
yarn dev

# pnpm
pnpm init
pnpm add express
pnpm add -D jest
pnpm remove express
pnpm install
pnpm dev
```

### npx — Run Without Installing

`npx` comes with npm and lets you run packages without installing them globally:

```bash
# Create a new Express project
npx express-generator myapp

# Run a one-time tool
npx create-react-app my-frontend

# Check package versions
npx npm-check-updates

# Use TypeScript without global install
npx ts-node script.ts

# Run any npm package binary
npx json-server db.json
```

### Workspace (Monorepo) Setup

For larger projects with multiple packages:

```json
// Root package.json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

```
my-monorepo/
├── package.json          ← Workspace root
├── packages/
│   ├── api/              ← Workspace package
│   │   └── package.json
│   ├── shared/           ← Workspace package
│   │   └── package.json
│   └── workers/          ← Workspace package
│       └── package.json
```

```bash
npm install              # Installs ALL workspaces
npm run dev -w api       # Run script in specific workspace
npm add express -w api   # Add dependency to specific workspace
```

## Why Package Management Matters

| Reason | Explanation |
|--------|-------------|
| **Reproducibility** | Lock files ensure identical installs across environments |
| **Security** | `npm audit` catches known vulnerabilities in dependencies |
| **Efficiency** | Don't reinvent the wheel — use battle-tested packages |
| **Collaboration** | `package.json` documents exactly what a project needs |
| **Version Control** | SemVer ranges let you get bug fixes without breaking changes |

> **Interview Question:** _"What is the difference between `dependencies` and `devDependencies`? When does it matter?"_
>
> `dependencies` are required at runtime (express, mongoose, bcrypt). `devDependencies` are only for development (jest, eslint, nodemon). It matters when deploying: `npm install --production` skips devDependencies, reducing attack surface and deployment size. In Docker: use `npm ci --only=production` in the final image.

> **Interview Question:** _"What happens when you run `npm install`?"_
>
> (1) Reads `package.json` to get dependency list, (2) Checks `package-lock.json` for exact versions, (3) Resolves the full dependency tree (transitive dependencies), (4) Downloads packages from the npm registry to a local cache, (5) Extracts packages into `node_modules/`, (6) Runs `preinstall`, `install`, `postinstall` lifecycle scripts, (7) Updates or creates `package-lock.json`.

-> Next: [Node.js Callbacks, Promises & Async/Await](/post/languages/nodejs-callbacks-promises-async-await)
