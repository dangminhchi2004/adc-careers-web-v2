const Application = require("../models/applyModel");
const Job = require("../models/jobModel");

async function getJobs(req, res) {
  try {
    const jobs = await Job.getAll();
    res.json({ success: true, data: jobs });
  } catch (error) {
    console.error("GET /api/admin/jobs failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai danh sach vi tri." });
  }
}

async function createJob(req, res) {
  try {
    const validationError = validateJob(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const job = await Job.create(req.body);
    res.status(201).json({ success: true, data: job });
  } catch (error) {
    console.error("POST /api/admin/jobs failed:", error);
    res.status(500).json({ success: false, message: "Khong the tao vi tri." });
  }
}

async function updateJob(req, res) {
  try {
    const validationError = validateJob(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const job = await Job.update(req.params.id, req.body);
    if (!job) {
      return res.status(404).json({ success: false, message: "Khong tim thay vi tri." });
    }

    res.json({ success: true, data: job });
  } catch (error) {
    console.error("PUT /api/admin/jobs/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the cap nhat vi tri." });
  }
}

async function deleteJob(req, res) {
  try {
    const removed = await Job.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, message: "Khong tim thay vi tri." });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/jobs/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the xoa vi tri." });
  }
}

async function getApplications(req, res) {
  try {
    const applications = await Application.getAll();
    res.json({ success: true, data: applications });
  } catch (error) {
    console.error("GET /api/admin/applications failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai ho so ung vien." });
  }
}

function validateJob(job) {
  const requiredFields = ["title", "vn", "dept", "level", "report"];
  const missingField = requiredFields.find((field) => !job[field] || !String(job[field]).trim());
  if (missingField) return "Vui long nhap day du thong tin vi tri.";

  const reqs = Array.isArray(job.reqs)
    ? job.reqs
    : String(job.reqs || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);

  if (reqs.length === 0) return "Vui long nhap it nhat mot yeu cau.";
  return "";
}

module.exports = {
  createJob,
  deleteJob,
  getApplications,
  getJobs,
  updateJob
};
