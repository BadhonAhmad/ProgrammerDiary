---
title: "Vue.js Installation & Setup — From Zero to Running"
date: "2025-01-01"
tags: ["vue", "javascript", "setup", "frontend"]
excerpt: "Learn how to set up a Vue.js development environment from scratch. Covers Vite-based setup, Vue CLI, CDN usage, and project configuration."
---

# Vue.js Installation & Setup

## Why Setup Matters

Before we write a single Vue component, we need the right development environment. Vue 3 has moved away from the old Vue CLI to **Vite** as its recommended build tool. Understanding why — and how to set things up properly — will save you hours of confusion later.

> **Interview Question:** _"What build tool does Vue 3 recommend and why?"_
> Vue 3 recommends Vite. Vite uses native ES modules for development (no bundling needed during dev, making it extremely fast) and Rollup for production builds. It was also created by Evan You. The old Vue CLI used Webpack, which was significantly slower during development.

## Three Ways to Use Vue

### Method 1: CDN (Quickest — For Learning & Prototyping)

The simplest way to start using Vue. No build tools, no Node.js, just a script tag:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Vue Quick Start</title>
</head>
<body>
  <div id="app">
    <h1>{{ message }}</h1>
    <button @click="count++">Clicked {{ count }} times</button>
  </div>

  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script>
    const { createApp, ref } = Vue

    createApp({
      setup() {
        const message = ref('Hello Vue!')
        const count = ref(0)
        return { message, count }
      }
    }).mount('#app')
  </script>
</body>
</html>
```

Open this file in a browser and it works. No `npm install`, no build step. This is perfect for:
- Learning Vue concepts
- Adding interactivity to an existing page
- Quick prototypes

**Limitations:** No Single File Components (`.vue` files), no TypeScript, no CSS pre-processors, no hot module replacement.

### Method 2: Vite (Recommended — For Real Projects)

This is the **recommended way** to create Vue projects. Vite provides instant server start, lightning-fast hot module replacement, and optimized production builds.

```bash
# Create a new Vue project
npm create vue@latest

# You'll be prompted with options:
# ✔ Project name: my-vue-app
# ✔ Add TypeScript? … No / Yes
# ✔ Add JSX Support? … No / Yes
# ✔ Add Vue Router? … No / Yes
# ✔ Add Pinia? … No / Yes
# ✔ Add Vitest? … No / Yes
# ✔ Add E2E Testing? … No / Yes
# ✔ Add ESLint? … No / Yes
# ✔ Add Prettier? … No / Yes

# Navigate to your project
cd my-vue-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Vite will start a dev server at `http://localhost:5173` with hot module replacement — changes to your code appear instantly in the browser without a full page reload.

### Method 3: Vue CLI (Legacy — Not Recommended for New Projects)

Vue CLI was the original build tool for Vue 2 projects. It uses Webpack under the hood. While it still works, it is in **maintenance mode** and not recommended for new projects.

```bash
# Legacy approach — avoid for new projects
npm install -g @vue/cli
vue create my-app
```

> **Viva Question:** _"What is the difference between Vite and Vue CLI?"_
> Vue CLI uses Webpack for bundling, which means it bundles your entire application before serving it — even during development. This gets slower as your project grows. Vite uses native ES modules during development, serving files on-demand without bundling, making it significantly faster. Vite is the recommended tool for Vue 3.

## Prerequisites

Before you start, make sure you have:

1. **Node.js** (v18.0 or higher) — Download from nodejs.org or use nvm
2. **A code editor** — VS Code with the "Vue - Official" extension (formerly Volar)
3. **A terminal** — Any terminal will work (PowerShell, Git Bash, etc.)

```bash
# Verify Node.js is installed
node --version   # Should show v18.x or higher
npm --version    # Should show 9.x or higher
```

### Setting Up VS Code

Install these extensions for the best Vue development experience:

| Extension | What It Does |
|-----------|-------------|
| **Vue - Official** | Syntax highlighting, IntelliSense, type checking for `.vue` files |
| **ESLint** | Catches JavaScript errors and enforces code style |
| **Prettier** | Automatic code formatting |
| **Vue VSCode Snippets** | Quick snippets for Vue boilerplate |

## The `create-vue` Scaffolding in Detail

When you run `npm create vue@latest`, the scaffolding tool (`create-vue`) generates a project with this structure:

```
my-vue-app/
├── public/
│   └── favicon.ico           # Static assets (served as-is)
├── src/
│   ├── assets/               # Static assets processed by build tool
│   │   └── base.css
│   ├── components/           # Reusable Vue components
│   │   ├── HelloWorld.vue
│   │   ├── TheWelcome.vue
│   │   └── WelcomeItem.vue
│   ├── App.vue               # Root component
│   └── main.js               # Application entry point
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── jsconfig.json             # JavaScript/IDE configuration
└── .gitignore
```

Let's understand the key files:

### `main.js` — The Entry Point

```javascript
import { createApp } from 'vue'
import App from './App.vue'

// Create the Vue application and mount it to #app in index.html
createApp(App).mount('#app')
```

This is where your Vue application starts. `createApp` creates a new Vue application instance, and `.mount('#app')` attaches it to the `<div id="app">` element in `index.html`.

### `App.vue` — The Root Component

```vue
<template>
  <div>
    <h1>{{ title }}</h1>
    <HelloWorld msg="Welcome to Vue!" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

const title = ref('My Vue App')
</script>

<style scoped>
h1 {
  color: #42b883;
}
</style>
```

This is a **Single File Component** — template, script, and style in one file. Every Vue application has at least one component: `App.vue`.

### `vite.config.js` — Build Configuration

```javascript
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

The `@` alias lets you import files using `@/components/HelloWorld.vue` instead of relative paths like `../../components/HelloWorld.vue`.

## NPM Scripts Explained

```json
{
  "scripts": {
    "dev": "vite",              // Start dev server (localhost:5173)
    "build": "vite build",      // Build for production → dist/
    "preview": "vite preview"   // Preview production build locally
  }
}
```

| Command | What It Does |
|---------|-------------|
| `npm run dev` | Starts development server with hot reload |
| `npm run build` | Creates optimized production build in `dist/` folder |
| `npm run preview` | Serves the production build locally to test it |

## Adding Vue Router and Pinia Later

If you didn't add Vue Router or Pinia during scaffolding, you can add them anytime:

```bash
# Add Vue Router
npm install vue-router@4

# Add Pinia (state management)
npm install pinia
```

Then configure them in `main.js`:

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())  // Add Pinia
app.use(router)         // Add Router
app.mount('#app')
```

> **Viva Question:** _"What is the purpose of `main.js` in a Vue project?"_
> `main.js` is the entry point of the Vue application. It creates the Vue app instance using `createApp()`, registers global plugins (like Router and Pinia), and mounts the app to a DOM element using `.mount('#app')`.

## Common Setup Issues

### "command not found: npm"
Node.js is not installed. Download it from nodejs.org.

### "Port 5173 already in use"
Vite will automatically try the next available port (5174, 5175, etc.). You can also configure it:

```javascript
// vite.config.js
export default defineConfig({
  server: {
    port: 3000  // Use a specific port
  }
})
```

### Vue DevTools Not Working
1. Install the "Vue.js devtools" browser extension (Chrome/Firefox)
2. Make sure you're using a development build (not production)
3. Hard refresh the page (Ctrl + Shift + R)

## What's Next?

Now that your development environment is set up, let's understand the directory structure of a Vue project in detail.

→ Next: [Vue.js Directory Structure](/post/languages/vue-directory-structure)
