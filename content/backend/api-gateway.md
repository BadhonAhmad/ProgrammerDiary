---
title: "API Gateway: The Front Door to Your Microservices"
date: "2026-04-17"
tags: ["backend", "api-gateway", "microservices", "architecture", "Kong", "Nginx"]
excerpt: "Learn how an API gateway acts as the single entry point for all client requests — handling routing, authentication, rate limiting, and transformation before traffic reaches your services."
---

# API Gateway: The Front Door to Your Microservices

Your mobile app calls 8 different microservices directly. Each has its own URL, auth mechanism, and rate limit. Changing the auth system means updating 8 service configs. Adding a new service means updating every client. An API gateway fixes this with a single front door.

## What is an API Gateway?

An **API gateway** is a server that sits between clients and your backend services. It's the **single entry point** for all API requests, handling cross-cutting concerns so individual services don't have to.

```text
Without API Gateway:
  Client ──> User Service (auth, rate limit, logging)
  Client ──> Order Service (auth, rate limit, logging)
  Client ──> Payment Service (auth, rate limit, logging)
  Client ──> Inventory Service (auth, rate limit, logging)

  Every service handles: auth, rate limiting, CORS, logging, transformation

With API Gateway:
  Client ──> API Gateway ──> User Service
                         ──> Order Service
                         ──> Payment Service
                         ──> Inventory Service

  Gateway handles: auth, rate limiting, CORS, logging, transformation
  Services focus on: business logic only
```

## Why Does It Matter?

❌ **Problem:** You have 10 microservices. Authentication logic is duplicated across all 10. Rate limiting is configured differently in each. CORS headers are inconsistent. When you change the auth token format, you deploy 10 services. Your mobile team needs to know 10 different base URLs. An analytics service wants to track all requests — you add logging to 10 services.

✅ **Solution:** The API gateway centralizes all cross-cutting concerns. Authentication, rate limiting, CORS, logging, request transformation — handled once, consistently, at the gateway. Backend services focus purely on business logic. Clients have one URL, one auth mechanism.

## What a Gateway Handles

| Concern | How the Gateway Handles It |
|---|---|
| **Routing** | Maps request paths to backend services |
| **Authentication** | Verifies JWT/API key before forwarding |
| **Rate limiting** | Throttles requests per user/IP |
| **CORS** | Sets headers for browser requests |
| **Request transformation** | Converts formats (REST → gRPC, rename fields) |
| **Response caching** | Caches identical requests |
| **Load balancing** | Distributes across service instances |
| **Logging/metrics** | Tracks all requests centrally |
| **SSL termination** | Handles HTTPS, backend uses HTTP |
| **API versioning** | Routes `/v1/` and `/v2/` to different services |

## Routing Example

```text
Client request:
  GET https://api.myapp.com/users/42

Gateway routes:
  /users/*     → User Service (http://user-service:3001)
  /orders/*    → Order Service (http://order-service:3002)
  /payments/*  → Payment Service (http://payment-service:3003)
  /search/*    → Search Service (http://search-service:3004)

Result:
  GET /users/42 → forwarded to http://user-service:3001/users/42
```

## API Gateway with Nginx

The simplest gateway — Nginx reverse proxy with routing:

```text
http {
  # Rate limiting zone
  limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;

  server {
    listen 443 ssl;
    server_name api.myapp.com;

    # SSL
    ssl_certificate /etc/ssl/certs/api.myapp.com.crt;
    ssl_certificate_key /etc/ssl/private/api.myapp.com.key;

    # Authentication (validate JWT)
    auth_request /auth;

    location = /auth {
      internal;
      proxy_pass http://auth-service:3000/verify;
      proxy_pass_request_body off;
      proxy_set_header Content-Length "";
      proxy_set_header Authorization $http_authorization;
    }

    # Rate limiting
    limit_req zone=api burst=50 nodelay;

    # CORS headers
    add_header Access-Control-Allow-Origin "https://myapp.com";
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE";
    add_header Access-Control-Allow-Headers "Authorization, Content-Type";

    # Route to services
    location /users/ {
      proxy_pass http://user-service:3001/;
      proxy_set_header X-Request-ID $request_id;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /orders/ {
      proxy_pass http://order-service:3002/;
    }

    location /payments/ {
      proxy_pass http://payment-service:3003/;
    }

    # Health check endpoint
    location /health {
      return 200 "OK";
    }
  }
}
```

## API Gateway with Kong

**Kong** is a popular open-source API gateway built on Nginx with a plugin system:

```text
# Start Kong with Docker
docker run -d --name kong \
  -p 8000:8000 \
  -p 8443:8443 \
  -e "KONG_DATABASE=postgres" \
  -e "KONG_PG_HOST=kong-db" \
  kong:latest

# Add a service (backend target)
curl -X POST http://localhost:8001/services \
  -d "name=user-service" \
  -d "url=http://user-service:3001"

# Add a route (path mapping)
curl -X POST http://localhost:8001/services/user-service/routes \
  -d "paths[]=/users"

# Add authentication plugin
curl -X POST http://localhost:8001/services/user-service/plugins \
  -d "name=jwt"

# Add rate limiting plugin
curl -X POST http://localhost:8001/services/user-service/plugins \
  -d "name=rate-limiting" \
  -d "config.minute=100" \
  -d "config.hour=5000"

# Add logging plugin
curl -X POST http://localhost:8001/services/user-service/plugins \
  -d "name=file-log" \
  -d "config.path=/var/log/kong/user-service.log"
```

### Kong Plugins (pre-built features)

| Plugin | What It Does |
|---|---|
| **JWT** | Validate JWT tokens |
| **Rate Limiting** | Throttle requests per consumer |
| **CORS** | Handle cross-origin requests |
| **IP Restriction** | Whitelist/blacklist IPs |
| **Request Transformer** | Modify request headers/body |
| **Response Transformer** | Modify response headers/body |
| **Caching** | Cache responses |
| **OAuth2** | OAuth2 authentication flow |
| **ACL** | Access control lists |
| **Logging** | File, TCP, UDP, HTTP, syslog logging |

## API Gateway vs Load Balancer

| Factor | Load Balancer | API Gateway |
|---|---|---|
| **Purpose** | Distribute traffic to servers | Route and manage API requests |
| **Awareness** | Knows about servers | Knows about APIs and services |
| **Routing** | Same backend for all requests | Path-based routing to different services |
| **Auth** | ❌ No | ✅ Validates tokens |
| **Rate limiting** | Basic (if any) | Advanced per-consumer limits |
| **Transformation** | ❌ No | ✅ Request/response transformation |
| **Layer** | L4 (TCP) or L7 (HTTP) | L7 (HTTP/HTTPS only) |

A load balancer distributes traffic. An API gateway understands the traffic.

## Backend-for-Frontend (BFF) Pattern

Different clients need different data shapes. Instead of one gateway, create one per client type:

```text
Mobile App ──> Mobile BFF Gateway ──> User Service
                                 ──> Order Service (simplified data)

Web App    ──> Web BFF Gateway    ──> User Service
                                 ──> Order Service (full data)
                                 ──> Analytics Service

Partner API ──> Partner Gateway   ──> User Service (limited fields)
                                 ──> Order Service (limited fields)
```

Each gateway tailors responses for its client — aggregating, filtering, and transforming data.

## When You Need an API Gateway

### ✅ Use One When

- You have 3+ microservices with shared cross-cutting concerns
- Multiple client types (mobile, web, partner) need different data
- You need centralized auth, rate limiting, and monitoring
- You want to migrate from monolith to microservices gradually (gateway routes old paths to monolith, new paths to services)

### ❌ Skip It When

- You have a single monolithic app
- Only 1-2 services with no shared concerns
- The complexity isn't worth it for a small team
- You can handle routing and auth in your application code

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **API gateway** | Single entry point that routes and manages all API traffic |
| **Routing** | Map URL paths to backend services |
| **Cross-cutting concerns** | Auth, rate limiting, CORS, logging — handled once |
| **Nginx** | Simple gateway via reverse proxy config |
| **Kong** | Full-featured gateway with plugin system |
| **BFF pattern** | Separate gateway per client type (mobile, web, partner) |
| **SSL termination** | Gateway handles HTTPS, backends use HTTP |
| **Request transformation** | REST → gRPC, field renaming, format conversion |
| **Centralized auth** | One auth check at the gateway, not in every service |

**Without a gateway, every service builds its own front door. With one, there's a single, well-guarded entrance — and every service behind it can focus on its actual job.**
