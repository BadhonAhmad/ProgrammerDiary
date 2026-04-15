---
title: "Transitions & Animations — Bringing Your UI to Life"
date: "2025-01-01"
tags: ["vue", "javascript", "transitions", "animations", "css", "frontend"]
excerpt: "Master Vue's built-in transition system. Learn CSS transitions, JavaScript hooks, list transitions, and animation patterns for smooth, polished user interfaces."
---

# Transitions & Animations

## Why Transitions Matter

Users perceive interfaces with smooth transitions as **faster and more professional** than those without. When an element fades in instead of appearing abruptly, or slides out instead of vanishing, the brain can follow what happened. Vue provides first-class support for transitions that makes adding them straightforward.

> **Interview Question:** _"How do transitions work in Vue?"_
> Vue's `<Transition>` component wraps an element and applies CSS classes at different stages of enter/leave animations. For enter: `v-enter-from` (starting state) → `v-enter-active` (active animation) → `v-enter-to` (ending state). For leave: `v-leave-from` → `v-leave-active` → `v-leave-to`. Vue automatically adds and removes these classes, so you just define the CSS for each state.

## The `<Transition>` Component

Vue's built-in `<Transition>` component handles enter and leave animations for a single element:

```vue
<template>
  <button @click="show = !show">Toggle</button>

  <Transition>
    <p v-if="show">Hello, I'm transitioning!</p>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
const show = ref(true)
</script>

<style>
/* Enter: from invisible → visible */
.v-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.v-enter-active {
  transition: all 0.3s ease;
}
.v-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Leave: from visible → invisible */
.v-leave-from {
  opacity: 1;
}
.v-leave-active {
  transition: all 0.3s ease;
}
.v-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
```

## Transition CSS Classes

Vue applies six CSS classes during transitions:

```
Enter Animation:
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│ v-enter-from │ →  │ v-enter-active│ →  │ v-enter-to   │
│ (start state)│    │ (animation    │    │ (end state)  │
│ opacity: 0   │    │  properties)  │    │ opacity: 1   │
└──────────────┘    └───────────────┘    └──────────────┘

Leave Animation:
┌──────────────┐    ┌───────────────┐    ┌──────────────┐
│ v-leave-from │ →  │ v-leave-active│ →  │ v-leave-to   │
│ (start state)│    │ (animation    │    │ (end state)  │
│ opacity: 1   │    │  properties)  │    │ opacity: 0   │
└──────────────┘    └───────────────┘    └──────────────┘
```

## Named Transitions

Use the `name` prop to avoid CSS conflicts when you have multiple transitions:

```vue
<Transition name="fade">
  <p v-if="show">Fading...</p>
</Transition>

<Transition name="slide">
  <p v-if="show">Sliding...</p>
</Transition>
```

```css
/* Fade transition classes (prefixed with "fade-") */
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

/* Slide transition classes (prefixed with "slide-") */
.slide-enter-from {
  transform: translateX(-100%);
}
.slide-enter-to {
  transform: translateX(0);
}
.slide-enter-active, .slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-leave-to {
  transform: translateX(100%);
}
```

## Common Transition Patterns

### Fade

```css
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
```

### Slide Down

```css
.slide-down-enter-from, .slide-down-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.slide-down-enter-to, .slide-down-leave-from {
  max-height: 500px;
  opacity: 1;
}
.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}
```

### Scale

```css
.scale-enter-from, .scale-leave-to {
  transform: scale(0.9);
  opacity: 0;
}
.scale-enter-active, .scale-leave-active {
  transition: all 0.2s ease;
}
```

## Transitioning Between Components

Use `<Transition>` with dynamic components:

```vue
<template>
  <Transition name="fade" mode="out-in">
    <component :is="currentTab" />
  </Transition>
</template>
```

The `mode` prop controls the timing:
- **`out-in`** — Current element leaves first, then new one enters (recommended)
- **`in-out`** — New element enters first, then old one leaves
- **No mode** — Both happen simultaneously (can cause layout issues)

## JavaScript Hooks

For animations that need JavaScript (like GSAP, anime.js, or Web Animations API):

```vue
<template>
  <Transition
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    :css="false"
  >
    <div v-if="show">Animated element</div>
  </Transition>
</template>

<script setup>
// Disable CSS detection for pure JS animations
// :css="false" tells Vue to skip CSS transition detection

function onBeforeEnter(el) {
  el.style.opacity = 0
  el.style.transform = 'translateY(20px)'
}

function onEnter(el, done) {
  // Use Web Animations API, GSAP, etc.
  el.animate([
    { opacity: 0, transform: 'translateY(20px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration: 300,
    easing: 'ease-out'
  }).onfinish = done  // Call done() when animation completes
}

function onLeave(el, done) {
  el.animate([
    { opacity: 1 },
    { opacity: 0 }
  ], {
    duration: 300
  }).onfinish = done
}
</script>
```

## `<TransitionGroup>` — Animating Lists

For animating items being added, removed, or reordered in a list:

```vue
<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
      <button @click="remove(item.id)">Remove</button>
    </li>
  </TransitionGroup>

  <button @click="add">Add Item</button>
</template>

<script setup>
import { ref } from 'vue'

let nextId = 4
const items = ref([
  { id: 1, text: 'Apple' },
  { id: 2, text: 'Banana' },
  { id: 3, text: 'Cherry' }
])

function add() {
  items.value.push({ id: nextId++, text: 'New Item' })
}

function remove(id) {
  items.value = items.value.filter(item => item.id !== id)
}
</script>

<style>
.list-enter-from, .list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
.list-enter-active, .list-leave-active {
  transition: all 0.3s ease;
}

/* Move transition for reordering */
.list-move {
  transition: transform 0.3s ease;
}

/* Ensure leaving items are taken out of layout flow */
.list-leave-active {
  position: absolute;
}
</style>
```

> **Viva Question:** _"What is the difference between `<Transition>` and `<TransitionGroup>`?"_
> `<Transition>` animates a single element entering or leaving the DOM. `<TransitionGroup>` animates multiple elements in a list — it handles adding, removing, and reordering items with individual animations. `<TransitionGroup>` also supports the `.move` class for smooth repositioning when items change order.

## What's Next?

Let's explore how Vue integrates with TypeScript.

→ Next: [Vue with TypeScript](/post/languages/vue-with-typescript)
