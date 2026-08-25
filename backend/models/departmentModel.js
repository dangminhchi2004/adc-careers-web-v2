const db = require("../config/db");

const Department = {
  getAll: async () => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM departments ORDER BY name ASC");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM departments WHERE id = ?", [id]);
    return rows[0] || null;
  },

  getByName: async (name) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM departments WHERE name = ?", [name]);
    return rows[0] || null;
  },

  create: async ({ name, description }) => {
    const [result] = await db.query(
      "INSERT INTO departments (name, description) VALUES (?, ?)",
      [name.trim(), description ? description.trim() : null]
    );
    return Department.getById(result.insertId);
  },

  update: async (id, { name, description }) => {
    await db.query(
      "UPDATE departments SET name = ?, description = ? WHERE id = ?",
      [name.trim(), description ? description.trim() : null, id]
    );
    return Department.getById(id);
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM departments WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Department;
