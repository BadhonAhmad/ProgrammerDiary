---
title: "Authorization: Who Gets to Do What"
date: "2026-04-17"
tags: ["backend", "authorization", "security", "RBAC", "Node.js", "Express"]
excerpt: "Learn how authorization controls what authenticated users can do — from role-based access to permission systems that keep your app secure."
---

# Authorization: Who Gets to Do What

You verified the person at the door is really Alice. Great. But should Alice have access to the server room? That's authorization.

## What is Authorization?

**Authorization** is the process of determining whether an authenticated user has permission to perform a specific action or access a specific resource.

Authentication asks: *"Who are you?"*
Authorization asks: *"Are you allowed to do this?"*

A regular user can view their own profile. An admin can view anyone's profile, delete users, and change system settings. Both are authenticated — but their **permissions** are different.

## Why Does It Matter?

❌ **Problem:** Imagine an apartment building where every resident has a master key. Tenant 4B can walk into the penthouse, the manager's office, and the maintenance room. In software, this means a regular user could delete other users, access admin panels, or modify data they shouldn't touch.

This isn't hypothetical. Broken access control has been the **#1 security risk** in the OWASP Top 10 for years. Companies like Uber, PayPal, and Twitter have all had authorization bugs that let users access other people's data.

✅ **Solution:** Proper authorization ensures every user can only access and modify what they're supposed to — nothing more.

## How Authorization Works

### The Flow

```text
1. User authenticates (login) → gets identity
2. User makes a request (e.g., DELETE /users/5)
3. Server checks: Does this user have permission?
4. Yes → proceed. No → 403 Forbidden.
```

### Authorization vs Authentication

These two are often confused but they're completely different steps:

```text
Authentication          Authorization
─────────────          ─────────────
"Who are you?"         "Can you do this?"
Happens first          Happens second
Checks identity        Checks permissions
401 if failed          403 if failed
```

## Authorization Models

### Role-Based Access Control (RBAC)

The most common approach. Users are assigned **roles**, and roles have **permissions**.

```text
User ──has role──> Role ──has permissions──> Permissions

Examples:
  admin    → [create_user, delete_user, view_all, edit_all]
  editor   → [create_post, edit_own_post, view_all]
  viewer   → [view_all]
```

```text
// Express middleware for RBAC
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

// Usage
app.delete("/users/:id", requireRole("admin"), deleteUser);
app.put("/posts/:id", requireRole("editor", "admin"), updatePost);
```

**Pros:** Simple, widely understood, easy to audit.
**Cons:** Role explosion for complex apps (too many roles to manage).

### Attribute-Based Access Control (ABAC)

Instead of just roles, access decisions consider **attributes** — properties of the user, resource, action, and environment.

```text
Can user X delete post Y?

Check attributes:
  - User role = "editor"
  - Post author = user X          ← user owns the post
  - Action = "delete"
  - Time = business hours         ← environmental attribute
  - IP = within company network   ← environmental attribute
```

ABAC is more flexible than RBAC but more complex to implement and debug.

### Ownership-Based Access Control

Users can only access resources they own.

```text
// User can only edit their own posts
app.put("/posts/:id", (req, res) => {
  const post = findPost(req.params.id);

  if (post.authorId !== req.user.id) {
    return res.status(403).json({ error: "Not your post" });
  }

  // proceed with update
});
```

Simple and effective for many CRUD applications.

### Permission-Based Access Control

Each user has a list of specific permissions, not tied to roles.

```text
user.permissions = ["posts:create", "posts:edit_own", "posts:delete_own"]
```

More granular than RBAC, but harder to manage at scale.

## Implementing Authorization in Express

### Middleware Approach

The cleanest pattern — check permissions before your route handler runs.

```text
// Check if user owns the resource
function requireOwnership(getResourceOwnerId) {
  return async (req, res, next) => {
    const ownerId = await getResourceOwnerId(req);
    if (req.user.id !== ownerId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.delete("/posts/:id",
  requireAuth,
  requireOwnership((req) => Post.findById(req.params.id).authorId),
  deletePost
);
```

### Resource-Level Checks

Always verify access **at the resource level**, not just the route level.

❌ **Wrong:** Checking if user is admin on the route, but not checking if the specific resource belongs to them.

```text
// Vulnerable — any authenticated user can delete ANY post
app.delete("/posts/:id", requireAuth, (req, res) => {
  Post.delete(req.params.id); // Bug! No ownership check
});
```

✅ **Right:** Always tie the resource to the user.

```text
app.delete("/posts/:id", requireAuth, (req, res) => {
  const post = Post.findById(req.params.id);
  if (post.authorId !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  Post.delete(req.params.id);
});
```

## Common Authorization Vulnerabilities

### ❌ Insecure Direct Object Reference (IDOR)

The user changes `/api/users/5` to `/api/users/6` and accesses someone else's data.

**Fix:** Always verify the requested resource belongs to the authenticated user.

### ❌ Missing Function-Level Access Control

Admin API endpoints exist but have no authorization check — any authenticated user can call them.

**Fix:** Every sensitive endpoint needs an explicit role/permission check.

### ❌ Trusting Client-Side Checks

Hiding a button in the UI doesn't prevent access. The real check must be on the server.

```text
// Frontend hiding the button means nothing
// If /api/admin/users has no server-side check,
// anyone can curl it directly.
```

### ❌ Overly Permissive Defaults

Giving everyone admin access "for now" and never tightening it.

**Fix:** Start with minimal permissions and grant as needed (principle of least privilege).

## Authorization Best Practices

| Practice | Description |
|---|---|
| **Principle of least privilege** | Give users minimum permissions needed |
| **Deny by default** | Block access unless explicitly allowed |
| **Server-side enforcement** | Never trust client-side checks alone |
| **Resource-level checks** | Verify access to each specific resource |
| **Centralized middleware** | One authz system, not scattered checks |
| **Log access denials** | Track who tried to access what |
| **Regular audits** | Review roles and permissions periodically |

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Authorization** | Controls what you can do after authentication |
| **RBAC** | Roles with permissions — most common model |
| **ABAC** | Attribute-based — more flexible, more complex |
| **Ownership checks** | Users access only their own resources |
| **401 vs 403** | 401 = not authenticated, 403 = not authorized |
| **IDOR** | Accessing resources by changing IDs — critical bug |
| **Least privilege** | Give minimum permissions, deny by default |
| **Server-side checks** | Never trust client-side hiding |

**Authentication lets users in the building. Authorization decides which doors they can open.**
