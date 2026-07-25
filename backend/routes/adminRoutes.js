const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  createJob,
  deleteJob,
  downloadApplicationCv,
  exportApplications,
  getApplicationCvLink,
  getApplications,
  getAuditLogs,
  getJobs,
  updateApplicationStatus,
  updateJob
} = require("../controllers/adminController");

const router = express.Router();

router.use(requireAdmin);

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
router.get("/applications", getApplications);
router.get("/applications/export", exportApplications);
router.put("/applications/:id/status", updateApplicationStatus);
router.get("/applications/:id/cv", downloadApplicationCv);
router.get("/applications/:id/cv-link", getApplicationCvLink);
router.get("/audit-logs", getAuditLogs);

module.exports = router;
