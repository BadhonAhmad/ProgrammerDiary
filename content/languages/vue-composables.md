---
title: "Composables — Reusable Logic in Vue 3"
date: "2025-01-01"
tags: ["vue", "javascript", "composables", "composition-api", "frontend"]
excerpt: "Learn how to create and use composables — Vue 3's approach to sharing reactive logic. Understand the composable pattern, naming conventions, and real-world examples."
---

# Composables

## What Are Composables?

A **composable** is a function that uses Vue's Composition API to encapsulate and reuse **stateful logic**. Think of them as Vue's version of React hooks — reusable pieces of reactive code that you can share across components.

> **Interview Question:** _"What are composables in Vue and how do they differ from mixins?"_
> Composables are functions that use the Composition API to encapsulate reusable reactive logic. They replace Vue 2's mixins with a better pattern. Unlike mixins, composables have: (1) **Clear source** — you import and destructure them, so you know where each function comes from; (2) **No naming conflicts** — you explicitly choose what to use; (3) **Better TypeScript support** — full type inference; (4) **Explicit dependencies** — you pass parameters to them.

## Why Composables Exist

### The Problem: Logic Duplication

Imagine you need to fetch data from an API in multiple components. Without composables, you'd repeat the same loading/error/data logic everywhere:

```vue
<!-- Every component repeats this pattern -->
<script setup>
import { ref, onMounted } from 'vue'

const data = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/api/users')
    data.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
</script>
```

### The Solution: Extract into a Composable

```javascript
// src/composables/useFetch.js
import { ref } from 'vue'

export function useFetch(url) {
  const data = ref(null)
  const loading = ref(true)
  const error = ref(null)

  async function fetchData() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      data.value = await response.json()
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  fetchData()

  return { data, loading, error, refetch: fetchData }
}
```

Now any component can use this logic:

```vue
<script setup>
import { useFetch } from '@/composables/useFetch'

const { data: users, loading, error } = useFetch('/api/users')
</script>

<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <ul v-else>
    <li v-for="user in users" :key="user.id">{{ user.name }}</li>
  </ul>
</template>
```

## Composable Naming Convention

- Name starts with **`use`**: `useFetch`, `useAuth`, `useLocalStorage`
- File name matches: `useFetch.js`, `useAuth.js`
- Place in `src/composables/` directory

## Real-World Composable Examples

### `useLocalStorage` — Persistent State

```javascript
// src/composables/useLocalStorage.js
import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const stored = localStorage.getItem(key)
  const data = ref(stored ? JSON.parse(stored) : defaultValue)

  watch(data, (newValue) => {
    localStorage.setItem(key, JSON.stringify(newValue))
  }, { deep: true })

  return data
}
```

```vue
<script setup>
import { useLocalStorage } from '@/composables/useLocalStorage'

const theme = useLocalStorage('theme', 'dark')
const recentSearches = useLocalStorage('recent-searches', [])
</script>
```

### `useMouse` — Track Mouse Position

```javascript
// src/composables/useMouse.js
import { ref, onMounted, onUnmounted } from 'vue'

export function useMouse() {
  const x = ref(0)
  const y = ref(0)

  function update(event) {
    x.value = event.clientX
    y.value = event.clientY
  }

  onMounted(() => window.addEventListener('mousemove', update))
  onUnmounted(() => window.removeEventListener('mousemove', update))

  return { x, y }
}
```

### `useDebounce` — Debounce Any Value

```javascript
// src/composables/useDebounce.js
import { ref, watch } from 'vue'

export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value)
  let timeout

  watch(value, (newVal) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}
```

### `useCounter` — Simple Counter Logic

```javascript
// src/composables/useCounter.js
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)

  const isEven = computed(() => count.value % 2 === 0)

  function increment() { count.value++ }
  function decrement() { count.value-- }
  function reset() { count.value = initialValue }

  return { count, isEven, increment, decrement, reset }
}
```

### `useAuth` — Authentication State

```javascript
// src/composables/useAuth.js
import { ref, computed } from 'vue'

const user = ref(null)
const token = ref(localStorage.getItem('token'))

const isAuthenticated = computed(() => !!token.value)

async function login(email, password) {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) throw new Error('Login failed')

  const data = await response.json()
  user.value = data.user
  token.value = data.token
  localStorage.setItem('token', data.token)
}

function logout() {
  user.value = null
  token.value = null
  localStorage.removeItem('token')
}

export function useAuth() {
  return { user, token, isAuthenticated, login, logout }
}
```

## Composables vs Mixins

| Aspect | Composables | Mixins (Vue 2) |
|--------|-------------|----------------|
| **Source clarity** | Explicit imports — `const { x } = useFeature()` | Implicit — merged into component |
| **Naming conflicts** | No conflicts — you choose names | Properties can collide |
| **TypeScript** | Full type inference | Poor type support |
| **Parameters** | Accept arguments | No parameters |
| **Tree-shaking** | Unused code can be removed | All mixin code is included |

## Best Practices

1. **Accept refs as arguments** — makes composables work with both static and reactive values
2. **Return refs** — keeps reactivity when the consumer uses the return value
3. **Clean up side effects** — use `onUnmounted` inside composables for cleanup
4. **Keep them focused** — each composable should do one thing well
5. **Document parameters and return values** — especially with TypeScript

> **Viva Question:** _"What is the naming convention for composables?"_
> Composables follow the `use` prefix convention: the function name starts with `use` (e.g., `useFetch`, `useAuth`, `useMouse`). The file is named to match (`useFetch.js`). This convention makes composables easy to identify and distinguishes them from regular utility functions that don't use reactive state.

## What's Next?

Let's explore Vue Router — how to build multi-page applications with Vue.

→ Next: [Vue Router](/post/languages/vue-router)
