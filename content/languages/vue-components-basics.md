---
title: "Vue Components Basics — Building Blocks of Your App"
date: "2025-01-01"
tags: ["vue", "javascript", "components", "frontend"]
excerpt: "Learn how to create, register, and use Vue components. Understand Single File Components, component registration, and the fundamentals of component-based architecture."
---

# Vue Components Basics

## What Are Components?

Components are the **fundamental building blocks** of Vue applications. A component is a self-contained unit that encapsulates its own template (HTML), logic (JavaScript), and styles (CSS). Think of them like LEGO blocks — each one is independent, reusable, and snaps together to build something bigger.

> **Interview Question:** _"What is a Vue component?"_
> A Vue component is a reusable, self-contained unit that encapsulates its own template, logic, and styles. Components follow a tree structure: a root `App` component contains child components, which can contain their own children. They communicate through props (parent → child) and events (child → parent). This modular architecture makes code reusable, testable, and maintainable.

## Why Components Exist

Without components, you'd write your entire application in one massive file. Imagine a 5000-line `App.vue` with the navigation, sidebar, content, footer, and every feature crammed together. Components solve this by splitting your UI into **independent, reusable pieces**:

```
App (root component)
├── AppHeader
│   ├── AppLogo
│   ├── SearchBar
│   └── UserMenu
│       ├── Avatar
│       └── DropdownMenu
├── AppSidebar
│   ├── NavItem (×5)
│   └── SidebarFooter
├── AppMain
│   ├── PostList
│   │   └── PostCard (×10)
│   └── Pagination
└── AppFooter
```

Each component is responsible for one thing. `PostCard` doesn't know about `SearchBar`. `Pagination` doesn't care about `UserMenu`. This separation makes your codebase scalable.

## Creating a Component

### Single File Component (SFC)

The standard way to create a Vue component is a `.vue` file:

```vue
<!-- src/components/BaseButton.vue -->
<template>
  <button :class="['btn', `btn-${type}`]" @click="handleClick">
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'primary'
  }
})

const emit = defineEmits(['click'])

function handleClick(event) {
  emit('click', event)
}
</script>

<style scoped>
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary {
  background: #42b883;
  color: white;
}
.btn-danger {
  background: #e74c3c;
  color: white;
}
</style>
```

### The Three Sections

Every `.vue` file can have up to three sections:

| Section | Purpose | Required? |
|---------|---------|-----------|
| `<template>` | HTML structure of the component | Yes (unless using render function) |
| `<script setup>` | JavaScript logic | Yes (if component has logic) |
| `<style scoped>` | CSS styles | No |

**`<script setup>`** is a compile-time syntactic sugar for the Composition API. It is the recommended way to write Vue 3 components:

```vue
<script setup>
// Everything here is available in the template automatically
// No need for `export default`, `setup()` function, or `return`
import { ref } from 'vue'

const count = ref(0)  // Automatically available in template
</script>
```

## Using a Component

### Step 1: Import It

```vue
<script setup>
import BaseButton from '@/components/BaseButton.vue'
</script>
```

With `<script setup>`, imported components are **automatically registered** — no need for a `components` option.

### Step 2: Use It in Template

```vue
<template>
  <BaseButton type="primary" @click="handleSave">
    Save Changes
  </BaseButton>

  <BaseButton type="danger" @click="handleDelete">
    Delete
  </BaseButton>
</template>
```

### Naming Conventions

- **PascalCase** in script: `BaseButton`, `UserCard`, `NavBar`
- **kebab-case** or PascalCase in template: `<base-button>` or `<BaseButton>`
- **Multi-word** names are required to avoid conflicts with HTML elements

```vue
<!-- Both work, but PascalCase is recommended -->
<BaseButton>Click</BaseButton>
<base-button>Click</base-button>
```

## Props — Passing Data to Components

Props are how a parent component passes data down to a child:

```vue
<!-- Parent: using the component -->
<template>
  <UserCard
    name="Alice"
    :age="25"
    :hobbies="['coding', 'reading']"
    :is-active="true"
  />
</template>
```

```vue
<!-- Child: UserCard.vue -->
<template>
  <div class="user-card">
    <h2>{{ name }}</h2>
    <p>Age: {{ age }}</p>
    <p>Status: {{ isActive ? 'Active' : 'Inactive' }}</p>
    <ul>
      <li v-for="hobby in hobbies" :key="hobby">{{ hobby }}</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    default: 0
  },
  hobbies: {
    type: Array,
    default: () => []
  },
  isActive: {
    type: Boolean,
    default: false
  }
})
</script>
```

### Props Validation

Vue can validate props with type checking and custom validators:

```javascript
defineProps({
  // Basic type check
  name: String,

  // Multiple possible types
  id: [String, Number],

  // Required with type
  email: {
    type: String,
    required: true
  },

  // With default value
  pageSize: {
    type: Number,
    default: 10
  },

  // Object/Array defaults must use factory function
  items: {
    type: Array,
    default: () => []
  },

  // Custom validator
  status: {
    type: String,
    validator: (value) => ['active', 'inactive', 'pending'].includes(value)
  }
})
```

> **Viva Question:** _"What are props in Vue?"_
> Props (short for properties) are custom attributes that a parent component passes down to a child component. They enable one-way data flow from parent to child. Props can be type-checked, required, have default values, and use custom validators. A child component should never mutate its props directly — it should emit an event to the parent if a change is needed.

## Events — Sending Messages Up

While props flow **down** (parent → child), events flow **up** (child → parent):

```vue
<!-- Child: TodoItem.vue -->
<template>
  <li>
    {{ text }}
    <button @click="remove">Delete</button>
  </li>
</template>

<script setup>
defineProps({
  text: String,
  id: Number
})

const emit = defineEmits(['remove'])

function remove() {
  emit('remove', props.id)  // Send id to parent
}
</script>
```

```vue
<!-- Parent -->
<template>
  <ul>
    <TodoItem
      v-for="todo in todos"
      :key="todo.id"
      :text="todo.text"
      :id="todo.id"
      @remove="removeTodo"
    />
  </ul>
</template>

<script setup>
import { ref } from 'vue'
import TodoItem from '@/components/TodoItem.vue'

const todos = ref([
  { id: 1, text: 'Learn Vue' },
  { id: 2, text: 'Build something' }
])

function removeTodo(id) {
  todos.value = todos.value.filter(t => t.id !== id)
}
</script>
```

## One-Way Data Flow

Vue enforces **unidirectional data flow**:

```
┌──────────┐    Props (data down)    ┌──────────┐
│  Parent  │ ──────────────────────→ │  Child   │
│Component │                         │Component │
│          │ ←────────────────────── │          │
└──────────┘    Events (events up)   └──────────┘
```

This makes data flow predictable and debuggable. When something goes wrong, you always know which direction to trace.

> **Interview Question:** _"How do components communicate in Vue?"_
> Parent-to-child: via **props** (data flows down). Child-to-parent: via **custom events** (child emits, parent listens). For deeply nested components or unrelated components: use **provide/inject** or a global state management solution like **Pinia**. This one-way data flow makes applications predictable and easier to debug.

## What's Next?

Now let's dive deeper into props and events — the backbone of component communication.

→ Next: [Props & Custom Events](/post/languages/vue-props-and-custom-events)
