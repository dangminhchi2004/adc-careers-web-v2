const express = require("express");
const { login, changePassword, logout, me } = require("../controllers/authController");
const { loginLimiter, changePasswordLimiter } = require("../middlewares/rateLimitMiddleware");
const { requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/login", loginLimiter, login);
router.put("/password", requireAdmin, changePasswordLimiter, changePassword);
router.post("/logout", requireAdmin, logout);
router.get("/me", requireAdmin, me);

module.exports = router;
