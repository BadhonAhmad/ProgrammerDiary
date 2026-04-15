---
title: "Custom Directives — Extending Vue's Template Power"
date: "2025-01-01"
tags: ["vue", "javascript", "directives", "custom", "frontend"]
excerpt: "Learn how to create custom directives in Vue 3. Understand directive hooks, build practical directives for focus, click-outside, permissions, and more."
---

# Custom Directives

## What Are Custom Directives?

Vue's built-in directives (`v-if`, `v-for`, `v-model`, `v-bind`, `v-on`) cover most needs. But sometimes you need custom behavior attached to DOM elements — auto-focusing an input, detecting clicks outside an element, lazy-loading images, or adding a tooltip. **Custom directives** let you create your own `v-something` attributes.

> **Interview Question:** _"When would you create a custom directive in Vue?"_
> Create a custom directive when you need low-level DOM access on elements — behaviors that can't be expressed declaratively through components. Good use cases: auto-focus (`v-focus`), click-outside detection (`v-click-outside`), lazy loading images (`v-lazy`), permission-based visibility (`v-permission`), and scroll-based animations. If the behavior involves template/UI rendering, use a component instead.

## Directive Hook Functions

A custom directive is an object with lifecycle hooks (similar to component hooks, but for DOM elements):

```javascript
const myDirective = {
  // Called before the element is inserted into the DOM
  created(el, binding, vnode) {},

  // Called after the element is inserted into the DOM
  mounted(el, binding) {},

  // Called after the parent component is updated
  updated(el, binding) {},

  // Called before the parent component is unmounted
  beforeUnmount(el, binding) {},

  // Called after the parent component is unmounted
  unmounted(el, binding) {}
}
```

### Hook Arguments

| Argument | What It Is |
|----------|-----------|
| `el` | The DOM element the directive is bound to |
| `binding.value` | The value passed to the directive: `v-dir="value"` |
| `binding.oldValue` | Previous value (available in `updated`) |
| `binding.arg` | The argument: `v-dir:arg` |
| `binding.modifiers` | Modifiers: `v-dir.foo.bar` → `{ foo: true, bar: true }` |

## Basic Example: `v-focus`

The classic example — auto-focus an input when the page loads:

```javascript
// src/directives/focus.js
export const vFocus = {
  mounted(el) {
    el.focus()
  }
}
```

```vue
<template>
  <input v-focus placeholder="I am auto-focused!">
</template>

<script setup>
import { vFocus } from '@/directives/focus'
</script>
```

## Registering Directives

### Locally (in a component)

```vue
<script setup>
// In <script setup>, directives starting with 'v' prefix are auto-registered
const vFocus = {
  mounted(el) { el.focus() }
}
</script>
```

### Globally (in main.js)

```javascript
// src/main.js
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

app.directive('focus', {
  mounted(el) {
    el.focus()
  }
})

app.mount('#app')
```

## Practical Custom Directives

### `v-click-outside` — Detect Clicks Outside an Element

Perfect for closing dropdowns and modals when clicking elsewhere:

```javascript
// src/directives/clickOutside.js
export const vClickOutside = {
  mounted(el, binding) {
    el.__clickOutsideHandler = (event) => {
      // If the click was outside the element
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)  // Call the provided function
      }
    }
    document.addEventListener('click', el.__clickOutsideHandler)
  },

  unmounted(el) {
    document.removeEventListener('click', el.__clickOutsideHandler)
  }
}
```

```vue
<template>
  <div v-click-outside="closeDropdown" class="dropdown">
    <button @click="isOpen = !isOpen">Toggle</button>
    <div v-if="isOpen" class="dropdown-menu">
      <p>Option 1</p>
      <p>Option 2</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { vClickOutside } from '@/directives/clickOutside'

const isOpen = ref(false)

function closeDropdown() {
  isOpen.value = false
}
</script>
```

### `v-permission` — Show/Hide Based on User Role

```javascript
// src/directives/permission.js
export const vPermission = {
  mounted(el, binding) {
    const userRole = localStorage.getItem('role') // or from Pinia store
    const requiredRoles = binding.value

    if (Array.isArray(requiredRoles) && !requiredRoles.includes(userRole)) {
      el.style.display = 'none'  // Or el.parentNode.removeChild(el)
    }
  }
}
```

```vue
<template>
  <button v-permission="['admin', 'editor']">Edit Post</button>
  <button v-permission="['admin']">Delete User</button>
</template>
```

### `v-lazy` — Lazy Load Images

```javascript
// src/directives/lazy.js
export const vLazy = {
  mounted(el, binding) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          el.src = binding.value
          observer.unobserve(el)
        }
      })
    })

    el.__lazyObserver = observer
    observer.observe(el)
  },

  unmounted(el) {
    if (el.__lazyObserver) {
      el.__lazyObserver.disconnect()
    }
  }
}
```

```vue
<template>
  <img v-lazy="product.imageUrl" alt="Product" />
</template>
```

### `v-uppercase` — Transform Text

```javascript
// Demonstrates binding.value and reactivity
export const vUppercase = {
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      el.value = binding.value.toUpperCase()
    }
  }
}
```

### `v-debounce` — Debounce Event Handling

```javascript
// Demonstrates binding.arg and binding.modifiers
export const vDebounce = {
  mounted(el, binding) {
    const delay = binding.value || 300
    const eventType = binding.arg || 'click'

    let timeout
    const originalHandler = el[`on${eventType}`]

    el.addEventListener(eventType, (e) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        originalHandler?.call(el, e)
      }, delay)
    })
  }
}
```

## Shorthand Form

If you only need `mounted` and `updated` (the most common case), use a function shorthand:

```javascript
// Full form
app.directive('color', {
  mounted(el, binding) {
    el.style.color = binding.value
  },
  updated(el, binding) {
    el.style.color = binding.value
  }
})

// Shorthand — function is used for mounted AND updated
app.directive('color', (el, binding) => {
  el.style.color = binding.value
})
```

> **Viva Question:** _"What is the difference between a component and a custom directive?"_
> Components encapsulate template, logic, and styles — they render UI. Directives attach low-level behavior to existing DOM elements — they don't render anything. Use components when you need to render UI, use directives when you need to modify existing DOM element behavior (like auto-focus, click detection, lazy loading).

## What's Next?

Let's explore Vue's built-in transition and animation system.

→ Next: [Transitions & Animations](/post/languages/vue-transitions-and-animations)
