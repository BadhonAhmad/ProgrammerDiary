---
title: "Vue Lifecycle Hooks — Every Stage of a Component's Life"
date: "2025-01-01"
tags: ["vue", "javascript", "lifecycle", "hooks", "frontend"]
excerpt: "Master every Vue lifecycle hook — from creation to destruction. Learn when each hook fires, what you should do in each one, and common interview questions."
---

# Vue Lifecycle Hooks

## What Are Lifecycle Hooks?

Every Vue component goes through a series of **lifecycle stages** — it gets created, mounted to the DOM, updated when data changes, and eventually destroyed. Lifecycle hooks are functions that let you run your code at specific points in this journey.

Think of it like the life of a person: birth, growing up, working, retirement. Each stage has specific things you do. Vue components are the same — there are specific things you do at each stage.

```
Creation → Mounting → Updating → Unmounting
   ↓          ↓          ↓          ↓
 setup()   onMounted   onUpdated  onUnmounted
```

> **Interview Question:** _"What are Vue lifecycle hooks?"_
> Lifecycle hooks are functions that allow you to execute code at specific stages of a component's existence. The main hooks are: `onMounted` (DOM is ready), `onUpdated` (reactive data changed and DOM re-rendered), and `onUnmounted` (component is being destroyed). They are used for tasks like fetching data, setting up subscriptions, and cleaning up resources.

## The Complete Lifecycle Diagram

```
                        ┌──────────────┐
                        │  createApp() │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │    setup()   │  ← Composition API runs here
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  onCreated   │  ← (rarely needed, setup replaces it)
                        └──────┬───────┘
                               │
                  ┌────────────▼────────────┐
                  │  Is there a template?   │
                  └────────────┬────────────┘
                        Yes    │    No
                     ┌─────────┴─────────┐
                     ▼                   ▼
              Compile template    Compile el's
              (if using SFC,       innerHTML
              already compiled)
                     │                   │
                     └─────────┬─────────┘
                               │
                        ┌──────▼───────┐
                        │  onBeforeMount │  ← About to insert into DOM
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  onMounted   │  ← DOM is ready, element inserted
                        └──────┬───────┘
                               │
                   ┌───────────▼───────────┐
                   │  Reactive data changes │
                   └───────────┬───────────┘
                               │
                        ┌──────▼───────┐
                        │  onBeforeUpdate│  ← About to re-render
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │  onUpdated   │  ← DOM updated
                        └──────┬───────┘
                               │
                   ┌───────────▼───────────┐
                   │ Component unmounted?  │──No──→ back to waiting
                   └───────────┬───────────┘
                        Yes    │
                        ┌──────▼───────┐
                        │onBeforeUnmount│  ← About to be removed
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │ onUnmounted  │  ← Clean up: remove listeners, timers
                        └──────┬───────┘
                               │
                            [Done]
```

## Each Hook Explained

### `setup()` — The Entry Point (Composition API)

The `setup()` function (or `<script setup>`) runs **before** everything else — before the component is created, before data is observed, before the DOM exists.

```vue
<script setup>
import { ref, onMounted } from 'vue'

// This code runs during setup — BEFORE mounting
const count = ref(0)
const message = ref('Hello')

// Can't access DOM here — it doesn't exist yet
// document.getElementById('app') → null
</script>
```

What to do here:
- Declare reactive data (`ref`, `reactive`)
- Define computed properties
- Declare methods
- Set up watchers
- Register lifecycle hooks

What NOT to do here:
- Access the DOM (it doesn't exist yet)
- Make API calls that need the component to be mounted

### `onMounted()` — DOM is Ready

This is the most commonly used hook. It fires after the component has been inserted into the DOM. At this point, you can safely:
- Access DOM elements
- Initialize third-party libraries that need DOM access
- Fetch initial data from an API

```vue
<script setup>
import { ref, onMounted } from 'vue'

const users = ref([])
const inputRef = ref(null)

onMounted(async () => {
  // Fetch initial data
  const response = await fetch('/api/users')
  users.value = await response.json()

  // Focus an input
  inputRef.value?.focus()

  // Initialize a third-party library
  const chart = new Chart(document.getElementById('myChart'), {
    type: 'bar',
    data: { /* ... */ }
  })
})
</script>
```

> **Viva Question:** _"When does `onMounted` fire?"_
> `onMounted` fires after the component has been mounted to the DOM — meaning the template has been rendered and the component's root element exists in the document. This is the right place to fetch initial data, access DOM elements, and initialize third-party libraries.

### `onUpdated()` — After Data Changes

Fires after a reactive data change causes the DOM to be re-rendered. Use it sparingly — most reactive updates should be handled by Vue's template system.

```vue
<script setup>
import { ref, onUpdated } from 'vue'

const count = ref(0)

onUpdated(() => {
  // Runs after every DOM update caused by reactive data changes
  console.log('Component updated, count is:', count.value)
  document.title = `Count: ${count.value}`
})
</script>
```

**Caution:** Do NOT modify reactive state inside `onUpdated` — it will trigger another update and cause an infinite loop.

### `onUnmounted()` — Cleanup Time

Fires when the component is being destroyed/removed. This is your chance to clean up:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

let intervalId = null
const seconds = ref(0)

onMounted(() => {
  intervalId = setInterval(() => {
    seconds.value++
  }, 1000)
})

onUnmounted(() => {
  // MUST clean up — or the timer keeps running even after component is gone
  clearInterval(intervalId)

  // Clean up event listeners
  window.removeEventListener('resize', handleResize)

  // Clean up WebSocket connections
  socket.close()

  // Cancel pending API requests
  controller.abort()
})
</script>
```

> **Interview Question:** _"Why is `onUnmounted` important?"_
> `onUnmounted` is crucial for preventing memory leaks. If you set up intervals, event listeners, WebSocket connections, or subscriptions in `onMounted`, you MUST clean them up in `onUnmounted`. Without cleanup, these resources keep running even after the component is destroyed, consuming memory and potentially causing errors.

### `onBeforeMount()` and `onBeforeUpdate()`

These fire **right before** the DOM operation happens. Rarely needed in practice:

```javascript
import { onBeforeMount, onBeforeUpdate } from 'vue'

onBeforeMount(() => {
  // DOM is about to be created — rarely needed
  console.log('About to mount')
})

onBeforeUpdate(() => {
  // DOM is about to be updated — useful for saving scroll position
  console.log('About to update')
})
```

### `onBeforeUnmount()`

Fires right before the component is removed. Useful for confirmation dialogs:

```javascript
import { onBeforeUnmount } from 'vue'

onBeforeUnmount(() => {
  // Last chance to prevent unmount or save state
  if (hasUnsavedChanges.value) {
    const answer = confirm('You have unsaved changes. Leave anyway?')
    if (!answer) {
      // Can't actually prevent unmount in Vue 3,
      // but you can save state
      saveDraft()
    }
  }
})
```

## Composition API vs Options API Hooks

If you see Vue 2 code or Options API code, the hooks have different names:

| Composition API | Options API | When it fires |
|----------------|-------------|---------------|
| `setup()` | `beforeCreate` / `created` | Component initialized |
| `onBeforeMount()` | `beforeMount` | Before DOM insertion |
| `onMounted()` | `mounted` | After DOM insertion |
| `onBeforeUpdate()` | `beforeUpdate` | Before re-render |
| `onUpdated()` | `updated` | After re-render |
| `onBeforeUnmount()` | `beforeUnmount` | Before removal |
| `onUnmounted()` | `unmounted` | After removal |

> **Viva Question:** _"What is the equivalent of `mounted` in the Composition API?"_
> `onMounted()`. In the Options API, you define hooks as methods on the component object (`mounted() { ... }`). In the Composition API (used with `<script setup>`), you call the `onMounted()` function and pass a callback.

## Practical Patterns

### Fetch Data on Mount

```javascript
import { ref, onMounted } from 'vue'

const posts = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const response = await fetch('/api/posts')
    posts.value = await response.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})
```

### Setup and Cleanup Event Listeners

```javascript
import { ref, onMounted, onUnmounted } from 'vue'

const windowWidth = ref(window.innerWidth)

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
```

### Using `onActivated` and `onDeactivated` with `keep-alive`

When components are wrapped in `<KeepAlive>`, they are cached instead of destroyed. `onUnmounted` won't fire. Instead, use:

```javascript
import { onActivated, onDeactivated } from 'vue'

onActivated(() => {
  console.log('Component activated (shown again)')
  // Resume polling, refresh data
})

onDeactivated(() => {
  console.log('Component deactivated (hidden but cached)')
  // Pause polling
})
```

## What's Next?

Now that you understand the component lifecycle, let's dive into Vue components themselves — how to build them, compose them, and communicate between them.

→ Next: [Vue Components Basics](/post/languages/vue-components-basics)
