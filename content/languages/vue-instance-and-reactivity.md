---
title: "Vue Instance & Reactivity — The Heart of Vue"
date: "2025-01-01"
tags: ["vue", "javascript", "reactivity", "frontend"]
excerpt: "Understand the Vue application instance and Vue's reactivity system. Learn how Vue tracks changes and automatically updates the DOM using JavaScript Proxies."
---

# Vue Instance & Reactivity

## What is the Vue Instance?

Every Vue application starts by creating an **application instance** — the root object that controls your entire app. Think of it as the conductor of an orchestra: it doesn't play any instruments itself, but it coordinates everything.

```javascript
import { createApp } from 'vue'

const app = createApp({
  /* root component options */
})

app.mount('#app')
```

The `createApp` function creates a new Vue application, and `.mount('#app')` attaches it to a DOM element. Everything inside that DOM element is now controlled by Vue.

> **Interview Question:** _"What happens when you call `createApp().mount('#app')`?"_
> Vue takes control of the DOM element with `id="app"`. It parses the template, creates reactive data bindings, sets up the virtual DOM, and renders the initial view. From this point on, Vue manages everything inside that element — when data changes, Vue automatically updates the DOM.

## The Root Component

The object you pass to `createApp` is the **root component**:

```javascript
const app = createApp({
  data() {
    return {
      message: 'Hello Vue!',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
})

app.mount('#app')
```

In a real project, this is usually a `.vue` file:

```javascript
// main.js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

## What is Reactivity?

Reactivity is the **core concept** that makes Vue special. It means: when your data changes, your UI updates automatically. No manual DOM manipulation. No `document.getElementById`. No `innerHTML`. Just change the data, and Vue handles the rest.

```javascript
// Without reactivity (vanilla JS)
let count = 0
document.getElementById('counter').textContent = count  // Manual DOM update

function increment() {
  count++
  document.getElementById('counter').textContent = count  // Must remember to update DOM!
}

// With Vue reactivity
const count = ref(0)  // Just declare reactive data

function increment() {
  count.value++  // DOM updates automatically!
}
```

> **Interview Question:** _"How does Vue's reactivity system work?"_
> Vue 3 uses JavaScript Proxies to intercept reads and writes on reactive objects. When a component renders, Vue tracks which reactive properties were read (dependency tracking). When any of those properties change, Vue knows exactly which components depend on that data and triggers a re-render. This is called a dependency-tracking reactivity system.

## How Reactivity Works Under the Hood

### The Problem Vue Solves

Consider this scenario: you have a variable `price` and a computed `total`. In vanilla JavaScript, changing `price` does NOT automatically update `total`:

```javascript
let price = 10
let quantity = 2
let total = price * quantity  // 20

price = 20
// total is still 20! You'd have to manually recalculate:
total = price * quantity  // Now it's 40
```

Vue's reactivity system solves this by **automatically tracking dependencies** and re-running computations when their dependencies change.

### Step 1: Proxy-Based Interception (Vue 3)

Vue 3 wraps reactive data in a **JavaScript Proxy**. A Proxy is an object that intercepts operations on another object — like a security guard at a door that notes who comes in and out.

```javascript
// Simplified version of what Vue does internally
const data = { price: 10, quantity: 2 }

const proxy = new Proxy(data, {
  get(target, key) {
    // Someone read a property — track this dependency
    track(target, key)
    return target[key]
  },
  set(target, key, value) {
    // Someone wrote a property — notify dependents
    target[key] = value
    trigger(target, key)
    return true
  }
})
```

### Step 2: Dependency Tracking

When a component renders, it reads reactive properties. Vue's Proxy intercepts these reads and records: "This component depends on `price` and `quantity`."

```
Component renders → Reads price → Proxy intercepts → Records: "Component A depends on price"
                  → Reads quantity → Proxy intercepts → Records: "Component A depends on quantity"
```

### Step 3: Trigger Updates

When a reactive property changes, Vue looks up all components that depend on it and schedules them for re-render:

```
price changes to 20 → Proxy intercepts set → Looks up dependents → Re-renders Component A
```

### The Complete Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Vue Reactivity Flow                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Component renders (reads reactive data)               │
│     ────────────────────────────────→                     │
│     Proxy.get() fires → track() records dependency        │
│                                                           │
│  2. Data changes (user clicks, API responds, etc.)        │
│     ────────────────────────────────→                     │
│     Proxy.set() fires → trigger() queues re-render        │
│                                                           │
│  3. Vue re-renders the component                          │
│     ────────────────────────────────→                     │
│     Creates new Virtual DOM → Diffs with old → Patches    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## `ref()` vs `reactive()` — Two Ways to Create Reactive Data

Vue provides two functions for creating reactive data:

### `ref()` — For Single Values

Use `ref` for **primitives** (strings, numbers, booleans) or any single value:

```javascript
import { ref } from 'vue'

const count = ref(0)
const name = ref('Alice')
const isActive = ref(false)
const items = ref([])  // Can also hold objects/arrays

// Access or modify with .value
console.log(count.value)  // 0
count.value++
console.log(count.value)  // 1
```

> **Viva Question:** _"Why do we need `.value` with `ref`?"_
> Because JavaScript primitives (numbers, strings, booleans) are passed by value, not by reference. You can't intercept access on a plain `let x = 5`. Vue wraps the value in an object `{ value: 5 }` so it can use a Proxy to intercept reads and writes. In templates, Vue automatically unwraps `.value`, so you use `{{ count }}` not `{{ count.value }}`.

### `reactive()` — For Objects

Use `reactive` for **objects and arrays** — you get direct property access without `.value`:

```javascript
import { reactive } from 'vue'

const user = reactive({
  name: 'Alice',
  age: 25,
  hobbies: ['coding', 'reading']
})

// No .value needed — access properties directly
console.log(user.name)  // 'Alice'
user.age++
user.hobbies.push('gaming')
```

### When to Use Which

| Aspect | `ref()` | `reactive()` |
|--------|---------|-------------|
| **Best for** | Primitives, single values | Objects, arrays |
| **Access** | `.value` in script | Direct property access |
| **Reassignment** | `count.value = 5` works | `state = newState` **breaks reactivity** |
| **Destructuring** | Not applicable | **Breaks reactivity** |
| **Template** | Auto-unwrapped (`{{ count }}`) | Direct access (`{{ user.name }}`) |

> **Interview Question:** _"What is the difference between `ref` and `reactive` in Vue?"_
> `ref` works with any value (primitives and objects) and requires `.value` to access in script. `reactive` only works with objects/arrays and gives direct property access without `.value`. The key difference is reassignment: you can reassign a `ref` freely (`count.value = 5`), but reassigning a `reactive` object breaks reactivity because you lose the Proxy. The Vue team recommends using `ref` as the default choice.

## Reactivity Gotchas

### Gotcha 1: Destructuring `reactive` Breaks Reactivity

```javascript
const state = reactive({ count: 0, name: 'Alice' })

// WRONG — loses reactivity!
const { count, name } = state

// CORRECT — use toRefs to preserve reactivity
import { toRefs } from 'vue'
const { count, name } = toRefs(state)
// Now count and name are refs that stay connected to state
```

### Gotcha 2: Replacing a `reactive` Object Breaks Reactivity

```javascript
const state = reactive({ items: [] })

// WRONG — reactivity lost!
state = { items: [1, 2, 3] }

// CORRECT — mutate the existing object
state.items = [1, 2, 3]
// Or use ref instead
const state = ref({ items: [] })
state.value = { items: [1, 2, 3] }  // This works with ref
```

### Gotcha 3: New Properties on `reactive` Objects

In Vue 3, thanks to Proxy, adding new properties to a `reactive` object **is** reactive (unlike Vue 2):

```javascript
const state = reactive({ name: 'Alice' })
state.age = 25  // This IS reactive in Vue 3 (wasn't in Vue 2)
```

## The Virtual DOM

When reactive data changes, Vue doesn't directly update the real DOM. Instead, it:

1. Creates a **Virtual DOM** — a lightweight JavaScript representation of your UI
2. Compares (diffs) the new virtual DOM with the old one
3. Calculates the **minimum number of changes** needed
4. Applies only those changes to the real DOM

```javascript
// Simplified virtual DOM node
const vnode = {
  type: 'div',
  props: { class: 'container' },
  children: [
    { type: 'h1', children: 'Hello Vue!' },
    { type: 'p', children: count.value }
  ]
}
```

This is much faster than re-rendering the entire page. If only the count changes, Vue only updates that specific text node — the div, h1, and p tags remain untouched.

> **Viva Question:** _"What is the Virtual DOM and why does Vue use it?"_
> The Virtual DOM is a lightweight JavaScript representation of the real DOM. Vue uses it for performance: instead of directly manipulating the real DOM (which is slow), Vue creates a virtual tree in memory, compares it with the previous version to find the minimal set of changes, and applies only those differences to the real DOM. This process is called "diffing and patching."

## What's Next?

Now that you understand reactivity, let's explore Vue's template syntax — the HTML-based language you use to build your UI.

→ Next: [Template Syntax & Directives](/post/languages/vue-template-syntax-and-directives)
