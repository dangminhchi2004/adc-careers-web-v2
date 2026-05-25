const jwt = require("jsonwebtoken");

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Vui long dang nhap de tiep tuc."
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "adc_careers_local_secret");
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
