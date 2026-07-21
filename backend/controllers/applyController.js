const Application = require("../models/applyModel");
const { deleteStoredCv, storeCv } = require("../services/cvStorageService");
const fileType = require("file-type");

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

async function submitApplication(req, res) {
  try {
    const { jobId, fullName, email, phone, expectedSalary, note } = req.body;
    const cvFile = req.file;

    const validationError = validateApplication({ jobId, fullName, email, phone, cvFile });
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError
      });
    }

    if (cvFile && cvFile.buffer) {
      const type = await fileType.fromBuffer(cvFile.buffer);
      
      const lowerName = cvFile.originalname.toLowerCase();
      if (lowerName.endsWith(".pdf") && (!type || type.ext !== "pdf")) {
        return res.status(400).json({
          success: false,
          message: "Hệ thống phát hiện file PDF không hợp lệ hoặc có dấu hiệu giả mạo."
        });
      }

      const executableExts = ["exe", "msi", "elf", "dll", "cab", "rpm", "deb", "dmg", "sys"];
      if (type && executableExts.includes(type.ext)) {
        return res.status(400).json({
          success: false,
          message: "File tải lên chứa định dạng thực thi nguy hiểm. Yêu cầu bị từ chối."
        });
      }
    }

    const cvStorage = await storeCv(cvFile);
    let application;

    try {
      application = await Application.create({
        jobId: Number(jobId),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        expectedSalary: expectedSalary ? expectedSalary.trim() : null,
        note: note ? note.trim() : null,
        cvFile,
        cvStorage
      });
    } catch (error) {
      await deleteStoredCv(cvStorage);
      throw error;
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

function validateApplication({ jobId, fullName, email, phone, cvFile }) {
  if (!jobId || Number.isNaN(Number(jobId))) return "Vui long chon vi tri ung tuyen.";
  if (!fullName || !fullName.trim()) return "Vui long nhap ho va ten.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Email chua hop le.";
  if (!phone || !/^[0-9+\-\s().]{8,18}$/.test(phone)) return "So dien thoai chua hop le.";
  if (!cvFile) return "Vui long dinh kem CV.";

  const lowerName = cvFile.originalname.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension));
  if (!hasValidExtension) return "CV chi chap nhan PDF, DOC hoac DOCX.";

  return "";
}

module.exports = {
  submitApplication
};
