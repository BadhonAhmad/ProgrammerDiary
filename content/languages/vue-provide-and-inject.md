---
title: "Provide & Inject — Deep Prop Passing Without Prop Drilling"
date: "2025-01-01"
tags: ["vue", "javascript", "provide", "inject", "components", "frontend"]
excerpt: "Learn how Vue's provide and inject mechanism solves prop drilling. Pass data deep through the component tree without manually threading props through every level."
---

# Provide & Inject

## The Problem: Prop Drilling

Imagine you have a deeply nested component structure:

```
App
├── Layout
│   ├── Sidebar
│   │   └── ThemeToggle    ← needs the current theme
│   └── Content
│       ├── PostList
│       │   └── PostCard   ← needs the current theme
│       └── Comments
│           └── CommentItem ← needs the current theme
```

The `theme` is defined in `App` but needed by `ThemeToggle`, `PostCard`, and `CommentItem`. With props, you'd have to pass `theme` through **every intermediate component** — even though `Layout`, `Sidebar`, and `Content` don't use it:

```vue
<!-- App.vue -->
<Layout :theme="theme" />

<!-- Layout.vue -->
<Sidebar :theme="theme" />
<Content :theme="theme" />

<!-- Sidebar.vue -->
<ThemeToggle :theme="theme" />

<!-- Content.vue -->
<PostList :theme="theme" />
```

This is called **prop drilling** — threading props through components that don't need them. Provide/inject solves this.

> **Interview Question:** _"What is prop drilling and how does Vue solve it?"_
> Prop drilling occurs when you pass data through multiple intermediate components that don't use the data themselves, just to get it to a deeply nested child. Vue solves this with **provide/inject**: an ancestor component provides data using `provide()`, and any descendant component accesses it with `inject()`, regardless of how deep it is in the tree. This eliminates the need to pass props through every level.

## How Provide & Inject Work

```
┌──────────────────────────────────────┐
│  App (provides theme)                │
│  ┌──────────────────────────────────┐│
│  │  Layout                          ││
│  │  ┌───────────┐ ┌───────────────┐ ││
│  │  │ Sidebar   │ │  Content      │ ││
│  │  │ ┌───────┐ │ │ ┌──────────┐  │ ││
│  │  │ │Toggle │ │ │ │ PostCard │  │ ││
│  │  │ │inject │ │ │ │ inject   │  │ ││
│  │  │ └───────┘ │ │ └──────────┘  │ ││
│  │  └───────────┘ └───────────────┘ ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

The providing component makes data available, and any descendant can inject it — no matter how many levels deep.

## Basic Usage

### Provide (Ancestor)

```vue
<!-- App.vue -->
<script setup>
import { provide, ref } from 'vue'

const theme = ref('dark')

// Provide data to all descendants
provide('theme', theme)

// You can also provide reactive functions
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

provide('toggleTheme', toggleTheme)
</script>
```

### Inject (Descendant)

```vue
<!-- ThemeToggle.vue (deeply nested child) -->
<script setup>
import { inject } from 'vue'

// Inject the data — no props needed!
const theme = inject('theme')
const toggleTheme = inject('toggleTheme')

// With a default value (in case no provider is found)
const optionalData = inject('someKey', 'default value')

// With a factory function as default
const config = inject('config', () => ({ debug: false }))
</script>

<template>
  <button @click="toggleTheme">
    Current theme: {{ theme }}
  </button>
</template>
```

## Using Symbols as Keys

Using string keys like `'theme'` can cause collisions if multiple libraries use the same key. The recommended approach is to use **Symbols**:

```javascript
// keys.js — shared keys file
export const ThemeKey = Symbol('theme')
export const UserKey = Symbol('user')
export const ConfigKey = Symbol('config')
```

```vue
<!-- Provider -->
<script setup>
import { provide, ref } from 'vue'
import { ThemeKey } from '@/keys'

const theme = ref('dark')
provide(ThemeKey, theme)
</script>
```

```vue
<!-- Injector -->
<script setup>
import { inject } from 'vue'
import { ThemeKey } from '@/keys'

const theme = inject(ThemeKey)
</script>
```

## Making Provide/Inject Reactive

By default, the provided value is **not reactive** unless you provide a `ref` or `reactive`:

```javascript
// NOT reactive — descendants won't see updates
provide('theme', 'dark')

// REACTIVE — descendants will see updates
const theme = ref('dark')
provide('theme', theme)

// REACTIVE with reactive()
const config = reactive({ debug: false, lang: 'en' })
provide('config', config)

// READ-ONLY — descendants can't mutate (recommended)
import { readonly } from 'vue'
provide('theme', readonly(theme))
```

## Provide/Inject vs Pinia

| Aspect | Provide/Inject | Pinia |
|--------|---------------|-------|
| **Scope** | Component tree scope | Global (any component) |
| **Best for** | Theme, locale, component-library configs | Application state, shared data |
| **Complexity** | Simple, lightweight | More structured, DevTools support |
| **When to use** | Data needed by a subtree | Data needed across entire app |

> **Viva Question:** _"When should you use provide/inject vs Pinia?"_
> Use provide/inject when data is scoped to a specific component subtree (like a theme for a section of your app, or form data shared among form fields). Use Pinia for global application state that many unrelated components need (like user authentication, shopping cart, notifications). Provide/inject is simpler and lighter; Pinia is more powerful and has DevTools integration.

## Practical Example: Form Context

```vue
<!-- FormProvider.vue -->
<script setup>
import { provide, ref, readonly } from 'vue'

const formData = reactive({
  username: '',
  email: '',
  password: ''
})

const errors = reactive({})
const isValid = computed(() => Object.keys(errors).length === 0)

provide('formData', readonly(formData))
provide('errors', readonly(errors))
provide('isValid', isValid)
provide('updateField', (field, value) => {
  formData[field] = value
})
</script>
```

## What's Next?

Let's explore dynamic and async components — loading components on demand.

→ Next: [Dynamic & Async Components](/post/languages/vue-dynamic-and-async-components)
