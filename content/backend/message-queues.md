---
title: "Message Queues: How Microservices Talk to Each Other"
date: "2026-04-17"
tags: ["backend", "message-queues", "RabbitMQ", "Kafka", "microservices", "architecture"]
excerpt: "Learn how message queues like RabbitMQ and Kafka decouple your services, handle failures gracefully, and keep your system running when parts of it go down."
---

# Message Queues: How Microservices Talk to Each Other

Service A needs to tell Service B that an order was placed. What if Service B is down? What if 10,000 orders come in at once? Without a message queue, you lose orders. With one, Service B processes them at its own pace — no matter what.

## What is a Message Queue?

A **message queue** is a system that accepts messages from producers, stores them reliably, and delivers them to consumers. It sits between services as an asynchronous communication layer.

Instead of Service A calling Service B directly (synchronous), Service A sends a message to the queue. Service B picks it up whenever it's ready.

```text
Synchronous (fragile):
  Service A ──HTTP call──> Service B
  If B is down → A fails → data lost

Asynchronous (resilient):
  Service A ──publish──> Message Queue ──consume──> Service B
  If B is down → messages wait in queue → B processes when it recovers
```

## Why Does It Matter?

❌ **Problem:** Your e-commerce app has an Order Service, Payment Service, Inventory Service, Email Service, and Analytics Service. When a customer places an order, the Order Service calls all the others via HTTP. If the Email Service is down, the order fails. If the Analytics Service is slow, the customer waits. If traffic spikes, all services must scale together. The whole system is only as reliable as its weakest service.

✅ **Solution:** A message queue decouples the services. The Order Service publishes an `order.created` message to the queue. Each service independently consumes and processes it. If Email is down, messages queue up — the order still goes through. If Analytics is slow, it processes at its own pace. Services can be deployed, restarted, and scaled independently.

## Core Concepts

### The Cast

```text
┌───────────┐     ┌──────────────────┐     ┌───────────┐
│ Producer  │────>│  Message Queue   │────>│ Consumer  │
│ (sender)  │     │  (broker)        │     │ (receiver)│
└───────────┘     └──────────────────┘     └───────────┘
```

| Role | What It Does |
|---|---|
| **Producer** | Creates and sends messages to the queue |
| **Consumer** | Receives and processes messages from the queue |
| **Broker** | The queue system itself (RabbitMQ, Kafka) |
| **Exchange** (RabbitMQ) | Routes messages to the right queues |
| **Topic** (Kafka) | Category/feed name where messages are published |
| **Partition** (Kafka) | Subdivision of a topic for parallel processing |

### Communication Patterns

#### Point-to-Point (Work Queue)

One message is processed by exactly one consumer.

```text
Producer → Queue → Consumer A ✓
                 → Consumer B (idle)

Use case: Processing orders, sending emails
```

#### Publish-Subscribe (Pub/Sub)

One message goes to all subscribers.

```text
Producer → Topic → Consumer A (email service) ✓
                → Consumer B (analytics) ✓
                → Consumer C (inventory) ✓

Use case: Event notifications, broadcasting
```

## RabbitMQ

**RabbitMQ** is a general-purpose message broker. It's the go-to choice for most backend applications.

### How RabbitMQ Works

```text
Producer → Exchange → Queue → Consumer

The Exchange routes messages:
  - Direct:    route by exact key
  - Topic:     route by pattern (order.* matches order.created, order.cancelled)
  - Fanout:    broadcast to all queues
  - Headers:   route by message headers
```

### Setting Up RabbitMQ with Node.js

```text
npm install amqplib
```

```text
// Producer — send a message
const amqp = require("amqplib");

async function publishOrder(order) {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const exchange = "orders";
  const routingKey = "order.created";

  await channel.assertExchange(exchange, "topic", { durable: true });

  channel.publish(
    exchange,
    routingKey,
    Buffer.from(JSON.stringify(order)),
    { persistent: true }  // Survive broker restart
  );

  console.log(`Published ${routingKey}:`, order.id);
}
```

```text
// Consumer — process messages
async function consumeOrders() {
  const connection = await amqp.connect("amqp://localhost");
  const channel = await connection.createChannel();

  const exchange = "orders";
  const queue = "email-service-orders";

  await channel.assertExchange(exchange, "topic", { durable: true });
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, "order.*");

  channel.consume(queue, async (msg) => {
    try {
      const order = JSON.parse(msg.content.toString());
      await sendOrderConfirmation(order);

      // Acknowledge — message was processed successfully
      channel.ack(msg);
    } catch (error) {
      // Reject and requeue (or send to dead letter queue)
      channel.nack(msg, false, false);
    }
  }, { noAck: false });
}
```

### Key RabbitMQ Features

- **Message acknowledgment:** Consumer must explicitly `ack` a message. If it crashes, the message goes back to the queue.
- **Durable queues:** Survive broker restarts (messages written to disk).
- **Dead letter exchanges:** Failed messages get routed for investigation.
- **Message TTL:** Auto-expire old messages.
- **Management UI:** Built-in dashboard at `http://localhost:15672`.

## Apache Kafka

**Kafka** is a distributed event streaming platform. It's designed for **high-throughput, real-time data streaming** at massive scale.

### How Kafka Works

```text
Producer → Topic (partitioned) → Consumer Group

Topics are split into partitions:
  topic "orders" has 3 partitions:
    Partition 0: order-1, order-4, order-7, ...
    Partition 1: order-2, order-5, order-8, ...
    Partition 2: order-3, order-6, order-9, ...

Each partition is an ordered, append-only log.
```

### Kafka vs RabbitMQ

| Factor | RabbitMQ | Kafka |
|---|---|---|
| **Designed for** | Message routing, work queues | Event streaming, log aggregation |
| **Message retention** | Deleted after acknowledged | Configurable retention (days/weeks) |
| **Throughput** | ~50K messages/sec | ~1M+ messages/sec |
| **Ordering** | Per queue | Per partition |
| **Replay** | No (consumed = gone) | Yes (read from any offset) |
| **Consumer model** | Competing consumers | Consumer groups |
| **Complexity** | Simpler | More complex to operate |
| **Best for** | Task queues, service communication | Event sourcing, analytics, stream processing |

### When to Use Which

```text
Choose RabbitMQ when:
  - Task queues (email, image processing)
  - Request-reply patterns
  - Complex routing logic (topic exchange, headers)
  - Small-to-medium scale (up to ~50K msg/sec)
  - You need message-level acknowledgment

Choose Kafka when:
  - Event streaming at high scale
  - Need to replay events (event sourcing)
  - Real-time analytics / data pipelines
  - Multiple consumers need the same events
  - Processing 100K+ messages/sec
```

## Message Delivery Guarantees

### At Most Once

Messages may be lost, but never duplicated.

```text
Producer sends → Broker receives → Consumer gets → Done
If consumer crashes before processing: message lost
```

Fastest, least reliable. Acceptable for analytics where occasional data loss is fine.

### At Least Once

Messages are never lost, but may be duplicated.

```text
Consumer processes → Acknowledges
If consumer crashes before ack: message is redelivered
```

Most common. Consumers must be **idempotent** (processing twice gives same result).

### Exactly Once

Messages are delivered once and only once.

Hardest to achieve. Requires transaction support. Both RabbitMQ and Kafka support it but with performance trade-offs.

## Designing with Message Queues

### Event-Driven Architecture

```text
Traditional:
  Order Service calls Payment Service, Email Service, Inventory Service
  (synchronous, coupled, fragile)

Event-Driven:
  Order Service publishes "order.created" event
  Payment Service listens and charges
  Email Service listens and sends confirmation
  Inventory Service listens and reserves stock
  (asynchronous, decoupled, resilient)
```

### Idempotent Consumers

Messages may be delivered more than once. Consumers must handle this safely.

```text
// Non-idempotent — dangerous
async function processOrder(order) {
  await chargeCreditCard(order.amount);  // May charge twice!
}

// Idempotent — safe
async function processOrder(order) {
  const existing = await db.findPayment(order.id);
  if (existing) return;  // Already processed

  await chargeCreditCard(order.amount);
  await db.savePayment({ orderId: order.id, amount: order.amount });
}
```

### Schema Design

Messages should be self-describing:

```text
{
  "eventId": "evt_abc123",        // Unique event ID
  "eventType": "order.created",   // What happened
  "timestamp": "2024-03-15T10:30:00Z",
  "version": "1.0",
  "data": {                        // The payload
    "orderId": "ord_456",
    "customerId": "cust_789",
    "total": 99.99,
    "items": [...]
  }
}
```

## Common Mistakes

### ❌ Using Queues for Everything

Not every communication needs a queue. Synchronous request-response (HTTP/gRPC) is fine for queries and real-time needs. Queues add complexity — use them where async genuinely helps.

### ❌ No Dead Letter Handling

Failed messages pile up silently. Always set up dead letter queues and monitor them.

### ❌ Unbounded Queue Growth

If consumers can't keep up, messages accumulate forever. Set max queue sizes and alerts.

### ❌ Ignoring Message Ordering

If order matters (process payment before sending receipt), ensure your queue preserves ordering. In Kafka, ordering is guaranteed per partition.

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Message queue** | Async communication layer between services |
| **Producer** | Sends messages to the queue |
| **Consumer** | Receives and processes messages |
| **RabbitMQ** | General-purpose broker — routing, work queues, acknowledgment |
| **Kafka** | Distributed event stream — high throughput, replay, retention |
| **Exchange** | RabbitMQ's message router |
| **Topic/Partition** | Kafka's category and parallelism unit |
| **At-least-once** | Messages never lost, may be duplicated — most common |
| **Idempotent consumer** | Safe to process same message twice |
| **Dead letter queue** | Failed messages for investigation |

**Synchronous calls couple services together. Message queues let each service succeed or fail independently.**
