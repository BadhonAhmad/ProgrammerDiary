---
title: "Express.js Performance & Best Practices"
date: "2026-04-16"
tags: ["expressjs", "performance", "production", "best-practices", "scaling"]
excerpt: "Production-ready Express.js — performance optimization, clustering, caching, compression, process management with PM2, and deployment best practices."
---

# Express.js Performance & Best Practices

## What is it?

**Performance optimization** in Express.js involves techniques to make your application faster, more reliable, and able to handle more concurrent users. **Best practices** ensure your code is maintainable, secure, and production-ready.

## How it Works

### 1. Compression

Reduce response size by 70%+ with gzip compression:

```bash
npm install compression
```

```javascript
const compression = require("compression");

// Enable compression for all responses
app.use(compression());

// With options
app.use(
  compression({
    level: 6,                 // Compression level (1-9)
    threshold: 1024,          // Only compress responses > 1KB
    filter: (req, res) => {
      // Don't compress if client doesn't accept it
      if (req.headers["x-no-compression"]) return false;
      return compression.filter(req, res);
    },
  })
);
```

### 2. Response Caching

```javascript
// In-memory cache for API responses
const cache = new Map();

function cacheMiddleware(duration) {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      originalJson(data);
    };

    next();
  };
}

// Cache for 5 minutes
app.get("/api/posts", cacheMiddleware(300000), postController.getPosts);

// Set Cache-Control headers
app.get("/api/static-data", (req, res) => {
  res.set("Cache-Control", "public, max-age=3600"); // 1 hour
  res.json(data);
});
```

### 3. Database Query Optimization

```javascript
// Use indexes
userSchema.index({ email: 1 });          // Single field index
postSchema.index({ author: 1, status: 1 }); // Compound index

// Select only needed fields
const users = await User.find().select("name email -_id");

// Lean queries (plain JS objects, no Mongoose methods)
const users = await User.find().lean();

// Pagination (always)
const posts = await Post.find()
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();

// Batch operations instead of loops
// ❌ BAD: N queries
for (const id of userIds) {
  await User.findById(id);
}

// ✅ GOOD: 1 query
const users = await User.find({ _id: { $in: userIds } });
```

### 4. Clustering — Use All CPU Cores

By default, Node.js runs on a **single CPU core**. Clustering creates multiple processes to use all available cores:

```javascript
// cluster.js
const cluster = require("cluster");
const os = require("os");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary process running. Forking ${numCPUs} workers...`);

  // Fork a worker for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code) => {
    console.log(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork(); // Restart dead workers
  });
} else {
  // Each worker runs the Express app
  require("./server");
  console.log(`Worker ${process.pid} started`);
}
```

```bash
# Start with clustering
node cluster.js
```

### 5. PM2 — Process Manager for Production

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name "my-api"

# Start with clustering (uses all CPU cores)
pm2 start server.js -i max --name "my-api"

# Common commands
pm2 list                 # List all processes
pm2 logs                 # View logs
pm2 restart my-api       # Restart app
pm2 stop my-api          # Stop app
pm2 delete my-api        # Remove from PM2
pm2 monit                # Real-time monitoring
pm2 describe my-api      # Detailed process info
```

```javascript
// ecosystem.config.js — PM2 configuration
module.exports = {
  apps: [
    {
      name: "my-api",
      script: "src/server.js",
      instances: "max",       // One per CPU core
      exec_mode: "cluster",   // Enable clustering
      watch: false,           // Don't auto-restart in production
      max_memory_restart: "1G", // Auto-restart on memory leak
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 8080,
      },
    },
  ],
};
```

```bash
pm2 start ecosystem.config.js --env production
```

### 6. Production Environment Setup

```javascript
// src/server.js — Production-ready setup
const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

// Security
app.use(helmet());
app.disable("x-powered-by");

// Performance
app.use(compression());

// Body parsing with limits
app.use(express.json({ limit: "10kb" }));

// Rate limiting
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Trust proxy (if behind Nginx, load balancer, etc.)
app.set("trust proxy", 1);

// Routes
app.use("/api/v1", require("./routes"));

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
  server.close(() => process.exit(1));
});
```

### 7. Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy dependency files first (for layer caching)
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Run as non-root user
USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/myapp
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### 8. Best Practices Checklist

| Category | Practice |
|----------|----------|
| **Security** | Use Helmet, validate input, hash passwords, rate limit, use HTTPS |
| **Performance** | Compression, caching, lean queries, pagination, clustering |
| **Error Handling** | Centralized handler, custom errors, graceful shutdown |
| **Structure** | MVC pattern, separate routes/controllers/services |
| **Environment** | Use .env, never commit secrets, different configs per environment |
| **Logging** | Use Winston/Pino (not console.log), structured JSON logs |
| **Testing** | Unit tests with Jest, integration tests with supertest |
| **Monitoring** | PM2 monitoring, health check endpoints, APM tools |
| **Documentation** | API docs with Swagger/OpenAPI, README with setup instructions |
| **CI/CD** | Automated testing, linting, and deployment pipeline |

### 9. Project Structure Best Practices

```
src/
├── config/             # Environment, database, third-party configs
├── controllers/        # Route handlers (HTTP concerns only)
├── middleware/          # Auth, validation, error handling
├── models/             # Database schemas
├── routes/             # Route definitions
├── services/           # Business logic
├── utils/              # Helpers, custom errors, logger
└── server.js           # Entry point
```

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Routes** | Map URLs to controllers | `router.get("/users", controller.getUsers)` |
| **Controllers** | Handle HTTP req/res | `res.json({ data })` |
| **Services** | Business logic | `calculateDiscount(order)` |
| **Models** | Data access & validation | Mongoose schemas |
| **Middleware** | Cross-cutting concerns | Auth, logging, validation |
| **Utils** | Shared utilities | Logger, error classes |

> **Interview Question:** _"How do you scale a Node.js application?"_
>
> Multiple levels: (1) **Clustering** — Use all CPU cores with Node's `cluster` module or PM2, (2) **Load balancing** — Nginx or cloud LB distributes traffic across instances, (3) **Horizontal scaling** — Run multiple instances behind a load balancer, (4) **Database scaling** — Read replicas, sharding, connection pooling, (5) **Caching** — Redis for sessions, query results, and frequently accessed data, (6) **Message queues** — RabbitMQ/Kafka for async processing, (7) **Containerization** — Docker + Kubernetes for deployment and auto-scaling, (8) **CDN** — CloudFlare for static assets.

> **Interview Question:** _"What is the difference between horizontal and vertical scaling?"_
>
> **Vertical scaling** (scaling up) means adding more resources to a single server — more CPU, RAM, SSD. Limited by hardware ceiling and is a single point of failure. **Horizontal scaling** (scaling out) means adding more servers to handle load. No hardware limit, fault-tolerant, but requires load balancing and stateless architecture. Node.js favors horizontal scaling because it's lightweight and stateless — easy to run many small instances behind a load balancer.

-> This concludes the Node.js and Express.js guide! You now have a comprehensive understanding of backend development with Node.js and Express.js.
