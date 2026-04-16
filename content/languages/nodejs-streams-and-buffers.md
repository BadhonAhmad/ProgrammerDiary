---
title: "Node.js Streams & Buffers"
date: "2026-04-16"
tags: ["nodejs", "streams", "buffers", "performance", "memory"]
excerpt: "Understand Node.js streams and buffers — how to process large files and data efficiently without loading everything into memory."
---

# Node.js Streams & Buffers

## What is it?

### Buffer
A **Buffer** is a fixed-size chunk of raw binary data allocated outside the V8 JavaScript engine. JavaScript originally had no way to handle binary data — Buffers fill that gap in Node.js.

### Stream
A **Stream** is an abstract interface for working with streaming data — processing data piece by piece (chunk by chunk) without loading the entire dataset into memory. Think of it like watching a YouTube video: you don't download the whole video first, you stream it in chunks.

## How it Works

### Buffers

```javascript
// Creating buffers
const buf1 = Buffer.alloc(10);          // 10 bytes, filled with zeros
const buf2 = Buffer.allocUnsafe(10);    // 10 bytes, uninitialized (faster, may contain old data)
const buf3 = Buffer.from("Hello");      // From string
const buf4 = Buffer.from([1, 2, 3]);   // From array
const buf5 = Buffer.from("Hello", "utf8"); // With encoding

// Reading and writing
buf1.write("Hi", 0, "utf8");
console.log(buf1.toString());           // "Hi\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000"
console.log(buf1.length);               // 10

// Access individual bytes
console.log(buf3[0]);                   // 72 (ASCII code for 'H')

// Convert buffer to string
console.log(buf3.toString("utf8"));     // "Hello"
console.log(buf3.toString("hex"));      // "48656c6c6f"

// JSON representation
console.log(buf3.toJSON());             // { type: 'Buffer', data: [ 72, 101, 108, 108, 111 ] }

// Copy buffers
const target = Buffer.alloc(5);
buf3.copy(target);
console.log(target.toString());         // "Hello"

// Concat buffers
const combined = Buffer.concat([buf3, Buffer.from(" World")]);
console.log(combined.toString());       // "Hello World"
```

### Types of Streams

Node.js has **four fundamental stream types**:

```
┌──────────────────────────────────────────────────┐
│                  Stream Types                     │
├──────────────┬───────────────────────────────────┤
│ Readable     │ Data you can read FROM            │
│              │ (fs.createReadStream, HTTP request)│
├──────────────┼───────────────────────────────────┤
│ Writable     │ Data you can write TO             │
│              │ (fs.createWriteStream, HTTP resp)  │
├──────────────┼───────────────────────────────────┤
│ Duplex       │ Both read AND write (independent) │
│              │ (TCP socket, WebSocket)            │
├──────────────┼───────────────────────────────────┤
│ Transform    │ Duplex that modifies data passing │
│              │ through (zlib, encryption)         │
└──────────────┴───────────────────────────────────┘
```

### Readable Streams

```javascript
const fs = require("fs");

// Create a readable stream
const readStream = fs.createReadStream("large-file.txt", {
  encoding: "utf8",
  highWaterMark: 64 * 1024, // 64KB chunks (default: 64KB)
});

// Event-based reading
readStream.on("data", (chunk) => {
  console.log(`Received ${chunk.length} bytes of data`);
  // Process each chunk
});

readStream.on("end", () => {
  console.log("Finished reading");
});

readStream.on("error", (err) => {
  console.error("Error:", err);
});

// Pause and resume
readStream.pause();
setTimeout(() => readStream.resume(), 1000);
```

### Writable Streams

```javascript
const fs = require("fs");

const writeStream = fs.createWriteStream("output.txt");

// Writing data
writeStream.write("Hello, ");
writeStream.write("World!\n");
writeStream.end("This is the final write");

writeStream.on("finish", () => {
  console.log("All data written");
});

writeStream.on("error", (err) => {
  console.error("Write error:", err);
});
```

### Pipe — Connecting Streams

`.pipe()` connects a readable stream to a writable stream, handling backpressure automatically:

```javascript
const fs = require("fs");
const zlib = require("zlib");

// Read file → Compress → Write to new file
fs.createReadStream("input.txt")
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream("output.txt.gz"));

console.log("File compressed!");
```

```javascript
// File copy with streams (memory efficient for large files)
const readStream = fs.createReadStream("source.mp4");
const writeStream = fs.createWriteStream("copy.mp4");

readStream.pipe(writeStream);

writeStream.on("finish", () => {
  console.log("Copy complete!");
});
```

### Transform Streams

```javascript
const { Transform } = require("stream");
const fs = require("fs");

// Create a transform stream that uppercases text
const upperCaseTransform = new Transform({
  transform(chunk, encoding, callback) {
    const uppercased = chunk.toString().toUpperCase();
    callback(null, uppercased);
  },
});

// Chain: Read → Transform → Write
fs.createReadStream("input.txt")
  .pipe(upperCaseTransform)
  .pipe(fs.createWriteStream("output-uppercase.txt"));
```

```javascript
// JSON line parser transform stream
const { Transform } = require("stream");

const jsonParser = new Transform({
  objectMode: true, // Process objects instead of buffers
  transform(chunk, encoding, callback) {
    try {
      const data = JSON.parse(chunk.toString());
      this.push(data);
      callback();
    } catch (err) {
      callback(err);
    }
  },
});
```

### Streams with Async Iterators (Node.js 10+)

```javascript
const fs = require("fs");

async function processLargeFile() {
  const stream = fs.createReadStream("huge-file.txt", "utf8");

  for await (const chunk of stream) {
    // Process each chunk
    const lines = chunk.split("\n");
    for (const line of lines) {
      // Process line by line
    }
  }

  console.log("File processed!");
}

processLargeFile().catch(console.error);
```

### Practical Example: Log File Processor

```javascript
const fs = require("fs");
const { Transform } = require("stream");
const { pipeline } = require("stream/promises");

// Filter only ERROR logs
const errorFilter = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const line = chunk.toString();
    if (line.includes("ERROR")) {
      this.push(line);
    }
    callback();
  },
});

// Extract timestamp and message
const logParser = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const match = chunk.match(/\[(.+?)\] ERROR: (.+)/);
    if (match) {
      this.push(JSON.stringify({ timestamp: match[1], message: match[2] }) + "\n");
    }
    callback();
  },
});

async function processLogs() {
  await pipeline(
    fs.createReadStream("app.log"),
    errorFilter,
    logParser,
    fs.createWriteStream("errors.json")
  );
  console.log("Error log created!");
}

processLogs();
```

## Why Streams & Buffers Matter

| Without Streams | With Streams |
|----------------|-------------|
| Read entire 5GB file into RAM | Process 5GB file with ~64MB RAM |
| Server crashes on large uploads | Handle uploads of any size |
| Slow response for large data | Stream data as it's generated |
| `readFileSync("big.json")` → OOM | `createReadStream("big.json")` → Works |

| Use Case | Stream Type |
|----------|-------------|
| File upload/download | Readable → Writable (pipe) |
| Log processing | Readable → Transform → Writable |
| Video/audio streaming | Readable → HTTP Response |
| Data compression | Readable → Transform (zlib) → Writable |
| Real-time data feeds | Readable → Transform → Writable |

> **Interview Question:** _"What is the difference between Buffer and Stream?"_
>
> A **Buffer** is a fixed-size chunk of raw binary data stored in memory. A **Stream** is a mechanism for processing data piece by piece (as Buffers) without loading everything into memory. Buffers are for when you need to hold binary data (cryptography, image processing). Streams are for efficiently processing large data (file I/O, network, video). Streams use buffers internally as their data units.

> **Interview Question:** _"What is backpressure in streams?"_
>
> Backpressure occurs when a readable stream produces data **faster** than a writable stream can consume it. Without handling, data accumulates in memory, causing leaks and crashes. Node.js `.pipe()` handles backpressure automatically — it pauses the readable stream when the writable stream is busy and resumes when it's ready. With manual stream handling, check `writeStream.write()` return value: `false` means you should pause reading.

-> Next: [Node.js File System](/post/languages/nodejs-file-system)
