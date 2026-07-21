const db = require("../config/db");

const Admin = {
  getByUsername: async (username) => {
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
    return rows[0] || null;
  },
  
  updatePassword: async (username, passwordHash) => {
    await db.query("UPDATE admins SET password_hash = ? WHERE username = ?", [passwordHash, username]);
  }
};

module.exports = Admin;
