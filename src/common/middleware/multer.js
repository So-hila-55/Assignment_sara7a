
import multer from "multer";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const multerLocal = ({ customPath = "General", customTypes = [], maxSizeMB = 2 } = {}) => {
  const dest = path.join("uploads", customPath);
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dest),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!customTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type!", { cause: 400 }));
    }
    cb(null, true);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  });
};