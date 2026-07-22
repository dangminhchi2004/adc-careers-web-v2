const TOKEN_SKEW_MS = 60 * 1000;

let cachedGraphToken = null;

async function getGraphToken() {
  if (cachedGraphToken && cachedGraphToken.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    return cachedGraphToken.accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(process.env.MS_TENANT_ID)}/oauth2/v2.0/token`;
  const form = new URLSearchParams({
    client_id: process.env.MS_CLIENT_ID,
    client_secret: process.env.MS_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials"
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });

  const result = await parseGraphResponse(response);
  if (!response.ok) {
    throw graphError("Could not authenticate with Microsoft Graph", response, result);
  }

  cachedGraphToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000
  };

  return cachedGraphToken.accessToken;
}

async function parseGraphResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
}

function graphError(message, response, result) {
  const detail = result && result.error
    ? result.error.message || result.error.code || result.error
    : result.error_description || result.raw || response.statusText;
  const error = new Error(`${message}: ${detail}`);
  error.statusCode = response.status;
  return error;
}

module.exports = {
  getGraphToken,
  parseGraphResponse,
  graphError
};
