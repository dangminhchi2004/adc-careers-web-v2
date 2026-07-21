const AuditLog = require("../models/auditModel");

const auditService = {
  logAction: async (req, action, entityType = null, entityId = null, details = null) => {
    try {
      // req.user is set by authMiddleware
      const username = req.user ? req.user.username : "system";
      // req.ip works in express if trust proxy is configured or directly
      let ipAddress = req.ip || req.connection.remoteAddress;

      // Extract IPv4 if it's IPv6 mapped IPv4
      if (ipAddress && ipAddress.includes("::ffff:")) {
        ipAddress = ipAddress.split("::ffff:")[1];
      }

      await AuditLog.create({
        action,
        username,
        entityType,
        entityId,
        details,
        ipAddress
      });
    } catch (error) {
      console.error("Failed to write audit log:", error);
      // We don't throw here to avoid failing the main request if logging fails
    }
  }
};

module.exports = auditService;
