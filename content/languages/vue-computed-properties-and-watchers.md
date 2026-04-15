---
title: "Computed Properties & Watchers — Derived State and Side Effects"
date: "2025-01-01"
tags: ["vue", "javascript", "computed", "watchers", "frontend"]
excerpt: "Learn how to create efficient derived data with computed properties and react to data changes with watchers. Understand when to use each and common pitfalls."
---

# Computed Properties & Watchers

## Why We Need Derived Data

In any real application, some data depends on other data. A shopping cart total depends on item prices and quantities. A filtered list depends on the search query. A formatted date depends on a raw timestamp. Vue provides two tools for handling these dependencies: **computed properties** and **watchers**.

> **Interview Question:** _"What is the difference between computed properties and watchers in Vue?"_
> Computed properties are for **deriving** new state from existing reactive data — they return a value and are cached based on dependencies. Watchers are for **side effects** when data changes — they don't return a value; they perform actions like API calls, DOM manipulation, or localStorage updates. Use computed when you need a value; use watchers when you need to do something.

## Computed Properties

### What Are They?

A computed property is a reactive function that **returns a value** based on other reactive data. Vue caches the result and only recalculates when its dependencies change.

```vue
<template>
  <p>Original price: ${{ price }}</p>
  <p>Quantity: {{ quantity }}</p>
  <p>Total: ${{ total }}</p>
  <p>Discounted: ${{ discountedTotal }}</p>
</template>

<script setup>
import { ref, computed } from 'vue'

const price = ref(100)
const quantity = ref(2)

// Computed — recalculates only when price or quantity changes
const total = computed(() => price.value * quantity.value)

// Computed can depend on other computeds
const discountedTotal = computed(() => total.value * 0.9)
</script>
```

### Why Not Just Use a Method?

You could achieve similar results with a method:

```vue
<!-- Using a method — runs EVERY time the template re-renders -->
<p>Total: ${{ getTotal() }}</p>

<!-- Using computed — cached, only runs when dependencies change -->
<p>Total: ${{ total }}</p>
```

```javascript
// Method — no caching, runs on every render
function getTotal() {
  console.log('Method called!')  // Called every render
  return price.value * quantity.value
}

// Computed — cached, runs only when deps change
const total = computed(() => {
  console.log('Computed called!')  // Called only when price/quantity changes
  return price.value * quantity.value
})
```

| Aspect | Computed | Method |
|--------|----------|--------|
| **Caching** | Yes — only recalculates when deps change | No — recalculates on every render |
| **Usage in template** | `{{ total }}` (like a property) | `{{ getTotal() }}` (like a function call) |
| **Performance** | Better for expensive operations | Fine for simple operations |
| **When to use** | Deriving state from reactive data | Performing an action or needing parameters |

> **Viva Question:** _"Are computed properties cached in Vue?"_
> Yes. Computed properties are cached based on their reactive dependencies. Vue tracks which reactive data a computed property accesses, and only recalculates when that data changes. If the dependencies haven't changed, Vue returns the cached value. This makes computed properties much more efficient than methods for derived data.

### Computed with Getters and Setters

By default, computed properties are read-only. But you can make them writable by providing a `get` and `set` function:

```vue
<template>
  <input v-model="fullName" placeholder="Full Name">
  <p>First: {{ firstName }}</p>
  <p>Last: {{ lastName }}</p>
</template>

<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed({
  get() {
    return firstName.value + ' ' + lastName.value
  },
  set(newValue) {
    const parts = newValue.split(' ')
    firstName.value = parts[0]
    lastName.value = parts[parts.length - 1]
  }
})
</script>
```

When the user types in the input, `v-model` calls the `set` function, which updates `firstName` and `lastName`. When those change, the `get` function returns the updated full name.

### Practical Examples

**Filtering a list:**

```javascript
const searchQuery = ref('')
const allUsers = ref([
  { id: 1, name: 'Alice', role: 'developer' },
  { id: 2, name: 'Bob', role: 'designer' },
  { id: 3, name: 'Charlie', role: 'developer' }
])

const filteredUsers = computed(() => {
  const query = searchQuery.value.toLowerCase()
  return allUsers.value.filter(user =>
    user.name.toLowerCase().includes(query)
  )
})
```

**Sorting:**

```javascript
const sortKey = ref('name')
const users = ref([...])

const sortedUsers = computed(() => {
  return [...users.value].sort((a, b) => {
    return a[sortKey.value].localeCompare(b[sortKey.value])
  })
})
```

**Form validation:**

```javascript
const email = ref('')
const password = ref('')

const isEmailValid = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value))
const isPasswordValid = computed(() => password.value.length >= 8)
const isFormValid = computed(() => isEmailValid.value && isPasswordValid.value)
```

## Watchers

### What Are Watchers?

A watcher lets you **react to changes** in reactive data with side effects. Side effects are things like:
- Making an API call when a search query changes
- Saving to localStorage when settings change
- Logging analytics when a user navigates
- Updating the document title

```vue
<template>
  <input v-model="searchQuery" placeholder="Search users...">
  <ul>
    <li v-for="user in results" :key="user.id">{{ user.name }}</li>
  </ul>
</template>

<script setup>
import { ref, watch } from 'vue'

const searchQuery = ref('')
const results = ref([])

// Watch searchQuery — make API call when it changes
watch(searchQuery, async (newQuery) => {
  if (newQuery.length < 2) {
    results.value = []
    return
  }

  const response = await fetch(`/api/users?q=${newQuery}`)
  results.value = await response.json()
})
</script>
```

### `watch()` vs `watchEffect()`

Vue 3 provides two ways to watch:

**`watch()` — Explicit Dependencies**

You specify exactly which reactive source to watch:

```javascript
import { ref, watch } from 'vue'

const count = ref(0)

// Watch a specific ref
watch(count, (newValue, oldValue) => {
  console.log(`Count changed from ${oldValue} to ${newValue}`)
})
```

**`watchEffect()` — Automatic Dependency Tracking**

It automatically tracks any reactive data accessed inside it:

```javascript
import { ref, watchEffect } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Automatically tracks firstName and lastName as dependencies
watchEffect(() => {
  console.log(`Full name: ${firstName.value} ${lastName.value}`)
  // Vue knows to re-run this whenever firstName or lastName changes
})
```

| Aspect | `watch()` | `watchEffect()` |
|--------|----------|-----------------|
| **Dependencies** | Explicit — you specify what to watch | Implicit — auto-tracked |
| **Old value** | Available as second argument | Not available |
| **When to use** | Need old value, or watching specific source | Don't care about old value, simpler syntax |
| **Lazy** | Yes — doesn't run on initial setup | No — runs immediately |

### Watching Multiple Sources

```javascript
const firstName = ref('John')
const lastName = ref('Doe')

// Watch both — callback receives arrays
watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log(`Name changed from ${oldFirst} ${oldLast} to ${newFirst} ${newLast}`)
})
```

### Watching Deep Objects

By default, `watch` only detects reference changes on `ref` objects. To watch nested property changes, use `{ deep: true }`:

```javascript
const user = ref({
  name: 'Alice',
  address: {
    city: 'Dhaka',
    country: 'Bangladesh'
  }
})

// Deep watch — detects nested property changes
watch(user, (newUser) => {
  console.log('User changed:', newUser)
}, { deep: true })

// This will trigger the watcher:
user.value.address.city = 'Chittagong'
```

> **Warning:** Deep watching can be expensive on large objects because Vue must traverse every nested property. Use it only when necessary.

### Watcher Options

```javascript
watch(source, callback, {
  immediate: true,  // Run callback immediately on setup (default: false)
  deep: true,       // Watch nested changes (default: false)
  flush: 'post'     // Run after DOM update (default: 'pre')
})
```

- **`immediate: true`** — Runs the callback right away with the current value, without waiting for a change. Useful for fetching initial data.
- **`deep: true`** — Traverses all nested properties. Expensive for large objects.
- **`flush: 'post'`** — Runs the watcher after Vue has updated the DOM. Useful when you need to access the updated DOM.

### Stopping a Watcher

`watch` and `watchEffect` return a `stop` function:

```javascript
const stop = watch(count, (newVal) => {
  console.log(newVal)
})

// Stop watching (useful for cleanup)
stop()
```

In `onUnmounted`, watchers are automatically stopped. But if you create watchers inside conditional logic or timeouts, you should stop them manually.

## Common Patterns

### Debounced Search with Watcher

```javascript
import { ref, watch } from 'vue'

const searchQuery = ref('')
const results = ref([])

watch(searchQuery, (newQuery) => {
  // Clear previous timeout
  const timeoutId = setTimeout(async () => {
    if (newQuery) {
      const res = await fetch(`/api/search?q=${newQuery}`)
      results.value = await res.json()
    } else {
      results.value = []
    }
  }, 300) // 300ms debounce
})
```

### Auto-save with Watcher

```javascript
const settings = ref({
  theme: 'dark',
  fontSize: 16,
  language: 'en'
})

watch(settings, (newSettings) => {
  localStorage.setItem('app-settings', JSON.stringify(newSettings))
}, { deep: true })
```

## What's Next?

Now let's compare methods, computed properties, and watchers — and understand exactly when to use each.

→ Next: [Methods vs Computed vs Watchers](/post/languages/vue-methods-vs-computed-vs-watchers)
