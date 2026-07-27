// Shared input-sanitization/validation helpers used across controllers.

// Strips control characters (keeping tab/newline/carriage-return) that serve
// no purpose in stored text other than log-injection or rendering quirks.
// Written as a code-point scan rather than a regex literal to avoid any
// ambiguity around embedding raw control characters in source.
function sanitizeText(value) {
  if (typeof value !== "string") return value;
  let result = "";
  for (const ch of value) {
    const code = ch.codePointAt(0);
    const isControl = code <= 0x1f && code !== 0x09 && code !== 0x0a && code !== 0x0d;
    if (!isControl && code !== 0x7f) {
      result += ch;
    }
  }
  return result.trim();
}

function isTooLong(value, max) {
  return typeof value === "string" && value.length > max;
}

// Normalizes a "list" field that may arrive as a real array, a JSON string,
// or newline-separated text, purely for counting/length validation before
// the value is handed off to the model layer (which re-parses it the same way).
function toItemsArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed;
  } catch (error) {
    // fall through to newline-splitting
  }

  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function itemTextLength(item) {
  if (item && typeof item === "object") {
    return Object.values(item)
      .filter((v) => typeof v === "string")
      .reduce((sum, v) => sum + v.length, 0);
  }
  return String(item ?? "").length;
}

module.exports = {
  sanitizeText,
  isTooLong,
  toItemsArray,
  itemTextLength
};
