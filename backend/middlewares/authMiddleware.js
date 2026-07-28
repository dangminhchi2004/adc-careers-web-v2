const jwt = require("jsonwebtoken");
const Admin = require("../models/adminModel");

async function requireAdmin(req, res, next) {
  // Browser flows now rely on the httpOnly cookie set at login (JS can't read
  // it, so an XSS can't exfiltrate it); the Authorization header is kept as a
  // fallback purely for non-browser tooling (curl/Postman) that read the
  // Set-Cookie value directly — it doesn't reopen the cookie's XSS protection.
  const authHeader = req.headers.authorization || "";
  const headerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const token = headerToken || (req.cookies && req.cookies.adcAdminToken) || "";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Vui long dang nhap de tiep tuc."
    });
  }

  try {
    // Pin the accepted algorithm explicitly — without this, jsonwebtoken will
    // accept whatever algorithm the token's header claims, which is how
    // algorithm-confusion attacks (e.g. RS256/HS256 key confusion) work.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });

    // Compare against the account's current token_version so that changing the
    // password immediately invalidates any token issued before the change,
    // instead of leaving a stolen token valid until its 8h expiry.
    const admin = await Admin.getByUsername(decoded.username);
    if (!admin || (admin.token_version || 0) !== (decoded.tokenVersion || 0)) {
      return res.status(401).json({
        success: false,
        message: "Phien dang nhap da het han."
      });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Phien dang nhap da het han."
    });
  }
}

module.exports = {
  requireAdmin
};
