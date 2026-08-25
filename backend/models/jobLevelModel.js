const db = require("../config/db");

const JobLevel = {
  getAll: async () => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM job_levels ORDER BY name ASC");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM job_levels WHERE id = ?", [id]);
    return rows[0] || null;
  },

  getByName: async (name) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM job_levels WHERE name = ?", [name]);
    return rows[0] || null;
  },

  create: async ({ name, description }) => {
    const [result] = await db.query(
      "INSERT INTO job_levels (name, description) VALUES (?, ?)",
      [name.trim(), description ? description.trim() : null]
    );
    return JobLevel.getById(result.insertId);
  },

  update: async (id, { name, description }) => {
    const oldLevel = await JobLevel.getById(id);
    
    await db.query(
      "UPDATE job_levels SET name = ?, description = ? WHERE id = ?",
      [name.trim(), description ? description.trim() : null, id]
    );

    if (oldLevel && oldLevel.name !== name.trim()) {
      await db.query("UPDATE jobs SET level = ? WHERE level = ?", [name.trim(), oldLevel.name]);
    }

    return JobLevel.getById(id);
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM job_levels WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = JobLevel;
