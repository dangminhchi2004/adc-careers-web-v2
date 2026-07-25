require("dotenv").config();
const { getGraphToken, parseGraphResponse, graphError } = require("../services/msGraphAuth");

const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

async function testSendMail() {
  const sendAs = process.env.MAIL_SEND_AS;
  const recipient = process.argv[2] || process.env.MAIL_HR_TO || sendAs;

  if (!sendAs) {
    console.error("MAIL_SEND_AS is not set in .env. Aborting.");
    process.exit(1);
  }

  console.log(`Testing Graph sendMail as: ${sendAs}`);
  console.log(`Recipient: ${recipient}`);

  try {
    console.log("Requesting app-only access token...");
    const token = await getGraphToken();
    console.log("Token acquired.");

    const url = `${GRAPH_BASE_URL}/users/${encodeURIComponent(sendAs)}/sendMail`;
    const message = {
      subject: "[TEST] ADC Careers - Graph mail-relay check",
      body: {
        contentType: "HTML",
        content: `<p>Test gửi mail app-only qua Microsoft Graph.</p><p>Thời điểm: ${new Date().toISOString()}</p>`
      },
      toRecipients: [{ emailAddress: { address: recipient } }]
    };

    console.log(`POST ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, saveToSentItems: true })
    });

    if (!response.ok) {
      const result = await parseGraphResponse(response);
      throw graphError("Could not send email via Microsoft Graph", response, result);
    }

    console.log(`SUCCESS: Mail sent as ${sendAs} to ${recipient}. HTTP ${response.status}.`);
  } catch (error) {
    console.error("FAILED:", error.message);
    if (error.statusCode) console.error("statusCode:", error.statusCode);
    process.exitCode = 1;
  }
}

testSendMail();
