---
title: "Route Handlers & API Routes — Building Backend APIs"
date: "2025-01-01"
tags: ["nextjs", "react", "api", "route-handlers", "rest", "frontend"]
excerpt: "Learn how to build REST API endpoints with Next.js Route Handlers. Understand GET, POST, PUT, DELETE methods, request/response handling, and when to use Route Handlers vs Server Actions."
---

# Route Handlers & API Routes

## What Are Route Handlers?

Route Handlers are functions that handle HTTP requests at specific URL paths. They let you build a full backend API inside your Next.js project. If you need to handle webhooks from Stripe, provide a REST API for mobile apps, or process file uploads, Route Handlers are the tool.

While Server Actions are great for form submissions and simple mutations, Route Handlers are for when you need full control over HTTP requests and responses — custom headers, different status codes, streaming responses, or handling webhooks from third-party services.

> **Interview Question:** _"When would you use a Route Handler instead of a Server Action?"_
> Use Route Handlers when you need: (1) to handle webhooks from external services (Stripe, GitHub); (2) to provide a REST API for mobile apps or third-party consumers; (3) custom HTTP responses (specific status codes, headers, cookies); (4) file uploads/downloads; (5) streaming responses. Use Server Actions for form submissions and mutations called directly from your own components — they are simpler and require less boilerplate.

## Creating Route Handlers

Create a `route.ts` file inside any route folder:

```
app/
└── api/
    ├── users/
    │   └── route.ts       →  /api/users
    ├── posts/
    │   ├── route.ts       →  /api/posts
    │   └── [id]/
    │       └── route.ts   →  /api/posts/42
    └── webhooks/
        └── stripe/
            └── route.ts   →  /api/webhooks/stripe
```

### GET Handler

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  const users = await prisma.user.findMany({
    where: search
      ? { name: { contains: search, mode: "insensitive" } }
      : undefined,
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json(users);
}
```

### POST Handler

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  if (!body.name || !body.email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  const user = await prisma.user.create({
    data: { name: body.name, email: body.email },
  });

  return NextResponse.json(user, { status: 201 });
}
```

### PUT and DELETE Handlers

```typescript
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const post = await prisma.post.findUnique({
    where: { id: params.id },
  });

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  const post = await prisma.post.update({
    where: { id: params.id },
    data: { title: body.title, content: body.content },
  });

  return NextResponse.json(post);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.post.delete({
    where: { id: params.id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
```

## Request and Response Helpers

### Reading Request Data

```typescript
export async function POST(request: NextRequest) {
  // JSON body
  const json = await request.json();

  // Form data
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const name = formData.get("name") as string;

  // Query parameters
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get("page");

  // Headers
  const authHeader = request.headers.get("authorization");

  // Cookies
  const token = request.cookies.get("session")?.value;
}
```

### Building Responses

```typescript
import { NextResponse } from "next/server";

// JSON response
return NextResponse.json({ data: users });

// With status code
return NextResponse.json({ error: "Not found" }, { status: 404 });

// With custom headers
return NextResponse.json(data, {
  headers: {
    "Cache-Control": "public, s-maxage=60",
  },
});

// Redirect
return NextResponse.redirect(new URL("/login", request.url));

// Set cookies
const response = NextResponse.json({ success: true });
response.cookies.set("session", token, {
  httpOnly: true,
  secure: true,
  maxAge: 60 * 60 * 24 * 7,
});
return response;
```

## Webhook Handler Example

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  // Verify webhook signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutComplete(event.data.object);
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object);
      break;
  }

  return NextResponse.json({ received: true });
}
```

## Route Handler Caching

GET Route Handlers are cached by default in production. To make them dynamic:

```typescript
// Force dynamic rendering on every request
export const dynamic = "force-dynamic";
```

## Route Handlers vs Server Actions

| Aspect | Route Handlers | Server Actions |
|--------|---------------|----------------|
| **Purpose** | REST APIs, webhooks | Form submissions, mutations |
| **HTTP methods** | GET, POST, PUT, DELETE, etc. | N/A — function calls |
| **Response control** | Full (status, headers, cookies) | Limited |
| **Consumers** | Any HTTP client (mobile, webhooks) | Your own components |
| **Progressive enhancement** | No | Yes (forms work without JS) |
| **When to use** | Webhooks, REST API for mobile | Form handling, data mutations |

> **Viva Question:** _"What file name creates an API endpoint in Next.js App Router?"_
> `route.ts` (or `route.js`). Place it inside any folder in the `app/` directory, and export functions named after HTTP methods (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`). The file path determines the API URL: `app/api/users/route.ts` handles requests to `/api/users`.

## What's Next?

Let's explore Next.js Middleware — code that runs before every request.

→ Next: [Next.js Middleware](/post/languages/nextjs-middleware)
