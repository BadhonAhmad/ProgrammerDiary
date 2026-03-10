---
title: "Docker for Backend Developers: A Practical Guide"
date: "2026-02-25"
tags: ["dev-tools", "docker", "DevOps"]
excerpt: "Get started with Docker as a backend developer. Learn to containerize your Node.js apps, use Docker Compose for local development, and common debugging tips."
---

# Docker for Backend Developers

Docker ensures your application runs the same way everywhere — your machine, your colleague's machine, staging, and production.

## Core Concepts

- **Image**: A blueprint/template (like a class)
- **Container**: A running instance of an image (like an object)
- **Dockerfile**: Instructions to build an image
- **Docker Compose**: Tool to run multi-container applications

## Your First Dockerfile

```dockerfile
# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
```

## Multi-Stage Builds

Keep your production image small:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Docker Compose for Local Dev

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: myapp
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## Essential Commands

```bash
docker build -t myapp .            # Build image
docker run -p 3000:3000 myapp      # Run container
docker compose up -d               # Start all services
docker compose logs -f app         # View logs
docker compose down                # Stop everything
docker exec -it <container> sh     # Shell into container
```

## Common Gotchas

1. **Don't run as root** in production containers
2. **Use .dockerignore** to exclude node_modules, .git
3. **Layer caching**: Put infrequently changing steps first
4. **Health checks**: Add HEALTHCHECK instructions
5. **Don't store data in containers** — use volumes
