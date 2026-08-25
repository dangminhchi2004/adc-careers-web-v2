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
      display_mode VARCHAR(20) NOT NULL DEFAULT 'standard',
      poster_image LONGBLOB NULL,
      poster_mime_type VARCHAR(100) NULL,
      poster_size INT NULL,
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
      consent_accepted_at TIMESTAMP NULL,
      consent_policy_version VARCHAR(20),
      consent_ip VARCHAR(50),
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
  await addColumnIfMissing("jobs", "display_mode", "VARCHAR(20) NOT NULL DEFAULT 'standard'");
  await addColumnIfMissing("jobs", "poster_image", "LONGBLOB NULL");
  await addColumnIfMissing("jobs", "poster_mime_type", "VARCHAR(100) NULL");
  await addColumnIfMissing("jobs", "poster_size", "INT NULL");
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

  await db.query(`
    CREATE TABLE IF NOT EXISTS consent_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      application_id INT NULL,
      applicant_email VARCHAR(255) NOT NULL,
      applicant_name VARCHAR(255) NOT NULL,
      consent_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      consent_ip VARCHAR(50),
      policy_code VARCHAR(50) DEFAULT 'ADC.IFR.PO.CS.01',
      policy_version VARCHAR(20) DEFAULT '3.0',
      purpose_core TINYINT(1) NOT NULL DEFAULT 1,
      purpose_talent_pool TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing("applications", "policy_code", "VARCHAR(50) DEFAULT 'ADC.IFR.PO.CS.01'");
  await addColumnIfMissing("applications", "purpose_core", "TINYINT(1) DEFAULT 1");
  await addColumnIfMissing("applications", "purpose_talent_pool", "TINYINT(1) DEFAULT 0");
  await addColumnIfMissing("applications", "consent_accepted_at", "TIMESTAMP NULL");
  await addColumnIfMissing("applications", "consent_policy_version", "VARCHAR(20)");
  await addColumnIfMissing("applications", "consent_ip", "VARCHAR(50)");
  await addColumnIfMissing("admins", "token_version", "INT DEFAULT 0");

  // BLOCKS (KHỐI) TABLE
  await db.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // DEPARTMENTS TABLE
  await db.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await addColumnIfMissing("departments", "block_id", "INT NULL");

  // JOB LEVELS TABLE
  await db.query(`
    CREATE TABLE IF NOT EXISTS job_levels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default blocks
  const [blockRows] = await db.query("SELECT COUNT(*) AS count FROM blocks");
  if (blockRows[0].count === 0) {
    const defaultBlocks = [
      { name: 'Khối Sản xuất & Vận hành', description: 'Các phòng ban vận hành nhà máy và quản lý sản xuất' },
      { name: 'Khối Kinh doanh & Tiếp thị', description: 'Phát triển thị trường, bán hàng trong nước và xuất khẩu' },
      { name: 'Khối Kỹ thuật & Công nghệ', description: 'Nghiên cứu phát triển, cơ điện và tự động hóa' },
      { name: 'Khối Hỗ trợ Doanh nghiệp', description: 'Nhân sự (P&O), Tài chính kế toán, Chuỗi cung ứng' }
    ];
    for (const b of defaultBlocks) {
      await db.query("INSERT IGNORE INTO blocks (name, description) VALUES (?, ?)", [b.name, b.description]);
    }
  }

  // Seed default departments
  const [deptRows] = await db.query("SELECT COUNT(*) AS count FROM departments");
  if (deptRows[0].count === 0) {
    await db.query(`
      INSERT IGNORE INTO departments (name)
      SELECT DISTINCT dept FROM jobs WHERE dept IS NOT NULL AND dept != ''
    `);
    const defaultDepts = ['Khối Vận hành', 'People & Organization', 'Kinh doanh', 'Kỹ thuật', 'Tài chính - Kế toán', 'Chuỗi Cung ứng'];
    for (const d of defaultDepts) {
      await db.query("INSERT IGNORE INTO departments (name) VALUES (?)", [d]);
    }
  }

  // Seed default job levels
  const [levelRows] = await db.query("SELECT COUNT(*) AS count FROM job_levels");
  if (levelRows[0].count === 0) {
    await db.query(`
      INSERT IGNORE INTO job_levels (name)
      SELECT DISTINCT level FROM jobs WHERE level IS NOT NULL AND level != ''
    `);
    const defaultLevels = ['Senior Leadership', 'Management', 'Specialist', 'Senior', 'Staff / Entry'];
    for (const l of defaultLevels) {
      await db.query("INSERT IGNORE INTO job_levels (name) VALUES (?)", [l]);
    }
  }
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
