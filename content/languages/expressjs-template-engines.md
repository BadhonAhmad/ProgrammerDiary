---
title: "Express.js Template Engines"
date: "2026-04-16"
tags: ["expressjs", "template-engine", "ejs", "pug", "ssr"]
excerpt: "Learn about server-side rendering with Express.js template engines — EJS, Pug, and Handlebars — when to use them and how to configure each."
---

# Express.js Template Engines

## What is it?

A **template engine** enables server-side rendering (SSR) — it lets you generate HTML dynamically by combining templates with data on the server before sending the complete HTML to the browser. Express.js supports many template engines through its `res.render()` method.

## How it Works

### How Template Engines Work in Express

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Template   │     │     Data     │     │  Final HTML  │
│   (.ejs)     │  +  │  (from DB)   │  =  │  (to browser)│
│              │     │              │     │              │
│ <h1><%=title%>│    │ {title:"Hi"} │     │ <h1>Hi</h1>  │
└──────────────┘     └──────────────┘     └──────────────┘
```

```javascript
// Basic setup
app.set("view engine", "ejs");    // Tell Express which engine to use
app.set("views", "./views");      // Where templates live (default)

// Render a template with data
app.get("/", (req, res) => {
  res.render("index", { title: "Home", users: [...] });
  // Looks for: views/index.ejs
});
```

### EJS (Embedded JavaScript)

The most popular — it's just HTML with embedded JavaScript.

```bash
npm install ejs
```

#### Configuration

```javascript
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
```

#### EJS Syntax

```html
<!-- views/index.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %></title>
</head>
<body>
  <!-- Variable output (HTML-escaped) -->
  <h1>Welcome, <%= user.name %>!</h1>

  <!-- Raw HTML output (unescaped — use with caution!) -->
  <div><%- user.bioHtml %></div>

  <!-- JavaScript logic -->
  <% if (user.isAdmin) { %>
    <a href="/admin">Admin Panel</a>
  <% } %>

  <!-- Loops -->
  <ul>
    <% users.forEach(function(user) { %>
      <li>
        <a href="/users/<%= user.id %>"><%= user.name %></a>
        — <%= user.email %>
      </li>
    <% }); %>
  </ul>

  <!-- Include partials -->
  <%- include('partials/header') %>
  <%- include('partials/nav', { currentPage: 'home' }) %>

  <!-- Ternary expressions -->
  <span class="<%= active ? 'active' : '' %>">
    Status: <%= active ? 'Online' : 'Offline' %>
  </span>
</body>
</html>
```

#### Partials

```html
<!-- views/partials/header.ejs -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title><%= title %> | My App</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <nav>
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="/contact">Contact</a>
  </nav>
```

```html
<!-- views/partials/footer.ejs -->
  <footer>&copy; <%= new Date().getFullYear() %> My App</footer>
</body>
</html>
```

#### Layout Pattern

```html
<!-- views/layout.ejs -->
<%- include('partials/header') %>
<main>
  <%- body %>
</main>
<%- include('partials/footer') %>
```

```javascript
// Use express-ejs-layouts for layout support
const expressLayouts = require("express-ejs-layouts");
app.use(expressLayouts);
app.set("layout", "layout");
```

### Pug (formerly Jade)

Indentation-based, concise syntax — no closing tags needed.

```bash
npm install pug
```

```javascript
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
```

```pug
//- views/index.pug
doctype html
html
  head
    title= title
    link(rel="stylesheet" href="/style.css")
  body
    header
      h1= title
      nav
        a(href="/") Home
        a(href="/about") About

    main
      //- Variables
      p Welcome, #{user.name}!

      //- Conditionals
      if user.isAdmin
        a.button(href="/admin") Admin Panel
      else
        p Regular user

      //- Loops
      ul.user-list
        each user in users
          li
            a(href=`/users/${user.id}`)= user.name
            span= user.email

      //- Mixins (reusable components)
      mixin card(title, description)
        .card
          h3= title
          p= description

      +card("Feature 1", "Description here")
      +card("Feature 2", "Another description")

    footer
      p &copy; #{new Date().getFullYear()} My App
```

### Handlebars (hbs)

Logic-less templates — minimal JavaScript in templates.

```bash
npm install hbs
```

```javascript
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
```

```handlebars
<!-- views/index.hbs -->
<h1>{{title}}</h1>

<!-- Variable -->
<p>Welcome, {{user.name}}!</p>

<!-- HTML-unsafe -->
<div>{{{user.bioHtml}}}</div>

<!-- Simple conditional -->
{{#if user.isAdmin}}
  <a href="/admin">Admin Panel</a>
{{/if}}

<!-- Loop -->
<ul>
  {{#each users}}
    <li>
      <a href="/users/{{this.id}}">{{this.name}}</a>
      — {{this.email}}
    </li>
  {{/each}}
</ul>

<!-- With helper -->
<p>Joined: {{formatDate user.createdAt}}</p>
```

```javascript
// Register helpers
const hbs = require("hbs");
hbs.registerHelper("formatDate", function (date) {
  return new Date(date).toLocaleDateString();
});

hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
```

### Template Engine Comparison

| Feature | EJS | Pug | Handlebars |
|---------|-----|-----|------------|
| **Syntax** | HTML + `<% %>` tags | Indentation-based | `{{ }}` mustache |
| **Learning Curve** | Easy (just HTML) | Medium (new syntax) | Easy |
| **JavaScript in Templates** | Full JS | Limited | None (logic-less) |
| **Readability** | Familiar | Concise | Clean |
| **Partials** | `<%- include() %>` | `include` | `{{> partial}}` |
| **Performance** | Good | Good | Good |
| **Best For** | Teams that know HTML | Rapid prototyping | Designers, strict MVC |
| **Popularity** | Most popular | Popular | Popular |

### When to Use Template Engines vs SPA

| Scenario | Use Template Engine (SSR) | Use SPA (React/Vue) |
|----------|--------------------------|---------------------|
| **SEO Critical** | Yes — server returns complete HTML | No — requires extra setup |
| **Content Sites** | Yes — blogs, docs, marketing | No |
| **Complex UI** | No | Yes — dashboards, editors |
| **Real-time Updates** | No | Yes — WebSocket-driven |
| **Fast Initial Load** | Yes | No — must load JS first |
| **Team Skills** | Backend developers | Frontend developers |

### Practical Example: Blog with EJS

```javascript
// server.js
const express = require("express");
const app = express();

app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", async (req, res) => {
  const posts = await Post.find().sort("-createdAt").limit(10);
  res.render("home", { title: "Blog", posts });
});

app.get("/posts/:slug", async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) return res.status(404).render("404", { title: "Not Found" });
  res.render("post", { title: post.title, post });
});
```

```html
<!-- views/home.ejs -->
<%- include('partials/header') %>

<section class="posts">
  <% posts.forEach(post => { %>
    <article class="post-card">
      <h2><a href="/posts/<%= post.slug %>"><%= post.title %></a></h2>
      <p class="meta">
        By <%= post.author %> on
        <%= new Date(post.createdAt).toLocaleDateString() %>
      </p>
      <p><%= post.excerpt %></p>
      <a href="/posts/<%= post.slug %>" class="read-more">Read more</a>
    </article>
  <% }); %>
</section>

<%- include('partials/footer') %>
```

## Why Template Engines Matter

| Reason | Explanation |
|--------|-------------|
| **SEO** | Search engines can index fully-rendered HTML |
| **Performance** | Faster first contentful paint — no JS needed to render |
| **Simplicity** | No separate frontend framework needed |
| **Progressive Enhancement** | Works even if JavaScript is disabled |

> **Interview Question:** _"What is a template engine and why would you use one?"_
>
> A template engine renders HTML on the server by combining template files with dynamic data. Benefits: (1) **SEO** — fully-rendered HTML for search engines, (2) **Performance** — faster initial page load, (3) **DRY** — reuse layouts, partials, and components, (4) **Security** — automatic HTML escaping prevents XSS. Popular choices: EJS (HTML-like syntax), Pug (concise), Handlebars (logic-less). For SPAs, template engines aren't needed — the frontend framework handles rendering.

-> Next: [Express.js Performance & Best Practices](/post/languages/expressjs-performance-and-best-practices)
