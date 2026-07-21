const db = require("../config/db");

const AuditLog = {
  create: async ({ action, username, entityType = null, entityId = null, details = null, ipAddress = null }) => {
    const detailsJson = details ? JSON.stringify(details) : null;
    const [result] = await db.query(
      `INSERT INTO audit_logs (action, username, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [action, username, entityType, entityId, detailsJson, ipAddress]
    );
    return result.insertId;
  },

  getAll: async (limit = 100, offset = 0) => {
    const [rows] = await db.query(
      `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }
};

module.exports = AuditLog;
