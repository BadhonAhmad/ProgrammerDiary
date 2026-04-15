---
title: "Dynamic & Async Components — Loading on Demand"
date: "2025-01-01"
tags: ["vue", "javascript", "dynamic-components", "async", "frontend"]
excerpt: "Learn how to render components dynamically with `<component :is>` and load components asynchronously for better performance. Covers KeepAlive, Suspense, and code splitting."
---

# Dynamic & Async Components

## What Are Dynamic Components?

Dynamic components let you switch between multiple components at runtime using a single mount point. Instead of using `v-if` / `v-else` for every possible component, you use Vue's built-in `<component>` element with the `:is` attribute.

> **Interview Question:** _"How do you implement tab switching in Vue?"_
> Use dynamic components with `<component :is="currentTab">`. Bind `:is` to a reactive variable that holds the current tab's component definition. This is cleaner than using multiple `v-if` conditions. Combine with `<KeepAlive>` to preserve component state when switching tabs.

## Dynamic Components with `<component :is>`

### Basic Tab Example

```vue
<template>
  <div>
    <button
      v-for="tab in tabs"
      :key="tab"
      @click="currentTab = tab"
      :class="{ active: currentTab === tab }"
    >
      {{ tab }}
    </button>

    <!-- Dynamic component — renders whatever currentTabComponent is -->
    <component :is="currentTabComponent" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import HomeTab from '@/components/HomeTab.vue'
import ProfileTab from '@/components/ProfileTab.vue'
import SettingsTab from '@/components/SettingsTab.vue'

const tabs = ['Home', 'Profile', 'Settings']
const currentTab = ref('Home')

const tabComponents = {
  Home: HomeTab,
  Profile: ProfileTab,
  Settings: SettingsTab
}

const currentTabComponent = computed(() => tabComponents[currentTab.value])
</script>
```

### `<component :is>` with Strings

You can also use HTML element names or registered component names:

```vue
<template>
  <!-- Renders a native HTML element -->
  <component :is="href ? 'a' : 'span'" :href="href">
    Click me
  </component>
</template>
```

## `<KeepAlive>` — Caching Component State

By default, when you switch dynamic components, the old component is **destroyed** and a new one is **created**. This means:
- Local state is lost (form inputs, scroll position, etc.)
- Lifecycle hooks fire again (`onMounted`, `onUnmounted`)
- API calls run again

`<KeepAlive>` caches component instances instead of destroying them:

```vue
<template>
  <KeepAlive>
    <component :is="currentTabComponent" />
  </KeepAlive>
</template>
```

### `KeepAlive` with Options

```vue
<template>
  <!-- Only cache specific components -->
  <KeepAlive :include="['HomeTab', 'ProfileTab']">
    <component :is="currentTabComponent" />
  </KeepAlive>

  <!-- Exclude specific components -->
  <KeepAlive :exclude="['SettingsTab']">
    <component :is="currentTabComponent" />
  </KeepAlive>

  <!-- Limit number of cached instances -->
  <KeepAlive :max="5">
    <component :is="currentTabComponent" />
  </KeepAlive>
</template>
```

### `onActivated` and `onDeactivated`

Cached components use different lifecycle hooks:

```vue
<!-- HomeTab.vue -->
<script setup>
import { onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'

onMounted(() => {
  console.log('Created')  // Fires once (first time)
})

onUnmounted(() => {
  console.log('Destroyed')  // WON'T fire while cached
})

onActivated(() => {
  console.log('Tab activated — resumed from cache')
  // Good place to refresh stale data
})

onDeactivated(() => {
  console.log('Tab deactivated — cached but alive')
  // Good place to pause expensive operations
})
</script>
```

> **Viva Question:** _"What does `<KeepAlive>` do?"_
> `<KeepAlive>` caches component instances instead of destroying them when they're removed from the DOM. When you switch back to a cached component, it restores its previous state instead of recreating from scratch. This preserves form inputs, scroll position, and avoids re-running `onMounted`. Cached components fire `onActivated`/`onDeactivated` instead of `onMounted`/`onUnmounted`.

## Async Components

### Why Async Components?

In a large application, you don't want to load every component upfront. Some components (like a heavy chart library, a rich text editor, or an admin panel) should only be loaded when needed. This is called **code splitting** or **lazy loading**.

### `defineAsyncComponent`

Vue provides `defineAsyncComponent` for loading components on demand:

```javascript
import { defineAsyncComponent } from 'vue'

// Simple usage — loads component when first needed
const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart.vue')
)

// With options
const RichEditor = defineAsyncComponent({
  // The loader function
  loader: () => import('@/components/RichEditor.vue'),

  // Component to show while loading
  loadingComponent: LoadingSpinner,

  // Component to show if loading fails
  errorComponent: ErrorDisplay,

  // Delay before showing loading component (default: 200ms)
  delay: 200,

  // Timeout for loading (shows error component)
  timeout: 3000
})
```

### Async Components in Routes

The most common use case is lazy-loading route components:

```javascript
// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/views/HomeView.vue')  // Eager loaded
    },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardView.vue')  // Lazy loaded
    },
    {
      path: '/admin',
      component: () => import('@/views/AdminView.vue')  // Only loaded if user visits /admin
    }
  ]
})
```

Each lazy-loaded route creates a separate JavaScript file that is only downloaded when the user navigates to that route.

## `<Suspense>` — Handling Async Setup

Vue 3's `<Suspense>` handles components with async `setup`:

```vue
<template>
  <Suspense>
    <!-- Main content with async component -->
    <template #default>
      <AsyncUserProfile :userId="currentUserId" />
    </template>

    <!-- Fallback while loading -->
    <template #fallback>
      <LoadingSpinner />
    </template>
  </Suspense>
</template>
```

The async component:

```vue
<!-- AsyncUserProfile.vue -->
<script setup>
const props = defineProps({ userId: Number })

// async setup — Suspense waits for this
const user = await fetch(`/api/users/${props.userId}`).then(r => r.json())
</script>

<template>
  <div>
    <h1>{{ user.name }}</h1>
    <p>{{ user.bio }}</p>
  </div>
</template>
```

> **Interview Question:** _"What is code splitting and how does Vue implement it?"_
> Code splitting is the practice of breaking your application into smaller chunks that are loaded on demand, reducing the initial bundle size. Vue implements this through async components and lazy-loaded routes using dynamic `import()`. Instead of bundling everything into one file, each lazy-loaded component becomes a separate file that downloads only when needed.

## What's Next?

Let's explore Vue's form handling capabilities — especially the powerful `v-model` directive.

→ Next: [Form Input Bindings](/post/languages/vue-form-input-bindings)
