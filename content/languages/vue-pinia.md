---
title: "Pinia — Vue's Official State Management"
date: "2025-01-01"
tags: ["vue", "javascript", "pinia", "state-management", "frontend"]
excerpt: "Learn Pinia — Vue 3's official state management library. Understand stores, actions, getters, and how Pinia replaces Vuex with a simpler, more powerful API."
---

# Pinia — Vue's Official State Management

## What is State Management?

As your Vue application grows, you'll have data that needs to be shared across many components:
- **User authentication** — every component needs to know if the user is logged in
- **Shopping cart** — the header, sidebar, and checkout page all need cart data
- **Notifications** — any component can trigger a notification
- **Theme/settings** — global preferences

Props and events work for parent-child communication, but passing data through many levels of components (prop drilling) becomes unmanageable. **State management** provides a global store that any component can access.

> **Interview Question:** _"What is Pinia and why did it replace Vuex?"_
> Pinia is Vue's official state management library (replacing Vuex). It provides a global store for shared state that any component can access. It replaced Vuex because: (1) **No mutations** — Pinia removed the unnecessary mutation/action split; actions can directly modify state. (2) **No namespaces** — each store is independently imported. (3) **Better TypeScript** — full autocompletion and type inference. (4) **Smaller** — ~1KB. (5) **Composition API friendly** — stores use the same patterns as components.

## Why Not Just Use Props?

```
Without Pinia:                    With Pinia:
App (has user data)              App
├── Header                       ├── Header → reads from auth store
│   └── UserMenu (needs user)    │   └── UserMenu
├── Sidebar                      ├── Sidebar → reads from cart store
│   └── CartWidget (needs cart)  │   └── CartWidget
└── Content                      └── Content
    ├── PostList                     ├── PostList → reads from auth store
    └── Comments                     └── Comments

Every intermediate component      Components directly access
passes props they don't use       the stores they need
```

## Setting Up Pinia

### Installation

```bash
npm install pinia
```

### Register in main.js

```javascript
// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

## Creating a Store

Pinia offers two store styles: **Setup Stores** (recommended) and **Option Stores**.

### Setup Store (Composition API style — Recommended)

```javascript
// src/stores/counter.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  // State
  const count = ref(0)

  // Getters (computed)
  const doubleCount = computed(() => count.value * 2)
  const isPositive = computed(() => count.value > 0)

  // Actions (functions)
  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  function reset() {
    count.value = 0
  }

  async function fetchCount() {
    const response = await fetch('/api/count')
    count.value = await response.json()
  }

  // Must return everything you want to expose
  return { count, doubleCount, isPositive, increment, decrement, reset, fetchCount }
})
```

### Option Store (Options API style)

```javascript
// src/stores/counter.js
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),

  getters: {
    doubleCount: (state) => state.count * 2,
    isPositive: (state) => state.count > 0
  },

  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    async fetchCount() {
      const response = await fetch('/api/count')
      this.count = await response.json()
    }
  }
})
```

## Using a Store in Components

```vue
<template>
  <p>Count: {{ counter.count }}</p>
  <p>Double: {{ counter.doubleCount }}</p>

  <button @click="counter.increment()">+</button>
  <button @click="counter.decrement()">-</button>
  <button @click="counter.reset()">Reset</button>
</template>

<script setup>
import { useCounterStore } from '@/stores/counter'

// Access the store — it's a singleton (same instance everywhere)
const counter = useCounterStore()
</script>
```

### Destructuring from Store

```vue
<script setup>
import { storeToRefs } from 'pinia'
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()

// WRONG — loses reactivity!
const { count, doubleCount } = counter

// CORRECT — use storeToRefs for state and getters
const { count, doubleCount } = storeToRefs(counter)

// Actions can be destructured directly (they're not reactive)
const { increment, decrement } = counter
</script>
```

## Real-World Store Examples

### Auth Store

```javascript
// src/stores/auth.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? 'Guest')

  async function login(email, password) {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) throw new Error('Invalid credentials')

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

  async function fetchUser() {
    if (!token.value) return
    const response = await fetch('/api/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    user.value = await response.json()
  }

  return { user, token, isAuthenticated, userName, login, logout, fetchUser }
})
```

### Cart Store

```javascript
// src/stores/cart.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  function addToCart(product) {
    const existing = items.value.find(item => item.id === product.id)
    if (existing) {
      existing.quantity++
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  function removeFromCart(productId) {
    items.value = items.value.filter(item => item.id !== productId)
  }

  function clearCart() {
    items.value = []
  }

  return { items, totalItems, totalPrice, addToCart, removeFromCart, clearCart }
})
```

## Store Composition

Stores can use other stores:

```javascript
// src/stores/checkout.js
import { defineStore } from 'pinia'
import { useCartStore } from './cart'
import { useAuthStore } from './auth'

export const useCheckoutStore = defineStore('checkout', () => {
  const cart = useCartStore()
  const auth = useAuthStore()

  async function placeOrder() {
    if (!auth.isAuthenticated) throw new Error('Must be logged in')
    if (cart.items.length === 0) throw new Error('Cart is empty')

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({ items: cart.items })
    })

    const order = await response.json()
    cart.clearCart()
    return order
  }

  return { placeOrder }
})
```

## Pinia vs Vuex

| Feature | Pinia | Vuex |
|---------|-------|------|
| **Mutations** | No mutations — actions modify state directly | Must use mutations (sync) + actions (async) |
| **Namespacing** | Each store is independent | Modules with namespace strings |
| **TypeScript** | Full autocompletion | Complex type declarations needed |
| **Bundle size** | ~1KB | ~6KB |
| **API style** | Composition API or Options API | Options API only |
| **DevTools** | Full support | Full support |
| **SSR** | Built-in support | Complex setup |

> **Viva Question:** _"Why did Pinia replace Vuex?"_
> Pinia simplified state management by removing mutations (you can modify state directly in actions), eliminating namespaces (stores are imported directly), providing first-class TypeScript support, reducing bundle size (~1KB vs ~6KB), and aligning with the Composition API patterns that Vue 3 developers already use. Vuex had a verbose, boilerplate-heavy pattern that Pinia eliminated.

## What's Next?

Now let's explore Vue's advanced features — custom directives, transitions, TypeScript integration, performance, and testing.

→ Next: [Custom Directives](/post/languages/vue-custom-directives)
