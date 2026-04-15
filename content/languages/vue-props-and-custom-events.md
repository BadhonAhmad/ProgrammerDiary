---
title: "Props & Custom Events — Component Communication"
date: "2025-01-01"
tags: ["vue", "javascript", "props", "events", "components", "frontend"]
excerpt: "Deep dive into props and custom events in Vue. Learn advanced prop patterns, event handling between components, and the v-model pattern for two-way communication."
---

# Props & Custom Events

## Why This Matters

Every non-trivial Vue application needs components to communicate. A `PostList` needs to tell `PostCard` which post to display. A `SearchBar` needs to tell the parent what the user typed. A `Modal` needs to tell the parent when it was closed. Props and events are the **official contract** for this communication.

> **Interview Question:** _"How do you implement two-way binding between parent and child components?"_
> Use `v-model` on the child component. The parent writes `<ChildComponent v-model="value" />`. In the child, define a `modelValue` prop and emit an `update:modelValue` event. Vue 3 also supports named v-model: `v-model:title="title"` uses prop `title` and emits `update:title`.

## Props Deep Dive

### Prop Types

Vue supports these prop types:

```javascript
defineProps({
  // Primitive types
  name: String,
  age: Number,
  isActive: Boolean,

  // Complex types
  user: Object,
  items: Array,

  // Function type (for callbacks — use events instead)
  validator: Function,

  // Date, Symbol, etc.
  createdAt: Date,

  // Multiple types
  id: [String, Number]
})
```

### Prop Default Values and Validators

```javascript
defineProps({
  // Simple default
  size: {
    type: String,
    default: 'medium'
  },

  // Object/Array defaults MUST use a factory function
  config: {
    type: Object,
    default: () => ({ theme: 'light', lang: 'en' })
  },

  items: {
    type: Array,
    default: () => []
  },

  // Required prop (no default)
  title: {
    type: String,
    required: true
  },

  // Custom validator function
  color: {
    type: String,
    validator: (value) => {
      return ['red', 'green', 'blue', 'yellow'].includes(value)
    }
  },

  // Combined: required + validator
  email: {
    type: String,
    required: true,
    validator: (value) => value.includes('@')
  }
})
```

> **Viva Question:** _"Why must Object and Array default values use factory functions in props?"_
> Because Vue creates component instances from the same definition. If you use a direct object like `default: {}`, all instances would share the **same** object reference — mutating it in one component would affect all others. Factory functions (`default: () => ({})`) create a fresh copy for each instance, preventing cross-instance contamination.

### Boolean Casting

Vue has special handling for Boolean props:

```vue
<!-- These are all equivalent -->
<BaseButton disabled />
<BaseButton :disabled="true" />

<!-- Without the prop, it's false -->
<BaseButton />  <!-- disabled is false -->
```

### Using Props in Script Setup

```vue
<script setup>
// Option 1: defineProps returns the props object
const props = defineProps({
  title: String,
  count: Number
})

console.log(props.title)  // Access via props object

// Option 2: Destructure with reactive loss (use with caution)
const { title, count } = defineProps({
  title: String,
  count: Number
})
// Note: destructured props are NOT reactive.
// Use props.title in computed/watchers, not the destructured title.
</script>
```

## Custom Events Deep Dive

### Defining Events

```vue
<script setup>
// Declare the events this component can emit
const emit = defineEmits(['update', 'delete', 'change'])

// Emit with no data
emit('update')

// Emit with data
emit('delete', itemId)

// Emit with multiple arguments
emit('change', newValue, oldValue)
</script>
```

### Validating Events

Like props, events can be validated:

```vue
<script setup>
const emit = defineEmits({
  // No validation
  click: null,

  // Validate payload
  submit: ({ email, password }) => {
    if (!email || !password) {
      console.warn('submit event must include email and password')
      return false
    }
    return true
  },

  // Validate with function
  change: (newValue) => {
    return typeof newValue === 'string'
  }
})
</script>
```

### Parent Listening to Events

```vue
<!-- Parent component -->
<template>
  <!-- Inline handler -->
  <ChildComponent @click="count++" />

  <!-- Method handler -->
  <ChildComponent @submit="handleSubmit" />

  <!-- Inline with event data -->
  <ChildComponent @delete="handleDelete($event)" />

  <!-- Multiple events -->
  <ChildComponent
    @update="handleUpdate"
    @delete="handleDelete"
  />
</template>
```

## The `v-model` Pattern on Components

This is one of the most important patterns in Vue. `v-model` on a custom component creates **two-way binding** between parent and child.

### How `v-model` Works

```vue
<!-- This: -->
<CustomInput v-model="searchQuery" />

<!-- Is syntactic sugar for: -->
<CustomInput
  :modelValue="searchQuery"
  @update:modelValue="searchQuery = $event"
/>
```

### Implementing `v-model` in a Child Component

```vue
<!-- CustomInput.vue -->
<template>
  <input
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  modelValue: String
})

defineEmits(['update:modelValue'])
</script>
```

### Named `v-model` (Multiple v-models)

Vue 3 supports multiple `v-model` bindings on a single component:

```vue
<!-- Parent -->
<UserForm v-model:first-name="firstName" v-model:last-name="lastName" />
```

```vue
<!-- UserForm.vue -->
<template>
  <input
    :value="firstName"
    @input="$emit('update:first-name', $event.target.value)"
  />
  <input
    :value="lastName"
    @input="$emit('update:last-name', $event.target.value)"
  />
</template>

<script setup>
defineProps({
  firstName: String,
  lastName: String
})

defineEmits(['update:first-name', 'update:last-name'])
</script>
```

> **Interview Question:** _"How does `v-model` work on a custom component in Vue 3?"_
> `v-model` on a custom component is syntactic sugar for passing a `modelValue` prop and listening for an `update:modelValue` event. The parent binds a reactive value and the child can update it by emitting the event. Vue 3 also supports named models: `v-model:title` uses prop `title` and event `update:title`.

### `v-model` with Computed Getter/Setter (Alternative Pattern)

A cleaner way to implement `v-model` in the child:

```vue
<!-- CustomInput.vue -->
<template>
  <input v-model="value" />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: String
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    return props.modelValue
  },
  set(newValue) {
    emit('update:modelValue', newValue)
  }
})
</script>
```

## Props Mutability Rules

### NEVER Mutate Props Directly

```vue
<script setup>
const props = defineProps({
  items: Array
})

// WRONG — Vue will warn you
props.items.push('new item')

// WRONG — direct mutation
props.count++
</script>
```

### Correct Patterns

```vue
<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  items: Array,
  count: Number
})

const emit = defineEmits(['update:count'])

// Pattern 1: Compute a new value (read-only use)
const sortedItems = computed(() =>
  [...props.items].sort((a, b) => a.name.localeCompare(b.name))
)

// Pattern 2: Emit event to parent (let parent decide)
function increment() {
  emit('update:count', props.count + 1)
}

// Pattern 3: Create local copy (if you need to modify independently)
const localItems = ref([...props.items])
</script>
```

> **Viva Question:** _"Why shouldn't you mutate props in Vue?"_
> Props follow one-way data flow — they are owned by the parent component. If a child mutates a prop, the parent doesn't know about it, creating inconsistency and making bugs hard to track. Instead, the child should emit an event to request the change, and the parent decides whether and how to update the data. This keeps data ownership clear and predictable.

## What's Next?

Let's explore slots — Vue's way of composing component content.

→ Next: [Slots in Vue](/post/languages/vue-slots)
