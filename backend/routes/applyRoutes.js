const express = require("express");
const multer = require("multer");
const path = require("path");
const { submitApplication } = require("../controllers/applyController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
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

router.post("/", (req, res, next) => {
  upload.single("cvFile")(req, res, (error) => {
    if (!error) return next();

    const message = error.message === "INVALID_FILE_TYPE"
      ? "CV chi chap nhan PDF, DOC hoac DOCX."
      : "CV can nho hon hoac bang 5MB.";

    return res.status(400).json({
      success: false,
      message
    });
  });
}, submitApplication);

module.exports = router;
