---
title: "Server Actions — Server Code from Components"
date: "2025-01-01"
tags: ["nextjs", "react", "server-actions", "forms", "mutations", "frontend"]
excerpt: "Learn how to use Next.js Server Actions to call server-side functions directly from components. Handle form submissions, mutations, and data updates without API routes."
---

# Server Actions

## What Are Server Actions?

Server Actions are functions that **run on the server** but can be called directly from client-side code. They eliminate the need to build API routes for form submissions, data mutations, and other server-side operations. Instead of creating an API endpoint and then calling it with `fetch`, you write a server function and call it directly.

Think of it this way: traditionally, if a user submits a form, you would build an API endpoint (`/api/users`), send a POST request to it from the browser, and handle the response. With Server Actions, you write a function that runs on the server and call it directly from your form's `action` attribute or from a button's `onClick`. No API route needed.

> **Interview Question:** _"What are Server Actions in Next.js?"_
> Server Actions are asynchronous functions marked with `"use server"` that execute on the server. They can be called directly from Client Components or used as form actions. They eliminate the need for manual API route creation — you write a server function, and Next.js handles the network communication automatically. They support progressive enhancement: forms with Server Actions work even if JavaScript is disabled.

## How Server Actions Work

### The Flow

```
User clicks button or submits form
    → Browser sends request to Next.js server
    → Server Action function executes on the server
    → Function can access databases, validate data, perform mutations
    → Server sends response back (re-rendered page or redirect)
    → UI updates automatically
```

### Creating a Server Action

Mark a function with `"use server"` at the top:

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  // Server-side validation
  if (!title || title.length < 3) {
    throw new Error("Title must be at least 3 characters");
  }

  // Direct database access
  await prisma.post.create({
    data: { title, content },
  });

  // Clear the cache so /blog shows the new post
  revalidatePath("/blog");
}
```

## Using Server Actions with Forms

### Basic Form Action

The simplest way — works without JavaScript (progressive enhancement):

```tsx
// app/blog/create/page.tsx
import { createPost } from "@/app/actions";

export default function CreatePostPage() {
  return (
    <form action={createPost}>
      <input
        type="text"
        name="title"
        placeholder="Post title"
        required
      />
      <textarea
        name="content"
        placeholder="Write your post..."
        required
      />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

When the form submits, Next.js:
1. Sends the form data to the server
2. Runs the `createPost` Server Action
3. Revalidates the `/blog` page cache
4. Returns the updated UI

### Using `useActionState` for Feedback

For loading states and error handling:

```tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export default function CreatePostForm() {
  const [state, formAction, isPending] = useActionState(createPost, null);

  return (
    <form action={formAction}>
      <input type="text" name="title" required />
      <textarea name="content" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Post"}
      </button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

Update the Server Action to return state:

```tsx
// app/actions.ts
"use server";

export async function createPost(prevState: any, formData: FormData) {
  try {
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;

    if (!title || title.length < 3) {
      return { error: "Title must be at least 3 characters" };
    }

    await prisma.post.create({
      data: { title, content },
    });

    revalidatePath("/blog");
    return { success: true };
  } catch (error) {
    return { error: "Failed to create post" };
  }
}
```

## Calling Server Actions from Buttons

Not just forms — you can call Server Actions from any event handler:

```tsx
"use client";

import { deletePost } from "@/app/actions";

export function DeleteButton({ postId }: { postId: string }) {
  return (
    <button
      onClick={async () => {
        if (confirm("Are you sure?")) {
          await deletePost(postId);
        }
      }}
    >
      Delete
    </button>
  );
}
```

```tsx
// app/actions.ts
"use server";

export async function deletePost(id: string) {
  await prisma.post.delete({ where: { id } });
  revalidatePath("/blog");
}
```

## Server Actions with `useOptimistic`

Show optimistic updates — update the UI immediately before the server responds:

```tsx
"use client";

import { useOptimistic } from "react";
import { likePost } from "@/app/actions";

export function LikeButton({ postId, initialLikes }: { postId: string; initialLikes: number }) {
  const [optimisticLikes, addOptimisticLike] = useOptimistic(
    initialLikes,
    (currentLikes) => currentLikes + 1
  );

  return (
    <button
      onClick={async () => {
        addOptimisticLike(undefined);
        await likePost(postId);
      }}
    >
      {optimisticLikes} Likes
    </button>
  );
}
```

> **Viva Question:** _"What is the advantage of Server Actions over traditional API routes?"_
> Server Actions eliminate boilerplate: no need to create API endpoints, manually serialize/deserialize data, or handle fetch calls. They provide progressive enhancement (forms work without JavaScript), built-in type safety with TypeScript, and tighter integration with Next.js caching (via `revalidatePath`/`revalidateTag`). They also reduce the amount of client-side JavaScript because the action logic stays on the server.

## Validation with Server Actions

Always validate on the server — never trust client-side data:

```tsx
"use server";

import { z } from "zod";

const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
});

export async function createPost(prevState: any, formData: FormData) {
  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
  };

  const result = postSchema.safeParse(rawData);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  await prisma.post.create({ data: result.data });
  revalidatePath("/blog");
  return { success: true };
}
```

## What's Next?

Let's explore Route Handlers — Next.js's way of building REST APIs.

→ Next: [Route Handlers & API Routes](/post/languages/nextjs-route-handlers)
