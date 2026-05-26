const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const uploadsDir = path.join(__dirname, "..", "uploads", "cvs");
const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_BASE_URL = "https://www.googleapis.com/drive/v3";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3";
const TOKEN_SKEW_MS = 60 * 1000;

let cachedGraphToken = null;
let cachedGoogleToken = null;

function isOneDriveEnabled() {
  return String(process.env.CV_STORAGE || "").trim().toLowerCase() === "onedrive";
}

function isGoogleDriveEnabled() {
  const storage = String(process.env.CV_STORAGE || "").trim().toLowerCase();
  return ["google_drive", "googledrive", "google-drive", "gdrive"].includes(storage);
}

function isSharePointEnabled() {
  return String(process.env.CV_STORAGE || "").trim().toLowerCase() === "sharepoint";
}

async function storeCv(file) {
  if (isOneDriveEnabled()) {
    return uploadToOneDrive(file);
  }

  if (isSharePointEnabled()) {
    return uploadToSharePoint(file);
  }

  if (isGoogleDriveEnabled()) {
    return uploadToGoogleDrive(file);
  }

  return saveToLocalDisk(file);
}

async function deleteStoredCv(storage) {
  if (!storage) return;

  try {
    if (storage.provider === "onedrive" && storage.driveId && storage.driveItemId) {
      await deleteOneDriveItem(storage.driveId, storage.driveItemId);
    }

    if (storage.provider === "sharepoint" && storage.driveId && storage.driveItemId) {
      await deleteOneDriveItem(storage.driveId, storage.driveItemId);
    }

    if (storage.provider === "google_drive" && storage.externalId) {
      await deleteGoogleDriveFile(storage.externalId);
    }
  } catch (error) {
    console.warn("Could not cleanup stored CV:", error.message);
  }
}

async function loadCv(application) {
  if (application.cvStorageProvider === "onedrive") {
    return downloadFromOneDrive(application);
  }

  if (application.cvStorageProvider === "sharepoint") {
    return downloadFromOneDrive(application);
  }

  if (application.cvStorageProvider === "google_drive") {
    return downloadFromGoogleDrive(application);
  }

  return loadFromLocalDisk(application);
}

async function saveToLocalDisk(file) {
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  const fileName = buildFileName(file.originalname);
  const absolutePath = path.join(uploadsDir, fileName);
  await fs.promises.writeFile(absolutePath, file.buffer);

  return {
    provider: "local",
    fileName,
    filePath: `/uploads/cvs/${fileName}`,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size
  };
}

async function loadFromLocalDisk(application) {
  if (!application.cvFilePath) {
    const error = new Error("CV_NOT_FOUND");
    error.statusCode = 404;
    throw error;
  }

  const relativePath = application.cvFilePath.replace(/^\/uploads\//, "");
  const absolutePath = path.resolve(__dirname, "..", "uploads", relativePath);
  const uploadsRoot = path.resolve(__dirname, "..", "uploads");

  if (!absolutePath.startsWith(uploadsRoot)) {
    const error = new Error("INVALID_CV_PATH");
    error.statusCode = 400;
    throw error;
  }

  const buffer = await fs.promises.readFile(absolutePath);
  return {
    buffer,
    fileName: application.cvOriginalName || application.cvFileName || "cv",
    mimeType: application.cvMimeType || "application/octet-stream"
  };
}

async function uploadToOneDrive(file) {
  const requiredEnv = [
    "MS_TENANT_ID",
    "MS_CLIENT_ID",
    "MS_CLIENT_SECRET",
    "ONEDRIVE_USER_ID"
  ];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const error = new Error(`Missing OneDrive configuration: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }

  const token = await getGraphToken();
  const oneDrivePath = buildOneDrivePath(file.originalname);
  const encodedPath = encodeOneDrivePath(oneDrivePath);
  const userId = encodeURIComponent(process.env.ONEDRIVE_USER_ID);
  await ensureOneDriveFolders(token, userId, path.posix.dirname(oneDrivePath));
  const uploadUrl = `${GRAPH_BASE_URL}/users/${userId}/drive/root:/${encodedPath}:/content`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.mimetype || "application/octet-stream"
    },
    body: file.buffer
  });

  const result = await parseGraphResponse(response);
  if (!response.ok) {
    throw graphError("Could not upload CV to OneDrive", response, result);
  }

  return {
    provider: "onedrive",
    fileName: path.posix.basename(oneDrivePath),
    filePath: null,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    driveId: result.parentReference ? result.parentReference.driveId : null,
    driveItemId: result.id,
    webUrl: result.webUrl || null,
    oneDrivePath,
    externalId: result.id,
    externalParentId: result.parentReference ? result.parentReference.driveId : null,
    externalUrl: result.webUrl || null,
    storagePath: oneDrivePath
  };
}

async function downloadFromOneDrive(application) {
  if (!application.cvDriveId || !application.cvDriveItemId) {
    const error = new Error("CV_NOT_FOUND");
    error.statusCode = 404;
    throw error;
  }

  const token = await getGraphToken();
  const driveId = encodeURIComponent(application.cvDriveId);
  const itemId = encodeURIComponent(application.cvDriveItemId);
  const response = await fetch(`${GRAPH_BASE_URL}/drives/${driveId}/items/${itemId}/content`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    const result = await parseGraphResponse(response);
    throw graphError("Could not download CV from OneDrive", response, result);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    fileName: application.cvOriginalName || application.cvFileName || "cv",
    mimeType: application.cvMimeType || response.headers.get("content-type") || "application/octet-stream"
  };
}

async function uploadToSharePoint(file) {
  if (!process.env.SHAREPOINT_DRIVE_ID) {
    const error = new Error("Missing SharePoint configuration: SHAREPOINT_DRIVE_ID");
    error.statusCode = 500;
    throw error;
  }

  const token = await getGraphToken();
  const sharePointPath = buildSharePointPath(file.originalname);
  const driveId = encodeURIComponent(process.env.SHAREPOINT_DRIVE_ID);
  await ensureGraphDriveFolders(token, driveId, path.posix.dirname(sharePointPath));
  const uploadUrl = `${GRAPH_BASE_URL}/drives/${driveId}/root:/${encodeOneDrivePath(sharePointPath)}:/content`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.mimetype || "application/octet-stream"
    },
    body: file.buffer
  });
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    throw graphError("Could not upload CV to SharePoint", response, result);
  }

  return {
    provider: "sharepoint",
    fileName: path.posix.basename(sharePointPath),
    filePath: null,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    driveId: result.parentReference ? result.parentReference.driveId : process.env.SHAREPOINT_DRIVE_ID,
    driveItemId: result.id,
    webUrl: result.webUrl || null,
    externalId: result.id,
    externalParentId: result.parentReference ? result.parentReference.id : null,
    externalUrl: result.webUrl || null,
    storagePath: sharePointPath
  };
}

async function deleteOneDriveItem(driveId, itemId) {
  const token = await getGraphToken();
  const response = await fetch(
    `${GRAPH_BASE_URL}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const result = await parseGraphResponse(response);
    throw graphError("Could not delete CV from OneDrive", response, result);
  }
}

async function uploadToGoogleDrive(file) {
  const requiredEnv = ["GOOGLE_DRIVE_FOLDER_ID"];
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const error = new Error(`Missing Google Drive configuration: ${missing.join(", ")}`);
    error.statusCode = 500;
    throw error;
  }

  if (!hasGoogleRefreshTokenConfig()) {
    const error = new Error(
      "Missing Google Drive OAuth configuration: provide GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN"
    );
    error.statusCode = 500;
    throw error;
  }

  const token = await getGoogleToken();
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const fileName = buildFileName(file.originalname);
  const yearFolderId = await ensureGoogleDriveFolder(token, process.env.GOOGLE_DRIVE_FOLDER_ID, year);
  const monthFolderId = await ensureGoogleDriveFolder(token, yearFolderId, month);
  const storagePath = `${year}/${month}/${fileName}`;
  const metadata = {
    name: fileName,
    parents: [monthFolderId]
  };
  const boundary = `adc-careers-${crypto.randomUUID()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(JSON.stringify(metadata)),
    Buffer.from(`\r\n--${boundary}\r\nContent-Type: ${file.mimetype || "application/octet-stream"}\r\n\r\n`),
    file.buffer,
    Buffer.from(`\r\n--${boundary}--`)
  ]);

  const response = await fetch(
    `${GOOGLE_DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,parents&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
        "Content-Length": String(body.length)
      },
      body
    }
  );
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    throw graphError("Could not upload CV to Google Drive", response, result);
  }

  return {
    provider: "google_drive",
    fileName,
    filePath: null,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    driveItemId: result.id,
    webUrl: result.webViewLink || null,
    externalId: result.id,
    externalParentId: monthFolderId,
    externalUrl: result.webViewLink || null,
    storagePath
  };
}

async function downloadFromGoogleDrive(application) {
  const fileId = application.cvExternalId || application.cvDriveItemId;
  if (!fileId) {
    const error = new Error("CV_NOT_FOUND");
    error.statusCode = 404;
    throw error;
  }

  const token = await getGoogleToken();
  const response = await fetch(
    `${GOOGLE_DRIVE_BASE_URL}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const result = await parseGraphResponse(response);
    throw graphError("Could not download CV from Google Drive", response, result);
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    fileName: application.cvOriginalName || application.cvFileName || "cv",
    mimeType: application.cvMimeType || response.headers.get("content-type") || "application/octet-stream"
  };
}

async function deleteGoogleDriveFile(fileId) {
  const token = await getGoogleToken();
  const response = await fetch(
    `${GOOGLE_DRIVE_BASE_URL}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok && response.status !== 404) {
    const result = await parseGraphResponse(response);
    throw graphError("Could not delete CV from Google Drive", response, result);
  }
}

async function ensureGoogleDriveFolder(token, parentId, folderName) {
  const existing = await findGoogleDriveFolder(token, parentId, folderName);
  if (existing) return existing.id;

  const response = await fetch(
    `${GOOGLE_DRIVE_BASE_URL}/files?fields=id,name,webViewLink&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId]
      })
    }
  );
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    throw graphError("Could not create Google Drive folder", response, result);
  }

  return result.id;
}

async function findGoogleDriveFolder(token, parentId, folderName) {
  const query = [
    "mimeType = 'application/vnd.google-apps.folder'",
    `name = '${escapeGoogleDriveQueryValue(folderName)}'`,
    `'${escapeGoogleDriveQueryValue(parentId)}' in parents`,
    "trashed = false"
  ].join(" and ");
  const params = new URLSearchParams({
    q: query,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: "1",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true"
  });
  const response = await fetch(`${GOOGLE_DRIVE_BASE_URL}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    throw graphError("Could not inspect Google Drive folder", response, result);
  }

  return Array.isArray(result.files) && result.files.length > 0 ? result.files[0] : null;
}

async function ensureOneDriveFolders(token, userId, folderPath) {
  const parts = normalizeBasePath(folderPath).split("/").filter(Boolean);
  let parentId = null;
  let currentPath = "";

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const existing = await getOneDriveItemByPath(token, userId, currentPath);
    if (existing) {
      parentId = existing.id;
      continue;
    }

    const createUrl = parentId
      ? `${GRAPH_BASE_URL}/users/${userId}/drive/items/${encodeURIComponent(parentId)}/children`
      : `${GRAPH_BASE_URL}/users/${userId}/drive/root/children`;
    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: part,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail"
      })
    });
    const result = await parseGraphResponse(response);

    if (response.status === 409) {
      const conflicted = await getOneDriveItemByPath(token, userId, currentPath);
      if (conflicted) {
        parentId = conflicted.id;
        continue;
      }
    }

    if (!response.ok) {
      throw graphError("Could not create OneDrive folder", response, result);
    }

    parentId = result.id;
  }
}

async function getOneDriveItemByPath(token, userId, itemPath) {
  const response = await fetch(
    `${GRAPH_BASE_URL}/users/${userId}/drive/root:/${encodeOneDrivePath(itemPath)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const result = await parseGraphResponse(response);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw graphError("Could not inspect OneDrive folder", response, result);
  }
  return result;
}

async function ensureGraphDriveFolders(token, driveId, folderPath) {
  const parts = normalizeBasePath(folderPath).split("/").filter(Boolean);
  let parentId = null;
  let currentPath = "";

  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const existing = await getGraphDriveItemByPath(token, driveId, currentPath);
    if (existing) {
      parentId = existing.id;
      continue;
    }

    const createUrl = parentId
      ? `${GRAPH_BASE_URL}/drives/${driveId}/items/${encodeURIComponent(parentId)}/children`
      : `${GRAPH_BASE_URL}/drives/${driveId}/root/children`;
    const response = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: part,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail"
      })
    });
    const result = await parseGraphResponse(response);

    if (response.status === 409) {
      const conflicted = await getGraphDriveItemByPath(token, driveId, currentPath);
      if (conflicted) {
        parentId = conflicted.id;
        continue;
      }
    }

    if (!response.ok) {
      throw graphError("Could not create SharePoint folder", response, result);
    }

    parentId = result.id;
  }
}

async function getGraphDriveItemByPath(token, driveId, itemPath) {
  const response = await fetch(
    `${GRAPH_BASE_URL}/drives/${driveId}/root:/${encodeOneDrivePath(itemPath)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const result = await parseGraphResponse(response);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw graphError("Could not inspect SharePoint folder", response, result);
  }
  return result;
}

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

async function getGoogleToken() {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + TOKEN_SKEW_MS) {
    return cachedGoogleToken.accessToken;
  }

  return getGoogleTokenFromRefreshToken();
}

async function getGoogleTokenFromRefreshToken() {
  const form = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token"
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: form
  });
  const result = await parseGraphResponse(response);

  if (!response.ok) {
    throw graphError("Could not authenticate with Google Drive OAuth", response, result);
  }

  cachedGoogleToken = {
    accessToken: result.access_token,
    expiresAt: Date.now() + Number(result.expires_in || 3600) * 1000
  };

  return cachedGoogleToken.accessToken;
}

function hasGoogleRefreshTokenConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

function buildOneDrivePath(originalName) {
  const basePath = normalizeBasePath(process.env.ONEDRIVE_BASE_PATH || "ADC-Careers/CVs");
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${basePath}/${year}/${month}/${buildFileName(originalName)}`;
}

function buildSharePointPath(originalName) {
  const basePath = normalizeBasePath(process.env.SHAREPOINT_BASE_PATH || "ADC-Careers/CVs");
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${basePath}/${year}/${month}/${buildFileName(originalName)}`;
}

function normalizeBasePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");
}

function buildFileName(originalName) {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "cv";

  return `${Date.now()}-${crypto.randomUUID()}-${baseName}${ext}`;
}

function encodeOneDrivePath(value) {
  return value
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function escapeGoogleDriveQueryValue(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
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
  deleteStoredCv,
  loadCv,
  storeCv
};
