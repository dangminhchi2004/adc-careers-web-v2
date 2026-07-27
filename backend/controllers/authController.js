const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auditService = require("../services/auditService");
const Admin = require("../models/adminModel");
const { validatePasswordStrength } = require("../utils/passwordPolicy");

async function login(req, res) {
  try {
    const { username, password, captchaToken } = req.body;

    if (
      typeof username !== "string" || typeof password !== "string" ||
      !username.trim() || !password ||
      username.length > 255 || password.length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: "Sai tai khoan hoac mat khau."
      });
    }

    if (!captchaToken) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng xác thực bạn không phải là người máy."
      });
    }

    try {
      const secretKey = process.env.RECAPTCHA_SECRET_KEY;
      if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY is not configured. Refusing login request.");
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

    const admin = await Admin.getByUsername(username);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Sai tai khoan hoac mat khau."
      });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Sai tai khoan hoac mat khau."
      });
    }

    const token = jwt.sign(
      {
        username,
        role: "admin",
        tokenVersion: admin.token_version || 0
      },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "8h" }
    );

    req.user = { username }; // Set req.user manually for auditService
    auditService.logAction(req, "LOGIN", "USER", null, { message: "Admin login successful" });

    res.json({
      success: true,
      token,
      user: {
        username,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Loi he thong." });
  }
}

async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const username = req.user.username; // set by authMiddleware

    if (typeof oldPassword !== "string" || typeof newPassword !== "string" || !oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Vui long nhap day du mat khau." });
    }

    if (oldPassword.length > 128) {
      return res.status(400).json({ success: false, message: "Mat khau hien tai khong dung." });
    }

    const strengthError = validatePasswordStrength(newPassword, username);
    if (strengthError) {
      return res.status(400).json({ success: false, message: strengthError });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({ success: false, message: "Mat khau moi phai khac mat khau hien tai." });
    }

    const admin = await Admin.getByUsername(username);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Tai khoan khong ton tai." });
    }

    const isValid = await bcrypt.compare(oldPassword, admin.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Mat khau hien tai khong dung." });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await Admin.updatePassword(username, hash);

    auditService.logAction(req, "CHANGE_PASSWORD", "USER", admin.id, { message: "Password updated successfully" });

    res.json({ success: true, message: "Doi mat khau thanh cong." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Loi he thong." });
  }
}

module.exports = {
  login,
  changePassword
};
