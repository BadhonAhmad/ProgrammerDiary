---
title: "FastAPI Background Tasks"
date: "2026-04-21"
tags: ["python", "fastapi", "background-tasks", "async", "performance"]
excerpt: "Learn how to run tasks after returning a response — sending emails, processing files, updating analytics — without making the user wait."
---

# FastAPI Background Tasks

User signs up. Your API creates the account (50ms) and sends a welcome email (2s). The user waits 2 seconds for a response. The email doesn't need to be sent before you respond — just eventually. Background tasks let you return the response immediately and handle the email afterward.

## What are Background Tasks?

**Background tasks** run after the response is sent to the client. FastAPI handles the execution — you just declare what should run in the background.

```python
from fastapi import BackgroundTasks

def send_welcome_email(email: str):
    # This takes 2 seconds — but user doesn't wait
    smtp.send(to=email, subject="Welcome!")

@router.post("/users", status_code=201)
def create_user(user: UserCreate, bg: BackgroundTasks):
    new_user = save_user(user)
    bg.add_task(send_welcome_email, email=new_user.email)
    return new_user  # Returns immediately, email sent in background
```

## Why Does It Matter?

❌ **Problem:** Your signup endpoint creates the user (50ms), sends a welcome email (2s), updates analytics (500ms), and enrolls in the onboarding sequence (300ms). Total response time: 3 seconds. The user thinks your app is slow.

✅ **Solution:** Return the response in 50ms. Everything else runs in the background. The user gets instant feedback, and the emails, analytics, and onboarding happen shortly after.

## How It Works

```text
1. Request arrives at endpoint
2. Endpoint adds tasks to BackgroundTasks
3. Endpoint returns response → sent to client immediately
4. FastAPI runs background tasks after response is sent
5. If background task raises exception → logged, not shown to client

Important: Background tasks run in the same process.
For heavy/long tasks, use Celery or ARQ instead.
```

## Multiple Background Tasks

```python
def send_email(email: str, subject: str, body: str): ...
def update_analytics(event: str): ...
def enqueue_onboarding(user_id: int): ...

@router.post("/users", status_code=201)
def create_user(user: UserCreate, bg: BackgroundTasks):
    new_user = save_user(user)

    bg.add_task(send_email, email=new_user.email,
                subject="Welcome!", body="Thanks for signing up")
    bg.add_task(update_analytics, event="user_created")
    bg.add_task(enqueue_onboarding, user_id=new_user.id)

    return new_user
```

## Background Tasks with Dependencies

```python
def process_file(file_id: str, db: Session):
    file = db.query(File).get(file_id)
    result = heavy_processing(file.content)
    file.status = "processed"
    file.result = result
    db.commit()

@router.post("/upload")
def upload_file(file: UploadFile, bg: BackgroundTasks, db: Session = Depends(get_db)):
    saved = save_file(file)
    bg.add_task(process_file, file_id=saved.id, db=db)
    return {"id": saved.id, "status": "processing"}
```

## When to Use Background Tasks vs Task Queue

```text
Use BackgroundTasks when:
  - Task takes seconds, not minutes
  - Task failure is acceptable (won't be retried)
  - Low volume (a few per request)
  - Simple use case

Use Celery / ARQ / Dramatiq when:
  - Task takes minutes or hours
  - Task must be retried on failure
  - High volume (thousands per minute)
  - Need task status tracking
  - Need scheduled/recurring tasks
  - Need task prioritization
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **BackgroundTasks** | Run functions after the response is sent |
| **`bg.add_task(func, args)`** | Add a function to run in background |
| **Response first** | Client gets response immediately, tasks run after |
| **Same process** | Runs in the same server process (not a worker) |
| **Error handling** | Task exceptions logged, not shown to client |
| **Light tasks** | Good for emails, analytics, notifications |
| **Heavy tasks** | Use Celery/ARQ for long-running, retryable tasks |

**Background tasks are the low-effort way to keep responses fast — delegate slow work to after the response, and the user never waits for something they don't need to see.**
