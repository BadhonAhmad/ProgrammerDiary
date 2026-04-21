---
title: "Spring Boot Caching"
date: "2026-04-21"
tags: ["java", "springboot", "caching", "performance", "redis"]
excerpt: "Learn how Spring Boot's caching abstraction works — from simple in-memory caching to Redis-backed distributed caches — and when caching transforms performance."
---

# Spring Boot Caching

Your product listing page makes a database query that takes 200ms. The data barely changes — maybe once an hour. But every single page load hits the database. 1,000 concurrent users = 1,000 identical queries per second. Cache it once, serve it in 1ms for every subsequent request.

## What is Caching?

**Caching** stores the result of an expensive operation (database query, API call, computation) in memory. The next time the same request comes, return the cached result instead of repeating the work.

```text
Without cache:
  Request 1 → Query database (200ms) → Return result
  Request 2 → Query database (200ms) → Return same result
  Request 3 → Query database (200ms) → Return same result

With cache:
  Request 1 → Query database (200ms) → Cache result → Return
  Request 2 → Return cached result (1ms) → No database hit
  Request 3 → Return cached result (1ms) → No database hit
```

## Setup

```java
// Enable caching on your application
@SpringBootApplication
@EnableCaching
public class MyApp { ... }
```

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
```

## Cache Annotations

```java
@Service
public class ProductService {

    // Cache the result — key is the method arguments
    @Cacheable(value = "products", key = "#id")
    public Product getProduct(Long id) {
        // This only runs on cache miss
        return productRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    // Invalidate cache when product is updated
    @CachePut(value = "products", key = "#result.id")
    public Product updateProduct(Long id, ProductRequest request) {
        Product product = getProduct(id);
        product.setName(request.getName());
        return productRepository.save(product);
    }

    // Remove from cache when product is deleted
    @CacheEvict(value = "products", key = "#id")
    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    // Clear all products cache
    @CacheEvict(value = "products", allEntries = true)
    public void clearAllCache() { }
}
```

## Cache Managers

### Simple (In-Memory, Default)
```java
@Bean
public CacheManager cacheManager() {
    return new ConcurrentMapCacheManager("products", "users");
}
// Good for development, not for production (not distributed)
```

### Redis (Production)
```yaml
spring:
  redis:
    host: localhost
    port: 6379
  cache:
    type: redis
    redis:
      time-to-live: 3600000    # 1 hour in ms
      cache-null-values: false
```

```text
Why Redis for production:
  - Shared across multiple application instances
  - Survives application restarts
  - Configurable TTL (auto-expiry)
  - Memory-efficient storage
  - Supports pub/sub for cache invalidation
```

### Caffeine (High-Performance In-Memory)
```java
@Bean
public CacheManager cacheManager() {
    CaffeineCacheManager manager = new CaffeineCacheManager("products", "users");
    manager.setCaffeine(Caffeine.newBuilder()
        .expireAfterWrite(30, TimeUnit.MINUTES)
        .maximumSize(1000));
    return manager;
}
// Great for single-instance apps needing fast in-memory cache
```

## When to Cache

```text
Cache when:
  ✅ Data is read frequently but updated rarely
  ✅ Query is expensive (complex joins, aggregations)
  ✅ Result is the same for identical inputs
  ✅ Slight staleness is acceptable

Don't cache when:
  ❌ Data changes frequently (cache constantly invalidated)
  ❌ Data must always be fresh (financial balances)
  ❌ Query is already fast (< 10ms)
  ❌ Results differ per user (personalized data)
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@Cacheable`** | Cache method result — skip execution on cache hit |
| **`@CachePut`** | Update cache with new value after method runs |
| **`@CacheEvict`** | Remove entry from cache |
| **`@EnableCaching`** | Activate Spring's caching annotation support |
| **Redis cache** | Distributed cache shared across instances |
| **Caffeine cache** | High-performance in-memory cache for single instance |
| **TTL** | Time-to-live — cache auto-expires after duration |
| **Cache key** | Derived from method arguments by default |

**Caching is the easiest performance win — add one annotation, and your expensive queries run once instead of a thousand times. Just remember to evict the cache when data changes.**
