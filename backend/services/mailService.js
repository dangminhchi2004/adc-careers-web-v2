const { getGraphToken, parseGraphResponse, graphError } = require("./msGraphAuth");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const MAX_ATTACHMENT_SIZE = 3 * 1024 * 1024;

let warnedAboutMissingConfig = false;

function isMailEnabled() {
  const enabled = String(process.env.MAIL_ENABLED || "").trim().toLowerCase() === "true";
  if (!enabled) return false;

  const required = ["MS_TENANT_ID", "MS_CLIENT_ID", "MS_CLIENT_SECRET", "MAIL_SEND_AS"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    if (!warnedAboutMissingConfig) {
      console.warn(`MAIL_ENABLED is true but missing config: ${missing.join(", ")}. Skipping email notifications.`);
      warnedAboutMissingConfig = true;
    }
    return false;
  }

  return true;
}

function isCvMailRelay(cvStorage) {
  return Boolean(cvStorage && cvStorage.provider === "sharepoint_relay");
}

async function sendApplicationEmails(application, cvFile, cvStorage) {
  if (!isMailEnabled()) {
    if (isCvMailRelay(cvStorage)) {
      throw new Error("MAIL_ENABLED is not set to true, but CV_STORAGE=mail_relay requires email delivery of the CV.");
    }
    return;
  }

  const hrRecipients = parseRecipientList(process.env.MAIL_HR_TO);

  sendCandidateConfirmation(application, hrRecipients).catch((error) => {
    console.error("Failed to send candidate confirmation email:", error);
  });

  await sendHrNotification(application, hrRecipients, cvFile, cvStorage);
}

async function sendCandidateConfirmation(application, hrRecipients) {
  const jobTitle = application.jobTitleVn || application.jobTitle || "vị trí bạn đã ứng tuyển";
  const htmlBody = `
    <p>Chào ${escapeHtml(application.fullName)},</p>
    <p>ADC Careers đã ghi nhận hồ sơ ứng tuyển của bạn cho vị trí <strong>${escapeHtml(jobTitle)}</strong>.</p>
    <p>Đội ngũ P&amp;O sẽ liên hệ khi có cập nhật phù hợp.</p>
    <p>Trân trọng,<br/>Asia Dragon Capital (ADC)</p>
  `;

  await sendGraphMail({
    subject: "Xác nhận đã nhận hồ sơ ứng tuyển – ADC Careers",
    htmlBody,
    toRecipients: [application.email],
    replyTo: hrRecipients
  });
}

async function sendHrNotification(application, hrRecipients, cvFile, cvStorage) {
  if (hrRecipients.length === 0) {
    if (isCvMailRelay(cvStorage)) {
      throw new Error("MAIL_HR_TO is empty, but CV_STORAGE=mail_relay requires an HR recipient to receive the CV.");
    }
    return;
  }

  const jobTitle = application.jobTitleVn || application.jobTitle || "N/A";
  const baseUrl = String(process.env.PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const adminLink = `${baseUrl}/admin`;
  const attachment = buildCvAttachment(cvFile, cvStorage);
  const cvNote = cvFile && !attachment
    ? "<p><em>CV vượt quá dung lượng đính kèm trực tiếp, vui lòng vào Admin Dashboard để tải.</em></p>"
    : "";

  const htmlBody = `
    <p>Có một hồ sơ ứng tuyển mới:</p>
    <ul>
      <li>Vị trí: ${escapeHtml(jobTitle)} (${escapeHtml(application.jobDept || "")})</li>
      <li>Họ tên: ${escapeHtml(application.fullName)}</li>
      <li>Email: ${escapeHtml(application.email)}</li>
      <li>Điện thoại: ${escapeHtml(application.phone)}</li>
      <li>Mức lương mong muốn: ${escapeHtml(application.expectedSalary || "Không ghi rõ")}</li>
      <li>Ghi chú: ${escapeHtml(application.note || "Không có")}</li>
      <li>Thời gian nộp: ${formatDateTime(application.appliedAt)}</li>
    </ul>
    ${cvNote}
    <p><a href="${adminLink}">Xem chi tiết trong Admin Dashboard</a></p>
  `;

  await sendGraphMail({
    subject: `Hồ sơ ứng tuyển mới: ${jobTitle}`,
    htmlBody,
    toRecipients: hrRecipients,
    attachments: attachment ? [attachment] : null,
    // Power Automate polls MAIL_SEND_AS's Sent Items for the CV attachment in mail-relay
    // mode, so the sent copy must be kept there instead of discarded.
    saveToSentItems: isCvMailRelay(cvStorage)
  });
}

function buildCvAttachment(cvFile, cvStorage) {
  if (!cvFile || !cvFile.buffer || !cvFile.buffer.length) return null;
  if (cvFile.buffer.length > MAX_ATTACHMENT_SIZE) return null;

  const attachmentName = (cvStorage && cvStorage.fileName) || cvFile.originalname || "CV";

  return {
    "@odata.type": "#microsoft.graph.fileAttachment",
    name: attachmentName,
    contentType: cvFile.mimetype || "application/octet-stream",
    contentBytes: cvFile.buffer.toString("base64")
  };
}

async function sendGraphMail({ subject, htmlBody, toRecipients, replyTo, attachments, saveToSentItems }) {
  const token = await getGraphToken();
  const sender = encodeURIComponent(process.env.MAIL_SEND_AS);
  const url = `${GRAPH_BASE_URL}/users/${sender}/sendMail`;

  const message = {
    subject,
    body: {
      contentType: "HTML",
      content: htmlBody
    },
    toRecipients: toRecipients.map((address) => ({ emailAddress: { address } }))
  };

  if (replyTo && replyTo.length > 0) {
    message.replyTo = replyTo.map((address) => ({ emailAddress: { address } }));
  }

  if (attachments && attachments.length > 0) {
    message.attachments = attachments;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message, saveToSentItems: Boolean(saveToSentItems) })
  });

  if (!response.ok) {
    const result = await parseGraphResponse(response);
    throw graphError("Could not send email via Microsoft Graph", response, result);
  }
}

function parseRecipientList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

module.exports = {
  sendApplicationEmails
};
