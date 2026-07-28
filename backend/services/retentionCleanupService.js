const db = require("../config/db");
const { deleteStoredCv } = require("./cvStorageService");

async function runRetentionCleanup() {
  console.log("[Retention Cleanup] Starting periodic cleanup job...");
  let stats = {
    purgedTalentPoolFalseApps: 0,
    purgedTalentPoolTrueApps: 0,
    purgedAuditLogs: 0,
    purgedConsentLogs: 0
  };

  try {
    // 1. purpose_talent_pool = false và đợt tuyển dụng đã đóng quá 30 ngày => Xóa hồ sơ và CV
    const [shortTermApps] = await db.query(`
      SELECT a.id, a.cv_storage_provider, a.cv_file_path, a.cv_drive_id, a.cv_drive_item_id, a.cv_onedrive_path
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      WHERE (a.purpose_talent_pool = 0 OR a.purpose_talent_pool IS NULL)
        AND j.status = 'closed'
        AND j.created_at < NOW() - INTERVAL 30 DAY
    `);

    for (const app of shortTermApps) {
      try {
        await deleteStoredCv({
          provider: app.cv_storage_provider,
          filePath: app.cv_file_path,
          driveId: app.cv_drive_id,
          driveItemId: app.cv_drive_item_id,
          oneDrivePath: app.cv_onedrive_path
        });
      } catch (err) {
        console.error(`[Retention Cleanup] Failed to delete CV for application ${app.id}:`, err);
      }
      await db.query("DELETE FROM applications WHERE id = ?", [app.id]);
      stats.purgedTalentPoolFalseApps++;
    }

    // 2. purpose_talent_pool = true và quá 12 tháng kể từ ngày nộp => Xóa hồ sơ và CV
    const [longTermApps] = await db.query(`
      SELECT id, cv_storage_provider, cv_file_path, cv_drive_id, cv_drive_item_id, cv_onedrive_path
      FROM applications
      WHERE purpose_talent_pool = 1
        AND applied_at < NOW() - INTERVAL 12 MONTH
    `);

    for (const app of longTermApps) {
      try {
        await deleteStoredCv({
          provider: app.cv_storage_provider,
          filePath: app.cv_file_path,
          driveId: app.cv_drive_id,
          driveItemId: app.cv_drive_item_id,
          oneDrivePath: app.cv_onedrive_path
        });
      } catch (err) {
        console.error(`[Retention Cleanup] Failed to delete CV for application ${app.id}:`, err);
      }
      await db.query("DELETE FROM applications WHERE id = ?", [app.id]);
      stats.purgedTalentPoolTrueApps++;
    }

    // 3. Nhật ký hệ thống (audit_logs) quá 12 tháng => Xóa
    const [auditRes] = await db.query(`
      DELETE FROM audit_logs
      WHERE created_at < NOW() - INTERVAL 12 MONTH
    `);
    stats.purgedAuditLogs = auditRes.affectedRows || 0;

    // 4. Bản ghi đồng ý (consent_logs) quá thời hạn lưu hồ sơ + 24 tháng (36 tháng) => Xóa
    const [consentRes] = await db.query(`
      DELETE FROM consent_logs
      WHERE consent_timestamp < NOW() - INTERVAL 36 MONTH
    `);
    stats.purgedConsentLogs = consentRes.affectedRows || 0;

    console.log("[Retention Cleanup] Finished successfully:", stats);
  } catch (error) {
    console.error("[Retention Cleanup] Error executing cleanup:", error);
  }

  return stats;
}

module.exports = {
  runRetentionCleanup
};
