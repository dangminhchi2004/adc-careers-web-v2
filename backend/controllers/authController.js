const jwt = require("jsonwebtoken");
const auditService = require("../services/auditService");

function login(req, res) {
  const { username, password } = req.body;
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (username !== expectedUsername || password !== expectedPassword) {
    return res.status(401).json({
      success: false,
      message: "Sai tai khoan hoac mat khau."
    });
  }

  const token = jwt.sign(
    {
      username,
      role: "admin"
    },
    process.env.JWT_SECRET || "adc_careers_local_secret",
    { expiresIn: "8h" }
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
}

module.exports = {
  login
};
