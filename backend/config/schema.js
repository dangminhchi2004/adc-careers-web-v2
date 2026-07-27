const db = require("./db");
const bcrypt = require("bcryptjs");

async function ensureSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      vn VARCHAR(255) NOT NULL,
      dept VARCHAR(100) NOT NULL,
      level VARCHAR(100) NOT NULL,
      report VARCHAR(100) NOT NULL,
      urgent TINYINT(1) DEFAULT 0,
      color VARCHAR(7) DEFAULT '#2196F3',
      reqs JSON NOT NULL,
      slug VARCHAR(180) UNIQUE,
      summary TEXT,
      employment_type VARCHAR(80) DEFAULT 'Full-time',
      work_location VARCHAR(255) DEFAULT 'KCN Tân Tạo, Bình Tân, TP.HCM',
      location_short VARCHAR(100) DEFAULT 'TP.HCM',
      salary_text VARCHAR(255) DEFAULT 'Thỏa thuận theo năng lực',
      deadline DATE,
      quantity INT DEFAULT 1,
      age_range VARCHAR(50),
      gender VARCHAR(50),
      experience_text VARCHAR(255),
      industry VARCHAR(255),
      published_at DATE,
      responsibilities JSON,
      requirements_detail JSON,
      benefits JSON,
      environment_sections JSON,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS applications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      job_id INT NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      expected_salary VARCHAR(100),
      note TEXT,
      cv_original_name VARCHAR(255),
      cv_file_name VARCHAR(255),
      cv_file_path VARCHAR(500),
      cv_mime_type VARCHAR(120),
      cv_size INT,
      cv_storage_provider VARCHAR(40) DEFAULT 'local',
      cv_drive_id VARCHAR(255),
      cv_drive_item_id VARCHAR(255),
      cv_web_url VARCHAR(1000),
      cv_onedrive_path VARCHAR(1000),
      cv_external_id VARCHAR(255),
      cv_external_parent_id VARCHAR(255),
      cv_external_url VARCHAR(1000),
      cv_storage_path VARCHAR(1000),
      status VARCHAR(40) DEFAULT 'new',
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing("jobs", "status", "VARCHAR(20) DEFAULT 'active'");

  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      action VARCHAR(100) NOT NULL,
      username VARCHAR(255) NOT NULL,
      entity_type VARCHAR(100),
      entity_id INT,
      details JSON,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      token_version INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [adminRows] = await db.query("SELECT COUNT(*) AS count FROM admins");
  if (adminRows[0].count === 0) {
    if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
      throw new Error(
        "ADMIN_USERNAME and ADMIN_PASSWORD must be set in the environment to seed the initial admin account."
      );
    }
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [process.env.ADMIN_USERNAME, hash]);
    console.log("Seeded default admin user.");
  }

  await addColumnIfMissing("jobs", "slug", "VARCHAR(180) UNIQUE");
  await addColumnIfMissing("jobs", "summary", "TEXT");
  await addColumnIfMissing("jobs", "employment_type", "VARCHAR(80) DEFAULT 'Full-time'");
  await addColumnIfMissing("jobs", "work_location", "VARCHAR(255) DEFAULT 'KCN Tân Tạo, Bình Tân, TP.HCM'");
  await addColumnIfMissing("jobs", "location_short", "VARCHAR(100) DEFAULT 'TP.HCM'");
  await addColumnIfMissing("jobs", "salary_text", "VARCHAR(255) DEFAULT 'Thỏa thuận theo năng lực'");
  await addColumnIfMissing("jobs", "deadline", "DATE");
  await addColumnIfMissing("jobs", "quantity", "INT DEFAULT 1");
  await addColumnIfMissing("jobs", "age_range", "VARCHAR(50)");
  await addColumnIfMissing("jobs", "gender", "VARCHAR(50)");
  await addColumnIfMissing("jobs", "experience_text", "VARCHAR(255)");
  await addColumnIfMissing("jobs", "industry", "VARCHAR(255)");
  await addColumnIfMissing("jobs", "published_at", "DATE");
  await addColumnIfMissing("jobs", "responsibilities", "JSON");
  await addColumnIfMissing("jobs", "requirements_detail", "JSON");
  await addColumnIfMissing("jobs", "benefits", "JSON");
  await addColumnIfMissing("jobs", "environment_sections", "JSON");
  await addColumnIfMissing("applications", "note", "TEXT");
  await addColumnIfMissing("applications", "cv_original_name", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_file_name", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_file_path", "VARCHAR(500)");
  await addColumnIfMissing("applications", "cv_mime_type", "VARCHAR(120)");
  await addColumnIfMissing("applications", "cv_size", "INT");
  await addColumnIfMissing("applications", "cv_storage_provider", "VARCHAR(40) DEFAULT 'local'");
  await addColumnIfMissing("applications", "cv_drive_id", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_drive_item_id", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_web_url", "VARCHAR(1000)");
  await addColumnIfMissing("applications", "cv_onedrive_path", "VARCHAR(1000)");
  await addColumnIfMissing("applications", "cv_external_id", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_external_parent_id", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_external_url", "VARCHAR(1000)");
  await addColumnIfMissing("applications", "cv_storage_path", "VARCHAR(1000)");
  await addColumnIfMissing("applications", "status", "VARCHAR(40) DEFAULT 'new'");
  await addColumnIfMissing("admins", "token_version", "INT DEFAULT 0");
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (rows.length === 0) {
    await db.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

module.exports = {
  ensureSchema
};
