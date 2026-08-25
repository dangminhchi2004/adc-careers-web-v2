const Job = require("../models/jobModel");
const Block = require("../models/blockModel");
const Department = require("../models/departmentModel");

// The stored poster_mime_type is only ever written by the admin upload
// endpoint (backend/controllers/adminController.js), which already derives
// it from a magic-byte scan of the file — but re-checking against this fixed
// whitelist here means a stale/legacy row could never make this route emit
// an unexpected Content-Type.
const SAFE_POSTER_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

async function getJobPoster(req, res) {
  try {
    const poster = await Job.getPosterById(req.params.id);
    if (!poster) {
      return res.status(404).json({ success: false, message: "Khong tim thay anh poster." });
    }

    const contentType = SAFE_POSTER_MIME_TYPES.has(poster.mimeType) ? poster.mimeType : "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(poster.buffer);
  } catch (error) {
    console.error("GET /api/jobs/:id/poster failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai anh poster." });
  }
}
async function getJobMetadata(req, res) {
  try {
    const blocks = await Block.getAll();
    const departments = await Department.getAll();
    res.json({
      success: true,
      data: { blocks, departments }
    });
  } catch (error) {
    console.error("GET /api/jobs/metadata failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai du lieu khoi/phong ban." });
  }
}

module.exports = {
  getActiveJobs,
  getJobPoster,
  getJobMetadata
};
