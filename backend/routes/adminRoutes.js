const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  createJob,
  deleteJob,
  downloadApplicationCv,
  getApplications,
  getJobs,
  updateJob
} = require("../controllers/adminController");

const router = express.Router();

router.use(requireAdmin);

router.get("/jobs", getJobs);
router.post("/jobs", createJob);
router.put("/jobs/:id", updateJob);
router.delete("/jobs/:id", deleteJob);
router.get("/applications", getApplications);
router.get("/applications/:id/cv", downloadApplicationCv);

module.exports = router;
