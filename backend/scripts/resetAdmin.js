require("dotenv").config();
const db = require("../config/db");
const bcrypt = require("bcryptjs");

async function resetAdmin() {
  try {
    const defaultUsername = process.env.ADMIN_USERNAME || "admin";
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";

    console.log(`Resetting password for admin user: ${defaultUsername}...`);
    
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [defaultUsername]);
    
    if (rows.length === 0) {
      await db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [defaultUsername, hash]);
      console.log("Admin user did not exist. Created a new one.");
    } else {
      await db.query("UPDATE admins SET password_hash = ? WHERE username = ?", [hash, defaultUsername]);
      console.log("Admin password has been reset successfully to the default value in .env.");
    }
  } catch (error) {
    console.error("Error resetting admin:", error);
  } finally {
    process.exit();
  }
}

resetAdmin();
