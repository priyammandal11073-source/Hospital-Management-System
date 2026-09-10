import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const storageRoot = path.resolve(__dirname, "../storage/medical_files");

// Ensure base storage directory exists
if (!fs.existsSync(storageRoot)) {
  fs.mkdirSync(storageRoot, { recursive: true });
}

// Allowed MIME types for diagnostic scans, pathology slides, and reports
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/dicom",
  "application/octet-stream",
]);

// Maximum file size in bytes (25 MB)
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Safe extension whitelist
const SAFE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".dcm", ".bin"]);

/**
 * Custom Multer disk storage engine generating non-guessable, secure storage keys
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageRoot);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = SAFE_EXTENSIONS.has(ext) ? ext : ".bin";
    const uniqueKey = `${Date.now()}-${crypto.randomUUID()}${safeExt}`;
    cb(null, uniqueKey);
  },
});

/**
 * Multer file filter to block unauthorized MIME extensions
 */
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!SAFE_EXTENSIONS.has(ext) && !ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error("Unsupported or unsafe medical file format. Allowed: JPG, PNG, WEBP, PDF, DICOM."));
  }
  return cb(null, true);
};

export const uploadMiddleware = multer({
  storage: diskStorage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 5,
  },
  fileFilter,
});

/**
 * Verify file exists on external storage
 */
export const fileExistsOnStorage = (storagePath) => {
  try {
    const fullPath = path.resolve(storageRoot, path.basename(storagePath));
    return fs.existsSync(fullPath);
  } catch {
    return false;
  }
};

/**
 * Get readable stream for secure, authenticated piping
 */
export const getFileReadStream = (storagePath) => {
  const safeFilename = path.basename(storagePath);
  const fullPath = path.resolve(storageRoot, safeFilename);

  // Prevent path traversal
  if (!fullPath.startsWith(storageRoot)) {
    throw new Error("Invalid storage access: Path traversal detected.");
  }

  if (!fs.existsSync(fullPath)) {
    throw new Error("File not found on external object storage.");
  }

  return fs.createReadStream(fullPath);
};

/**
 * Delete a file from external storage
 */
export const deleteFileFromStorage = async (storagePath) => {
  const safeFilename = path.basename(storagePath);
  const fullPath = path.resolve(storageRoot, safeFilename);

  if (!fullPath.startsWith(storageRoot)) {
    throw new Error("Invalid storage access.");
  }

  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
    return true;
  }
  return false;
};

/**
 * Get storage metadata
 */
export const getStorageStats = () => {
  try {
    const files = fs.readdirSync(storageRoot).filter((f) => f !== ".gitkeep");
    let totalBytes = 0;
    files.forEach((f) => {
      try {
        const stat = fs.statSync(path.join(storageRoot, f));
        totalBytes += stat.size;
      } catch {}
    });
    return {
      provider: "local_object_storage",
      totalFiles: files.length,
      usedBytes: totalBytes,
      usedMB: (totalBytes / (1024 * 1024)).toFixed(2),
      storageRoot,
    };
  } catch (err) {
    return { provider: "local_object_storage", error: err.message };
  }
};
