---
title: "Reactive & Ref — Understanding Vue's Reactivity Primitives"
date: "2025-01-01"
tags: ["vue", "javascript", "reactive", "ref", "reactivity", "frontend"]
excerpt: "Deep dive into ref and reactive — Vue's two reactivity primitives. Learn how they work internally, when to use each, common gotchas, and best practices."
---

# Reactive & Ref

## The Two Reactivity Primitives

Vue 3's reactivity system is built on JavaScript **Proxies**. It provides two ways to create reactive data: `ref()` and `reactive()`. Understanding both — and when to use each — is fundamental to writing correct Vue code.

> **Interview Question:** _"Explain Vue 3's reactivity system."_
> Vue 3 uses JavaScript Proxies to intercept reads and writes on reactive objects. When a component renders, Vue tracks which reactive properties were read (dependency tracking). When those properties change, Vue triggers a re-render of only the affected components. `ref()` wraps any value (including primitives) in an object with a `.value` property that is tracked. `reactive()` makes an entire object reactive using a deep Proxy. Both enable automatic UI updates when data changes.

## `ref()` — The Universal Primitive

### What It Does

`ref()` takes any value and wraps it in a reactive container. For primitives (numbers, strings, booleans), this is the only way to make them reactive because JavaScript passes primitives by value — you can't Proxy a number.

```javascript
import { ref } from 'vue'

const count = ref(0)
const name = ref('Alice')
const isActive = ref(false)
const items = ref([1, 2, 3])
const user = ref({ name: 'Bob', age: 25 })
```

### How It Works Internally

```javascript
// Simplified implementation of ref
function ref(value) {
  return new RefImpl(value)
}

class RefImpl {
  constructor(value) {
    this._value = value
    // When .value is read → track this ref as a dependency
    // When .value is written → trigger all dependents
  }

  get value() {
    track(this, 'value')  // Dependency tracking
    return this._value
  }

  set value(newValue) {
    this._value = newValue
    trigger(this, 'value')  // Notify dependents
  }
}
```

### Accessing `ref` Values

```javascript
const count = ref(0)

// In <script>: use .value
count.value = 5
console.log(count.value)  // 5

// In <template>: auto-unwrapped (no .value needed)
// {{ count }}  →  5
```

### Ref Unwrapping Rules

Vue automatically unwraps refs in these contexts:

1. **Templates** — `{{ count }}` not `{{ count.value }}`
2. **Reactive objects** — if a ref is a property of a `reactive` object:
   ```javascript
   const state = reactive({ count: ref(0) })
   state.count  // Auto-unwrapped, no .value needed
   ```
3. **Props** — refs in props are auto-unwrapped

But NOT unwrapped in:
- Plain JavaScript objects
- Destructured variables from `reactive`
- Array elements

## `reactive()` — The Object Proxy

### What It Does

`reactive()` makes an entire object (or array) deeply reactive using a Proxy. You access properties directly — no `.value`:

```javascript
import { reactive } from 'vue'

const state = reactive({
  name: 'Alice',
  age: 25,
  hobbies: ['coding', 'reading'],
  address: {
    city: 'Dhaka',
    country: 'Bangladesh'
  }
})

// Direct access — no .value
state.name = 'Bob'
state.hobbies.push('gaming')
state.address.city = 'Chittagong'  // Deep reactivity works!
```

### How It Works Internally

```javascript
// Simplified implementation
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key)  // Record: "someone read this property"
      const result = Reflect.get(target, key, receiver)
      // Deep conversion: if the value is an object, make it reactive too
      if (typeof result === 'object' && result !== null) {
        return reactive(result)  // Recursively proxy nested objects
      }
      return result
    },
    set(target, key, value, receiver) {
      const oldValue = target[key]
      const result = Reflect.set(target, key, value, receiver)
      if (oldValue !== value) {
        trigger(target, key)  // Notify: "this property changed"
      }
      return result
    }
  })
}
```

## `ref` vs `reactive` — Complete Comparison

| Aspect | `ref()` | `reactive()` |
|--------|---------|-------------|
| **Works with** | Any value (primitives, objects, arrays) | Objects and arrays only |
| **Access** | `.value` in script | Direct property access |
| **Template** | Auto-unwrapped | Direct access |
| **Reassignment** | `ref.value = newVal` (works!) | `reactive = newObj` (BREAKS!) |
| **Destructuring** | N/A (single value) | Loses reactivity (use `toRefs`) |
| **Deep reactivity** | Yes (auto-unwraps nested refs) | Yes (deep Proxy) |
| **TypeScript** | `Ref<string>` | inferred from object |

## The Big Gotchas

### Gotcha 1: Reassigning `reactive` Breaks Everything

```javascript
const state = reactive({ items: [] })

// WRONG — breaks reactivity!
state = reactive({ items: [1, 2, 3] })

// CORRECT — mutate the existing reactive object
state.items = [1, 2, 3]

// OR use ref instead (supports reassignment)
const state = ref({ items: [] })
state.value = { items: [1, 2, 3] }  // This works!
```

> **Viva Question:** _"Why does reassigning a `reactive` object break reactivity?"_
> Because `reactive()` returns a Proxy wrapped around the original object. When you reassign the variable (`state = newObject`), you replace the Proxy with a plain object — the Proxy is gone, and Vue can no longer intercept changes. The variable now points to a non-reactive object.

### Gotcha 2: Destructuring `reactive` Loses Reactivity

```javascript
const state = reactive({ name: 'Alice', age: 25 })

// WRONG — name and age are now plain values, not reactive
const { name, age } = state

// CORRECT — use toRefs to create connected refs
import { toRefs } from 'vue'
const { name, age } = toRefs(state)
// Now name.value and age.value are reactive and stay connected
```

### Gotcha 3: Passing `ref` Values to Functions

```javascript
const count = ref(0)

// WRONG — passes the value (a number), loses reactivity
function double(c) {
  return c * 2
}
double(count.value)  // Just 0, not reactive

// CORRECT — pass the ref itself
function double(c) {
  return computed(() => c.value * 2)
}
const result = double(count)
```

## Recommended Approach

The Vue team recommends **using `ref` as the default** and `reactive` for specific cases:

```javascript
// Default: use ref for everything
const name = ref('')
const age = ref(0)
const items = ref([])
const user = ref({ name: '', email: '' })

// Use reactive when you have a group of related properties
const form = reactive({
  username: '',
  email: '',
  password: '',
  agreeToTerms: false
})
```

**Why prefer `ref`:**
1. Works with any value type
2. Supports reassignment
3. Clear boundary: if you see `.value`, it's reactive
4. Consistent pattern across your codebase

## Helper Functions

```javascript
import { ref, reactive, isRef, unref, toRef, toRefs, toRaw } from 'vue'

// isRef — check if something is a ref
isRef(count)  // true

// unref — get the value (ref or plain)
unref(count)     // returns count.value if ref, otherwise count
unref(42)        // 42

// toRef — create a ref from a reactive property
const name = toRef(state, 'name')  // Ref connected to state.name

// toRefs — convert all properties to refs
const { name, age } = toRefs(state)

// toRaw — get the original non-reactive object
const rawState = toRaw(state)
```

## What's Next?

Now let's learn about composables — the best way to organize and reuse reactive logic.

→ Next: [Composables](/post/languages/vue-composables)
