---
title: "Vue.js Directory Structure — Understanding Your Project"
date: "2025-01-01"
tags: ["vue", "javascript", "project-structure", "frontend"]
excerpt: "Understand every file and folder in a Vue.js project. Learn what goes where, and why a well-organized project structure matters."
---

# Vue.js Directory Structure

## Why Structure Matters

When you first create a Vue project, it generates a bunch of files and folders. At first glance, it can look overwhelming. But every file serves a specific purpose, and understanding the structure early will save you from the "where does this go?" confusion that slows down every beginner.

> **Interview Question:** _"Explain the directory structure of a Vue.js project."_
> A typical Vue project has: `src/` for your source code (components, views, assets), `public/` for static files, `index.html` as the entry HTML, `vite.config.js` for build configuration, and `package.json` for dependencies. Inside `src/`, `main.js` bootstraps the app, `App.vue` is the root component, and subdirectories like `components/`, `views/`, `router/`, and `stores/` organize different concerns.

## The Full Project Structure

Here is what a complete Vue project (with Router and Pinia) looks like:

```
my-vue-app/
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── base.css
│   │   └── logo.svg
│   ├── components/
│   │   ├── HelloWorld.vue
│   │   ├── NavBar.vue
│   │   └── FooterBar.vue
│   ├── views/
│   │   ├── HomeView.vue
│   │   ├── AboutView.vue
│   │   └── UserView.vue
│   ├── router/
│   │   └── index.js
│   ├── stores/
│   │   ├── counter.js
│   │   └── user.js
│   ├── composables/
│   │   ├── useFetch.js
│   │   └── useAuth.js
│   ├── utils/
│   │   └── helpers.js
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
├── jsconfig.json
├── .gitignore
├── .env
├── .env.development
└── .env.production
```

Let's break down every piece.

## Top-Level Files

### `index.html` — The HTML Entry Point

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" href="/favicon.ico">
  <title>My Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

This is the **only HTML file** in your entire application. Vue mounts your entire app into the `<div id="app">` element. The `<script type="module">` tag loads your JavaScript as an ES module — this is how Vite serves code during development without bundling.

### `package.json` — Project Configuration

```json
{
  "name": "my-vue-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.3.0",
    "pinia": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.4.0"
  }
}
```

Key sections:
- **`dependencies`** — Packages your app needs to run (Vue, Router, Pinia)
- **`devDependencies`** — Packages only needed during development (Vite, plugins)
- **`scripts`** — Command shortcuts (`npm run dev` runs `vite`)

### `vite.config.js` — Vite Configuration

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

This configures Vite. The `@` alias is crucial — it lets you import from the `src` directory using `@/` instead of messy relative paths:

```javascript
// Without alias (painful)
import NavBar from '../../../components/NavBar.vue'

// With @ alias (clean)
import NavBar from '@/components/NavBar.vue'
```

### Environment Files

```
.env                  # Default (all environments)
.env.development      # Development only
.env.production       # Production only
```

```bash
# .env.development
VITE_API_URL=http://localhost:3000/api

# .env.production
VITE_API_URL=https://api.myapp.com
```

> **Viva Question:** _"Why do environment variables in Vue need the VITE_ prefix?"_
> For security. Only variables prefixed with `VITE_` are embedded into the client bundle by Vite. This prevents accidentally exposing server-side secrets (like database passwords) to the browser. Any variable without the `VITE_` prefix is ignored.

## The `public/` Directory

Files in `public/` are served **as-is** without any processing. They are not processed by Vite, not hashed, not optimized. Use it for:

- `favicon.ico` — Browser tab icon
- `robots.txt` — Search engine crawl instructions
- `manifest.json` — PWA manifest
- Images that need a fixed URL (like Open Graph images)

```html
<!-- Reference public files with absolute paths -->
<link rel="icon" href="/favicon.ico">
<img src="/images/og-image.jpg">
```

## The `src/` Directory — Where Your Code Lives

This is where 99% of your work happens.

### `src/main.js` — Application Bootstrap

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
```

This file:
1. Imports the root `App` component
2. Creates a Vue application instance
3. Registers plugins (Pinia, Router)
4. Mounts the app to `#app` in `index.html`

### `src/App.vue` — The Root Component

```vue
<template>
  <NavBar />
  <RouterView />
  <FooterBar />
</template>

<script setup>
import NavBar from '@/components/NavBar.vue'
import FooterBar from '@/components/FooterBar.vue'
</script>

<style>
/* Global app-level styles */
#app {
  font-family: Arial, sans-serif;
  min-height: 100vh;
}
</style>
```

`<RouterView />` is a special component that renders the component matching the current route. Think of it as a placeholder that Vue Router fills in.

### `src/components/` — Reusable Components

This folder holds **reusable, self-contained UI components** — buttons, cards, modals, form inputs. A component here should be usable in multiple places:

```
components/
├── NavBar.vue           # Navigation bar
├── FooterBar.vue        # Footer
├── BaseButton.vue       # Reusable button
├── BaseCard.vue         # Reusable card
├── BaseInput.vue        # Reusable form input
├── UserCard.vue         # Displays user info
└── SearchBar.vue        # Search input with logic
```

### `src/views/` — Page-Level Components

Views are **page-level components** — each one represents a route/page in your application. They use the reusable components from `components/`:

```
views/
├── HomeView.vue         # Home page (/)
├── AboutView.vue        # About page (/about)
├── UserView.vue         # User profile (/user/:id)
├── LoginView.vue        # Login page (/login)
└── DashboardView.vue    # Dashboard (/dashboard)
```

> **Interview Question:** _"What is the difference between components and views in Vue?"_
> Components are reusable UI building blocks (buttons, cards, modals) used across multiple pages. Views are page-level components mapped to routes — each view represents a full page. Views compose components together. This separation keeps your code organized: views handle page-level concerns, components handle reusable UI.

### `src/router/` — Route Definitions

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // Lazy-loaded — only loaded when user visits /about
      component: () => import('@/views/AboutView.vue')
    },
    {
      path: '/user/:id',
      name: 'user',
      component: () => import('@/views/UserView.vue')
    }
  ]
})

export default router
```

### `src/stores/` — Pinia State Management

```javascript
// src/stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

### `src/composables/` — Reusable Logic

Composables are **reusable pieces of reactive logic** — think of them as Vue's version of React hooks:

```javascript
// src/composables/useFetch.js
import { ref } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(true)

  fetch(url)
    .then(res => res.json())
    .then(json => { data.value = json; loading.value = false })
    .catch(err => { error.value = err; loading.value = false })

  return { data, error, loading }
}
```

### `src/assets/` — Static Assets

Files here are **processed by Vite** — they get hashed filenames for cache busting and can be optimized:

```javascript
// Import an image (Vite processes it)
import logo from '@/assets/logo.svg'

// Use it in template
// <img :src="logo" alt="Logo" />
```

### `src/utils/` — Helper Functions

Plain JavaScript utility functions that don't depend on Vue's reactivity:

```javascript
// src/utils/helpers.js
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(new Date(date))
}

export function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase, multi-word | `NavBar.vue`, `UserCard.vue` |
| Views | PascalCase + `View` suffix | `HomeView.vue`, `AboutView.vue` |
| Composables | camelCase with `use` prefix | `useFetch.js`, `useAuth.js` |
| Stores | camelCase | `counter.js`, `user.js` |
| Utils | camelCase | `helpers.js`, `validators.js` |

> **Viva Question:** _"Why should Vue component names be multi-word?"_
> To avoid conflicts with current and future HTML elements. HTML elements are single words (`<button>`, `<header>`, `<footer>`). If you name a component `Header.vue`, it could conflict with the native `<header>` element. Using multi-word names like `AppHeader` or `NavBar` prevents this. This is an official Vue style guide recommendation.

## What's Next?

Now that you understand the project structure, let's dive into Vue's core concepts — starting with the Vue Instance and Reactivity system.

→ Next: [Vue Instance & Reactivity](/post/languages/vue-instance-and-reactivity)
