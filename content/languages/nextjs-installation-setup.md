---
title: "Next.js Installation & Setup — From Zero to Running"
date: "2025-01-01"
tags: ["nextjs", "react", "setup", "installation", "frontend"]
excerpt: "Learn how to create and configure a Next.js project from scratch. Covers create-next-app, TypeScript setup, Tailwind CSS, environment variables, and development scripts."
---

# Next.js Installation & Setup

## Why Proper Setup Matters

Before writing a single component, setting up your Next.js project correctly saves you from hours of configuration headaches later. Next.js provides a powerful scaffolding tool called `create-next-app` that handles the entire setup — including TypeScript, Tailwind CSS, ESLint, and the App Router — in one command.

> **Interview Question:** _"How do you create a new Next.js project?"_
> Run `npx create-next-app@latest` and answer the prompts. The tool scaffolds the entire project with the App Router, TypeScript (optional), Tailwind CSS (optional), ESLint, and the correct configuration. The recommended flags for a production-ready setup: `npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir`.

## Prerequisites

Before you start, make sure you have:

1. **Node.js 18.17 or later** — Next.js 14+ requires this minimum version
2. **A package manager** — npm (comes with Node), yarn, pnpm, or bun
3. **A code editor** — VS Code with the following extensions:
   - **Tailwind CSS IntelliSense** — for Tailwind class autocompletion
   - **ESLint** — for code linting
   - **Prettier** — for code formatting

```bash
# Verify Node.js is installed
node --version   # Should be v18.17+ or higher
npm --version    # Should be 9+ or higher
```

## Creating a New Project

### Using `create-next-app`

```bash
npx create-next-app@latest
```

The interactive prompts will ask:

```
What is your project named? my-nextjs-app
Would you like to use TypeScript? No / Yes
Would you like to use ESLint? No / Yes
Would you like to use Tailwind CSS? No / Yes
Would you like your code inside a `src/` directory? No / Yes
Would you like to use App Router? (recommended) No / Yes
Would you like to use Turbopack for next dev? No / Yes
Would you like to customize the import alias (@/* by default)? No / Yes
```

**Recommended answers for a modern project:**

| Prompt | Recommendation | Why |
|--------|---------------|-----|
| TypeScript? | Yes | Type safety catches bugs early |
| ESLint? | Yes | Code quality enforcement |
| Tailwind CSS? | Yes | Most popular CSS solution with Next.js |
| `src/` directory? | Yes | Cleaner project root |
| App Router? | Yes | The modern, recommended routing system |
| Turbopack? | Yes | Faster development builds |
| Import alias? | `@/*` (default) | Clean imports |

### One-Liner (Skip Prompts)

```bash
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --turbopack
```

## The Generated Project

After scaffolding, your project looks like this:

```
my-nextjs-app/
├── public/
│   └── file.svg
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx         ← Root layout (wraps all pages)
│   │   └── page.tsx           ← Home page (/)
│   └── ...
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### Key Configuration Files

**`next.config.ts`** — Next.js configuration:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add custom configuration here
};

export default nextConfig;
```

This is where you configure image domains, redirects, rewrites, environment variables, and custom webpack settings.

**`tsconfig.json`** — TypeScript configuration. The `@/*` alias is pre-configured:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**`tailwind.config.ts`** — Tailwind CSS configuration:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

## NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Starts development server at `http://localhost:3000` with hot reload |
| `npm run build` | Creates optimized production build in `.next/` folder |
| `npm run start` | Starts the production server (must run `build` first) |
| `npm run lint` | Runs ESLint to check for code issues |

## Environment Variables

Next.js has built-in support for environment variables with a security-first design:

```bash
# .env.local (never committed to git)
DATABASE_URL=postgresql://localhost:5432/mydb
API_SECRET=something-secret

# .env (committed — default values)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**The critical rule:**

- Variables prefixed with **`NEXT_PUBLIC_`** are exposed to the browser (embedded into the client JavaScript bundle)
- Variables **without** the prefix are server-only — they are never sent to the browser

```tsx
// Server Component — can access ALL environment variables
const dbUrl = process.env.DATABASE_URL;          // Works
const publicUrl = process.env.NEXT_PUBLIC_APP_URL; // Also works

// Client Component — can ONLY access NEXT_PUBLIC_ variables
const dbUrl = process.env.DATABASE_URL;          // undefined (not available!)
const publicUrl = process.env.NEXT_PUBLIC_APP_URL; // Works
```

> **Viva Question:** _"Why do environment variables need the `NEXT_PUBLIC_` prefix in Next.js?"_
> For security. Only variables prefixed with `NEXT_PUBLIC_` are embedded into the client-side JavaScript bundle at build time. Variables without the prefix remain server-only and are never sent to the browser. This prevents accidentally exposing database passwords, API secrets, or other sensitive credentials to users.

## Running the Development Server

```bash
cd my-nextjs-app
npm run dev
```

Open `http://localhost:3000` in your browser. You should see the Next.js starter page.

Key features of the dev server:
- **Fast Refresh** — Changes to your code appear instantly without losing component state
- **TypeScript errors** — Shown as an overlay in the browser and in the terminal
- **Automatic compilation** — Pages are compiled on-demand as you navigate

## Common Setup Issues

### "Module not found" errors
Run `npm install` to ensure all dependencies are installed.

### Port 3000 already in use
Next.js automatically tries the next available port (3001, 3002, etc.). You can also specify a port:

```bash
npm run dev -- -p 4000
```

### Tailwind classes not working
Make sure your `tailwind.config.ts` includes the correct `content` paths for where your components are located.

## What's Next?

Now that your project is running, let's understand every file and folder in the Next.js directory structure.

→ Next: [Next.js Directory Structure](/post/languages/nextjs-directory-structure)
