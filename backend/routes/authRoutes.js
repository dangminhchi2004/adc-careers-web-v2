const express = require("express");
const { login, changePassword } = require("../controllers/authController");
const { loginLimiter, changePasswordLimiter } = require("../middlewares/rateLimitMiddleware");
const { requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.put("/password", requireAdmin, changePasswordLimiter, changePassword);

module.exports = router;
