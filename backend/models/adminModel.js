const db = require("../config/db");

const Admin = {
  getByUsername: async (username) => {
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
    return rows[0] || null;
  },
  
  updatePassword: async (username, passwordHash) => {
    // Bumping token_version invalidates every JWT issued before this change,
    // so a stolen token stops working the moment the password is rotated.
    await db.query(
      "UPDATE admins SET password_hash = ?, token_version = token_version + 1 WHERE username = ?",
      [passwordHash, username]
    );
  }
};

module.exports = Admin;
