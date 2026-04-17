---
title: "gRPC: When REST Is Too Slow and JSON Is Too Fat"
date: "2026-04-17"
tags: ["backend", "gRPC", "Protobuf", "microservices", "API", "performance"]
excerpt: "Learn how gRPC uses Protocol Buffers and HTTP/2 to deliver 10x faster communication between services — and why it's the backbone of modern microservice architectures."
---

# gRPC: When REST Is Too Slow and JSON Is Too Fat

Your microservices talk to each other over REST. Each call serializes to JSON, sends over HTTP/1.1 with 1KB of headers, and deserializes on the other end. At 50,000 calls per second, that's 50MB of JSON per second. gRPC cuts this to 5MB and makes it 10x faster.

## What is gRPC?

**gRPC** (gRPC Remote Procedure Call) is Google's high-performance RPC framework. It uses **Protocol Buffers** for serialization and **HTTP/2** for transport, making service-to-service communication dramatically faster than REST + JSON.

With gRPC, calling a remote service looks like calling a local function:

```text
// Instead of HTTP call:
const response = await fetch("/api/users/42");
const user = await response.json();

// gRPC — looks like a local function call:
const user = await userService.getUser({ id: 42 });
```

## Why Does It Matter?

❌ **Problem:** Your order service calls the payment service, inventory service, notification service, and analytics service — all over REST + JSON. Each call takes 20-50ms just for serialization and network overhead. A single checkout request fans out to 5 HTTP calls, taking 200ms before any business logic runs. At scale, JSON serialization becomes a measurable CPU bottleneck.

✅ **Solution:** gRPC uses binary Protobuf encoding (3-10x smaller than JSON) and HTTP/2 multiplexing (multiple calls on one connection). Serialization is nearly free, and the typed schema catches errors at compile time instead of runtime.

## gRPC vs REST

| Factor | REST + JSON | gRPC + Protobuf |
|---|---|---|
| **Format** | Text (JSON) | Binary (Protobuf) |
| **Size** | Larger | 3-10x smaller |
| **Speed** | Slower serialization | 10-100x faster |
| **Schema** | None (OpenAPI optional) | Strict .proto files |
| **Streaming** | ❌ No | ✅ Bidirectional |
| **Code generation** | Manual or OpenAPI tools | Automatic from .proto |
| **Browser support** | ✅ Native | ❌ Requires gRPC-Web |
| **Human readable** | ✅ Yes | ❌ Binary |
| **Best for** | Public APIs, browsers | Service-to-service |

## How gRPC Works

### Step 1: Define the Service (Proto File)

```text
// user.proto
syntax = "proto3";

package users;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);
  rpc CreateUser (CreateUserRequest) returns (User);
}

message GetUserRequest {
  int32 id = 1;
}

message ListUsersRequest {
  int32 limit = 1;
  int32 offset = 2;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message User {
  int32 id = 1;
  string name = 2;
  string email = 3;
  bool active = 4;
}
```

### Step 2: Generate Code

```text
# Install protoc compiler
# Generate Node.js code from .proto file
npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:./generated \
  --grpc_out=grpc_js:./generated \
  user.proto
```

This generates client stubs and server interfaces — no manual serialization code.

### Step 3: Implement the Server

```text
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const packageDef = protoLoader.loadSync("user.proto");
const userProto = grpc.loadPackageDefinition(packageDef).users;

const server = new grpc.Server();

server.addService(userProto.UserService, {
  GetUser: async (call, callback) => {
    const user = await db.user.findById(call.request.id);
    callback(null, { id: user.id, name: user.name, email: user.email, active: user.isActive });
  },

  ListUsers: async (call) => {
    const users = await db.user.findAll();
    for (const user of users) {
      call.write({ id: user.id, name: user.name, email: user.email });
    }
    call.end();
  },

  CreateUser: async (call, callback) => {
    const user = await db.user.create(call.request);
    callback(null, { id: user.id, name: user.name, email: user.email, active: true });
  },
});

server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
  server.start();
});
```

### Step 4: Call from Client

```text
const client = new userProto.UserService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

// Unary call — like a normal function
client.GetUser({ id: 42 }, (err, user) => {
  console.log(user);  // { id: 42, name: "Alice", email: "alice@dev.io" }
});

// Server streaming — receive multiple responses
const stream = client.ListUsers({ limit: 100 });
stream.on("data", (user) => console.log(user));
stream.on("end", () => console.log("Done"));
```

## gRPC Communication Patterns

| Pattern | Description | Use Case |
|---|---|---|
| **Unary** | Single request → single response | Get user, create order |
| **Server streaming** | Single request → stream of responses | List users, watch logs |
| **Client streaming** | Stream of requests → single response | Upload file in chunks |
| **Bidirectional streaming** | Stream ↔ Stream | Chat, real-time gaming |

REST can only do unary. gRPC handles all four patterns natively.

## gRPC in a Microservices Architecture

```text
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ REST
┌──────▼──────┐
│ API Gateway │
└──────┬──────┘
       │ gRPC
  ┌────┼────┐
  │    │    │
┌─▼──┐┌▼──┐┌▼──────┐
│User││Or-││Inven- │
│Srvc││der││tory   │
└────┘└───┘└───────┘

External traffic → REST (browser-friendly)
Internal traffic → gRPC (fast, typed, streaming)
```

The API gateway speaks REST to clients and gRPC to internal services — getting the best of both worlds.

## gRPC Strengths and Weaknesses

### ✅ Strengths
- **Blazing fast** — binary encoding + HTTP/2
- **Type-safe** — Protobuf schema generates typed code
- **Streaming** — Bidirectional, not just request-response
- **Polyglot** — Generate code for 11+ languages from same .proto
- **Backward compatible** — Add new fields without breaking old clients

### ❌ Weaknesses
- **No browser support** — Need gRPC-Web proxy or REST gateway
- **Not human-readable** — Can't curl a gRPC endpoint
- **Steep learning curve** — Protobuf, code generation, HTTP/2 concepts
- **Limited ecosystem** — Fewer tools than REST for debugging/testing
- **Load balancer support** — Many LBs don't support HTTP/2 well (improving)

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **gRPC** | Google's RPC framework using Protobuf + HTTP/2 |
| **Protobuf** | Binary serialization — tiny, fast, schema-enforced |
| **.proto file** | Service and message definitions — generates code |
| **Unary RPC** | Single request → single response (like REST) |
| **Streaming RPC** | Server, client, or bidirectional streaming |
| **Code generation** | Auto-generates typed client and server code |
| **HTTP/2** | Multiplexed connections — multiple calls on one TCP connection |
| **Not for browsers** | Use REST for external, gRPC for internal service-to-service |
| **Schema evolution** | Add fields without breaking existing clients |

**REST speaks to the world. gRPC speaks to your own services. Use both — REST at the edge, gRPC in the middle.**
