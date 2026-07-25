const MIN_LENGTH = 12;
const MAX_LENGTH = 128;

// Small blocklist of passwords that are weak/guessable regardless of length
// (default credentials, keyboard walks, common patterns). Not exhaustive —
// this is a baseline check per OWASP ASVS V2.1.7, not a full breach-list lookup.
const COMMON_WEAK_PASSWORDS = [
  "admin123",
  "password",
  "password123",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "letmein123",
  "admin@123",
  "changeme123"
];

function validatePasswordStrength(password, username) {
  if (!password || typeof password !== "string") {
    return "Mat khau moi la bat buoc.";
  }

  if (password.length < MIN_LENGTH) {
    return `Mat khau moi phai co it nhat ${MIN_LENGTH} ky tu.`;
  }

  if (password.length > MAX_LENGTH) {
    return `Mat khau moi khong duoc vuot qua ${MAX_LENGTH} ky tu.`;
  }

  if (COMMON_WEAK_PASSWORDS.includes(password.toLowerCase())) {
    return "Mat khau nay qua pho bien va de bi do. Vui long chon mat khau khac.";
  }

  if (username && password.toLowerCase().includes(String(username).toLowerCase())) {
    return "Mat khau khong duoc chua ten dang nhap.";
  }

  return null;
}

module.exports = {
  validatePasswordStrength
};
