---
title: "Craftsmen (Software Company) - Interview Experience"
date: "2026-03-17"
tags: ["interviews", "craftsmen", "viva", "hiring", "software-engineering"]
excerpt: "Complete interview questions and answers from Craftsmen Software Company including online test, written exam with technical questions, system design scenarios, puzzles, and soft skills assessment."
---

# Craftsmen (Software Company) - Interview Experience

## Interview Structure

**First Step:** Online Test (AI was allowed)

**Second Step:** Written Exam (Multiple Sections)

---

## Question 1: Thread vs Process

### Question Explanation

This question tests your understanding of fundamental operating systems concepts. It evaluates whether you understand the differences between two core concurrency primitives and when to apply each in real-world applications.

### Answer

A **process** is an independent running program with its own isolated memory space, file descriptors, and system resources. Each process has its own heap, stack, and data segments.

A **thread** is a lightweight execution unit within a process. Multiple threads in the same process share the same memory address space, file descriptors, and other resources, but each thread maintains its own stack and program counter.

### Key Differences

| Aspect | Process | Thread |
|--------|---------|--------|
| **Memory Isolation** | Completely isolated | Shared memory space |
| **Creation Cost** | High (time and memory) | Low (minimal overhead) |
| **Context Switching** | Expensive | Fast and efficient |
| **IPC (Inter-communication)** | Complex (pipes, sockets, message queues) | Simple (shared variables, but needs synchronization) |
| **Safety** | Crash in one process doesn't affect others | Crash in one thread can crash entire process |
| **Synchronization** | Less critical (OS handles isolation) | Critical (must use locks, semaphores, mutexes) |

### When to Use

- **Use processes** for: Long-running independent services, maximum fault isolation, security boundaries, running different programs
- **Use threads** for: Concurrent tasks within the same application, shared data processing, I/O multiplexing, web servers handling multiple clients

### Example in Context

A web server typically spawns one thread per client connection (not a process) because threads are lightweight and share the server's data structures efficiently.

---

## Question 2: Leetcode Problem — Merge Intervals

### Question Explanation

This is a classic algorithm problem that tests your ability to solve medium-level coding challenges. It evaluates problem-solving approach, code clarity, and algorithm efficiency.

### Problem Statement

Given an array of intervals where each interval is `[start, end]`, merge all overlapping intervals and return an array of the merged intervals in any order.

**Example:**
- Input: `[[1,3],[2,6],[8,10],[15,18]]`
- Output: `[[1,6],[8,10],[15,18]]`

### Solution with Explanation

```typescript
function mergeIntervals(intervals: number[][]): number[][] {
  // Edge case: if no intervals, return empty array
  if (intervals.length <= 1) {
    return intervals;
  }

  // Step 1: Sort intervals by start time
  // Time Complexity: O(n log n)
  intervals.sort((a, b) => a[0] - b[0]);

  // Step 2: Initialize result with first interval
  const merged: number[][] = [intervals[0]];

  // Step 3: Iterate through remaining intervals
  // Time Complexity: O(n)
  for (let i = 1; i < intervals.length; i++) {
    const currentInterval = intervals[i];
    const lastMergedInterval = merged[merged.length - 1];

    // If current interval overlaps with last merged interval, merge them
    if (currentInterval[0] <= lastMergedInterval[1]) {
      // Extend the end of the last merged interval
      lastMergedInterval[1] = Math.max(
        lastMergedInterval[1],
        currentInterval[1]
      );
    } else {
      // No overlap, add current interval to result
      merged.push(currentInterval);
    }
  }

  return merged;
}
```

### Time & Space Complexity

- **Time:** O(n log n) — dominated by sorting
- **Space:** O(1) or O(n) depending on whether sorting is in-place

### Key Insight

Always sort first, then use a greedy approach to merge overlapping intervals by checking if the current interval's start is within the last merged interval's range.

---

## Question 3: Scenario-Based Questions (Pseudocode)

### Scenario 3.1: Service Design for High Request Volume

#### Question Explanation

This scenario evaluates your system design skills, understanding of scalability patterns, and ability to think through real-world constraints when users are experiencing performance issues.

#### Scenario

You are designing a service where users are experiencing performance degradation because requests are not being processed properly and users are getting bored due to slow response times. You need to handle a significantly larger number of concurrent users. What design decisions would you take? (Write pseudocode)

#### Answer - System Architecture & Design

```pseudocode
// Strategy 1: Implement Request Queue and Worker Pool
class ServiceScaler {
  private requestQueue = new PriorityQueue()
  private workerPool = new ThreadPool(maxWorkers: 100)
  private cache = new DistributedCache()
  
  function handleRequest(userId, request) {
    // Check cache first (avoid redundant processing)
    if (cache.has(request.key)) {
      return cache.get(request.key)
    }
    
    // Add request to queue with priority
    requestQueue.enqueue(request, priority: request.isPriority)
    
    return workerPool.assignWork({
      task: processRequest,
      data: request,
      timeout: 5000
    })
  }
}

// Strategy 2: Implement Circuit Breaker Pattern
class CircuitBreaker {
  state = "CLOSED"  // CLOSED, OPEN, or HALF_OPEN
  failureCount = 0
  threshold = 5
  
  function executeRequest(request) {
    if (state == "OPEN") {
      return failFast(request, "Service temporarily unavailable")
    }
    
    try {
      result = performRequest(request)
      onSuccess()
      return result
    } catch (error) {
      failureCount++
      if (failureCount >= threshold) {
        state = "OPEN"  // Stop sending requests
        scheduleHalfOpenReset(30 seconds)
      }
      throw error
    }
  }
}

// Strategy 3: Rate Limiting with Token Bucket
class RateLimiter {
  tokens = capacity
  capacity = 1000
  refillRate = 100  // tokens per second
  
  function allowRequest(userId) {
    currentTokens = tokens + (timeSinceLastRefill * refillRate)
    currentTokens = min(currentTokens, capacity)
    
    if (currentTokens >= 1) {
      tokens = currentTokens - 1
      return true
    }
    return false
  }
}

// Strategy 4: Asynchronous Processing
class AsyncService {
  function submitTask(userId, heavyTask) {
    // Immediately return a job ID
    jobId = generateUniqueId()
    
    // Process in background
    queue.enqueue({
      jobId: jobId,
      task: heavyTask,
      userId: userId
    })
    
    return { status: "QUEUED", jobId: jobId }
  }
  
  function pollResult(jobId) {
    // User polls for result instead of waiting
    return cache.get("job_" + jobId)
  }
}
```

#### Key Design Decisions

1. **Request Queuing** — Smoothens load spikes
2. **Worker Pool** — Limits concurrent processing to system capacity
3. **Caching** — Serves frequently requested data instantly
4. **Circuit Breaker** — Prevents cascading failures
5. **Rate Limiting** — Controls request influx
6. **Asynchronous Processing** — Don't block on long operations

---

### Scenario 3.2: Cache and Microservices Architecture with Multiple Servers

#### Question Explanation

This evaluates your understanding of distributed systems, caching strategies, and microservices architecture when data is spread across multiple servers.

#### Scenario

Draw and explain a system diagram where cache and microservices are used to handle requests efficiently across several servers.

#### Answer - Architecture Diagram & Explanation

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUESTS                          │
└──────────────┬──────────────────────────────────────────────────┘
               │
       ┌───────▼───────┐
       │  API Gateway  │  (Load Balancer & Request Router)
       │  (Port 8080)  │
       └───────┬───────┘
               │
        ┌──────┴──────┬──────────┬──────────┐
        │             │          │          │
   ┌────▼───┐  ┌─────▼──┐  ┌───▼────┐  ┌──▼─────┐
   │ Service │  │Service │  │Service │  │Service │
   │    A    │  │   B    │  │   C    │  │   D    │
   │ (User)  │  │(Order) │  │(Payment)  │(Product)
   └────┬───┘  └─────┬──┘  └───┬────┘  └──┬─────┘
        │            │         │          │
        │    ┌───────┴────┬────┴──────┬──┴──────┐
        │    │            │           │         │
    ┌───▼────▼────────────▼───────┐  │         │
    │   Redis Cache Layer         │  │         │
    │  (In-Memory Data Store)     │  │         │
    │  • User Sessions            │  │         │
    │  • Hot Data (TTL: 1 hour)   │  │         │
    │  • Query Results            │  │         │
    └───────────┬──────────────────┘  │         │
                │                     │         │
        ┌───────▼─────────┐   ┌──────▼──┐  ┌──▼────┐
        │  PostgreSQL     │   │ MongoDB  │  │Redis  │
        │  Primary DB     │   │ Documents│  │Cache  │
        │ (User, Orders)  │   │(Products)   │Replica
        └─────────────────┘   └──────────┘  └───────┘
```

#### Architecture Explanation

**1. API Gateway Layer**
- Single entry point for all client requests
- Routes requests to appropriate microservices
- Handles authentication and rate limiting

**2. Microservices Layer**
- **Service A (User Service)**: Manages user profiles and authentication
- **Service B (Order Service)**: Handles order creation and management
- **Service C (Payment Service)**: Processes payments securely
- **Service D (Product Service)**: Manages product catalog

**3. Cache Layer (Redis)**
- **Purpose**: Reduce database load and improve response time
- **Data Cached**:
  - User sessions (TTL: 1 hour)
  - Frequently accessed products
  - Query results from expensive operations
- **Benefits**: 100x faster than database queries

**4. Database Layer**
- **PostgreSQL**: Relational data (users, orders, transactions)
- **MongoDB**: Document storage (product details, reviews)
- **Redis Replica**: Cache backup for disaster recovery

#### Request Flow Example (Get User Profile)

```pseudocode
1. Client → API Gateway (GET /api/users/123)

2. API Gateway → Check Redis Cache
   if (cache.exists("user:123")) {
     return cache.get("user:123")  // Cache Hit - O(1)
   }

3. Cache Miss → Service A queries PostgreSQL
   user = database.query("SELECT * FROM users WHERE id = 123")

4. Service A → Store in Redis (TTL: 1 hour)
   cache.set("user:123", user, ttl: 3600)

5. Service A → Return to API Gateway → Client

6. Next request for same user → Cache Hit (no DB query!)
```

#### Scaling Strategy

- **Horizontal Scaling**: Add more instances of each microservice
- **Cache Clustering**: Redis Cluster for distributed caching
- **Database Sharding**: Partition data across multiple database instances
- **Service Replication**: Multiple instances behind load balancer

---

## Question 4: Puzzle-Type Questions

### Puzzle 4.1: How Will You Take the Elephant in One Hand?

#### Question Explanation

This is a lateral thinking or riddle puzzle. It tests creativity, flexibility of thought, and whether you can think beyond obvious interpretations.

#### Answer

This is a trick question that requires thinking outside the box. The answer depends on the interpretation:

**Common Answers:**
1. **Literal Interpretation**: Take a picture or drawing of an elephant in your hand (a photo, painting, or toy elephant)
2. **Metaphorical Interpretation**: It's impossible with a live elephant, so the "answer" might be to question the premise
3. **Logical Interpretation**: Elephants are too large to physically hold in one hand, so the acceptable answer is to find a smaller representation

#### In Interview Context

The interviewer is likely evaluating:
- Your ability to think creatively
- How you handle ambiguous questions
- Whether you seek clarification before assuming
- Your sense of humor and communication style

#### Best Response During Interview

*"Could you clarify the question? The puzzle as stated seems impossible if we're talking about a real elephant. Are you asking about a toy elephant, a picture, or is this a lateral thinking puzzle with a metaphorical answer?"*

This shows you think critically rather than just guessing.

---

### Puzzle 4.2: You Had Three Apples, You Took Away Two Apples—How Many Do You Have?

#### Question Explanation

This is another classic riddle that tests careful listening and literal interpretation versus assumptions.

#### Answer

You have **two apples**.

#### Explanation

- You started with three apples
- You took away two apples
- Therefore: 3 - 2 = 2 apples remaining

#### Why This Matters

This puzzle tests whether you:
- Listen carefully to the exact wording
- Don't make assumptions
- Can do basic math under pressure
- Don't overthink simple problems

#### Common Mistakes Candidates Make

- Saying "three" (not reading carefully)
- Saying "one" (misunderstanding the arithmetic)
- Overthinking and looking for a trick when there isn't one

#### Interviewer Intent

This is usually asked to:
- See if you stay calm under seemingly odd questions
- Verify basic reasoning during stress
- Understand how you handle ambiguous situations

---

## Question 5: Soft Skills and Management Capability

### Scenario 5.1: Tour Planning with Conflicting Preferences

#### Question Explanation

This scenario evaluates your people management skills, decision-making under conflicting interests, and ability to balance team satisfaction with organizational needs.

#### Scenario

Suppose you are the head of your company and planning a tour in Nepal that your office went to last year. However, some colleagues are not willing to go to the same country this time. How will you manage this situation?

#### Answer - Management Approach

```
Step 1: Understand the Problem
├─ Identify why some colleagues don't want to repeat Nepal
│  ├─ They were disappointed last year
│  ├─ They want to explore new destinations
│  ├─ Budget or time constraints
│  └─ Personal/health reasons
└─ Gather feedback and concerns

Step 2: Consider Possible Solutions
├─ Solution A: Change destination to a new country
│  ├─ Pros: Everyone gets a fresh experience
│  └─ Cons: May disappoint those who want Nepal redux
│
├─ Solution B: Split the team
│  ├─ Pros: Accommodate different preferences
│  └─ Cons: Divides team unity
│
├─ Solution C: Go to Nepal but improve the experience
│  ├─ Pros: Keep the original plan, address concerns
│  └─ Cons: May not satisfy those really against Nepal
│
└─ Solution D: Hybrid approach (Recommended)
   └─ Same destination + new activities + better planning

Step 3: Recommended Action Plan

A. Conduct 1-on-1 Discussions
   "What would make a team tour more enjoyable for you?
    What wasn't working last time?"

B. Make Data-Driven Decision
   - Survey all team members
   - Analyze feedback
   - Propose options with pros/cons

C. Democratic Vote with Consultation
   "Here are three options. Let's decide together.
    Option 1: Nepal with new activities
    Option 2: Different country (e.g., Thailand)
    Option 3: Team votes on destination"

D. Enhance Experience if Going to Nepal
   - Choose different accommodation
   - Plan different activities
   - Involve team in planning
   - Set clear expectations upfront
   - Allow time for personal exploration

E. Communicate Final Decision
   "We've decided on [destination]. Here's how we
    addressed your feedback: [specific improvements]"

Step 4: Post-Decision Follow-up
   ├─ Share detailed itinerary
   ├─ Address individual concerns
   ├─ Set expectations clearly
   └─ Stay flexible to minor adjustments
```

#### Human Management Principles Applied

- **Listen First**: Understand concerns before deciding
- **Transparency**: Explain why you chose what you chose
- **Inclusion**: Make people feel heard even if not every preference is met
- **Flexibility**: Adapt within reasonable bounds
- **Clear Communication**: No surprises or hidden decisions

#### In Interview Context

Show that you:
- Care about team satisfaction and morale
- Make data-driven decisions
- Communicate transparently
- Can handle disagreement professionally
- Find compromise solutions

---

### Scenario 5.2: QA Bug Report — Writing a Slack Message to Team

#### Question Explanation

This scenario evaluates your communication skills, ability to provide constructive feedback, technical understanding of bugs, and team management without blame.

#### Scenario

QA has submitted a bug report indicating that several bugs were introduced because some colleagues mistakenly forgot to handle edge cases. You need to write a Slack message to your team mentioning the team lead about the bugs and proposed solutions.

#### Answer - Professional Slack Message

```
@Team Lead, team:

We received bug reports from QA involving edge case handling that I'd like to address collectively. 
Rather than pointing fingers, let's see this as an opportunity to strengthen our process.

📋 **Issues Identified:**
• Missing null/undefined checks in user input validation
• Array boundary conditions not handled (empty arrays causing crashes)
• Timezone handling inconsistencies in date calculations
• Missing error handling for API timeout scenarios

🎯 **Root Cause Analysis:**
These are common oversights during high-velocity development. Edge cases are easy to miss when 
focused on the happy path. This is actually a sign we need better processes, not worse developers.

✅ **Proposed Solutions:**

1. **Code Review Focus** (@Team Lead)
   - Edge case checklist during PR reviews
   - Require explicit handling of error scenarios

2. **Test Coverage Improvement**
   - Mandatory tests for boundary conditions
   - Add test cases template: (null input, empty collection, max/min values)

3. **Pair Programming Sessions**
   - Quick 15-min pairing on tricky edge case scenarios
   - Knowledge sharing on common pitfalls

4. **Documentation** 
   - Update coding standards with "edge case patterns"
   - Share examples of properly handled edge cases

📌 **Immediate Action Items:**
• Release a patch for current bugs (ETA: today)
• I'll create a brief edge case checklist by tomorrow
• Team lead: We'll discuss QA collaboration in standup

This is normal in development. What matters is learning quickly. Let's use this to level up 
our code quality together. No one's getting blamed—we're all improving.

Questions? Let's discuss in today's standup.
```

#### Key Principles Demonstrated

| Principle | Implementation |
|-----------|-----------------|
| **Professional Tone** | No blame, focused on solutions |
| **Clarity** | Specific issues, not vague complaints |
| **Constructive** | Multiple solutions proposed, not just problems |
| **Inclusive** | "We" language, not "you guys messed up" |
| **Action-Oriented** | Clear next steps with owners and timelines |
| **Growth Mindset** | Frame as learning opportunity |
| **Transparent** | Honest assessment without hidden resentment |
| **Respectful** | Valued each person's contribution |

#### Why This Approach Works

- ✅ Fixes the problems without destroying morale
- ✅ Shows leadership maturity
- ✅ Prevents team defensiveness
- ✅ Creates improvement systems, not just blame
- ✅ Maintains psychological safety
- ✅ Encourages similar transparency from others

#### What NOT to Do

- ❌ "Who wrote this code?!" - Creates fear
- ❌ Harsh tone - Destroys trust
- ❌ Only problems, no solutions - Demoralizing
- ❌ Hidden frustration - Breeds resentment
- ❌ Taking full blame - Undermines leadership

#### In Interview Context

This response shows you:
- Communicate effectively across technical and non-technical issues
- Lead with empathy while maintaining standards
- Focus on systems improvement, not individual blame
- Have emotional intelligence
- Can give tough feedback professionally
