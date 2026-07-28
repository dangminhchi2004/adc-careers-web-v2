const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const auditService = require("../services/auditService");
const Admin = require("../models/adminModel");
const { validatePasswordStrength } = require("../utils/passwordPolicy");

// Precomputed at startup so a nonexistent-username login still pays the same
// bcrypt cost as a real one below — otherwise the fast-path early-return for
// "no such admin" is a timing side-channel that lets an attacker enumerate
// valid usernames by measuring response time.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-attack-mitigation-dummy", 10);

const SESSION_COOKIE = "adcAdminToken";
const SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000; // keep in sync with the JWT's own 8h expiresIn

// httpOnly so client-side JS (and therefore any XSS) can never read the
// token; sameSite=strict plus the existing Origin-allowlist check in
// server.js together cover CSRF without needing a separate token exchange.
// secure is derived from req.secure (trust proxy is set) rather than a fixed
// env check, so it works both over plain http in local dev and https in prod.
function cookieOptions(req) {
  return {
    httpOnly: true,
    secure: req.secure,
    sameSite: "strict",
    path: "/"
  };
}

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

    // Always run bcrypt against a real hash — dummy when the account doesn't
    // exist — so response timing doesn't reveal whether the username is valid.
    const isValid = await bcrypt.compare(password, admin ? admin.password_hash : DUMMY_PASSWORD_HASH);

    if (!admin || !isValid) {
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

    res.cookie(SESSION_COOKIE, token, { ...cookieOptions(req), maxAge: SESSION_MAX_AGE_MS });
    res.json({
      success: true,
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

async function logout(req, res) {
  try {
    const username = req.user.username; // set by authMiddleware

    await Admin.bumpTokenVersion(username);
    auditService.logAction(req, "LOGOUT", "USER", null, { message: "Admin logout" });

    res.clearCookie(SESSION_COOKIE, cookieOptions(req));
    res.json({ success: true, message: "Da dang xuat." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ success: false, message: "Loi he thong." });
  }
}

function me(req, res) {
  // Lets the frontend ask "am I logged in" without being able to read the
  // httpOnly session cookie itself — used by auth-zone.js to skip the login
  // form when a valid session already exists.
  res.json({ success: true, user: { username: req.user.username, role: "admin" } });
}

module.exports = {
  login,
  changePassword,
  logout,
  me
};
