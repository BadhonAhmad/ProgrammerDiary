---
title: "Express.js File Upload & Static Files"
date: "2026-04-16"
tags: ["expressjs", "file-upload", "multer", "static-files", "storage"]
excerpt: "Handle file uploads in Express.js using Multer — single/multiple uploads, file validation, storage configuration, and serving static files."
---

# Express.js File Upload & Static Files

## What is it?

**File upload** handling allows users to send files (images, documents, videos) to your server. **Static file serving** lets you serve files like images, CSS, and JavaScript to the browser. Express.js uses **Multer** middleware for file uploads and `express.static()` for serving files.

## How it Works

### Serving Static Files

```javascript
const express = require("express");
const path = require("path");
const app = express();

// Serve files from "public" directory
app.use(express.static("public"));

// Now these are accessible:
// http://localhost:3000/images/logo.png → serves public/images/logo.png
// http://localhost:3000/style.css       → serves public/style.css

// Virtual path prefix
app.use("/static", express.static("public"));
// http://localhost:3000/static/images/logo.png

// Multiple static directories (checked in order)
app.use(express.static("public"));
app.use(express.static("files"));

// Absolute path (recommended)
app.use(express.static(path.join(__dirname, "public")));
```

### File Upload with Multer

```bash
npm install multer
```

#### Basic Single File Upload

```javascript
const multer = require("multer");

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save to uploads/ directory
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter — only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, GIF, and WebP images are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Single file upload
app.post("/upload/profile", upload.single("avatar"), (req, res) => {
  // req.file contains the uploaded file info
  console.log(req.file);
  // {
  //   fieldname: 'avatar',
  //   originalname: 'photo.jpg',
  //   encoding: '7bit',
  //   mimetype: 'image/jpeg',
  //   destination: 'uploads/',
  //   filename: 'avatar-1699654321-123456789.jpg',
  //   path: 'uploads/avatar-1699654321-123456789.jpg',
  //   size: 245678
  // }

  res.json({
    success: true,
    file: {
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      type: req.file.mimetype,
    },
  });
});
```

#### Multiple File Uploads

```javascript
// Upload multiple files (max 5)
app.post(
  "/upload/gallery",
  upload.array("photos", 5),
  (req, res) => {
    // req.files is an array of files
    const files = req.files.map((f) => ({
      url: `/uploads/${f.filename}`,
      size: f.size,
      type: f.mimetype,
    }));

    res.json({ success: true, count: files.length, files });
  }
);

// Upload multiple fields
const cpUpload = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "gallery", maxCount: 8 },
]);

app.post("/upload/profile-complete", cpUpload, (req, res) => {
  // req.files is an object with arrays
  const avatar = req.files["avatar"]?.[0];
  const gallery = req.files["gallery"] || [];

  res.json({
    avatar: avatar?.filename,
    galleryCount: gallery.length,
  });
});
```

#### Complete Upload Service

```javascript
// src/services/uploadService.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const AppError = require("../utils/AppError");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subDir = path.join(uploadDir, file.fieldname);
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir, { recursive: true });
    }
    cb(null, subDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

// File type configurations
const fileTypes = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  },
  document: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: [".pdf", ".doc", ".docx"],
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm"],
    maxSize: 100 * 1024 * 1024, // 100MB
    extensions: [".mp4", ".webm"],
  },
};

function createUploader(type = "image") {
  const config = fileTypes[type];

  const fileFilter = (req, file, cb) => {
    if (config.mimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Invalid file type. Allowed: ${config.extensions.join(", ")}`,
          400
        ),
        false
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: config.maxSize },
  });
}

// Export pre-configured uploaders
module.exports = {
  uploadImage: createUploader("image"),
  uploadDocument: createUploader("document"),
  uploadVideo: createUploader("video"),
};
```

#### Using the Upload Service

```javascript
// src/routes/uploadRoutes.js
const express = require("express");
const router = express.Router();
const { uploadImage, uploadDocument } = require("../services/uploadService");
const { authenticate } = require("../middleware/auth");

// Upload profile image
router.post(
  "/profile-image",
  authenticate,
  uploadImage.single("avatar"),
  (req, res) => {
    res.json({
      success: true,
      url: `/uploads/avatar/${req.file.filename}`,
    });
  }
);

// Upload post images
router.post(
  "/post-images",
  authenticate,
  uploadImage.array("images", 5),
  (req, res) => {
    const urls = req.files.map((f) => `/uploads/images/${f.filename}`);
    res.json({ success: true, urls });
  }
);

// Upload document
router.post(
  "/document",
  authenticate,
  uploadDocument.single("file"),
  (req, res) => {
    res.json({
      success: true,
      url: `/uploads/file/${req.file.filename}`,
      size: req.file.size,
    });
  }
);

module.exports = router;
```

#### Error Handling for Uploads

```javascript
// Multer-specific error handler
function multerErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 5MB.",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        error: "Too many files uploaded.",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        error: "Unexpected field name in upload.",
      });
    }
  }

  if (err.message?.includes("Invalid file type")) {
    return res.status(400).json({ error: err.message });
  }

  next(err);
}

app.use(multerErrorHandler);
```

### Serving Uploaded Files

```javascript
// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Or protect with authentication
app.get("/uploads/:type/:filename", authenticate, (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.type, req.params.filename);
  res.sendFile(filePath);
});
```

## Why Proper File Handling Matters

| Reason | Explanation |
|--------|-------------|
| **Security** | File type validation prevents malicious uploads (PHP shells, executables) |
| **Storage** | Unique filenames prevent overwrites; size limits prevent disk exhaustion |
| **Performance** | Static file serving with proper caching headers reduces server load |
| **Organization** | Structured directories make file management scalable |

> **Interview Question:** _"How do you handle file uploads in Express.js?"_
>
> Use **Multer** middleware. Configure storage (disk or memory), file filter (validate MIME types), and size limits. Use `upload.single()` for one file, `upload.array()` for multiple files with the same field name, and `upload.fields()` for different field names. Always validate file types server-side (check MIME type, not just extension) and set size limits. Store files outside the web root for security.

> **Interview Question:** _"What security risks should you consider with file uploads?"_
>
> (1) **Malicious files** — validate MIME types server-side, not just extensions, (2) **Path traversal** — sanitize filenames, never use user-provided names directly, (3) **File size** — enforce limits to prevent DoS, (4) **Executable files** — never allow .php, .exe, .sh uploads, (5) **Storage location** — store outside the web root, serve through a controller, not directly, (6) **Virus scanning** — scan uploads in production with tools like ClamAV.

-> Next: [Express.js Error Handling](/post/languages/expressjs-error-handling)
