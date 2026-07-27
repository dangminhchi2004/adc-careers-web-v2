const express = require("express");
const multer = require("multer");
const path = require("path");
const { submitApplication } = require("../controllers/applyController");
const { applyLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    fieldSize: 32 * 1024, // generous headroom for multi-byte (Vietnamese) text fields
    fields: 10,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".pdf", ".doc", ".docx"];
    if (!allowed.includes(ext)) {
      return callback(new Error("INVALID_FILE_TYPE"));
    }
    callback(null, true);
  }
});

router.post("/", applyLimiter, (req, res, next) => {
  upload.single("cvFile")(req, res, (error) => {
    if (!error) return next();

    let message = "Du lieu gui len khong hop le. Vui long thu lai.";
    if (error.message === "INVALID_FILE_TYPE") {
      message = "CV chi chap nhan PDF, DOC hoac DOCX.";
    } else if (error.code === "LIMIT_FILE_SIZE") {
      message = "CV can nho hon hoac bang 5MB.";
    } else if (["LIMIT_FIELD_VALUE", "LIMIT_FIELD_COUNT", "LIMIT_UNEXPECTED_FILE"].includes(error.code)) {
      message = "Du lieu gui len qua lon hoac khong dung dinh dang.";
    }

    return res.status(400).json({
      success: false,
      message
    });
  });
}, submitApplication);

module.exports = router;
