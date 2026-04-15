---
title: "Vue Testing — Ensuring Your Code Works"
date: "2025-01-01"
tags: ["vue", "javascript", "testing", "vitest", "frontend"]
excerpt: "Learn how to test Vue components and applications. Covers unit testing with Vitest, component testing with Vue Test Utils, and end-to-end testing with Cypress and Playwright."
---

# Vue Testing

## Why Testing Matters

You write code, it works. Then you add a feature, and something else breaks. Without tests, you only discover the break when a user complains. Tests give you **confidence** that your code works and stays working as you make changes.

> **Interview Question:** _"What testing tools do you use with Vue?"_
> For unit testing: **Vitest** (fast, Vite-native test runner) with **Vue Test Utils** (official component testing library). For end-to-end testing: **Cypress** or **Playwright**. Vitest is preferred over Jest for Vue 3 because it shares Vite's configuration and provides faster test execution.

## Testing Pyramid

```
         ┌─────────┐
         │  E2E    │  Few, slow, expensive
         │  Tests  │  Test entire user flows
        ─┴─────────┴─
        │             │
        │ Component   │  Moderate number
        │   Tests     │  Test components in isolation
       ─┴─────────────┴─
       │                 │
       │  Unit Tests     │  Many, fast, cheap
       │  (composables,  │  Test pure functions
       │   utilities)    │  and logic
       └─────────────────┘
```

## Setup

### Install Testing Dependencies

```bash
npm install -D vitest @vue/test-utils @testing-library/vue jsdom
```

### Configure Vitest

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom'
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

### Add Test Script

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Unit Testing Composables

Testing a composable is straightforward — it's just a function:

```javascript
// src/composables/__tests__/useCounter.test.js
import { describe, it, expect } from 'vitest'
import { useCounter } from '../useCounter'

describe('useCounter', () => {
  it('initializes with default value', () => {
    const { count } = useCounter()
    expect(count.value).toBe(0)
  })

  it('initializes with custom value', () => {
    const { count } = useCounter(10)
    expect(count.value).toBe(10)
  })

  it('increments count', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
  })

  it('decrements count', () => {
    const { count, decrement } = useCounter(5)
    decrement()
    expect(count.value).toBe(4)
  })

  it('resets count', () => {
    const { count, increment, reset } = useCounter()
    increment()
    increment()
    reset()
    expect(count.value).toBe(0)
  })

  it('computes isEven correctly', () => {
    const { count, isEven, increment } = useCounter()
    expect(isEven.value).toBe(true)  // 0 is even
    increment()
    expect(isEven.value).toBe(false) // 1 is odd
  })
})
```

## Component Testing with Vue Test Utils

### Testing a Simple Component

```vue
<!-- src/components/Counter.vue -->
<template>
  <div>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const count = ref(0)
function increment() { count.value++ }
</script>
```

```javascript
// src/components/__tests__/Counter.test.js
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Counter from '../Counter.vue'

describe('Counter', () => {
  it('renders initial count', () => {
    const wrapper = mount(Counter)
    expect(wrapper.text()).toContain('Count: 0')
  })

  it('increments count when button is clicked', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 1')
  })

  it('increments multiple times', async () => {
    const wrapper = mount(Counter)

    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')
    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Count: 3')
  })
})
```

### Testing Props

```javascript
import { mount } from '@vue/test-utils'
import UserCard from '../UserCard.vue'

describe('UserCard', () => {
  it('displays user name and email', () => {
    const wrapper = mount(UserCard, {
      props: {
        name: 'Alice',
        email: 'alice@example.com'
      }
    })

    expect(wrapper.text()).toContain('Alice')
    expect(wrapper.text()).toContain('alice@example.com')
  })
})
```

### Testing Events

```javascript
import { mount } from '@vue/test-utils'
import TodoItem from '../TodoItem.vue'

describe('TodoItem', () => {
  it('emits remove event with correct id', async () => {
    const wrapper = mount(TodoItem, {
      props: {
        id: 42,
        text: 'Learn Vue'
      }
    })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('remove')
    expect(wrapper.emitted('remove')[0]).toEqual([42])
  })
})
```

### Testing with Slots

```javascript
const wrapper = mount(BaseCard, {
  slots: {
    default: 'Card content here',
    header: '<h2>Card Title</h2>'
  }
})

expect(wrapper.text()).toContain('Card content here')
expect(wrapper.find('h2').text()).toBe('Card Title')
```

### Testing with Pinia

```javascript
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import ShoppingCart from '../ShoppingCart.vue'

describe('ShoppingCart', () => {
  it('displays cart items from store', () => {
    const wrapper = mount(ShoppingCart, {
      global: {
        plugins: [
          createTestingPinia({
            initialState: {
              cart: {
                items: [
                  { id: 1, name: 'Book', price: 20 }
                ]
              }
            }
          })
        ]
      }
    })

    expect(wrapper.text()).toContain('Book')
  })
})
```

### Testing Async Behavior

```javascript
import { mount } from '@vue/test-utils'
import UserProfile from '../UserProfile.vue'

describe('UserProfile', () => {
  it('shows loading state then data', async () => {
    const wrapper = mount(UserProfile)

    // Initially loading
    expect(wrapper.text()).toContain('Loading')

    // Wait for async operations
    await wrapper.vm.$nextTick()
    // ... or flushPromises()

    // Data loaded
    expect(wrapper.text()).toContain('Alice')
  })
})
```

## E2E Testing with Playwright

```bash
npm install -D @playwright/test
```

```javascript
// e2e/auth.spec.js
import { test, expect } from '@playwright/test'

test('user can log in', async ({ page }) => {
  await page.goto('http://localhost:5173/login')

  await page.fill('[data-testid="email"]', 'alice@example.com')
  await page.fill('[data-testid="password"]', 'password123')
  await page.click('[data-testid="submit"]')

  // Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('h1')).toContainText('Dashboard')
})
```

## What's Next?

Finally, let's learn about deploying Vue applications to production.

→ Next: [Vue Deployment](/post/languages/vue-deployment)
