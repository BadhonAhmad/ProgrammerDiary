---
title: "Methods vs Computed vs Watchers — When to Use What"
date: "2025-01-01"
tags: ["vue", "javascript", "methods", "computed", "watchers", "frontend"]
excerpt: "A practical guide to understanding when to use methods, computed properties, and watchers in Vue. Includes decision flowcharts, common patterns, and interview questions."
---

# Methods vs Computed vs Watchers

## The Three Tools

Vue gives you three tools for working with reactive data in different ways. The confusion most beginners face is: which one do I use? Each has a specific purpose:

| Tool | Purpose | Returns a value? | Cached? | When to use |
|------|---------|------------------|---------|-------------|
| **Methods** | Perform actions, accept parameters | Optional | No | Event handlers, parameterized logic |
| **Computed** | Derive state from reactive data | Yes (required) | Yes | Filtering, sorting, formatting, validation |
| **Watchers** | React to data changes with side effects | No | N/A | API calls, localStorage, DOM manipulation |

> **Interview Question:** _"When would you use a method vs a computed property vs a watcher?"_
> Use **methods** for event handlers and logic that needs parameters. Use **computed properties** to derive new reactive state from existing data (they're cached and reactive). Use **watchers** for side effects when data changes (API calls, localStorage, logging). A simple rule: computed returns a value, watchers do something, methods do either but aren't cached.

## Methods

### What Are They?

Methods are plain JavaScript functions defined in your component. They are **not reactive** and **not cached** — they run every time they are called.

```vue
<template>
  <button @click="greet('Alice')">Greet</button>
  <p>{{ formatPrice(29.99) }}</p>
  <p>{{ formatPrice(49.99) }}</p>
</template>

<script setup>
function greet(name) {
  alert('Hello, ' + name + '!')
}

function formatPrice(amount) {
  return '$' + amount.toFixed(2)
}
</script>
```

### When to Use Methods

1. **Event handlers** — functions triggered by user actions
2. **Functions that need parameters** — `formatDate(date)`, `calculateTotal(items, tax)`
3. **Functions called from other functions** — utility logic within your component
4. **When you need to run the same logic with different arguments**

```javascript
// Methods accept parameters — computed properties cannot
function getDiscountedPrice(price, discountPercent) {
  return price * (1 - discountPercent / 100)
}

// Called with different arguments
const laptop = getDiscountedPrice(999, 10)    // 899.1
const phone = getDiscountedPrice(699, 15)     // 594.15
```

### When NOT to Use Methods

Don't use methods in templates for expensive computations that don't need parameters:

```vue
<!-- BAD — runs on every render, even if data hasn't changed -->
<p>{{ expensiveCalculation() }}</p>

<!-- GOOD — cached, only recalculates when data changes -->
<p>{{ expensiveResult }}</p>
```

## Computed Properties

### What Are They?

Computed properties are **reactive, cached functions** that return a derived value. They only recalculate when their dependencies change.

```vue
<template>
  <p>Full name: {{ fullName }}</p>
  <p>Initials: {{ initials }}</p>
</template>

<script setup>
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed(() => `${firstName.value} ${lastName.value}`)
const initials = computed(() => `${firstName.value[0]}${lastName.value[0]}`)
</script>
```

### When to Use Computed

1. **Deriving data from other reactive data** — full name from first/last name
2. **Filtering/sorting lists** — search results from a query
3. **Formatting values** — currency formatting, date formatting
4. **Validation** — checking if a form is valid
5. **Aggregating data** — totals, averages, counts

```javascript
// Filtering
const filteredTodos = computed(() =>
  todos.value.filter(t => t.completed === showCompleted.value)
)

// Validation
const isFormValid = computed(() =>
  email.value.includes('@') && password.value.length >= 8
)

// Aggregation
const totalPrice = computed(() =>
  cartItems.value.reduce((sum, item) => sum + item.price * item.qty, 0)
)
```

### Computed Properties Cannot Accept Parameters

```javascript
// WRONG — computed cannot accept parameters
const filteredList = computed((searchTerm) => {  // Error!
  return items.value.filter(i => i.name.includes(searchTerm))
})

// CORRECT — use a reactive variable that computed depends on
const searchTerm = ref('')
const filteredList = computed(() => {
  return items.value.filter(i =>
    i.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})
```

If you truly need to filter with different parameters in different places, use a **method** or a **composable** instead.

## Watchers

### What Are They?

Watchers run **side effects** when reactive data changes. They don't return a value — they do something.

```vue
<script setup>
import { ref, watch } from 'vue'

const userId = ref(1)
const userData = ref(null)

// When userId changes, fetch new user data
watch(userId, async (newId) => {
  const response = await fetch(`/api/users/${newId}`)
  userData.value = await response.json()
}, { immediate: true })
</script>
```

### When to Use Watchers

1. **API calls** triggered by data changes (search, pagination, route params)
2. **Persisting data** (saving to localStorage, IndexedDB)
3. **DOM manipulation** that can't be done declaratively
4. **Analytics/logging** — tracking user behavior
5. **Asynchronous operations** — debounced searches, timeouts

```javascript
// Save to localStorage on change
watch(settings, (newSettings) => {
  localStorage.setItem('settings', JSON.stringify(newSettings))
}, { deep: true })

// Debounced search
watch(searchQuery, (query) => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchUsers(query)
  }, 300)
})

// Update document title
watch(pageTitle, (title) => {
  document.title = title
})
```

### When NOT to Use Watchers

Don't use watchers when you just need to derive a value:

```javascript
// BAD — using a watcher for derived state
const firstName = ref('John')
const lastName = ref('Doe')
const fullName = ref('')

watch([firstName, lastName], ([first, last]) => {
  fullName.value = `${first} ${last}`  // Just use computed!
})

// GOOD — use computed for derived state
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
```

## Decision Flowchart

```
Need to react to a data change?
│
├── Do you need a RETURN VALUE?
│   ├── YES → Use COMPUTED
│   │   └── Examples: filtering, sorting, formatting, totals
│   │
│   └── NO → Is it a SIDE EFFECT?
│       ├── YES → Use WATCHER
│       │   └── Examples: API calls, localStorage, DOM updates
│       │
│       └── NO → Is it triggered by a USER EVENT?
│           ├── YES → Use METHOD
│           │   └── Examples: click handler, form submit
│           │
│           └── Do you need PARAMETERS?
│               ├── YES → Use METHOD
│               │   └── Examples: formatDate(date), getPrice(item)
│               │
│               └── NO → Use COMPUTED
│                   └── Examples: derived state
```

## Side-by-Side Comparison

### Scenario: Shopping Cart

```vue
<template>
  <div v-for="item in cart" :key="item.id">
    {{ item.name }} — ${{ item.price }}
    <button @click="removeFromCart(item.id)">Remove</button>
  </div>

  <p>Total items: {{ totalItems }}</p>
  <p>Total price: ${{ totalPrice }}</p>
  <p>Status: {{ cartStatus }}</p>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const cart = ref([])

// METHOD — event handler with parameter
function removeFromCart(itemId) {
  cart.value = cart.value.filter(item => item.id !== itemId)
}

// COMPUTED — derived values (cached)
const totalItems = computed(() => cart.value.length)
const totalPrice = computed(() =>
  cart.value.reduce((sum, item) => sum + item.price, 0)
)
const cartStatus = computed(() => {
  if (cart.value.length === 0) return 'Empty'
  if (totalPrice.value > 100) return ' qualifies for free shipping!'
  return `${cart.value.length} items`
})

// WATCHER — side effect (save cart to localStorage)
watch(cart, (newCart) => {
  localStorage.setItem('cart', JSON.stringify(newCart))
}, { deep: true })
</script>
```

Notice how each tool serves a different purpose in the same feature:
- **Method**: `removeFromCart(id)` — triggered by click, needs a parameter
- **Computed**: `totalItems`, `totalPrice`, `cartStatus` — derived values, automatically update
- **Watcher**: saves to localStorage — a side effect, not a value

## What's Next?

Now let's explore Vue's lifecycle hooks — the moments in a component's life where you can run your code.

→ Next: [Vue Lifecycle Hooks](/post/languages/vue-lifecycle-hooks)
