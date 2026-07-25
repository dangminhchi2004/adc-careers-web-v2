const Application = require("../models/applyModel");
const Job = require("../models/jobModel");
const { buildCvViewUrl, loadCv } = require("../services/cvStorageService");
const auditService = require("../services/auditService");

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
    auditService.logAction(req, "CREATE_JOB", "JOB", job.id, { title: job.title });
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

    auditService.logAction(req, "UPDATE_JOB", "JOB", job.id, { title: job.title });
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

    auditService.logAction(req, "DELETE_JOB", "JOB", req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/jobs/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the xoa vi tri." });
  }
}

async function getApplications(req, res) {
  try {
    const applications = await Application.getAll();
    const data = applications.map((application) => ({
      ...application,
      cvViewUrl: application.cvStorageProvider === "sharepoint_relay" && application.cvFileName
        ? `/api/admin/applications/${application.id}/cv-link`
        : null
    }));
    res.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/applications failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai ho so ung vien." });
  }
}

async function updateApplicationStatus(req, res) {
  try {
    const status = String(req.body.status || "").trim();
    const allowedStatuses = ["new", "screening", "interview", "offer", "hired", "rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Trang thai ho so khong hop le." });
    }

    const application = await Application.updateStatus(req.params.id, status);
    if (!application) {
      return res.status(404).json({ success: false, message: "Khong tim thay ho so ung vien." });
    }

    auditService.logAction(req, "UPDATE_STATUS", "APPLICATION", application.id, { status });
    res.json({ success: true, data: application });
  } catch (error) {
    console.error("PUT /api/admin/applications/:id/status failed:", error);
    res.status(500).json({ success: false, message: "Khong the cap nhat trang thai ho so." });
  }
}

async function exportApplications(req, res) {
  try {
    const applications = await Application.getAll();
    const headers = [
      "ID",
      "Ho ten",
      "Email",
      "Dien thoai",
      "Vi tri",
      "Phong ban",
      "Luong ky vong",
      "Trang thai",
      "CV",
      "Ngay gui",
      "Ghi chu"
    ];
    const rows = applications.map((application) => [
      application.id,
      application.fullName,
      application.email,
      application.phone,
      application.jobTitle || application.jobTitleVn || "",
      application.jobDept || "",
      application.expectedSalary || "",
      application.status || "new",
      application.cvOriginalName || application.cvFileName || "",
      application.appliedAt ? new Date(application.appliedAt).toISOString() : "",
      application.note || ""
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"adc-careers-applications.csv\"");
    res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("GET /api/admin/applications/export failed:", error);
    res.status(500).json({ success: false, message: "Khong the xuat du lieu ho so." });
  }
}

async function downloadApplicationCv(req, res) {
  try {
    const application = await Application.getById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: "Khong tim thay ho so ung vien." });
    }

    const cv = await loadCv(application);
    auditService.logAction(req, "DOWNLOAD_CV", "APPLICATION", application.id, { fileName: cv.fileName });

    res.setHeader("Content-Type", cv.mimeType);
    res.setHeader("Content-Length", cv.buffer.length);
    res.setHeader("Content-Disposition", buildContentDisposition(cv.fileName, cv.mimeType));
    return res.send(cv.buffer);
  } catch (error) {
    console.error("GET /api/admin/applications/:id/cv failed:", error);
    const statusCode = error.statusCode === 404 ? 404 : 500;
    const message = statusCode === 404
      ? "Khong tim thay file CV."
      : "Khong the tai CV luc nay.";
    return res.status(statusCode).json({ success: false, message });
  }
}

async function getApplicationCvLink(req, res) {
  try {
    const application = await Application.getById(req.params.id);
    if (!application || application.cvStorageProvider !== "sharepoint_relay" || !application.cvFileName) {
      return res.status(404).json({ success: false, message: "Khong tim thay file CV." });
    }

    const url = buildCvViewUrl(application.cvFileName);
    if (!url) {
      return res.status(500).json({ success: false, message: "Chua cau hinh CV_VIEW_BASE_URL." });
    }

    auditService.logAction(req, "VIEW_CV_LINK", "APPLICATION", application.id, { fileName: application.cvFileName });
    return res.json({ success: true, url });
  } catch (error) {
    console.error("GET /api/admin/applications/:id/cv-link failed:", error);
    return res.status(500).json({ success: false, message: "Khong the mo lien ket CV." });
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
  downloadApplicationCv,
  exportApplications,
  getApplicationCvLink,
  getApplications,
  getJobs,
  updateApplicationStatus,
  updateJob
};

function buildContentDisposition(fileName, mimeType) {
  const fallback = String(fileName || "cv")
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/["\\]/g, "_");
  const disposition = mimeType === "application/pdf" ? "inline" : "attachment";
  return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName || "cv")}`;
}

function csvCell(value) {
  let text = String(value ?? "");
  // Neutralize formula injection: a cell starting with =, +, -, @, tab or CR
  // is interpreted as a formula by Excel/Sheets when the export is opened,
  // letting an applicant's name/note run code or exfiltrate data from HR's machine.
  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replace(/"/g, '""')}"`;
}
