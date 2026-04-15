---
title: "Composition API & Setup — Modern Vue Logic"
date: "2025-01-01"
tags: ["vue", "javascript", "composition-api", "setup", "frontend"]
excerpt: "Deep dive into Vue 3's Composition API. Understand <script setup>, the setup function, and how it compares to the Options API. Learn why Composition API is the future of Vue."
---

# Composition API & Setup

## Why the Composition API Exists

The Options API (Vue 2 style) organizes code by **option type**: all data in `data()`, all methods in `methods`, all computed in `computed`. This is fine for small components. But as components grow, code for a single feature (like "search") gets scattered across multiple options:

```javascript
// Options API — search logic is scattered
export default {
  data() {
    return {
      searchQuery: '',
      searchResults: [],
      isSearching: false
    }
  },
  computed: {
    filteredResults() { /* ... */ }
  },
  methods: {
    async performSearch() { /* ... */ },
    clearSearch() { /* ... */ }
  },
  watch: {
    searchQuery() { /* ... */ }
  }
}
```

The Composition API lets you **group code by feature** instead of by option type:

```javascript
// Composition API — all search logic together
function useSearch() {
  const searchQuery = ref('')
  const searchResults = ref([])
  const isSearching = ref(false)

  const filteredResults = computed(() => /* ... */)

  async function performSearch() { /* ... */ }
  function clearSearch() { /* ... */ }

  watch(searchQuery, performSearch)

  return { searchQuery, searchResults, isSearching, filteredResults, clearSearch }
}
```

> **Interview Question:** _"Why was the Composition API introduced in Vue 3?"_
> Three main reasons: (1) **Better code organization** — group related logic by feature instead of scattering it across `data`, `methods`, `computed`, and `watch`; (2) **Better logic reuse** — extract reusable logic into composables (functions) instead of relying on mixins which have naming conflicts and unclear source issues; (3) **Better TypeScript support** — the Composition API provides full type inference without complex type declarations.

## `<script setup>` — The Recommended Syntax

`<script setup>` is a compile-time syntactic sugar for the Composition API. It is the **recommended way** to write Vue 3 components:

```vue
<template>
  <button @click="count++">{{ count }}</button>
</template>

<script setup>
import { ref } from 'vue'

// Everything declared here is automatically available in the template
const count = ref(0)
</script>
```

### What `<script setup>` Does Automatically

- **No `export default`** needed
- **No `setup()` function** needed
- **No `return` statement** needed — all top-level bindings are exposed to the template
- **Imported components** are automatically registered
- **Better performance** — code is compiled into more efficient output
- **Better IDE inference** — TypeScript works better

### Comparison: Options API vs Composition API

**Options API:**
```vue
<script>
export default {
  data() {
    return { count: 0 }
  },
  computed: {
    doubleCount() {
      return this.count * 2
    }
  },
  methods: {
    increment() {
      this.count++
    }
  },
  mounted() {
    console.log('Mounted!')
  }
}
</script>
```

**Composition API (`<script setup>`):**
```vue
<script setup>
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const doubleCount = computed(() => count.value * 2)

function increment() {
  count.value++
}

onMounted(() => {
  console.log('Mounted!')
})
</script>
```

## Key Composition API Functions

### `ref()` — Wrapping Reactive Values

```javascript
import { ref } from 'vue'

const count = ref(0)          // Number
const name = ref('Alice')     // String
const active = ref(false)     // Boolean
const items = ref([])         // Array
const user = ref({ name: '' }) // Object

// Access with .value in <script>
count.value++
name.value = 'Bob'

// In <template>, .value is auto-unwrapped
// {{ count }} not {{ count.value }}
```

### `reactive()` — Reactive Objects

```javascript
import { reactive } from 'vue'

const state = reactive({
  count: 0,
  name: 'Alice',
  items: []
})

// Direct property access — no .value
state.count++
state.name = 'Bob'
state.items.push('new item')
```

### `computed()` — Derived Reactive State

```javascript
import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

const fullName = computed(() => `${firstName.value} ${lastName.value}`)
// Automatically updates when firstName or lastName changes
```

### `watch()` and `watchEffect()` — React to Changes

```javascript
import { ref, watch, watchEffect } from 'vue'

const searchQuery = ref('')

// Explicit dependency
watch(searchQuery, (newVal, oldVal) => {
  console.log(`Search changed from "${oldVal}" to "${newVal}"`)
})

// Auto-tracked dependencies
watchEffect(() => {
  console.log(`Current search: ${searchQuery.value}`)
})
```

### Lifecycle Hooks

```javascript
import { onMounted, onUpdated, onUnmounted } from 'vue'

onMounted(() => {
  console.log('Component mounted')
})

onUpdated(() => {
  console.log('Component updated')
})

onUnmounted(() => {
  console.log('Component unmounted — cleanup here')
})
```

### `toRefs()` and `toRef()` — Convert Reactive to Refs

```javascript
import { reactive, toRefs, toRef } from 'vue'

const state = reactive({
  name: 'Alice',
  age: 25,
  city: 'Dhaka'
})

// Convert entire object to refs
const { name, age } = toRefs(state)
// name.value === 'Alice', stays connected to state.name

// Convert single property
const city = toRef(state, 'city')
```

> **Viva Question:** _"What is the difference between Options API and Composition API?"_
> Options API organizes code by option type (`data`, `methods`, `computed`, `watch`) — which scatters related logic. Composition API organizes code by feature — related state, computed properties, and methods can be grouped together. Composition API also enables better logic reuse through composables (extractable functions) and provides better TypeScript support. Both APIs can be used together in the same component.

## Using Both APIs Together

You can use both Options API and Composition API in the same component:

```vue
<script>
import { someMixin } from './mixins'

export default {
  mixins: [someMixin],
  data() {
    return { legacyData: 'from Options API' }
  }
}
</script>

<script setup>
import { ref } from 'vue'

// This runs alongside the Options API setup
const modernData = ref('from Composition API')
</script>
```

## `defineProps()` and `defineEmits()`

These are **compiler macros** (not imports) available inside `<script setup>`:

```vue
<script setup>
// defineProps — declare component props
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 }
})

// defineEmits — declare component events
const emit = defineEmits(['update', 'delete'])

// Usage
emit('update', { title: 'New Title' })
</script>
```

### With TypeScript

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  items: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
}>()
</script>
```

## `defineExpose()` — Controlling What's Exposed

By default, components using `<script setup>` are **closed** — parent components can't access their internals via template refs. `defineExpose` lets you explicitly expose specific properties:

```vue
<!-- ChildComponent.vue -->
<script setup>
import { ref } from 'vue'

const count = ref(0)
const secret = ref('hidden')

function reset() {
  count.value = 0
}

// Only expose count and reset — secret stays private
defineExpose({
  count,
  reset
})
</script>
```

```vue
<!-- Parent -->
<template>
  <ChildComponent ref="child" />
  <button @click="child?.reset()">Reset Child</button>
</template>

<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const child = ref(null)
// child.value.count — accessible
// child.value.secret — undefined (not exposed)
</script>
```

## What's Next?

Now let's dive deeper into `ref` and `reactive` — understanding their internals and when to use each.

→ Next: [Reactive & Ref](/post/languages/vue-reactive-and-ref)
