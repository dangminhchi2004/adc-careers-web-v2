const db = require("../config/db");

const Block = {
  getAll: async () => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM blocks ORDER BY name ASC");
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM blocks WHERE id = ?", [id]);
    return rows[0] || null;
  },

  getByName: async (name) => {
    const [rows] = await db.query("SELECT id, name, description, created_at FROM blocks WHERE name = ?", [name]);
    return rows[0] || null;
  },

  create: async ({ name, description }) => {
    const [result] = await db.query(
      "INSERT INTO blocks (name, description) VALUES (?, ?)",
      [name.trim(), description ? description.trim() : null]
    );
    return Block.getById(result.insertId);
  },

  update: async (id, { name, description }) => {
    await db.query(
      "UPDATE blocks SET name = ?, description = ? WHERE id = ?",
      [name.trim(), description ? description.trim() : null, id]
    );
    return Block.getById(id);
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM blocks WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

module.exports = Block;
