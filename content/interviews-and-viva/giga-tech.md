---
title: "Giga Tech - Interview Questions and Answers"
date: "2026-03-17"
tags: ["interviews", "viva", "giga-tech", "leetcode", "dsa", "sql", "react"]
excerpt: "Giga Tech written and viva interview questions with clear, efficient answers: string and matrix problems, frequency counting, bridge puzzle, product except self, large Fibonacci with DP, BST, OOP concepts, SQL vs NoSQL, and React hook dependency array."
---

# Giga Tech - Interview Questions and Answers

## Written Round

### 1. Reverse the Order of Words (Leetcode)

**Question:** Given a sentence, reverse the order of words.

**Efficient Answer:**
- Trim leading/trailing spaces.
- Split by spaces.
- Ignore extra empty tokens.
- Reverse word order and join with a single space.

**Time Complexity:** O(n)
**Space Complexity:** O(n)

Example:
- Input: `"  the sky   is blue  "`
- Output: `"blue is sky the"`

---

### 2. Transpose Matrix (Rows -> Columns)

**Question:** Convert rows to columns and columns to rows.

**Answer:**
For a matrix of size `m x n`, create a new matrix of size `n x m` and set:

`transposed[j][i] = matrix[i][j]`

Example:
- Input:
  `[[1,2,3], [4,5,6]]`
- Output:
  `[[1,4], [2,5], [3,6]]`

**Time Complexity:** O(mn)
**Space Complexity:** O(mn)

---

### 3. Count Character Frequencies Efficiently (Without Map)

**Question:** Count character frequencies and output like `a3b2cd5` efficiently, without map (vector/array allowed).

**Answer:**
Use a fixed-size frequency array (e.g., size 256 for ASCII):

1. Initialize `freq[256] = {0}`.
2. Traverse string once and increment `freq[(unsigned char)ch]`.
3. Build output by iterating over all characters in desired order.
4. Append character and count only when count > 1; if count == 1, append just character.

This avoids hash-map overhead and is very fast for fixed character sets.

**Time Complexity:** O(n + K), where `K=256` for ASCII
**Space Complexity:** O(K)

Example:
- Input: `"aaabbcddddd"`
- Output: `"a3b2cd5"`

---

### 4. Bridge and Torch Puzzle (No Code)

**Question:** Four men need 1, 2, 5, and 10 minutes respectively. Only two can cross at once, and they need the torch. What is the minimum total time?

**Optimal Answer:** 17 minutes

Steps:
1. `1` and `2` cross -> 2 minutes
2. `1` returns -> 1 minute (total 3)
3. `5` and `10` cross -> 10 minutes (total 13)
4. `2` returns -> 2 minutes (total 15)
5. `1` and `2` cross -> 2 minutes (total 17)

Why optimal:
- The two slowest (`5`, `10`) should cross together once.
- The fastest people (`1`, `2`) are used to shuttle the torch efficiently.

---

### 5. Product of Array Except Self (Leetcode)

**Question:** Return an array where each index contains product of all elements except itself, without division.

**Efficient Answer:**
Use prefix and suffix products:

1. `res[i]` stores product of all elements to the left.
2. Traverse from right with a `suffix` variable and multiply into `res[i]`.

This gives O(n) time and O(1) extra space (excluding output array).

Example:
- Input: `[1,2,3,4]`
- Output: `[24,12,8,6]`

**Time Complexity:** O(n)
**Space Complexity:** O(1) extra

---

### 6. nth Fibonacci for Very Large n (DP)

**Question:** Find the nth Fibonacci number using DP when n can be very large.

**Answer:**
Use iterative DP with two variables (space-optimized):

- `f(0)=0`, `f(1)=1`
- For `i=2..n`: `curr = prev1 + prev2`

This avoids recursion overhead and stack issues.

For very large `n` where value overflows 64-bit:
- Use modulo arithmetic (e.g., `1e9+7`) if requested.
- Or use BigInteger / big number library.

**Time Complexity:** O(n)
**Space Complexity:** O(1)

Note: If interviewer pushes for faster-than-O(n), mention matrix exponentiation / fast doubling in O(log n).

---

## Viva Round

### 1. Explain BST with an Example Tree

**Answer:**
A Binary Search Tree (BST) is a binary tree where:
- Left subtree values are smaller than node value.
- Right subtree values are greater than node value.
- This property holds for every node.

Example (insert: 8, 3, 10, 1, 6, 14, 4, 7, 13):

```text
        8
      /   \
     3     10
    / \      \
   1   6      14
      / \    /
     4   7  13
```

In-order traversal of BST gives sorted order: `1, 3, 4, 6, 7, 8, 10, 13, 14`

---

### 2. Method Overloading vs Overriding

**Overloading:**
- Same method name, different parameter list.
- Happens in same class.
- Compile-time polymorphism.

**Overriding:**
- Child class provides new implementation of parent method with same signature.
- Runtime polymorphism.

Example:
- Overloading: `sum(int a, int b)` and `sum(int a, int b, int c)`
- Overriding: `Animal.sound()` overridden by `Dog.sound()`

---

### 3. 8 Balls and a Scale; One Ball Has Different Weight

**Question:** Minimum number of weighings to identify the odd ball (heavier or lighter unknown).

**Answer:** 2 weighings

Reasoning:
- Each weighing on balance scale has 3 outcomes: left heavy, right heavy, equal.
- With 2 weighings you get `3^2 = 9` outcomes.
- Need to distinguish 8 possibilities, so 2 weighings are sufficient.

Strategy outline:
- Weigh 3 vs 3.
- Based on result, narrow candidates.
- Second weighing identifies exact odd ball.

---

### 4. SQL vs NoSQL

**SQL (Relational):**
- Structured schema (tables, rows, columns)
- ACID transactions
- Strong consistency
- Great for complex joins and relational integrity

**NoSQL (Non-relational):**
- Flexible schema (document/key-value/column/graph)
- High horizontal scalability
- Often optimized for large distributed workloads
- Good for rapidly changing or semi-structured data

Use SQL when consistency and relations are critical.
Use NoSQL when scale, flexibility, and high throughput are primary.

---

### 5. Hook Dependency Array (React)

**Answer:**
In `useEffect`, dependency array controls when effect runs.

- `useEffect(fn)` -> runs after every render.
- `useEffect(fn, [])` -> runs once after initial mount.
- `useEffect(fn, [a, b])` -> runs when `a` or `b` changes.

Why important:
- Missing dependencies can cause stale values and bugs.
- Extra dependencies can cause unnecessary re-runs.

Best practice:
- Include all external values used inside effect.
- Memoize callbacks/objects with `useCallback` / `useMemo` when needed.

Example:

```tsx
useEffect(() => {
  fetchUser(userId);
}, [userId]);
```

This refetches only when `userId` changes.
