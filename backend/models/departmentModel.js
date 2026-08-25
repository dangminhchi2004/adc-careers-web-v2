const db = require("../config/db");

const Department = {
  getAll: async () => {
    const [rows] = await db.query(`
      SELECT d.id, d.name, d.description, d.block_id, b.name AS block_name, d.created_at 
      FROM departments d 
      LEFT JOIN blocks b ON d.block_id = b.id 
      ORDER BY d.name ASC
    `);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(`
      SELECT d.id, d.name, d.description, d.block_id, b.name AS block_name, d.created_at 
      FROM departments d 
      LEFT JOIN blocks b ON d.block_id = b.id 
      WHERE d.id = ?
    `, [id]);
    return rows[0] || null;
  },

  getByName: async (name) => {
    const [rows] = await db.query(`
      SELECT d.id, d.name, d.description, d.block_id, b.name AS block_name, d.created_at 
      FROM departments d 
      LEFT JOIN blocks b ON d.block_id = b.id 
      WHERE d.name = ?
    `, [name]);
    return rows[0] || null;
  },

  create: async ({ name, description, blockId }) => {
    const [result] = await db.query(
      "INSERT INTO departments (name, description, block_id) VALUES (?, ?, ?)",
      [name.trim(), description ? description.trim() : null, blockId ? Number(blockId) : null]
    );
    return Department.getById(result.insertId);
  },

  update: async (id, { name, description, blockId }) => {
    const oldDept = await Department.getById(id);
    
    await db.query(
      "UPDATE departments SET name = ?, description = ?, block_id = ? WHERE id = ?",
      [name.trim(), description ? description.trim() : null, blockId ? Number(blockId) : null, id]
    );

    if (oldDept && oldDept.name !== name.trim()) {
      await db.query("UPDATE jobs SET dept = ? WHERE dept = ?", [name.trim(), oldDept.name]);
    }

    return Department.getById(id);
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM departments WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Department;
