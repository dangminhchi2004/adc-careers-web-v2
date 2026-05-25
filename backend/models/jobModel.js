const db = require("../config/db");

const Job = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM jobs ORDER BY created_at DESC");
    return rows.map(normalizeJob);
  },

  getAllActive: async () => {
    const [rows] = await db.query('SELECT * FROM jobs WHERE status = "active" ORDER BY created_at DESC');
    return rows.map(normalizeJob);
  },

  create: async (job) => {
    const [result] = await db.query(
      `INSERT INTO jobs
        (title, vn, dept, level, report, urgent, color, reqs, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        job.title,
        job.vn,
        job.dept,
        job.level,
        job.report,
        job.urgent ? 1 : 0,
        job.color || "#2196F3",
        JSON.stringify(parseRequirements(job.reqs)),
        job.status || "active"
      ]
    );

    return Job.getById(result.insertId);
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
    return rows[0] ? normalizeJob(rows[0]) : null;
  },

  update: async (id, job) => {
    await db.query(
      `UPDATE jobs
       SET title = ?,
           vn = ?,
           dept = ?,
           level = ?,
           report = ?,
           urgent = ?,
           color = ?,
           reqs = ?,
           status = ?
       WHERE id = ?`,
      [
        job.title,
        job.vn,
        job.dept,
        job.level,
        job.report,
        job.urgent ? 1 : 0,
        job.color || "#2196F3",
        JSON.stringify(parseRequirements(job.reqs)),
        job.status || "active",
        id
      ]
    );

    return Job.getById(id);
  },

  remove: async (id) => {
    const [result] = await db.query("DELETE FROM jobs WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

function normalizeJob(row) {
  return {
    ...row,
    urgent: Boolean(row.urgent),
    reqs: parseRequirements(row.reqs)
  };
}

function parseRequirements(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

module.exports = Job;
