---
title: "Template Syntax & Directives — Building Vue Templates"
date: "2025-01-01"
tags: ["vue", "javascript", "template", "directives", "frontend"]
excerpt: "Master Vue's template syntax and built-in directives. Learn how to bind data, handle events, render conditionals and lists, and write clean declarative templates."
---

# Template Syntax & Directives

## What is Vue Template Syntax?

Vue templates are **HTML with extra powers**. You write standard HTML and add special attributes called **directives** (prefixed with `v-`) that tell Vue how to connect your data to the DOM. If you know HTML, you already know 90% of Vue templates.

> **Interview Question:** _"What are Vue directives?"_
> Directives are special attributes with the `v-` prefix that apply reactive behavior to the DOM. Vue provides built-in directives like `v-if` (conditional rendering), `v-for` (list rendering), `v-model` (two-way binding), `v-bind` (attribute binding), and `v-on` (event handling). They are the bridge between your data and the DOM.

## Interpolation — Displaying Data

### Text Interpolation: `{{ }}`

The most basic form of data binding. The double curly braces display the value of a reactive property:

```vue
<template>
  <p>{{ message }}</p>
  <p>{{ count + 1 }}</p>
  <p>{{ ok ? 'Yes' : 'No' }}</p>
  <p>{{ message.split('').reverse().join('') }}</p>
</template>

<script setup>
import { ref } from 'vue'
const message = ref('Hello Vue!')
const count = ref(5)
const ok = ref(true)
</script>
```

Inside `{{ }}`, you can use **any JavaScript expression** (but not statements like `if` or `for`):

```vue
<!-- Valid expressions -->
{{ number + 1 }}
{{ ok ? 'YES' : 'NO' }}
{{ message.split('').reverse().join('') }}

<!-- INVALID — these are statements, not expressions -->
{{ var a = 1 }}
{{ if (ok) { return message } }}
```

### Raw HTML: `v-html`

By default, Vue escapes HTML to prevent XSS attacks. Use `v-html` when you explicitly need to render HTML:

```vue
<template>
  <!-- Escaped (safe) — shows literal HTML tags -->
  <p>{{ rawHtml }}</p>

  <!-- Rendered as real HTML — use with caution! -->
  <p v-html="rawHtml"></p>
</template>

<script setup>
const rawHtml = ref('<strong>This is bold</strong>')
</script>
```

> **Warning:** Never use `v-html` with user-provided content. It creates a XSS vulnerability. Only use it with content you trust.

### Attribute Binding: `v-bind` (shorthand `:`)

You can't use `{{ }}` inside HTML attributes. Use `v-bind` instead:

```vue
<template>
  <!-- Full syntax -->
  <img v-bind:src="imageUrl" v-bind:alt="imageAlt">

  <!-- Shorthand (most common) -->
  <img :src="imageUrl" :alt="imageAlt">

  <!-- Dynamic classes -->
  <div :class="{ active: isActive, 'text-danger': hasError }">

  <!-- Dynamic styles -->
  <p :style="{ color: textColor, fontSize: fontSize + 'px' }">

  <!-- Boolean attributes -->
  <button :disabled="isloading">Submit</button>
</template>
```

### Dynamic attribute names: `v-bind:[attrname]`

```vue
<template>
  <button :[attrName]="value">Dynamic attribute</button>
</template>

<script setup>
import { ref } from 'vue'
const attrName = ref('disabled')
const value = ref(true)
</script>
```

## Event Handling: `v-on` (shorthand `@`)

`v-on` attaches event listeners to elements:

```vue
<template>
  <!-- Full syntax -->
  <button v-on:click="count++">Add 1</button>

  <!-- Shorthand (most common) -->
  <button @click="count++">Add 1</button>

  <!-- Call a method -->
  <button @click="handleClick">Click me</button>

  <!-- Pass arguments -->
  <button @click="greet('Alice')">Say Hi</button>

  <!-- Access the native event -->
  <button @click="handleClick($event)">With event</button>
</template>

<script setup>
import { ref } from 'vue'

const count = ref(0)

function handleClick(event) {
  console.log('Clicked!', event.target)
}

function greet(name) {
  alert('Hello ' + name)
}
</script>
```

### Event Modifiers

Vue provides modifiers that handle common event patterns. Instead of writing `event.preventDefault()` in your handler, you add `.prevent` to the directive:

```vue
<template>
  <!-- Prevent default (stop page reload on form submit) -->
  <form @submit.prevent="handleSubmit">

  <!-- Stop event propagation (don't bubble to parent) -->
  <div @click.stop="handleDivClick">

  <!-- Only trigger once -->
  <button @click.once="doSomething">First click only</button>

  <!-- Only on Enter key -->
  <input @keyup.enter="submitForm">

  <!-- Only on Ctrl+Enter -->
  <textarea @keyup.ctrl.enter="sendMessage">

  <!-- Chain modifiers -->
  <a @click.stop.prevent="doSomething">Link</a>
</template>
```

| Modifier | What It Does |
|----------|-------------|
| `.stop` | Stops event propagation (`event.stopPropagation()`) |
| `.prevent` | Prevents default behavior (`event.preventDefault()`) |
| `.capture` | Use capture mode when adding event listener |
| `.self` | Only trigger if event target is the element itself |
| `.once` | Trigger at most once |
| `.passive` | Improves scroll performance (never calls `preventDefault`) |

### Key Modifiers

```vue
<input @keyup.enter="submit" />
<input @keyup.tab="nextField" />
<input @keyup.delete="deleteItem" />
<input @keyup.esc="cancel" />
<input @keyup.up="moveUp" />
<input @keyup.down="moveDown" />
```

> **Viva Question:** _"What is the difference between `v-bind` and `v-on`?"_
> `v-bind` (shorthand `:`) binds data to HTML attributes — it connects your reactive data to things like `src`, `href`, `class`, `style`, `disabled`. `v-on` (shorthand `@`) attaches event listeners — it connects DOM events like `click`, `input`, `keyup` to your JavaScript functions. `v-bind` flows data TO the DOM; `v-on` flows events FROM the DOM.

## Conditional Rendering: `v-if`, `v-else`, `v-else-if`, `v-show`

### `v-if` — True Conditional Rendering

`v-if` completely removes or adds elements from the DOM:

```vue
<template>
  <div v-if="type === 'A'">Type A content</div>
  <div v-else-if="type === 'B'">Type B content</div>
  <div v-else-if="type === 'C'">Type C content</div>
  <div v-else>Not A, B, or C</div>
</template>
```

### `v-show` — Toggle Visibility

`v-show` keeps the element in the DOM but toggles `display: none`:

```vue
<template>
  <p v-show="isVisible">I'm always in the DOM, just hidden</p>
</template>
```

### `v-if` vs `v-show`

| Aspect | `v-if` | `v-show` |
|--------|--------|----------|
| **DOM** | Removes/adds element | Keeps element, toggles `display` |
| **Initial render** | Skips rendering if false | Always renders |
| **Toggle cost** | High (DOM operations) | Low (CSS toggle) |
| **When to use** | Rarely changes condition | Frequently toggled (e.g., tabs, modals) |

> **Interview Question:** _"When would you use `v-if` vs `v-show`?"_
> Use `v-if` when the condition rarely changes — it has higher toggle cost (real DOM operations) but no initial render cost if false. Use `v-show` when the condition changes frequently (like tabs, dropdowns, modals) — the element is always in the DOM so toggling is cheap, but it has an initial render cost even when hidden.

## List Rendering: `v-for`

`v-for` renders a list of items based on an array or object:

```vue
<template>
  <!-- Rendering an array -->
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>

  <!-- With index -->
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      {{ index }}: {{ item.name }}
    </li>
  </ul>

  <!-- Rendering an object's properties -->
  <div v-for="(value, key) in userInfo" :key="key">
    {{ key }}: {{ value }}
  </div>

  <!-- Rendering a range of numbers -->
  <span v-for="n in 10" :key="n">{{ n }}</span>
</template>

<script setup>
import { ref, reactive } from 'vue'

const items = ref([
  { id: 1, name: 'Bread' },
  { id: 2, name: 'Milk' },
  { id: 3, name: 'Eggs' }
])

const userInfo = reactive({
  name: 'Alice',
  age: 25,
  role: 'Developer'
})
</script>
```

### Why `:key` is Important

The `:key` attribute helps Vue identify which items have changed, been added, or removed. **Always use a unique key** (like an ID from your database):

```vue
<!-- GOOD — unique ID -->
<li v-for="item in items" :key="item.id">

<!-- BAD — using index (causes bugs with reordering/deletion) -->
<li v-for="(item, index) in items" :key="index">

<!-- BAD — no key at all -->
<li v-for="item in items">
```

> **Interview Question:** _"Why is the `:key` attribute important in `v-for`?"_
> The `:key` gives each list item a unique identity so Vue can efficiently track which items changed, were added, or removed during the virtual DOM diffing process. Without a proper key (or using the array index as key), Vue may reuse DOM elements incorrectly when items are reordered, inserted, or deleted, leading to rendering bugs. Always use a unique identifier like `item.id`.

### `v-for` with a Component

```vue
<template>
  <TodoItem
    v-for="todo in todos"
    :key="todo.id"
    :title="todo.title"
    @remove="removeTodo(todo.id)"
  />
</template>
```

## Two-Way Binding: `v-model`

`v-model` creates two-way data bindings on form inputs. It combines `v-bind` and `v-on` into one convenient directive:

```vue
<template>
  <!-- Text input -->
  <input v-model="name" placeholder="Your name">

  <!-- Textarea -->
  <textarea v-model="description"></textarea>

  <!-- Checkbox -->
  <input type="checkbox" v-model="agreeToTerms"> I agree

  <!-- Multiple checkboxes → array -->
  <input type="checkbox" value="vue" v-model="skills"> Vue
  <input type="checkbox" value="react" v-model="skills"> React
  <input type="checkbox" value="angular" v-model="skills"> Angular

  <!-- Radio buttons -->
  <input type="radio" value="student" v-model="role"> Student
  <input type="radio" value="teacher" v-model="role"> Teacher

  <!-- Select -->
  <select v-model="selected">
    <option value="a">Option A</option>
    <option value="b">Option B</option>
  </select>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const description = ref('')
const agreeToTerms = ref(false)
const skills = ref([])
const role = ref('student')
const selected = ref('a')
</script>
```

### `v-model` Modifiers

```vue
<!-- .lazy — update on change instead of input -->
<input v-model.lazy="name">

<!-- .number — auto-convert to number -->
<input v-model.number="age" type="number">

<!-- .trim — auto-trim whitespace -->
<input v-model.trim="email">
```

## Template Refs

When you need direct access to a DOM element, use `ref` attribute:

```vue
<template>
  <input ref="inputElement" placeholder="Focus me">
  <button @click="focusInput">Focus</button>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const inputElement = ref(null)

function focusInput() {
  inputElement.value.focus()
}

onMounted(() => {
  inputElement.value.focus()  // Auto-focus on mount
})
</script>
```

## Computed Attribute Names and Dynamic Arguments

```vue
<!-- Dynamic event name -->
<button @[eventName]="handleClick">Dynamic Event</button>

<!-- Dynamic attribute name -->
<a :[attrName]="url">Dynamic Link</a>
```

```javascript
const eventName = ref('click')
const attrName = ref('href')
const url = ref('https://vuejs.org')
```

> **Viva Question:** _"What is the difference between `{{ }}` interpolation and `v-text` directive?"_
> Both set the text content of an element. `{{ }}` is more readable and lets you embed expressions inside other text (`Hello {{ name }}!`). `v-text` replaces the entire text content of the element. In practice, `{{ }}` is preferred because it's more flexible and readable.

## What's Next?

Now that you can build templates, let's explore computed properties and watchers — Vue's powerful tools for derived state and side effects.

→ Next: [Computed Properties & Watchers](/post/languages/vue-computed-properties-and-watchers)
