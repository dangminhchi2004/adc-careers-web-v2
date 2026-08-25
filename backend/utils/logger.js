/**
 * logger.js — Lightweight structured logger (no external dependencies).
 *
 * In production: outputs JSON lines to stdout — easy to ingest by log aggregators
 * (Datadog, Logtail, Render log drain, etc.).
 *
 * In development: outputs colored, human-readable lines for terminal readability.
 *
 * Usage:
 *   const { log, requestLogger } = require("./utils/logger");
 *   log.info("Server started", { port: 5000 });
 *   log.warn("Suspicious request", { ip, path });
 *   log.error("DB query failed", { error: err.message });
 *   app.use(requestLogger);
 */

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// ANSI color codes — only applied in development for terminal readability
const C = {
  reset: "\x1b[0m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m",
  cyan: "\x1b[36m", gray: "\x1b[90m"
};

const LEVEL_COLOR = { INFO: C.green, WARN: C.yellow, ERROR: C.red, HTTP: C.cyan };

function ts() { return new Date().toISOString(); }

/**
 * Core emitter. Production → JSON line. Development → colored human text.
 * @param {"INFO"|"WARN"|"ERROR"|"HTTP"} level
 * @param {string} message
 * @param {object} [meta]
 */
function emit(level, message, meta = {}) {
  const now = ts();

  if (IS_PRODUCTION) {
    const entry = JSON.stringify({ ts: now, level, message, ...meta });
    level === "ERROR"
      ? process.stderr.write(entry + "\n")
      : process.stdout.write(entry + "\n");
    return;
  }

  // Development: colored
  const col = LEVEL_COLOR[level] || C.reset;
  const metaStr = Object.keys(meta).length
    ? " " + C.gray + JSON.stringify(meta) + C.reset
    : "";
  const line = `${C.dim}${now}${C.reset} ${col}[${level}]${C.reset} ${message}${metaStr}`;
  level === "ERROR"
    ? process.stderr.write(line + "\n")
    : process.stdout.write(line + "\n");
}

const log = {
  /** Normal system events */
  info:  (msg, meta) => emit("INFO",  msg, meta),
  /** Unexpected but non-fatal conditions */
  warn:  (msg, meta) => emit("WARN",  msg, meta),
  /** Failures that need attention */
  error: (msg, meta) => emit("ERROR", msg, meta),
  /** HTTP traffic — used internally by requestLogger */
  http:  (msg, meta) => emit("HTTP",  msg, meta)
};

/**
 * Express middleware — logs every HTTP request.
 * Fields: method, path, status, duration (ms), client IP.
 * Skips GET /health to avoid log noise from monitoring pings.
 */
function requestLogger(req, res, next) {
  if (req.method === "GET" && req.path === "/health") return next();

  const startAt = process.hrtime.bigint();

  res.on("finish", () => {
    const ms = (Number(process.hrtime.bigint() - startAt) / 1_000_000).toFixed(1);
    log.http(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${ms}ms`,
      ip: req.ip || req.socket?.remoteAddress
    });
  });

  next();
}

module.exports = { log, requestLogger };
