const Job = require("../models/jobModel");

async function getActiveJobs(req, res) {
  try {
    const jobs = await Job.getAllActive();
    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error("GET /api/jobs failed:", error);
    res.status(500).json({
      success: false,
      message: "Khong the tai danh sach viec lam."
    });
  }
}

module.exports = {
  getActiveJobs
};
