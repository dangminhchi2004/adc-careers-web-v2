const db = require("../config/db");

const Application = {
  create: async ({ jobId, fullName, email, phone, expectedSalary, note, cvFile }) => {
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
          cv_size
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        jobId,
        fullName,
        email,
        phone,
        expectedSalary || null,
        note || null,
        cvFile ? cvFile.originalname : null,
        cvFile ? cvFile.filename : null,
        cvFile ? `/uploads/cvs/${cvFile.filename}` : null,
        cvFile ? cvFile.mimetype : null,
        cvFile ? cvFile.size : null
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
