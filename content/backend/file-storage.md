---
title: "File Storage: Local vs Cloud — Where Do You Put User Uploads?"
date: "2026-04-17"
tags: ["backend", "file-storage", "S3", "cloud", "uploads", "Node.js"]
excerpt: "Learn when to store files on your server vs the cloud, how to handle uploads securely, and why putting user files on your app server is a ticking time bomb."
---

# File Storage: Local vs Cloud — Where Do You Put User Uploads?

User uploads a profile photo. You save it to `/uploads/photos/profile.jpg` on your server. Then you deploy. The server gets replaced. The photo is gone. The user sees a broken image. Forever.

## What is File Storage?

**File storage** is how and where your application persists files — images, documents, videos, backups, logs. The two main approaches are:

- **Local storage:** Files live on the same server running your application (filesystem).
- **Cloud storage:** Files live on a managed object storage service (AWS S3, Cloudflare R2, Google Cloud Storage).

```text
Local:   App Server ←→ /var/www/uploads/photo.jpg
Cloud:   App Server ←→ S3 Bucket ←→ https://cdn.myapp.com/photo.jpg
```

## Why Does It Matter?

❌ **Problem:** You store user uploads on the app server's filesystem. Everything works — until:
- You scale to 2 servers. User uploads on Server A. Next request hits Server B. File not found.
- You deploy a new version. The container gets replaced. All uploads wiped.
- The disk fills up. The server crashes. You can't accept any more uploads.
- You need to serve files with a CDN. But they're stuck on one server.

✅ **Solution:** Cloud object storage (S3) solves all of this. Files live outside your server, accessible from any instance, infinitely scalable, with built-in CDN integration. Your app server stays stateless.

## Local Storage

### How It Works

```text
POST /api/upload
  → Multer middleware receives the file
  → Save to /uploads/filename.jpg
  → Store path in database: /uploads/filename.jpg
  → Serve via static middleware: express.static("uploads")
```

### Implementation with Multer

```text
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

app.post("/api/upload", upload.single("avatar"), (req, res) => {
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.use("/uploads", express.static("uploads"));
```

### When Local Storage Makes Sense

| Scenario | Why Local Works |
|---|---|
| Development / prototyping | Quick setup, no cloud account needed |
| Single-server apps with low traffic | No scaling concerns |
| Temporary files (exports, reports) | Generated and deleted quickly |
| Log files | Best stored on the server that generates them |
| Internal tools | Small user base, no CDN needed |

### Local Storage Problems

| Problem | Consequence |
|---|---|
| Server restart / redeploy | Files lost (especially in containers) |
| Horizontal scaling | Files on Server A invisible to Server B |
| Disk space | Finite — server crashes when full |
| Backup | Your responsibility — easy to forget |
| CDN integration | Can't serve from edge locations |
| Security | Serving user uploads from your app server is risky |

## Cloud Storage (S3)

### How It Works

```text
POST /api/upload
  → App receives file
  → App uploads to S3 bucket
  → S3 returns a URL
  → App stores URL in database
  → User accesses file via S3 URL (or CDN)
```

```text
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────>│  Server  │────>│  S3      │
│          │     │  (API)   │     │  Bucket  │
│          │     └──────────┘     └────┬─────┘
│          │<──────────────────────────┘
│          │  Direct S3 URL or CDN URL
└──────────┘
```

### Implementation with AWS SDK

```text
npm install @aws-sdk/client-s3
```

```text
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });  // Keep in memory, not disk

app.post("/api/upload", upload.single("avatar"), async (req, res) => {
  const key = `avatars/${Date.now()}-${req.file.originalname}`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  }));

  const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  // Store URL in database
  await db.user.update(req.user.id, { avatarUrl: url });

  res.json({ url });
});
```

### Direct-to-S3 Upload (Presigned URLs)

For large files, don't route them through your server. Let the client upload directly to S3 using a **presigned URL**:

```text
// 1. Client asks server for a presigned URL
app.get("/api/upload-url", async (req, res) => {
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
  const { PutObjectCommand } = require("@aws-sdk/client-s3");

  const key = `uploads/${req.user.id}/${Date.now()}`;
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min

  res.json({
    uploadUrl,
    fileUrl: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`,
  });
});

// 2. Client uploads directly to S3 (bypasses your server)
// PUT <presigned-url> with file binary
```

```text
Benefits of presigned uploads:
  - Server doesn't handle file data (saves bandwidth + memory)
  - Faster for large files (direct S3 connection)
  - Uploads capped by presigned URL expiration
  - Less server load
```

### S3 Features That Matter

| Feature | What It Does |
|---|---|
| **Buckets** | Top-level containers for files |
| **Keys** | Full path/filename within a bucket |
| **Presigned URLs** | Temporary access without making files public |
| **Versioning** | Keep all versions of a file |
| **Lifecycle rules** | Auto-delete old files (e.g., delete uploads/ after 30 days) |
| **Server-side encryption** | Encrypt files at rest |
| **CORS configuration** | Control which domains can access files |
| **CloudFront integration** | CDN in front of S3 for faster delivery |

## Local vs Cloud Comparison

| Factor | Local | Cloud (S3) |
|---|---|---|
| **Setup** | Zero config | AWS account + SDK setup |
| **Cost** | Free (uses existing server disk) | Pay per GB stored + per request |
| **Scalability** | Limited by disk size | Virtually unlimited |
| **Multi-server** | ❌ Files stuck on one server | ✅ Accessible from anywhere |
| **CDN** | ❌ Manual setup | ✅ Built-in (CloudFront) |
| **Persistence** | Lost on server replace | Permanent until deleted |
| **Backup** | Your responsibility | Built-in (versioning, replication) |
| **Security** | Filesystem permissions | IAM policies, presigned URLs, encryption |
| **Best for** | Dev, temp files, single-server | Production, scaled apps, user uploads |

## File Upload Security

### ❌ Common Mistakes

**Trusting the client's filename:**
```text
// Dangerous — path traversal attack
const filename = req.body.filename;  // "../../../etc/passwd"
fs.writeFileSync(`uploads/${filename}`, data);

// Safe — sanitize and rename
const safeName = `${uuid()}.${allowedExt}`;
```

**No file type validation:**
A file named `malware.exe` renamed to `photo.jpg` is still executable on some systems. Validate the actual file content, not just the extension.

```text
const fileType = await detectFileType(buffer);  // Check magic bytes
if (!["image/jpeg", "image/png"].includes(fileType.mime)) {
  throw new Error("Invalid file type");
}
```

**No file size limit:**
Without a limit, a single 10GB upload exhausts server memory.

```text
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
});
```

**Serving user uploads with execution permissions:**
Never let uploaded files be executed as code. Store outside the web root and serve through a controlled endpoint.

## Cloudflare R2 as an S3 Alternative

**Cloudflare R2** offers S3-compatible storage with **zero egress fees** — you don't pay for downloads. This matters when serving lots of images or videos.

```text
S3:   $0.09/GB stored + $0.085/GB egress
R2:   $0.015/GB stored + $0 egress
```

R2 uses the same S3 API, so you switch by changing the endpoint:

```text
const s3 = new S3Client({
  region: "auto",
  endpoint: "https://<account_id>.r2.cloudflarestorage.com",
  credentials: { accessKeyId, secretAccessKey },
});
```

## Key Points Cheat Sheet

| Concept | What It Does |
|---|---|
| **Local storage** | Files on app server filesystem — simple but fragile |
| **Cloud storage (S3)** | Files in managed object store — scalable, persistent |
| **Multer** | Express middleware for handling file uploads |
| **Presigned URLs** | Let clients upload directly to S3 — bypass your server |
| **File validation** | Check extension + actual content type + file size |
| **Path traversal** | Never trust client-provided filenames |
| **Cloudflare R2** | S3-compatible, zero egress fees |
| **CDN integration** | Serve files from edge locations for global speed |
| **Rule of thumb** | Dev → local. Production → cloud storage |

**Store files on your server and they'll disappear when it does. Store them in the cloud and they outlast every server you'll ever run.**
