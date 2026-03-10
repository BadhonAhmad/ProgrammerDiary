---
title: "Graph Algorithms: BFS and DFS Demystified"
date: "2026-02-15"
tags: ["algorithms", "graphs", "data-structures"]
excerpt: "A hands-on guide to Breadth-First Search and Depth-First Search. Understand when to use each, with TypeScript implementations and visual walkthroughs."
---

# Graph Algorithms: BFS and DFS

Graphs are everywhere — social networks, maps, dependency trees, web crawlers. BFS and DFS are the two fundamental ways to traverse them.

## Graph Representation

```typescript
// Adjacency list (most common)
const graph: Record<string, string[]> = {
  A: ['B', 'C'],
  B: ['A', 'D', 'E'],
  C: ['A', 'F'],
  D: ['B'],
  E: ['B', 'F'],
  F: ['C', 'E'],
};
```

## Breadth-First Search (BFS)

Explores level by level. Uses a **queue** (FIFO).

```typescript
function bfs(graph: Record<string, string[]>, start: string): string[] {
  const visited = new Set<string>();
  const queue: string[] = [start];
  const result: string[] = [];

  visited.add(start);

  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

**Use BFS when:**
- Finding shortest path (unweighted)
- Level-order traversal
- Finding all nodes within k distance

## Depth-First Search (DFS)

Explores as deep as possible first. Uses a **stack** (or recursion).

```typescript
function dfs(graph: Record<string, string[]>, start: string): string[] {
  const visited = new Set<string>();
  const result: string[] = [];

  function explore(node: string) {
    visited.add(node);
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        explore(neighbor);
      }
    }
  }

  explore(start);
  return result;
}
```

**Use DFS when:**
- Detecting cycles
- Topological sorting
- Finding connected components
- Path existence checks
- Solving mazes

## BFS vs DFS Comparison

| Aspect | BFS | DFS |
|--------|-----|-----|
| Data Structure | Queue | Stack/Recursion |
| Memory | O(width) | O(depth) |
| Shortest Path | Yes (unweighted) | No |
| Complete | Yes | Yes (finite graphs) |

## Real-World Applications

- **BFS**: Social network "degrees of separation", GPS navigation
- **DFS**: Dependency resolution (npm), maze generation, compiler analysis
