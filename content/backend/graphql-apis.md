---
title: "GraphQL APIs: Ask for Exactly What You Need"
date: "2026-04-17"
tags: ["backend", "graphql", "API", "Apollo", "Node.js", "REST"]
excerpt: "Learn how GraphQL lets clients specify exactly the data they want — no over-fetching, no under-fetching, no versioning — and when it's worth the complexity."
---

# GraphQL APIs: Ask for Exactly What You Need

Your mobile app needs a user's name and avatar. Your REST endpoint returns 47 fields including address, phone, settings, and billing history. The mobile user on a slow connection downloads 50KB to display two fields. GraphQL fixes this.

## What is GraphQL?

**GraphQL** is a query language for APIs and a runtime for executing those queries. Instead of multiple REST endpoints returning fixed data structures, GraphQL exposes a **single endpoint** where clients describe exactly the data they need, and the server returns exactly that — nothing more, nothing less.

```text
REST:
  GET /api/users/42           → Returns full user object (all fields)
  GET /api/users/42/posts     → Returns user's posts
  GET /api/users/42/followers → Returns user's followers

GraphQL:
  POST /graphql
  {
    user(id: 42) {
      name
      avatarUrl
      posts(limit: 5) {
        title
        likes
      }
    }
  }

  → Returns ONLY name, avatarUrl, and 5 posts with title + likes
```

## Why Does It Matter?

❌ **Problem:** Your REST API has `/users`, `/users/:id/posts`, `/users/:id/followers`. The mobile team needs name + 3 recent posts on the profile screen. That's 2 API calls. The web team needs name + posts + followers + stats. That's 4 API calls. You keep adding endpoints for each screen: `/users/:id/profile-summary`, `/users/:id/dashboard`. Now you have 15 endpoints, each serving a slightly different slice of the same data.

This is the **over-fetching / under-fetching** problem. REST endpoints return fixed shapes — too much data for some clients, too little for others, leading to extra requests.

✅ **Solution:** GraphQL gives clients a single endpoint and lets them request exactly the fields they need. Mobile asks for 3 fields. Web asks for 20. Same endpoint, same type system, no extra endpoints.

## Core GraphQL Concepts

### Schema

The schema defines your API's **type system** — what data exists and how it relates.

```text
type User {
  id: ID!
  name: String!
  email: String!
  avatarUrl: String
  posts: [Post!]!
  followers: [User!]!
  followerCount: Int!
}

type Post {
  id: ID!
  title: String!
  content: String
  author: User!
  likes: Int!
  createdAt: String!
}

type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  post(id: ID!): Post
  posts(filter: PostFilter): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updatePost(id: ID!, input: UpdatePostInput!): Post!
  deletePost(id: ID!): Boolean!
}
```

### Queries (Read Data)

```text
query GetUserProfile {
  user(id: 42) {
    name
    avatarUrl
    followerCount
    posts(limit: 3) {
      title
      likes
    }
  }
}
```

Response:

```text
{
  "data": {
    "user": {
      "name": "Alice",
      "avatarUrl": "https://cdn.myapp.com/avatars/alice.jpg",
      "followerCount": 1243,
      "posts": [
        { "title": "Hello World", "likes": 42 },
        { "title": "GraphQL Tips", "likes": 89 },
        { "title": "REST vs GraphQL", "likes": 156 }
      ]
    }
  }
}
```

### Mutations (Write Data)

```text
mutation CreatePost {
  createPost(input: {
    title: "My New Post"
    content: "Hello everyone!"
  }) {
    id
    title
    createdAt
  }
}
```

### Subscriptions (Real-Time)

```text
subscription OnNewMessage {
  newMessage(roomId: "general") {
    id
    text
    sender {
      name
    }
  }
}
```

## Setting Up GraphQL with Apollo Server

```text
npm install @apollo/server graphql
```

```text
const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");

// Schema
const typeDefs = `#graphql
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String
    author: User!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
    post(id: ID!): Post
  }

  type Mutation {
    createPost(title: String!, content: String): Post!
  }
`;

// Resolvers — functions that fetch data for each field
const resolvers = {
  Query: {
    user: (_, { id }) => db.user.findById(id),
    users: () => db.user.findAll(),
    post: (_, { id }) => db.post.findById(id),
  },
  Mutation: {
    createPost: (_, { title, content }, context) => {
      return db.post.create({ title, content, authorId: context.userId });
    },
  },
  // Nested resolvers — only called if client requests these fields
  User: {
    posts: (user) => db.post.findByAuthorId(user.id),
  },
  Post: {
    author: (post) => db.user.findById(post.authorId),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

startStandaloneServer(server, { listen: { port: 4000 } });
```

## GraphQL vs REST

| Factor | REST | GraphQL |
|---|---|---|
| **Endpoints** | Many (one per resource) | One (`/graphql`) |
| **Data shape** | Fixed by server | Client decides |
| **Over-fetching** | Common | Eliminated |
| **Under-fetching** | Multiple requests needed | Single request |
| **Versioning** | `/v1/`, `/v2/` | Evolve schema without versions |
| **Caching** | HTTP caching built-in | Requires custom solutions |
| **Learning curve** | Low | Medium |
| **Tooling** | Simple (curl, Postman) | GraphQL Playground, Apollo |
| **File uploads** | Native (multipart) | Requires separate handling |
| **Error handling** | HTTP status codes | Always 200, errors in response body |

## The N+1 Problem

The biggest performance trap in GraphQL:

```text
Query: Get all users with their posts

GraphQL resolves:
  1. Fetch all users        → 1 query
  2. For EACH user, fetch posts → N queries

10 users = 11 database queries
100 users = 101 database queries
```

### Solution: DataLoader

DataLoader batches and caches database calls within a single request:

```text
const DataLoader = require("dataloader");

const postLoader = new DataLoader(async (authorIds) => {
  // Batch: fetch ALL posts for ALL authors in ONE query
  const posts = await db.post.findAllByAuthorIds(authorIds);

  // Group by author ID
  return authorIds.map(id =>
    posts.filter(post => post.authorId === id)
  );
});

// In resolver
User: {
  posts: (user, _, { loaders }) => loaders.posts.load(user.id),
}
```

Now 10 users = 2 queries. 100 users = 2 queries.

## When to Use GraphQL

### ✅ Good Fit

- Apps with many different views needing different data slices
- Mobile apps where bandwidth matters
- Complex, nested data relationships
- Rapidly evolving frontend needs
- When you want to avoid API versioning

### ❌ Not Ideal

- Simple CRUD apps with few endpoints
- File-heavy uploads (REST handles multipart better)
- When HTTP caching is critical (GraphQL breaks HTTP cache)
- Small teams unfamiliar with the ecosystem
- Public APIs where simplicity matters more than flexibility

## GraphQL Best Practices

| Practice | Why |
|---|---|
| **Use DataLoader** | Prevent N+1 queries on nested resolvers |
| **Limit query depth** | Prevent malicious deeply-nested queries |
| **Persist queries** | Only allow pre-approved queries in production |
| **Add pagination** | Use cursor-based pagination on list fields |
| **Authenticate in context** | Pass auth info via resolver context, not arguments |
| **Monitor resolver times** | Track which fields are slow with Apollo tracing |
| **Schema-first design** | Design schema before implementing resolvers |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **GraphQL** | Query language where clients specify exact data needs |
| **Schema** | Type definitions — the API contract |
| **Query** | Read data (like GET) |
| **Mutation** | Write data (like POST/PUT/DELETE) |
| **Subscription** | Real-time updates (like WebSocket) |
| **Resolver** | Function that fetches data for a specific field |
| **N+1 problem** | Nested resolvers cause multiple DB queries per item |
| **DataLoader** | Batches resolver calls — fixes N+1 |
| **Single endpoint** | All operations go to `/graphql` |
| **No over/under-fetching** | Client gets exactly what it asks for |

**REST is a buffet — take the whole plate. GraphQL is à la carte — order exactly what you want. Pick based on who's ordering.**
