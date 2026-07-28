const db = require("../config/db");

const Application = {
  create: async ({
    jobId,
    fullName,
    email,
    phone,
    expectedSalary,
    note,
    cvFile,
    cvStorage,
    consentAcceptedAt,
    consentPolicyVersion,
    policyCode,
    consentIp,
    purposeCore,
    purposeTalentPool
  }) => {
    const policyVer = consentPolicyVersion || "3.0";
    const polCode = policyCode || "ADC.IFR.PO.CS.01";
    const isPurposeCore = purposeCore ? 1 : 1;
    const isPurposeTalentPool = purposeTalentPool ? 1 : 0;
    const timestamp = consentAcceptedAt || new Date();

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
          cv_storage_path,
          consent_accepted_at,
          consent_policy_version,
          policy_code,
          purpose_core,
          purpose_talent_pool,
          consent_ip
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        cvStorage ? cvStorage.storagePath : null,
        timestamp,
        policyVer,
        polCode,
        isPurposeCore,
        isPurposeTalentPool,
        consentIp || null
      ]
    );

    const insertedId = result.insertId;

    // Independent consent record for dispute evidence & audit compliance (Law 91/2025/QH15 & Decree 356/2025/ND-CP)
    try {
      await db.query(
        `INSERT INTO consent_logs
          (application_id, applicant_email, applicant_name, consent_timestamp, consent_ip, policy_code, policy_version, purpose_core, purpose_talent_pool)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          insertedId,
          email,
          fullName,
          timestamp,
          consentIp || null,
          polCode,
          policyVer,
          isPurposeCore,
          isPurposeTalentPool
        ]
      );
    } catch (e) {
      console.error("Failed to insert independent consent_log:", e);
    }

    return Application.getById(insertedId);
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
  },

  remove: async (id) => {
    const [result] = await db.query("DELETE FROM applications WHERE id = ?", [id]);
    return result.affectedRows > 0;
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
      a.consent_accepted_at AS consentAcceptedAt,
      a.consent_policy_version AS consentPolicyVersion,
      a.policy_code AS policyCode,
      a.purpose_core AS purposeCore,
      a.purpose_talent_pool AS purposeTalentPool,
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

