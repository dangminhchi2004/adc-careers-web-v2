const express = require("express");
const { requireAdmin } = require("../middlewares/authMiddleware");
const {
  createJob,
  deleteJob,
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

module.exports = router;
