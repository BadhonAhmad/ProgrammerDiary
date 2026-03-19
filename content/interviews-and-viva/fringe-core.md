---
title: "Fringe Core - Interview Questions and Answers"
date: "2026-03-17"
tags: ["interviews", "viva", "fringe-core", "backend", "frontend", "indexing", "database"]
excerpt: "Fringe Core interview notes with implementation-focused technical tasks and viva questions, including how indexing logic is designed and coded in real systems."
---

# Fringe Core - Interview Questions and Answers

## Technical Round

### Tasks Given

The round included practical implementation tasks in both backend and frontend.

- Backend task: implement API/business logic with clean architecture and error handling.
- Frontend task: implement UI behavior connected to backend data.

### What Interviewers Usually Evaluate

- Problem decomposition and implementation strategy
- Code quality, readability, and structure
- Handling of edge cases and validation
- API design and response consistency
- Debugging and communication during implementation

---

## Viva Round

### Questions Were Based on the Implemented Tasks

Most viva questions focused on design choices and trade-offs from the submitted backend/frontend solutions.

Typical follow-up areas:
- Why this API/data model?
- How did you handle errors and invalid input?
- Why this component structure/state flow?
- How would you optimize this if traffic grows?

---

## Added Viva Question: How Do We Write Indexing Logic or Code?

### Answer

Indexing is used to speed up data retrieval by avoiding full table scans.

Core idea:
- Choose columns frequently used in `WHERE`, `JOIN`, `ORDER BY`, and `GROUP BY`.
- Create indexes on those columns.
- Validate improvement using query plans and latency metrics.

### 1. SQL-Level Indexing (Most Common)

Example table:

```sql
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL
);
```

If queries often filter by `user_id` and sort by `created_at`, use a composite index:

```sql
CREATE INDEX idx_orders_user_created_at
ON orders (user_id, created_at DESC);
```

If many queries request only delivered orders, a partial index can be better:

```sql
CREATE INDEX idx_orders_delivered_created_at
ON orders (created_at DESC)
WHERE status = 'DELIVERED';
```

### 2. How to Decide What to Index

Use this process:
1. Identify slow queries from logs/APM.
2. Run `EXPLAIN` or `EXPLAIN ANALYZE`.
3. Check if planner is doing sequential scans.
4. Add index aligned with filter/sort/join pattern.
5. Re-run query plan and compare performance.
6. Monitor write overhead (indexes speed reads but can slow writes).

### 3. Backend Logic Perspective

Backend code should issue query patterns that can use indexes efficiently.

Example (Node.js query shape):

```ts
// Good pattern: filter + ordered pagination aligned with index
const sql = `
  SELECT id, user_id, status, created_at, total_amount
  FROM orders
  WHERE user_id = $1
  ORDER BY created_at DESC
  LIMIT $2 OFFSET $3
`;
```

This query benefits directly from `(user_id, created_at DESC)` index.

### 4. Common Mistakes

- Indexing every column blindly
- Wrong index column order in composite indexes
- Not indexing foreign keys used in joins
- Ignoring cardinality/selectivity
- Forgetting to re-check query plans after schema/query changes

### Interview-Ready Summary

"I first profile slow queries, then design targeted indexes based on real filter/join/order patterns. I validate with `EXPLAIN ANALYZE`, and I balance read gains against write overhead. For high-traffic APIs, I also shape query code to match index order so the database can use index scans efficiently."

---

## Sample Task-Based Viva Q&A

### 1. Why did you choose this backend architecture?

**Answer:**
I used a layered structure (route/controller, service, and data-access layers) to keep concerns separate. This improves readability, testing, and future changes. Business rules stay in the service layer, while controllers stay thin and focus on request/response handling.

### 2. How did you handle validation and error responses?

**Answer:**
I validated input at the API boundary and returned consistent error payloads with proper HTTP status codes (`400`, `404`, `409`, `500`). I also avoided leaking internal errors to clients and logged technical details server-side for debugging.

### 3. How did you optimize frontend performance?

**Answer:**
I reduced unnecessary re-renders by keeping state minimal and colocated. I memoized expensive computations where needed, used loading/error states for better UX, and avoided repeated API calls with controlled effect dependencies.

### 4. If traffic increases 10x, what changes would you make first?

**Answer:**
I would first profile bottlenecks (DB latency, API response time, frontend bundle size), then apply targeted improvements:
- Add caching for hot reads.
- Add/adjust indexes for slow queries.
- Paginate heavy list endpoints.
- Use async processing for long-running tasks.
- Add horizontal scaling behind a load balancer.

### 5. How do you prevent race conditions in update operations?

**Answer:**
I use database transactions and optimistic locking where applicable (for example, version checks). For critical counters or inventory-like updates, I use atomic operations and clear retry strategy on conflict.

### 6. How do you ensure code quality for task-based delivery?

**Answer:**
I follow a small checklist before completion:
- Input validation and edge-case handling
- Meaningful variable and function naming
- Unit/integration tests for core logic
- Lint/format checks
- Short documentation of trade-offs and limitations

This ensures the solution is not only working but maintainable.
