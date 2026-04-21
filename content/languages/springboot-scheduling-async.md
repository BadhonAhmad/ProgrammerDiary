---
title: "Spring Boot Scheduling & Async"
date: "2026-04-21"
tags: ["java", "springboot", "scheduling", "async", "background-tasks"]
excerpt: "Learn how to run tasks in the background and on a schedule in Spring Boot — from @Async methods to cron jobs and fixed-rate scheduling."
---

# Spring Boot Scheduling & Async

Your API sends a welcome email after signup. The email takes 3 seconds. The user waits 3 seconds for a response. The email doesn't need to be sent before you respond — just eventually. `@Async` makes it run in the background. `@Scheduled` runs tasks on a timer.

## @Async — Background Execution

### Setup
```java
@SpringBootApplication
@EnableAsync
public class MyApp { ... }
```

### Usage
```java
@Service
public class EmailService {

    @Async
    public void sendWelcomeEmail(String email, String name) {
        // This runs in a separate thread
        // Caller returns immediately
        Thread.sleep(3000);  // Simulate slow email
        emailClient.send(to=email, subject="Welcome " + name);
    }
}
```

```java
@Service
public class UserService {

    private final EmailService emailService;

    public UserResponse createUser(UserRequest request) {
        User user = saveUser(request);
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        // Returns immediately — email sent in background
        return mapToResponse(user);
    }
}
```

### Async with Return Value
```java
@Async
public CompletableFuture<Report> generateReport(Long userId) {
    Report report = heavyComputation(userId);
    return CompletableFuture.completedFuture(report);
}

// Caller:
CompletableFuture<Report> future = reportService.generateReport(42);
// Do other work...
Report report = future.get();  // Block when you need the result
```

## @Scheduled — Timer-Based Tasks

### Setup
```java
@SpringBootApplication
@EnableScheduling
public class MyApp { ... }
```

### Fixed Rate
```java
@Component
public class ScheduledTasks {

    // Run every 60 seconds, regardless of how long it takes
    @Scheduled(fixedRate = 60_000)
    public void syncExternalData() {
        externalApi.fetchUpdates();
    }

    // Run 60 seconds after the PREVIOUS execution finishes
    @Scheduled(fixedDelay = 60_000)
    public void cleanupTempFiles() {
        fileService.deleteOldTempFiles();
    }

    // Run with an initial delay of 30 seconds, then every 5 minutes
    @Scheduled(initialDelay = 30_000, fixedRate = 300_000)
    public void warmCache() {
        cacheService.preloadFrequentData();
    }
}
```

### Cron Expressions
```java
// Run at 2 AM every day
@Scheduled(cron = "0 0 2 * * *")
public void generateDailyReport() {
    reportService.generateReportForYesterday();
}

// Run every Monday at 9 AM
@Scheduled(cron = "0 0 9 * * MON")
public void weeklyCleanup() {
    databaseService.archiveOldRecords();
}

// Run every 15 minutes during business hours (9-5)
@Scheduled(cron = "0 */15 9-17 * * MON-FRI")
public void businessHoursSync() {
    syncService.syncWithERP();
}
```

```text
Cron format: second minute hour day month weekday

  0 0 2 * * *        → Every day at 2:00 AM
  0 */5 * * * *      → Every 5 minutes
  0 0 9 * * MON      → Every Monday at 9 AM
  0 0 0 1 * *        → First day of every month at midnight
  */30 * * * * *     → Every 30 seconds
```

## When to Use What

```text
@Async:
  - One-off background work triggered by a request
  - Send email after signup, process uploaded file
  - Doesn't repeat — runs once per trigger

@Scheduled:
  - Recurring tasks on a timer
  - Daily reports, hourly cleanup, 15-minute syncs
  - Runs automatically — no trigger needed

External task queue (RabbitMQ/Kafka):
  - Heavy, long-running tasks
  - Tasks that must survive application restarts
  - Tasks that need retry logic
  - High-volume background processing
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **`@Async`** | Run method in a separate thread — caller returns immediately |
| **`@EnableAsync`** | Activate async method processing |
| **`@Scheduled`** | Run method on a timer — fixed rate, delay, or cron |
| **`@EnableScheduling`** | Activate scheduled task processing |
| **`fixedRate`** | Run every N ms regardless of execution time |
| **`fixedDelay`** | Run N ms after previous execution completes |
| **`cron`** | Unix cron expression for precise scheduling |
| **`CompletableFuture`** | Async method return type for future results |

**`@Async` for fire-and-forget, `@Scheduled` for recurring tasks — two annotations that handle background work without reaching for a message queue.**
