---
title: "Vue Router — Building Multi-Page Applications"
date: "2025-01-01"
tags: ["vue", "javascript", "router", "routing", "spa", "frontend"]
excerpt: "Master Vue Router for building single-page applications with multiple views. Learn route configuration, navigation guards, dynamic routes, lazy loading, and nested routes."
---

# Vue Router

## What is Vue Router?

Vue Router is the **official routing library** for Vue.js. It enables you to build **Single Page Applications (SPAs)** — applications that have multiple "pages" without actually reloading the browser. When you click a link, Vue Router swaps out the current view component for a new one, creating the illusion of page navigation.

Without a router, your Vue app is a single page. With Vue Router, it becomes a multi-page experience.

> **Interview Question:** _"How does Vue Router work?"_
> Vue Router maps URL paths to Vue components. When the URL changes, Vue Router matches the path to its route configuration, finds the corresponding component, and renders it inside the `<RouterView>` outlet — all without reloading the page. It uses the browser's History API to manipulate the URL and provides navigation guards for controlling access to routes.

## Why Routing Matters

Traditional multi-page websites load a new HTML document from the server on every navigation. This causes a full page reload — white flash, lost JavaScript state, slow experience.

SPAs solve this by loading **one HTML page** and dynamically swapping content using JavaScript. Vue Router is the tool that manages which component is displayed for each URL.

```
Traditional:  Click link → Full page reload → New HTML document
SPA:          Click link → JavaScript swaps component → Instant, no reload
```

## Setting Up Vue Router

### Installation

```bash
npm install vue-router@4
```

### Basic Configuration

```javascript
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/about',
    name: 'about',
    // Lazy-loaded — only downloaded when user visits /about
    component: () => import('@/views/AboutView.vue')
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('@/views/UsersView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
```

### Register in main.js

```javascript
// src/main.js
import { createApp } from 'vue'
import router from './router'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

### Use in App.vue

```vue
<!-- src/App.vue -->
<template>
  <nav>
    <RouterLink to="/">Home</RouterLink>
    <RouterLink to="/about">About</RouterLink>
    <RouterLink to="/users">Users</RouterLink>
  </nav>

  <!-- Route components are rendered here -->
  <RouterView />
</template>
```

> **Viva Question:** _"What is the difference between `RouterLink` and a regular `<a>` tag?"_
> `<RouterLink>` is Vue Router's component for navigation. Unlike a regular `<a>` tag which causes a full page reload, `RouterLink` intercepts the click, updates the URL using the History API, and renders the matching route component — all without a page reload. It also automatically applies the `router-link-active` class when the link matches the current route, useful for styling active navigation.

## Dynamic Routes

Routes with parameters using `:paramName`:

```javascript
const routes = [
  {
    path: '/users/:id',
    name: 'user',
    component: () => import('@/views/UserView.vue')
  },
  {
    path: '/posts/:postId/comments/:commentId',
    name: 'comment',
    component: () => import('@/views/CommentView.vue')
  }
]
```

### Accessing Route Params

```vue
<!-- UserView.vue -->
<script setup>
import { useRoute } from 'vue-router'
import { ref, watch } from 'vue'

const route = useRoute()

// Access the :id parameter
console.log(route.params.id)  // e.g., "42"

// React to param changes (e.g., navigating from /users/1 to /users/2)
watch(() => route.params.id, (newId) => {
  fetchUser(newId)
})
</script>
```

### Optional and Repeatable Params

```javascript
// Optional parameter (matches /users and /users/:id)
{ path: '/users/:id?' }

// Repeatable parameter (matches /files, /files/foo, /files/foo/bar)
{ path: '/files/:path*' }

// Required repeatable (must have at least one)
{ path: '/files/:path+' }
```

## Nested Routes

For layouts with nested content areas:

```javascript
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardLayout.vue'),
    children: [
      {
        path: '',  // /dashboard
        component: () => import('@/views/DashboardHome.vue')
      },
      {
        path: 'settings',  // /dashboard/settings
        component: () => import('@/views/DashboardSettings.vue')
      },
      {
        path: 'profile',  // /dashboard/profile
        component: () => import('@/views/DashboardProfile.vue')
      }
    ]
  }
]
```

```vue
<!-- DashboardLayout.vue -->
<template>
  <div class="dashboard">
    <DashboardSidebar />

    <main>
      <!-- Child route components render here -->
      <RouterView />
    </main>
  </div>
</template>
```

## Navigation

### Programmatic Navigation

```javascript
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// Navigate to a named route
router.push({ name: 'user', params: { id: 42 } })

// Navigate to a path
router.push('/users')

// With query parameters
router.push({ path: '/search', query: { q: 'vue' } })
// URL: /search?q=vue

// Replace current entry (no back button)
router.replace('/login')

// Go back
router.go(-1)

// Go forward
router.go(1)
```

### Declarative Navigation

```vue
<template>
  <!-- Basic -->
  <RouterLink to="/about">About</RouterLink>

  <!-- Named route -->
  <RouterLink :to="{ name: 'user', params: { id: 42 } }">User 42</RouterLink>

  <!-- With query -->
  <RouterLink :to="{ path: '/search', query: { q: 'vue' } }">Search</RouterLink>

  <!-- Replace instead of push -->
  <RouterLink to="/about" replace>About</RouterLink>

  <!-- Custom active class -->
  <RouterLink to="/about" active-class="current" exact-active-class="exact-current">
    About
  </RouterLink>
</template>
```

## Navigation Guards

Guards let you control access to routes — perfect for authentication, data fetching, and analytics.

### Per-Route Guards

```javascript
const routes = [
  {
    path: '/admin',
    component: () => import('@/views/AdminView.vue'),
    beforeEnter: (to, from) => {
      // Return false to cancel navigation
      if (!isAuthenticated()) {
        return '/login'  // Redirect to login
      }
    }
  }
]
```

### Global Guards

```javascript
// router/index.js
router.beforeEach((to, from) => {
  const isAuthenticated = localStorage.getItem('token')

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: 'login' }
  }
})

router.afterEach((to, from) => {
  // Analytics, page title, etc.
  document.title = to.meta.title || 'My App'
})
```

### Route Meta Fields

```javascript
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Dashboard'
    }
  },
  {
    path: '/login',
    component: () => import('@/views/LoginView.vue'),
    meta: {
      requiresAuth: false,
      title: 'Login'
    }
  }
]
```

### In-Component Guards

```javascript
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

// Prevent leaving with unsaved changes
onBeforeRouteLeave((to, from) => {
  if (hasUnsavedChanges.value) {
    const answer = confirm('Do you really want to leave? You have unsaved changes.')
    if (!answer) return false
  }
})

// React to param changes in the same component
onBeforeRouteUpdate(async (to) => {
  // User navigated from /users/1 to /users/2
  userData.value = await fetchUser(to.params.id)
})
```

## 404 Catch-All Route

```javascript
const routes = [
  // ... other routes

  // Catch-all — matches any path not matched above
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]
```

## `createWebHistory` vs `createWebHashHistory`

| Mode | URL Example | When to Use |
|------|-------------|-------------|
| `createWebHistory` | `/users/42` | **Recommended** — clean URLs, requires server config |
| `createWebHashHistory` | `/#/users/42` | When you can't configure the server |

For `createWebHistory`, you must configure your server to serve `index.html` for all routes (otherwise refreshing on `/users/42` returns 404).

> **Interview Question:** _"What is the difference between `createWebHistory` and `createWebHashHistory`?"_
> `createWebHistory` uses the HTML5 History API for clean URLs (`/users/42`) — requires server-side configuration to redirect all routes to `index.html`. `createWebHashHistory` uses the URL hash (`/#/users/42`) — works without server configuration because the server never sees the hash part. `createWebHistory` is recommended for production due to cleaner URLs and better SEO.

## What's Next?

Now let's learn about Pinia — Vue's official state management solution.

→ Next: [Pinia State Management](/post/languages/vue-pinia)
