const Application = require("../models/applyModel");
const { deleteStoredCv, storeCv } = require("../services/cvStorageService");
const { sendApplicationEmails } = require("../services/mailService");
const fileType = require("file-type");

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx"];

async function submitApplication(req, res) {
  try {
    const { jobId, fullName, email, phone, expectedSalary, note, captchaToken } = req.body;
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
