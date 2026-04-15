---
title: "Slots in Vue — Flexible Content Distribution"
date: "2025-01-01"
tags: ["vue", "javascript", "slots", "components", "frontend"]
excerpt: "Master Vue slots — default slots, named slots, scoped slots, and advanced patterns. Learn how to build flexible, reusable components that accept dynamic content."
---

# Slots in Vue

## What Are Slots?

Slots are Vue's mechanism for **content distribution** — they let a component accept arbitrary content from its parent. Think of a slot like a placeholder in a template that the parent fills in. If props pass data, slots pass **template content**.

> **Interview Question:** _"What are slots in Vue?"_
> Slots are a content distribution mechanism that allows a parent component to pass template content (HTML, other components, or any template code) into a child component. The child defines where the content goes using `<slot>`. Vue supports default slots, named slots (multiple insertion points), and scoped slots (child passes data back to the parent's slot content).

## Default Slot

The simplest form — the child component has a `<slot>` that receives whatever the parent puts between its tags:

```vue
<!-- BaseCard.vue (child) -->
<template>
  <div class="card">
    <div class="card-body">
      <slot>Default content if nothing is provided</slot>
    </div>
  </div>
</template>
```

```vue
<!-- Parent using BaseCard -->
<template>
  <!-- Custom content -->
  <BaseCard>
    <h2>Welcome!</h2>
    <p>This is the card content.</p>
  </BaseCard>

  <!-- No content — shows fallback -->
  <BaseCard />
</template>
```

The `<slot>` element is a **slot outlet** — it marks where the parent's content will be rendered. If the parent doesn't provide content, the fallback (default content inside `<slot>`) is shown.

## Named Slots

When a component needs **multiple content areas**, use named slots:

```vue
<!-- BaseLayout.vue -->
<template>
  <div class="layout">
    <header class="layout-header">
      <slot name="header"></slot>
    </header>

    <main class="layout-main">
      <slot></slot>  <!-- Default slot (unnamed) -->
    </main>

    <footer class="layout-footer">
      <slot name="footer"></slot>
    </footer>
  </div>
</template>
```

```vue
<!-- Parent using BaseLayout -->
<template>
  <BaseLayout>
    <template #header>
      <h1>My Website</h1>
      <nav>Home | About | Contact</nav>
    </template>

    <template #default>
      <p>Main content goes here.</p>
    </template>

    <template #footer>
      <p>&copy; 2025 My Website</p>
    </template>
  </BaseLayout>
</template>
```

The parent uses `#name` (shorthand for `v-slot:name`) to target specific named slots. Any content not wrapped in a `<template #name>` goes to the default slot.

## Scoped Slots

Scoped slots let the **child component pass data back** to the slot content. This is one of Vue's most powerful patterns:

```vue
<!-- TodoList.vue (child) -->
<template>
  <ul>
    <li v-for="todo in todos" :key="todo.id">
      <!-- Pass todo data to the parent's slot content -->
      <slot :todo="todo" :index="index">
        <!-- Fallback: simple display if parent doesn't customize -->
        {{ todo.text }}
      </slot>
    </li>
  </ul>
</template>

<script setup>
import { toRefs } from 'vue'

const props = defineProps({
  todos: {
    type: Array,
    required: true
  }
})

const { todos } = toRefs(props)
</script>
```

```vue
<!-- Parent — fully custom rendering using child's data -->
<template>
  <TodoList :todos="myTodos">
    <!-- Receive todo data from child via destructure -->
    <template #default="{ todo, index }">
      <span :class="{ completed: todo.done }">
        {{ index + 1 }}. {{ todo.text }}
      </span>
      <button @click="toggleTodo(todo.id)">
        {{ todo.done ? 'Undo' : 'Done' }}
      </button>
    </template>
  </TodoList>
</template>
```

The child exposes data via slot attributes (`:todo="todo"`), and the parent receives it via the `#default="{ todo }"` destructuring pattern.

> **Interview Question:** _"What is a scoped slot?"_
> A scoped slot allows a child component to pass data to the parent's slot content. The child uses `<slot :data="value">` to expose data, and the parent receives it using `v-slot="{ data }"` or `#default="{ data }"`. This is useful for creating flexible list components, tables, or any component where the parent should control rendering but needs data from the child.

## Real-World Patterns

### Reusable Data Table

```vue
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="col.key">
          {{ col.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in rows" :key="row.id">
        <td v-for="col in columns" :key="col.key">
          <slot :name="col.key" :row="row" :index="index">
            {{ row[col.key] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
defineProps({
  columns: Array,
  rows: Array
})
</script>
```

```vue
<!-- Parent — custom rendering for specific columns -->
<template>
  <DataTable :columns="columns" :rows="users">
    <!-- Custom slot for the "status" column -->
    <template #status="{ row }">
      <span :class="`badge badge-${row.status}`">
        {{ row.status }}
      </span>
    </template>

    <!-- Custom slot for the "actions" column -->
    <template #actions="{ row }">
      <button @click="edit(row.id)">Edit</button>
      <button @click="remove(row.id)">Delete</button>
    </template>

    <!-- Other columns use default rendering -->
  </DataTable>
</template>
```

### Reusable Modal

```vue
<!-- BaseModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <slot name="header">
          <h2>{{ title }}</h2>
        </slot>
        <button @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <slot></slot>
      </div>

      <div class="modal-footer">
        <slot name="footer">
          <button @click="close">Close</button>
        </slot>
      </div>
    </div>
  </div>
</template>
```

## Slot Props and TypeScript

```vue
<script setup lang="ts">
defineProps<{
  items: { id: number; name: string; done: boolean }[]
}>()
</script>

<template>
  <div v-for="item in items" :key="item.id">
    <slot :item="item" :toggle="() => toggleItem(item.id)">
      {{ item.name }}
    </slot>
  </div>
</template>
```

## What's Next?

Let's explore provide/inject — Vue's mechanism for passing data deeply through the component tree.

→ Next: [Provide & Inject](/post/languages/vue-provide-and-inject)
