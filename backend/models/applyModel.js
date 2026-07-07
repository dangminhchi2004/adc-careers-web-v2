const db = require("../config/db");

const Application = {
  create: async ({ jobId, fullName, email, phone, expectedSalary, note, cvFile, cvStorage }) => {
    const [result] = await db.query(
      `INSERT INTO applications
        (
          job_id,
          full_name,
          email,
          phone,
          expected_salary,
          note,
          cv_original_name,
          cv_file_name,
          cv_file_path,
          cv_mime_type,
          cv_size,
          cv_storage_provider,
          cv_drive_id,
          cv_drive_item_id,
          cv_web_url,
          cv_onedrive_path,
          cv_external_id,
          cv_external_parent_id,
          cv_external_url,
          cv_storage_path
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        fullName,
        email,
        phone,
        expectedSalary || null,
        note || null,
        cvFile ? cvFile.originalname : null,
        cvStorage ? cvStorage.fileName : null,
        cvStorage ? cvStorage.filePath : null,
        cvStorage ? cvStorage.mimeType : cvFile ? cvFile.mimetype : null,
        cvStorage ? cvStorage.size : cvFile ? cvFile.size : null,
        cvStorage ? cvStorage.provider : "local",
        cvStorage ? cvStorage.driveId : null,
        cvStorage ? cvStorage.driveItemId : null,
        cvStorage ? cvStorage.webUrl : null,
        cvStorage ? cvStorage.oneDrivePath : null,
        cvStorage ? cvStorage.externalId : null,
        cvStorage ? cvStorage.externalParentId : null,
        cvStorage ? cvStorage.externalUrl : null,
        cvStorage ? cvStorage.storagePath : null
      ]
    );

    return Application.getById(result.insertId);
  },

  getById: async (id) => {
    const [rows] = await db.query(applicationSelectSql("WHERE a.id = ?"), [id]);
    return rows[0] || null;
  },

  getAll: async () => {
    const [rows] = await db.query(applicationSelectSql("ORDER BY a.applied_at DESC"));
    return rows;
  },

  updateStatus: async (id, status) => {
    await db.query("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
    return Application.getById(id);
  }
};

function applicationSelectSql(tailSql) {
  return `
    SELECT
      a.id,
      a.job_id AS jobId,
      a.full_name AS fullName,
      a.email,
      a.phone,
      a.expected_salary AS expectedSalary,
      a.note,
      a.cv_original_name AS cvOriginalName,
      a.cv_file_name AS cvFileName,
      a.cv_file_path AS cvFilePath,
      a.cv_mime_type AS cvMimeType,
      a.cv_size AS cvSize,
      a.cv_storage_provider AS cvStorageProvider,
      a.cv_drive_id AS cvDriveId,
      a.cv_drive_item_id AS cvDriveItemId,
      a.cv_web_url AS cvWebUrl,
      a.cv_onedrive_path AS cvOneDrivePath,
      a.cv_external_id AS cvExternalId,
      a.cv_external_parent_id AS cvExternalParentId,
      a.cv_external_url AS cvExternalUrl,
      a.cv_storage_path AS cvStoragePath,
      a.status,
      a.applied_at AS appliedAt,
      j.title AS jobTitle,
      j.vn AS jobTitleVn,
      j.dept AS jobDept
    FROM applications a
    LEFT JOIN jobs j ON j.id = a.job_id
    ${tailSql}
  `;
}

module.exports = Application;
