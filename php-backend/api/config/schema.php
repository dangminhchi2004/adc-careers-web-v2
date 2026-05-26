<?php

require_once __DIR__ . '/db.php';

function ensure_schema(): void
{
    $pdo = db();
    $pdo->exec("
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
    ");

    $pdo->exec("
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
    ");

    add_column_if_missing('applications', 'note', 'TEXT');
    add_column_if_missing('applications', 'cv_original_name', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_file_name', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_file_path', 'VARCHAR(500)');
    add_column_if_missing('applications', 'cv_mime_type', 'VARCHAR(120)');
    add_column_if_missing('applications', 'cv_size', 'INT');
    add_column_if_missing('applications', 'cv_storage_provider', "VARCHAR(40) DEFAULT 'local'");
    add_column_if_missing('applications', 'cv_drive_id', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_drive_item_id', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_web_url', 'VARCHAR(1000)');
    add_column_if_missing('applications', 'cv_onedrive_path', 'VARCHAR(1000)');
    add_column_if_missing('applications', 'cv_external_id', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_external_parent_id', 'VARCHAR(255)');
    add_column_if_missing('applications', 'cv_external_url', 'VARCHAR(1000)');
    add_column_if_missing('applications', 'cv_storage_path', 'VARCHAR(1000)');
    add_column_if_missing('applications', 'status', "VARCHAR(40) DEFAULT 'new'");
}

function add_column_if_missing(string $table, string $column, string $definition): void
{
    $stmt = db()->prepare("
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ");
    $stmt->execute([$table, $column]);

    if (!$stmt->fetch()) {
        db()->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
    }
}

