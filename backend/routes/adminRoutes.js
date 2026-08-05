const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  createJob,
  deleteJob,
  deleteJobPoster,
  downloadApplicationCv,
  exportApplications,
  getApplicationCvLink,
  getApplications,
  getAuditLogs,
  getJobs,
  updateApplicationStatus,
  updateJob,
  uploadJobPoster
} = require("../controllers/adminController");

const router = express.Router();

router.use(requireAdmin);

const uploadPoster = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = [".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.includes(ext)) {
      return callback(new Error("INVALID_FILE_TYPE"));
    }
    callback(null, true);
  }
});

function handlePosterUpload(req, res, next) {
  uploadPoster.single("poster")(req, res, (error) => {
    if (!error) return next();

    let message = "Du lieu gui len khong hop le. Vui long thu lai.";
    if (error.message === "INVALID_FILE_TYPE") {
      message = "Anh poster chi chap nhan JPG, PNG hoac WebP.";
    } else if (error.code === "LIMIT_FILE_SIZE") {
      message = "Anh poster can nho hon hoac bang 10MB.";
    } else if (["LIMIT_FIELD_VALUE", "LIMIT_FIELD_COUNT", "LIMIT_UNEXPECTED_FILE"].includes(error.code)) {
      message = "Du lieu gui len qua lon hoac khong dung dinh dang.";
    }

    return res.status(400).json({ success: false, message });
  });
}

// Reject non-numeric :id early (400) instead of letting it fall through to a
// DB lookup that just returns "not found" — fails closed on malformed input
// per ASVS V5 instead of relying on the query happening to return no rows.
router.param("id", (req, res, next, value) => {
  if (!/^\d+$/.test(value)) {
    return res.status(400).json({ success: false, message: "ID khong hop le." });
  }
  return next();
});

router.get("/jobs", getJobs);
router.post("/jobs", createJob);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);
router.post("/jobs/:id/poster", handlePosterUpload, uploadJobPoster);
router.delete("/jobs/:id/poster", deleteJobPoster);
router.get("/applications", getApplications);
router.get("/applications/export", exportApplications);
router.put("/applications/:id/status", updateApplicationStatus);
router.get("/applications/:id/cv", downloadApplicationCv);
router.get("/applications/:id/cv-link", getApplicationCvLink);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
