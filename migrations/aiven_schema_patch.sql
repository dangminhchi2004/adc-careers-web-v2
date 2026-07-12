-- ADC Careers - Aiven MySQL schema patch
-- Run this in MySQL Workbench while connected to the Aiven database.
-- It only adds missing tables, columns, and indexes. It does not drop data.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  expected_salary VARCHAR(100),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX job_id (job_id),
  CONSTRAINT applications_ibfk_1 FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  UNIQUE KEY username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_missing $$
CREATE PROCEDURE add_column_if_missing(
  IN table_name_value VARCHAR(64),
  IN column_name_value VARCHAR(64),
  IN column_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND COLUMN_NAME = column_name_value
  ) THEN
    SET @ddl = CONCAT(
      'ALTER TABLE `', table_name_value, '` ADD COLUMN `',
      column_name_value, '` ', column_definition_value
    );
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DROP PROCEDURE IF EXISTS add_index_if_missing $$
CREATE PROCEDURE add_index_if_missing(
  IN table_name_value VARCHAR(64),
  IN index_name_value VARCHAR(64),
  IN index_definition_value TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name_value
      AND INDEX_NAME = index_name_value
  ) THEN
    SET @ddl = CONCAT('ALTER TABLE `', table_name_value, '` ADD ', index_definition_value);
    PREPARE stmt FROM @ddl;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END $$

DELIMITER ;

CALL add_column_if_missing('jobs', 'slug', 'VARCHAR(180) NULL');
CALL add_column_if_missing('jobs', 'summary', 'TEXT NULL');
CALL add_column_if_missing('jobs', 'employment_type', 'VARCHAR(80) DEFAULT ''Full-time''');
CALL add_column_if_missing('jobs', 'work_location', 'VARCHAR(255) DEFAULT ''KCN Tan Tao, Binh Tan, TP.HCM''');
CALL add_column_if_missing('jobs', 'location_short', 'VARCHAR(100) DEFAULT ''TP.HCM''');
CALL add_column_if_missing('jobs', 'salary_text', 'VARCHAR(255) DEFAULT ''Thoa thuan theo nang luc''');
CALL add_column_if_missing('jobs', 'deadline', 'DATE NULL');
CALL add_column_if_missing('jobs', 'quantity', 'INT DEFAULT 1');
CALL add_column_if_missing('jobs', 'age_range', 'VARCHAR(50) NULL');
CALL add_column_if_missing('jobs', 'gender', 'VARCHAR(50) NULL');
CALL add_column_if_missing('jobs', 'experience_text', 'VARCHAR(255) NULL');
CALL add_column_if_missing('jobs', 'industry', 'VARCHAR(255) NULL');
CALL add_column_if_missing('jobs', 'published_at', 'DATE NULL');
CALL add_column_if_missing('jobs', 'responsibilities', 'JSON NULL');
CALL add_column_if_missing('jobs', 'requirements_detail', 'JSON NULL');
CALL add_column_if_missing('jobs', 'benefits', 'JSON NULL');
CALL add_column_if_missing('jobs', 'environment_sections', 'JSON NULL');
CALL add_column_if_missing('jobs', 'status', 'VARCHAR(20) DEFAULT ''active''');
CALL add_index_if_missing('jobs', 'slug', 'UNIQUE KEY `slug` (`slug`)');

CALL add_column_if_missing('applications', 'note', 'TEXT NULL');
CALL add_column_if_missing('applications', 'cv_original_name', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_file_name', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_file_path', 'VARCHAR(500) NULL');
CALL add_column_if_missing('applications', 'cv_mime_type', 'VARCHAR(120) NULL');
CALL add_column_if_missing('applications', 'cv_size', 'INT NULL');
CALL add_column_if_missing('applications', 'cv_storage_provider', 'VARCHAR(40) DEFAULT ''local''');
CALL add_column_if_missing('applications', 'cv_drive_id', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_drive_item_id', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_web_url', 'VARCHAR(1000) NULL');
CALL add_column_if_missing('applications', 'cv_onedrive_path', 'VARCHAR(1000) NULL');
CALL add_column_if_missing('applications', 'cv_external_id', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_external_parent_id', 'VARCHAR(255) NULL');
CALL add_column_if_missing('applications', 'cv_external_url', 'VARCHAR(1000) NULL');
CALL add_column_if_missing('applications', 'cv_storage_path', 'VARCHAR(1000) NULL');
CALL add_column_if_missing('applications', 'status', 'VARCHAR(40) DEFAULT ''new''');

UPDATE applications
SET cv_storage_provider = 'local'
WHERE id IS NOT NULL
  AND (cv_storage_provider IS NULL OR cv_storage_provider = '');

UPDATE applications
SET status = 'new'
WHERE id IS NOT NULL
  AND (status IS NULL OR status = '');

UPDATE jobs
SET status = 'active'
WHERE id IS NOT NULL
  AND (status IS NULL OR status = '');

UPDATE jobs
SET
  slug = CASE
    WHEN slug IS NULL OR slug = ''
      THEN CONCAT(LOWER(REPLACE(REPLACE(REPLACE(title, '&', 'and'), ' ', '-'), '/', '-')), '-', id)
    ELSE slug
  END,
  summary = COALESCE(summary, CONCAT('Co hoi dong hanh cung ADC trong vai tro ', vn, '.')),
  employment_type = COALESCE(employment_type, 'Full-time'),
  work_location = COALESCE(work_location, 'KCN Tan Tao, Binh Tan, TP.HCM'),
  location_short = COALESCE(location_short, 'TP.HCM'),
  salary_text = COALESCE(salary_text, 'Thoa thuan theo nang luc'),
  quantity = COALESCE(quantity, 1),
  experience_text = COALESCE(experience_text, JSON_UNQUOTE(JSON_EXTRACT(reqs, '$[0]'))),
  industry = COALESCE(industry, dept),
  requirements_detail = COALESCE(requirements_detail, reqs)
WHERE id IS NOT NULL;

DROP PROCEDURE IF EXISTS add_column_if_missing;
DROP PROCEDURE IF EXISTS add_index_if_missing;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Aiven schema patch completed' AS message;
