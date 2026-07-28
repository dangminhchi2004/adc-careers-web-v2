const Application = require("../models/applyModel");
const Job = require("../models/jobModel");
const { deleteStoredCv, storeCv } = require("../services/cvStorageService");
const { sendApplicationEmails } = require("../services/mailService");
const { sanitizeText, isTooLong } = require("../utils/validate");
const { PRIVACY_POLICY_VERSION, POLICY_CODE } = require("../config/policy");

// multer parses checkbox fields as the string "true"/"on" when checked, and
// simply omits the field (or sends "false") when unchecked — never a boolean.
const CONSENT_TRUE_VALUES = new Set(["true", "on", "1"]);

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

// multer's file.mimetype is the client-declared multipart Content-Type — fully
// attacker-controlled and never itself checked against the magic-byte scan
// below. Never trust it for storage/serving; derive the type we persist from
// the (already extension- and magic-byte-validated) file extension instead.
const SAFE_MIME_TYPES = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
};

// file-type@22+ is ESM-only, so it can't be required() from this CommonJS
// module — load it once via dynamic import() and reuse the cached promise.
let fileTypeFromBufferPromise;
function getFileTypeFromBuffer() {
  if (!fileTypeFromBufferPromise) {
    fileTypeFromBufferPromise = import("file-type").then((mod) => mod.fileTypeFromBuffer);
  }
  return fileTypeFromBufferPromise;
}

async function submitApplication(req, res) {
  try {
    const jobId = req.body.jobId;
    const fullName = sanitizeText(req.body.fullName);
    const email = sanitizeText(req.body.email);
    const phone = sanitizeText(req.body.phone);
    const expectedSalary = sanitizeText(req.body.expectedSalary);
    const note = sanitizeText(req.body.note);
    const captchaToken = req.body.captchaToken;
    const purposeCore = CONSENT_TRUE_VALUES.has(String(req.body.purposeCore || req.body.consent || "").toLowerCase());
    const purposeTalentPool = CONSENT_TRUE_VALUES.has(String(req.body.purposeTalentPool || "").toLowerCase());
    const cvFile = req.file;

    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng xác thực bạn không phải là người máy."
      });
    }

    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY is not configured. Refusing apply request.");
        return res.status(500).json({
          success: false,
          message: "Loi cau hinh may chu. Vui long thu lai sau."
        });
      }

      const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secretKey}&response=${captchaToken}`
      });
      const verifyData = await verifyResponse.json();

      if (!verifyData.success) {
        return res.status(400).json({
          success: false,
          message: "Xác thực CAPTCHA thất bại. Vui lòng thử lại."
        });
      }
    } catch (e) {
      console.error("CAPTCHA validation error:", e);
      return res.status(500).json({
        success: false,
        message: "Lỗi kết nối máy chủ xác thực. Vui lòng thử lại sau."
      });
    }

    const validationError = validateApplication({ jobId, fullName, email, phone, expectedSalary, note, cvFile, consent: purposeCore });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    // The DB has a FK on applications.job_id, but that only rejects a
    // nonexistent job with an opaque 500 — and doesn't stop applying to a
    // job that's been closed (status != active). Check both explicitly.
    const job = await Job.getById(Number(jobId));
    if (!job || job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Vi tri ung tuyen khong ton tai hoac da ngung tuyen."
      });
    }

    if (cvFile && cvFile.buffer) {
      const fileTypeFromBuffer = await getFileTypeFromBuffer();
      const type = await fileTypeFromBuffer(cvFile.buffer);
      const lowerName = cvFile.originalname.toLowerCase();

      if (lowerName.endsWith(".pdf") && (!type || type.ext !== "pdf")) {
        return res.status(400).json({
          success: false,
          message: "Hệ thống phát hiện file PDF không hợp lệ hoặc có dấu hiệu giả mạo."
        });
      }

      // .doc/.docx signature checks only fire on a definite mismatch — file-type
      // can't always resolve older .doc's OLE subtype, and we don't want to
      // reject a legitimate file just because detection came back empty.
      if (lowerName.endsWith(".docx") && type && type.ext !== "docx") {
        return res.status(400).json({
          success: false,
          message: "Hệ thống phát hiện file DOCX không hợp lệ hoặc có dấu hiệu giả mạo."
        });
      }

      if (lowerName.endsWith(".doc") && type && type.ext !== "doc" && type.ext !== "cfb") {
        return res.status(400).json({
          success: false,
          message: "Hệ thống phát hiện file DOC không hợp lệ hoặc có dấu hiệu giả mạo."
        });
      }

      const executableExts = ["exe", "msi", "elf", "dll", "cab", "rpm", "deb", "dmg", "sys"];
      if (type && executableExts.includes(type.ext)) {
        return res.status(400).json({
          success: false,
          message: "File tải lên chứa định dạng thực thi nguy hiểm. Yêu cầu bị từ chối."
        });
      }

      const ext = ALLOWED_EXTENSIONS.find((extension) => lowerName.endsWith(extension));
      cvFile.mimetype = SAFE_MIME_TYPES[ext] || "application/octet-stream";
    }

    const cvStorage = await storeCv(cvFile);
    let application;

    try {
      application = await Application.create({
        jobId: Number(jobId),
        fullName,
        email,
        phone,
        expectedSalary: expectedSalary || null,
        note: note || null,
        cvFile,
        cvStorage,
        consentAcceptedAt: new Date(),
        consentPolicyVersion: PRIVACY_POLICY_VERSION,
        policyCode: POLICY_CODE,
        consentIp: req.ip,
        purposeCore,
        purposeTalentPool
      });
    } catch (error) {
      await deleteStoredCv(cvStorage);
      throw error;
    }


    const cvIsMailRelay = cvStorage.provider === "sharepoint_relay";

    if (cvIsMailRelay) {
      try {
        await sendApplicationEmails(application, cvFile, cvStorage);
      } catch (error) {
        console.error("Critical: CV mail-relay delivery failed, rolling back application:", error);
        await Application.remove(application.id);
        return res.status(502).json({
          success: false,
          message: "Khong the gui ho so ung tuyen luc nay. Vui long thu lai sau it phut."
        });
      }
    } else {
      sendApplicationEmails(application, cvFile, cvStorage).catch((error) => {
        console.error("Failed to send application emails:", error);
      });
    }

    res.status(201).json({
      success: true,
      message: "Ho so ung tuyen da duoc ghi nhan.",
      data: application
    });
  } catch (error) {
    console.error("POST /api/apply failed:", error);
    res.status(500).json({
      success: false,
      message: "Khong the gui ho so ung tuyen luc nay."
    });
  }
}

function validateApplication({ jobId, fullName, email, phone, expectedSalary, note, cvFile, consent }) {
  if (!jobId || Number.isNaN(Number(jobId))) return "Vui long chon vi tri ung tuyen.";
  if (!consent) return "Vui long dong y voi Quy dinh Bao mat truoc khi gui ho so.";
  if (!fullName) return "Vui long nhap ho va ten.";
  if (isTooLong(fullName, 255)) return "Ho va ten qua dai.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email chua hop le.";
  if (isTooLong(email, 255)) return "Email qua dai.";
  if (!phone || !/^[0-9+\-\s().]{8,18}$/.test(phone)) return "So dien thoai chua hop le.";
  if (isTooLong(expectedSalary, 100)) return "Muc luong ky vong qua dai.";
  if (isTooLong(note, 3000)) return "Ghi chu qua dai (toi da 3000 ky tu).";
  if (!cvFile) return "Vui long dinh kem CV.";

  const lowerName = cvFile.originalname.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  if (!hasValidExtension) return "CV chi chap nhan PDF, DOC hoac DOCX.";

  return "";
}

module.exports = {
  submitApplication
};
