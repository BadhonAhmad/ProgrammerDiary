---
title: "Vue Performance Optimization — Making Your App Fast"
date: "2025-01-01"
tags: ["vue", "javascript", "performance", "optimization", "frontend"]
excerpt: "Learn practical techniques to optimize Vue application performance. Covers lazy loading, virtual scrolling, computed caching, v-memo, and profiling with Vue DevTools."
---

# Vue Performance Optimization

## Why Performance Matters

Performance directly impacts user experience and business metrics. A 100ms delay in page load can reduce conversion rates by 7%. Vue is already fast, but as applications grow, you need to be intentional about keeping them fast.

> **Interview Question:** _"How do you optimize a Vue application's performance?"_
> Key strategies: (1) **Lazy loading** — use dynamic `import()` for routes and heavy components; (2) **Virtual scrolling** for large lists with `vue-virtual-scroller`; (3) **Computed properties** instead of methods for derived data (they're cached); (4) **`v-memo`** to skip re-renders of list items; (5) **`shallowRef`** for large objects where deep reactivity isn't needed; (6) **KeepAlive** to cache components; (7) **Code splitting** to reduce initial bundle size.

## Page-Level Optimizations

### Lazy Load Routes

The most impactful optimization — only load code when the user navigates to it:

```javascript
// Instead of eager loading:
import DashboardView from '@/views/DashboardView.vue'

// Use lazy loading:
const routes = [
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue')  // Separate chunk!
  }
]
```

Each lazy-loaded route creates a separate JavaScript file. Users only download what they need.

### Lazy Load Heavy Components

```vue
<script setup>
import { defineAsyncComponent } from 'vue'

// Only loads when first rendered
const HeavyChart = defineAsyncComponent(() =>
  import('@/components/HeavyChart.vue')
)

const RichEditor = defineAsyncComponent(() =>
  import('@/components/RichEditor.vue')
)
</script>
```

### `<KeepAlive>` — Cache Component State

Prevent unnecessary re-renders when switching between views:

```vue
<template>
  <KeepAlive :include="['UserList', 'Dashboard']">
    <RouterView />
  </KeepAlive>
</template>
```

## Rendering Optimizations

### Use `v-once` for Static Content

Tell Vue an element never changes — skip re-rendering it entirely:

```vue
<template>
  <!-- Rendered once, never updated (saves diffing time) -->
  <div v-once>
    <h1>Static Header</h1>
    <p>This content never changes</p>
  </div>

  <p>{{ dynamicContent }}</p>
</template>
```

### Use `v-memo` for Expensive Lists

Skip re-rendering list items when their data hasn't changed:

```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
    v-memo="[item.selected]"
  >
    <!-- Only re-renders when item.selected changes -->
    <!-- Ignores all other changes in parent component -->
    <ExpensiveItem :data="item" />
  </div>
</template>
```

### Use Computed Properties Over Methods

```vue
<!-- BAD — recalculates on every render -->
<p>{{ formatPrice(total) }}</p>

<!-- GOOD — cached, only recalculates when total changes -->
<p>{{ formattedTotal }}</p>
```

```javascript
// Method — no caching
function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(amount)
}

// Computed — cached
const formattedTotal = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD'
  }).format(total.value)
)
```

### Virtual Scrolling for Large Lists

Rendering 10,000 list items in the DOM is slow. Virtual scrolling only renders what's visible:

```bash
npm install vue-virtual-scroller
```

```vue
<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div class="item">{{ item.name }}</div>
    </template>
  </RecycleScroller>
</template>
```

## Reactivity Optimizations

### `shallowRef` — Skip Deep Reactivity

Vue's `ref` makes nested objects deeply reactive by default. If you have a large object and only need top-level reactivity:

```javascript
import { shallowRef, triggerRef } from 'vue'

// Deep reactivity (default) — tracks all nested properties
const deepData = ref({ nested: { deeply: { value: 1 } } })

// Shallow reactivity — only tracks .value changes
const shallowData = shallowRef({ nested: { deeply: { value: 1 } } })

shallowData.value.nested.deeply.value = 2  // NOT tracked
triggerRef(shallowData)  // Manually trigger update
```

### `shallowReactive` — Shallow Object Reactivity

```javascript
import { shallowReactive } from 'vue'

const state = shallowReactive({
  name: 'Alice',   // Tracked
  nested: {
    age: 25        // NOT tracked
  }
})

state.name = 'Bob'          // Triggers re-render
state.nested.age = 30       // Does NOT trigger re-render
state.nested = { age: 30 }  // Triggers (top-level property changed)
```

### `markRaw` — Prevent Reactivity

```javascript
import { markRaw, reactive } from 'vue'

// Mark a third-party class instance as never-reactive
const chart = markRaw(new Chart(element, config))

const state = reactive({
  chart: chart  // Won't be made reactive (saves performance)
})
```

## Bundle Size Optimization

### Tree Shaking

Import only what you need:

```javascript
// BAD — imports entire library
import { ref, computed, watch, reactive, onMounted, onUpdated, /* ... */ } from 'vue'

// GOOD — tree-shaking works automatically with ES modules
import { ref, computed } from 'vue'
```

### Analyze Bundle Size

```bash
npm install rollup-plugin-visualizer --save-dev
```

```javascript
// vite.config.js
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({ open: true })
  ]
})
```

Run `npm run build` and a visual chart shows what's in your bundle.

### Production Mode

Vue runs development-only warnings and checks in dev mode that are stripped in production:

```bash
# Build for production (automatically sets NODE_ENV=production)
npm run build
```

## Profiling with Vue DevTools

1. Install the **Vue.js DevTools** browser extension
2. Open DevTools → Vue tab
3. Use the **Performance** tab to:
   - Record component render times
   - Identify which components re-render most often
   - Find expensive computations
4. Use the **Timeline** tab to see:
   - Component events
   - Route changes
   - Pinia actions

### Chrome Performance Tab

1. Open Chrome DevTools → Performance tab
2. Click Record
3. Interact with your app
4. Stop recording
5. Look for:
   - Long tasks (>50ms) in the main thread
   - Excessive layout recalculations
   - Frequent garbage collection

## Quick Performance Checklist

| Optimization | Impact | Effort |
|-------------|--------|--------|
| Lazy load routes | High | Low |
| Lazy load heavy components | High | Low |
| Use computed over methods | Medium | Low |
| `v-memo` for expensive lists | Medium | Low |
| Virtual scrolling for large lists | High | Medium |
| `shallowRef` for large objects | Medium | Low |
| `v-once` for static content | Low | Low |
| `KeepAlive` for tab content | Medium | Low |
| Analyze and reduce bundle size | High | Medium |

> **Viva Question:** _"What is virtual scrolling?"_
> Virtual scrolling is a technique that only renders the DOM elements currently visible in the viewport, instead of all items in a list. For example, if you have 10,000 items but only 20 are visible on screen, virtual scrolling renders only those 20. As the user scrolls, it recycles the DOM elements by swapping their data. This dramatically reduces DOM nodes and improves performance.

## What's Next?

Let's learn about testing Vue applications.

→ Next: [Vue Testing](/post/languages/vue-testing)
