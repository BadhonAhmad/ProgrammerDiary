---
title: "Big O Notation Explained with Real Examples"
date: "2026-03-01"
tags: ["algorithms", "data-structures", "complexity"]
excerpt: "A practical guide to Big O notation. Understand time and space complexity through real-world code examples that you'll encounter in interviews and daily work."
---

# Big O Notation Explained

Big O notation describes how an algorithm's performance scales as input size grows. It's the language we use to talk about efficiency.

## Common Time Complexities

### O(1) - Constant Time

```typescript
function getFirst(arr: number[]): number {
  return arr[0]; // Always one operation, regardless of array size
}
```

### O(log n) - Logarithmic

```typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}
```

### O(n) - Linear

```typescript
function findMax(arr: number[]): number {
  let max = arr[0];
  for (const num of arr) {
    if (num > max) max = num;
  }
  return max;
}
```

### O(n log n) - Linearithmic

Most efficient comparison-based sorting algorithms:
- Merge Sort
- Quick Sort (average case)
- Heap Sort

### O(n²) - Quadratic

```typescript
function bubbleSort(arr: number[]): number[] {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}
```

## Practical Comparison

| n | O(1) | O(log n) | O(n) | O(n log n) | O(n²) |
|---|------|----------|------|------------|-------|
| 10 | 1 | 3 | 10 | 33 | 100 |
| 1,000 | 1 | 10 | 1,000 | 10,000 | 1,000,000 |
| 1,000,000 | 1 | 20 | 1,000,000 | 20,000,000 | 10¹² |

## Space Complexity

Don't forget about memory usage:

```typescript
// O(n) space - creates new array
function double(arr: number[]): number[] {
  return arr.map(x => x * 2);
}

// O(1) space - modifies in place
function doubleInPlace(arr: number[]): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= 2;
  }
}
```

## Key Rules

1. **Drop constants**: O(2n) → O(n)
2. **Drop lower-order terms**: O(n² + n) → O(n²)
3. **Consider worst case** unless stated otherwise
4. **Different inputs = different variables**: O(a + b), not O(n)
