---
title: "Form Input Bindings — v-model in Depth"
date: "2025-01-01"
tags: ["vue", "javascript", "forms", "v-model", "frontend"]
excerpt: "Master Vue's v-model directive for two-way form binding. Learn how to handle text inputs, checkboxes, radio buttons, select dropdowns, and build custom form components."
---

# Form Input Bindings

## Why Form Binding Matters

Forms are the primary way users interact with web applications — logging in, searching, submitting orders, posting comments. Vue's `v-model` makes form handling dramatically simpler by creating **two-way bindings** between form inputs and your reactive data. No manual event listeners, no DOM queries, no `document.getElementById`.

> **Interview Question:** _"How does `v-model` work under the hood?"_
> `v-model` is syntactic sugar that combines `v-bind` and `v-on`. For a text input, `v-model="text"` expands to `:value="text" @input="text = $event.target.value"`. Vue also applies special handling for different input types: checkboxes use `checked` property and `change` event, radio buttons use `checked` and `change`, select uses `value` and `change`.

## Text Input

```vue
<template>
  <input v-model="name" placeholder="Enter your name">
  <p>Hello, {{ name }}!</p>
</template>

<script setup>
import { ref } from 'vue'
const name = ref('')
</script>
```

### Multi-line Text

```vue
<template>
  <textarea v-model="description" placeholder="Tell us about yourself..."></textarea>
  <p>Preview: {{ description }}</p>
</template>

<script setup>
import { ref } from 'vue'
const description = ref('')
</script>
```

> **Note:** Interpolation (`<textarea>{{ text }}</textarea>`) does NOT work inside `<textarea>`. Use `v-model` instead.

## Checkbox

### Single Checkbox (Boolean)

```vue
<template>
  <input type="checkbox" id="agree" v-model="agreed">
  <label for="agree">I agree to the terms</label>
  <p>Agreed: {{ agreed }}</p>

  <button :disabled="!agreed">Continue</button>
</template>

<script setup>
import { ref } from 'vue'
const agreed = ref(false)
</script>
```

### Custom True/False Values

```vue
<template>
  <input
    type="checkbox"
    v-model="status"
    true-value="active"
    false-value="inactive"
  >
  <p>Status: {{ status }}</p>
</template>

<script setup>
import { ref } from 'vue'
const status = ref('inactive')
</script>
```

### Multiple Checkboxes (Array)

```vue
<template>
  <div>
    <input type="checkbox" id="vue" value="Vue" v-model="skills">
    <label for="vue">Vue</label>

    <input type="checkbox" id="react" value="React" v-model="skills">
    <label for="react">React</label>

    <input type="checkbox" id="angular" value="Angular" v-model="skills">
    <label for="angular">Angular</label>
  </div>

  <p>Selected skills: {{ skills }}</p>
</template>

<script setup>
import { ref } from 'vue'
const skills = ref([])  // Will contain ['Vue', 'React', ...]
</script>
```

## Radio Buttons

```vue
<template>
  <div>
    <input type="radio" id="beginner" value="beginner" v-model="level">
    <label for="beginner">Beginner</label>

    <input type="radio" id="intermediate" value="intermediate" v-model="level">
    <label for="intermediate">Intermediate</label>

    <input type="radio" id="advanced" value="advanced" v-model="level">
    <label for="advanced">Advanced</label>
  </div>

  <p>Your level: {{ level }}</p>
</template>

<script setup>
import { ref } from 'vue'
const level = ref('beginner')
</script>
```

## Select

### Single Select

```vue
<template>
  <select v-model="selectedCountry">
    <option disabled value="">Select a country</option>
    <option value="bd">Bangladesh</option>
    <option value="us">United States</option>
    <option value="uk">United Kingdom</option>
  </select>

  <p>Selected: {{ selectedCountry }}</p>
</template>

<script setup>
import { ref } from 'vue'
const selectedCountry = ref('')
</script>
```

### Multi-Select

```vue
<template>
  <select v-model="selectedColors" multiple>
    <option value="red">Red</option>
    <option value="green">Green</option>
    <option value="blue">Blue</option>
  </select>

  <p>Selected: {{ selectedColors }}</p>
</template>

<script setup>
import { ref } from 'vue'
const selectedColors = ref([])
</script>
```

### Dynamic Options with `v-for`

```vue
<template>
  <select v-model="selectedUserId">
    <option disabled value="">Select a user</option>
    <option
      v-for="user in users"
      :key="user.id"
      :value="user.id"
    >
      {{ user.name }}
    </option>
  </select>
</template>

<script setup>
import { ref } from 'vue'
const selectedUserId = ref('')
const users = ref([
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' }
])
</script>
```

## `v-model` Modifiers

Vue provides three modifiers for fine-tuning `v-model` behavior:

### `.lazy` — Sync on `change` Instead of `input`

By default, `v-model` syncs on every keystroke. With `.lazy`, it syncs when the input loses focus or the user presses Enter:

```vue
<input v-model.lazy="name" />
<!-- Updates `name` when user leaves the field, not on every keystroke -->
```

### `.number` — Auto-Convert to Number

Even with `type="number"`, HTML inputs return strings. `.number` auto-converts:

```vue
<input v-model.number="age" type="number" />
<!-- age will be a number, not a string -->
```

```javascript
const age = ref(0)  // Remains a number, not "25"
```

### `.trim` — Auto-Trim Whitespace

```vue
<input v-model.trim="email" />
<!-- "  hello@world.com  " becomes "hello@world.com" -->
```

## Building a Complete Form

```vue
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label>Name:</label>
      <input v-model.trim="form.name" required>
    </div>

    <div>
      <label>Email:</label>
      <input v-model.trim="form.email" type="email" required>
    </div>

    <div>
      <label>Age:</label>
      <input v-model.number="form.age" type="number" min="1" max="120">
    </div>

    <div>
      <label>Role:</label>
      <select v-model="form.role">
        <option value="developer">Developer</option>
        <option value="designer">Designer</option>
        <option value="manager">Manager</option>
      </select>
    </div>

    <div>
      <label>
        <input type="checkbox" v-model="form.agreeToTerms">
        I agree to the terms
      </label>
    </div>

    <button type="submit" :disabled="!isFormValid">Submit</button>
  </form>
</template>

<script setup>
import { reactive, computed } from 'vue'

const form = reactive({
  name: '',
  email: '',
  age: null,
  role: 'developer',
  agreeToTerms: false
})

const isFormValid = computed(() =>
  form.name.length > 0 &&
  form.email.includes('@') &&
  form.agreeToTerms
)

function handleSubmit() {
  console.log('Form submitted:', { ...form })
  // Send to API...
}
</script>
```

## What's Next?

Let's dive into the Composition API — Vue 3's modern way of writing component logic.

→ Next: [Composition API & Setup](/post/languages/vue-composition-api-and-setup)
