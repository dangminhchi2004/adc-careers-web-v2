const db = require("./db");

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
      status VARCHAR(40) DEFAULT 'new',
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  await addColumnIfMissing("applications", "note", "TEXT");
  await addColumnIfMissing("applications", "cv_original_name", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_file_name", "VARCHAR(255)");
  await addColumnIfMissing("applications", "cv_file_path", "VARCHAR(500)");
  await addColumnIfMissing("applications", "cv_mime_type", "VARCHAR(120)");
  await addColumnIfMissing("applications", "cv_size", "INT");
  await addColumnIfMissing("applications", "status", "VARCHAR(40) DEFAULT 'new'");
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
