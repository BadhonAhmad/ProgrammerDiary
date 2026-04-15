---
title: "Vue with TypeScript — Type-Safe Vue Applications"
date: "2025-01-01"
tags: ["vue", "typescript", "types", "frontend"]
excerpt: "Learn how to use TypeScript with Vue 3. Understand typed props, emits, refs, composables, and how the Composition API enables seamless TypeScript integration."
---

# Vue with TypeScript

## Why TypeScript with Vue?

Vue 3 was **rewritten from scratch in TypeScript**. This isn't an afterthought — TypeScript support is a first-class feature. Using TypeScript with Vue gives you:
- **Catch errors at compile time** instead of runtime
- **IntelliSense autocompletion** in your IDE
- **Self-documenting code** — types describe what data looks like
- **Safer refactoring** — rename a prop and TypeScript tells you every place you need to update

> **Interview Question:** _"How does Vue 3's TypeScript support compare to Vue 2?"_
> Vue 3 was rewritten in TypeScript with first-class TS support. The Composition API provides full type inference without manual type annotations — `ref`, `computed`, and `reactive` automatically infer types. `<script setup lang="ts">` enables TypeScript in templates. Vue 2 had experimental TS support that required complex decorator syntax (`vue-class-component`) and poor type inference.

## Setup

### Enable TypeScript

Simply use `<script setup lang="ts">`:

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)  // TypeScript infers: Ref<number>
const name = ref('')  // TypeScript infers: Ref<string>
</script>
```

### Vite Already Handles TypeScript

Vite compiles TypeScript out of the box — no additional configuration needed. Just name your files `.vue` with `lang="ts"` or create `.ts` files directly.

## Typed Props

### Using `defineProps` with TypeScript

```vue
<script setup lang="ts">
// Interface-based props (recommended)
interface Props {
  title: string
  count?: number          // Optional
  items: string[]
  isActive: boolean
  callback: (id: number) => void
}

const props = defineProps<Props>()
</script>
```

### Props with Default Values

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
  theme?: 'light' | 'dark'
}

// withDefaults for default values
const props = withDefaults(defineProps<Props>(), {
  count: 0,
  theme: 'light'
})
</script>
```

### Runtime Declaration (Alternative)

```vue
<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
  items: { type: Array as PropType<string[]>, default: () => [] }
})
</script>
```

## Typed Emits

```vue
<script setup lang="ts">
// Type-safe emits
const emit = defineEmits<{
  update: [value: string]
  delete: [id: number]
  change: [oldValue: string, newValue: string]
}>()

// TypeScript ensures you pass the correct types
emit('update', 'new value')  // OK
emit('delete', 42)           // OK
emit('update', 123)          // Error: Argument of type 'number' is not assignable to 'string'
</script>
```

## Typed Refs

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// TypeScript infers types automatically
const count = ref(0)           // Ref<number>
const name = ref('Alice')      // Ref<string>
const items = ref<string[]>([]) // Explicit type for empty array

// Computed values are inferred
const double = computed(() => count.value * 2)  // ComputedRef<number>

// Template refs
const inputEl = ref<HTMLInputElement | null>(null)

onMounted(() => {
  inputEl.value?.focus()  // TypeScript knows it's an HTMLInputElement
})
</script>
```

## Typed Reactive

```vue
<script setup lang="ts">
import { reactive } from 'vue'

interface User {
  name: string
  age: number
  email: string
}

const user: User = reactive({
  name: 'Alice',
  age: 25,
  email: 'alice@example.com'
})

// TypeScript enforces correct property types
user.name = 'Bob'    // OK
user.age = 'twenty'  // Error: Type 'string' is not assignable to type 'number'
</script>
```

## Typed Composables

```typescript
// src/composables/useFetch.ts
import { ref, type Ref } from 'vue'

interface UseFetchReturn<T> {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  refetch: () => Promise<void>
}

export function useFetch<T>(url: string): UseFetchReturn<T> {
  const data = ref<T | null>(null) as Ref<T | null>
  const loading = ref(true)
  const error = ref<string | null>(null)

  async function refetch() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch(url)
      data.value = await response.json()
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  refetch()

  return { data, loading, error, refetch }
}
```

Using the typed composable:

```vue
<script setup lang="ts">
interface User {
  id: number
  name: string
  email: string
}

// TypeScript knows data is User | null
const { data, loading, error } = useFetch<User>('/api/users')
</script>
```

## Typed Event Handling

```vue
<script setup lang="ts">
function handleClick(event: MouseEvent) {
  console.log(event.clientX, event.clientY)
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  console.log(target.value)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    submitForm()
  }
}
</script>

<template>
  <button @click="handleClick">Click</button>
  <input @input="handleInput" @keydown="handleKeydown">
</template>
```

## Typed Provide/Inject

```typescript
// keys.ts
import type { InjectionKey, Ref } from 'vue'

export interface ThemeContext {
  theme: Ref<string>
  toggleTheme: () => void
}

// Symbol + type together ensures type safety
export const ThemeKey: InjectionKey<ThemeContext> = Symbol('theme')
```

```vue
<!-- Provider -->
<script setup lang="ts">
import { provide, ref } from 'vue'
import { ThemeKey } from '@/keys'

const theme = ref('dark')
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

provide(ThemeKey, { theme, toggleTheme })
</script>
```

```vue
<!-- Consumer -->
<script setup lang="ts">
import { inject } from 'vue'
import { ThemeKey } from '@/keys'

// TypeScript knows the type — no assertion needed
const { theme, toggleTheme } = inject(ThemeKey)!
</script>
```

## Useful Utility Types

```typescript
import type { PropType, ComponentPublicInstance } from 'vue'

// PropType for complex prop types
defineProps({
  callback: Function as PropType<(id: number) => void>,
  options: Object as PropType<{ label: string; value: number }[]>
})

// ComponentPublicInstance for template refs to components
const childRef = ref<ComponentPublicInstance | null>(null)
```

> **Viva Question:** _"How do you type props in Vue 3 with TypeScript?"_
> Use `defineProps` with a TypeScript interface: `const props = defineProps<{ title: string; count?: number }>()`. For default values, wrap with `withDefaults(defineProps<Props>(), { count: 0 })`. This gives full type checking and IntelliSense without runtime overhead — Vue's compiler extracts the types for runtime validation.

## What's Next?

Let's learn how to optimize Vue application performance.

→ Next: [Vue Performance Optimization](/post/languages/vue-performance-optimization)
