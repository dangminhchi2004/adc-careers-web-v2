const { imageSize } = require("image-size");
const Application = require("../models/applyModel");
const Job = require("../models/jobModel");
const Department = require("../models/departmentModel");
const JobLevel = require("../models/jobLevelModel");
const { buildCvViewUrl, loadCv } = require("../services/cvStorageService");
const auditService = require("../services/auditService");
const AuditLog = require("../models/auditModel");
const { isTooLong, toItemsArray, itemTextLength } = require("../utils/validate");

// file-type@22+ is ESM-only, so it can't be required() from this CommonJS
// module — load it once via dynamic import() and reuse the cached promise.
// Mirrors the same pattern already used for CV magic-byte validation in
// backend/controllers/applyController.js.
let fileTypeFromBufferPromise;
function getFileTypeFromBuffer() {
  if (!fileTypeFromBufferPromise) {
    fileTypeFromBufferPromise = import("file-type").then((mod) => mod.fileTypeFromBuffer);
  }
  return fileTypeFromBufferPromise;
}

const POSTER_TARGET_RATIO = 1240 / 1754; // ~0.707, A4 portrait
const POSTER_RATIO_TOLERANCE = 0.02;
const POSTER_SAFE_MIME_TYPES = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

// The stored cv_mime_type can hold an attacker-declared value from before this
// was locked down at upload time (backend/controllers/applyController.js), so
// never trust it for the response header — derive Content-Type strictly from
// the file extension against this fixed whitelist instead.
const SAFE_CV_MIME_TYPES = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

function safeCvContentType(fileName) {
  const match = /\.[a-z0-9]+$/i.exec(String(fileName || ""));
  const ext = match ? match[0].toLowerCase() : "";
  return SAFE_CV_MIME_TYPES[ext] || "application/octet-stream";
}

// Mirrors the VARCHAR/TEXT column widths in backend/config/schema.js so an
// oversized field is rejected with a clean 400 instead of crashing the insert
// with a DB-level ER_DATA_TOO_LONG (500).
const TEXT_FIELD_LIMITS = {
  title: 255,
  vn: 255,
  dept: 100,
  level: 100,
  report: 100,
  summary: 5000,
  employmentType: 80,
  workLocation: 255,
  locationShort: 100,
  salaryText: 255,
  ageRange: 50,
  gender: 50,
  experienceText: 255,
  industry: 255,
  slug: 180
};

const LIST_FIELD_LIMITS = {
  reqs: { maxItems: 50, maxItemLength: 500 },
  responsibilities: { maxItems: 50, maxItemLength: 500 },
  requirementsDetail: { maxItems: 50, maxItemLength: 500 },
  benefits: { maxItems: 30, maxItemLength: 500 },
  environmentSections: { maxItems: 20, maxItemLength: 4000 }
};

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

    const contentType = safeCvContentType(cv.fileName);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", cv.buffer.length);
    res.setHeader("Content-Disposition", buildContentDisposition(cv.fileName, contentType));
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

async function getAuditLogs(req, res) {
  try {
    // Cap page size so a caller can't force an unbounded table scan/response.
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    const logs = await AuditLog.getAll(limit, offset);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error("GET /api/admin/audit-logs failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai audit log." });
  }
}

function validateJob(job) {
  const isPoster = job.displayMode === "poster";
  const requiredFields = isPoster
    ? ["title", "vn", "dept", "level"]
    : ["title", "vn", "dept", "level", "report"];
  const missingField = requiredFields.find((field) => !job[field] || !String(job[field]).trim());
  if (missingField) return "Vui long nhap day du thong tin vi tri.";

  if (isPoster) {
    if (!job.report || !String(job.report).trim()) job.report = "P&O";
    const currentReqs = toItemsArray(job.reqs);
    if (currentReqs.length === 0) job.reqs = ["Xem chi tiet tren poster"];
  }

  for (const [field, max] of Object.entries(TEXT_FIELD_LIMITS)) {
    if (job[field] !== undefined && job[field] !== null && typeof job[field] !== "string") {
      return `Truong ${field} khong hop le.`;
    }
    if (isTooLong(job[field], max)) return `Truong ${field} qua dai (toi da ${max} ky tu).`;
  }

  for (const [field, { maxItems, maxItemLength }] of Object.entries(LIST_FIELD_LIMITS)) {
    const items = toItemsArray(job[field]);
    if (items.length > maxItems) return `Truong ${field} co qua nhieu muc (toi da ${maxItems}).`;
    if (items.some((item) => itemTextLength(item) > maxItemLength)) {
      return `Mot muc trong ${field} qua dai (toi da ${maxItemLength} ky tu).`;
    }
  }

  if (job.quantity !== undefined && job.quantity !== null && job.quantity !== "") {
    const quantity = Number(job.quantity);
    if (!Number.isFinite(quantity) || quantity < 0 || quantity > 9999) {
      return "So luong tuyen khong hop le.";
    }
  }

  const reqs = toItemsArray(job.reqs);
  if (!isPoster && reqs.length === 0) return "Vui long nhap it nhat mot yeu cau.";

  if (job.displayMode !== undefined && !["standard", "poster"].includes(job.displayMode)) {
    return "Che do hien thi khong hop le.";
  }

  return "";
}

async function uploadJobPoster(req, res) {
  try {
    const job = await Job.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Khong tim thay vi tri." });
    }

    const posterFile = req.file;
    if (!posterFile || !posterFile.buffer) {
      return res.status(400).json({ success: false, message: "Vui long chon anh poster." });
    }

    const fileTypeFromBuffer = await getFileTypeFromBuffer();
    const type = await fileTypeFromBuffer(posterFile.buffer);
    const detectedExt = type ? type.ext : null;

    if (!detectedExt || !POSTER_SAFE_MIME_TYPES[detectedExt]) {
      return res.status(400).json({
        success: false,
        message: "Anh poster khong hop le hoac co dau hieu gia mao dinh dang. Chi chap nhan JPG, PNG hoac WebP."
      });
    }

    let dimensions;
    try {
      dimensions = imageSize(posterFile.buffer);
    } catch (error) {
      return res.status(400).json({ success: false, message: "Khong doc duoc kich thuoc anh poster." });
    }

    const ratio = dimensions.width / dimensions.height;
    if (Math.abs(ratio - POSTER_TARGET_RATIO) > POSTER_TARGET_RATIO * POSTER_RATIO_TOLERANCE) {
      return res.status(400).json({
        success: false,
        message: `Ty le khung hinh khong dung chuan (yeu cau ~1240x1754px, ty le doc A4). Anh tai len co kich thuoc ${dimensions.width}x${dimensions.height}px.`
      });
    }

    const safeMimeType = POSTER_SAFE_MIME_TYPES[detectedExt];
    const updated = await Job.setPoster(job.id, posterFile.buffer, safeMimeType, posterFile.buffer.length);

    auditService.logAction(req, "UPLOAD_JOB_POSTER", "JOB", job.id, { size: posterFile.buffer.length });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("POST /api/admin/jobs/:id/poster failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai len anh poster." });
  }
}

async function deleteJobPoster(req, res) {
  try {
    const job = await Job.getById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Khong tim thay vi tri." });
    }

    const updated = await Job.clearPoster(job.id);
    auditService.logAction(req, "DELETE_JOB_POSTER", "JOB", job.id);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("DELETE /api/admin/jobs/:id/poster failed:", error);
    res.status(500).json({ success: false, message: "Khong the xoa anh poster." });
  }
}

// --- Department Management ---
async function getDepartments(req, res) {
  try {
    const data = await Department.getAll();
    res.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/departments failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai danh sach phong ban." });
  }
}

async function createDepartment(req, res) {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ten phong ban khong duoc de trong." });
    }
    const existing = await Department.getByName(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: "Phong ban nay da ton tai." });
    }
    const created = await Department.create({ name, description });
    auditService.logAction(req, "CREATE_DEPARTMENT", "DEPARTMENT", created.id, { name: created.name });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("POST /api/admin/departments failed:", error);
    res.status(500).json({ success: false, message: "Khong the tao phong ban." });
  }
}

async function updateDepartment(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ten phong ban khong duoc de trong." });
    }
    const existing = await Department.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Khong tim thay phong ban." });
    }
    const sameName = await Department.getByName(name.trim());
    if (sameName && sameName.id !== id) {
      return res.status(400).json({ success: false, message: "Ten phong ban da bi trung lap." });
    }
    const updated = await Department.update(id, { name, description });
    auditService.logAction(req, "UPDATE_DEPARTMENT", "DEPARTMENT", id, { name: updated.name });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/admin/departments/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the cap nhat phong ban." });
  }
}

async function deleteDepartment(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await Department.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Khong tim thay phong ban." });
    }
    await Department.delete(id);
    auditService.logAction(req, "DELETE_DEPARTMENT", "DEPARTMENT", id, { name: existing.name });
    res.json({ success: true, message: "Da xoa phong ban thanh cong." });
  } catch (error) {
    console.error("DELETE /api/admin/departments/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the xoa phong ban." });
  }
}

// --- Job Level Management ---
async function getJobLevels(req, res) {
  try {
    const data = await JobLevel.getAll();
    res.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/admin/levels failed:", error);
    res.status(500).json({ success: false, message: "Khong the tai danh sach cap bac." });
  }
}

async function createJobLevel(req, res) {
  try {
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ten cap bac khong duoc de trong." });
    }
    const existing = await JobLevel.getByName(name.trim());
    if (existing) {
      return res.status(400).json({ success: false, message: "Cap bac nay da ton tai." });
    }
    const created = await JobLevel.create({ name, description });
    auditService.logAction(req, "CREATE_JOB_LEVEL", "JOB_LEVEL", created.id, { name: created.name });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("POST /api/admin/levels failed:", error);
    res.status(500).json({ success: false, message: "Khong the tao cap bac." });
  }
}

async function updateJobLevel(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Ten cap bac khong duoc de trong." });
    }
    const existing = await JobLevel.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Khong tim thay cap bac." });
    }
    const sameName = await JobLevel.getByName(name.trim());
    if (sameName && sameName.id !== id) {
      return res.status(400).json({ success: false, message: "Ten cap bac da bi trung lap." });
    }
    const updated = await JobLevel.update(id, { name, description });
    auditService.logAction(req, "UPDATE_JOB_LEVEL", "JOB_LEVEL", id, { name: updated.name });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("PUT /api/admin/levels/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the cap nhat cap bac." });
  }
}

async function deleteJobLevel(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await JobLevel.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Khong tim thay cap bac." });
    }
    await JobLevel.delete(id);
    auditService.logAction(req, "DELETE_JOB_LEVEL", "JOB_LEVEL", id, { name: existing.name });
    res.json({ success: true, message: "Da xoa cap bac thanh cong." });
  } catch (error) {
    console.error("DELETE /api/admin/levels/:id failed:", error);
    res.status(500).json({ success: false, message: "Khong the xoa cap bac." });
  }
}

module.exports = {
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
  uploadJobPoster,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getJobLevels,
  createJobLevel,
  updateJobLevel,
  deleteJobLevel
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
