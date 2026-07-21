const rateLimit = require("express-rate-limit");

// Giới hạn API nộp hồ sơ (apply)
// Cho phép tối đa 5 lần nộp hồ sơ từ cùng 1 IP trong vòng 15 phút
const applyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 5,
  message: {
    success: false,
    message: "Bạn đã nộp hồ sơ quá nhiều lần. Vui lòng thử lại sau 15 phút."
  },
  standardHeaders: true, // Trả về RateLimit headers (Draft-7)
  legacyHeaders: false, // Tắt các header cũ X-RateLimit-*
});

// Giới hạn API đăng nhập (login)
// Chống Brute Force: Tối đa 10 lần thử trong 30 phút
const loginLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 phút
  max: 10,
  message: {
    success: false,
    message: "Bạn đã nhập sai mật khẩu quá nhiều lần. Vui lòng thử lại sau 30 phút."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  applyLimiter,
  loginLimiter
};
