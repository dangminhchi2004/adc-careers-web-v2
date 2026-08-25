const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const applyRoutes = require("./routes/applyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const { ensureSchema } = require("./config/schema");
const { log, requestLogger } = require("./utils/logger");

const IS_PRODUCTION = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET) {
  log.error("JWT_SECRET is not set. Refusing to start with a guessable/default signing secret.");
  process.exit(1);
}

// Refuse to start in production with a known-weak default admin password.
// This is a last-resort guard in case someone deploys without updating credentials.
const WEAK_PASSWORDS = new Set(["admin", "admin123", "password", "123456", "changeme"]);
if (IS_PRODUCTION && process.env.ADMIN_PASSWORD && WEAK_PASSWORDS.has(process.env.ADMIN_PASSWORD)) {
  log.error("ADMIN_PASSWORD is set to a known-weak default value. Refusing to start in production.");
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, "..", "frontend");
const htmlDemoFile = path.join(__dirname, "..", "htmldemo.html");
const uploadsDir = path.join(__dirname, "uploads", "cvs");

fs.mkdirSync(uploadsDir, { recursive: true });

// Render (and most PaaS hosts) sit behind a reverse proxy, so req.ip must come
// from X-Forwarded-For or every request/rate-limit bucket collapses onto the
// proxy's own address instead of the real client IP.
app.set("trust proxy", 1);

// Frontend and API are served from the same origin in production, so CORS only
// matters for cross-site callers. Default-deny and only allow an explicit list
// (ASVS V14.5) instead of reflecting every origin.
const allowedOrigins = String(process.env.ALLOWED_ORIGINS || process.env.PUBLIC_BASE_URL || "http://localhost:5000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The frontend's own JS (config.js, shared.js, ...) is built to support opening
// the HTML files directly via file:// for local testing, falling back to
// http://localhost:5000 as the API base. Browsers send Origin: null for those
// requests, so it has to stay allowed or that (intended) workflow breaks. This
// doesn't weaken auth: admin/API access is Bearer-token based, not cookies, so
// a null-origin page still can't do anything without already having a token.
// In production this is disabled — file:// testing is a local-dev workflow only.
if (!IS_PRODUCTION) {
  allowedOrigins.push("null");
}

app.use((req, res, next) => {
  // Browsers attach Origin even on same-origin POST/PUT/DELETE (unlike GET),
  // so a static allowlist alone breaks the app the moment it's reached via
  // any host that isn't the literal ALLOWED_ORIGINS/PUBLIC_BASE_URL string —
  // e.g. testing straight against http://localhost:5000. Compare against the
  // request's own Host header so wherever this server is actually being
  // served from is always implicitly allowed, on top of the explicit list.
  const selfOrigin = `${req.protocol}://${req.get("host")}`;

  cors({
    origin(origin, callback) {
      // Same-origin requests (curl, server-to-server) send no Origin header.
      if (!origin || origin === selfOrigin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    // The admin session now travels as an httpOnly cookie, so cross-origin
    // requests need the browser's permission to attach it — safe to enable
    // because the origin callback above never allows "*", only the explicit
    // whitelist/same-Host, which credentials:true requires anyway.
    credentials: true
  })(req, res, next);
});
app.use(cookieParser());
app.use(compression()); // Compress responses (gzip)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
      imgSrc: ["'self'", "data:"],
      // frame-ancestors doesn't fall back to default-src like other fetch
      // directives, so without it clickjacking protection relies solely on
      // the legacy X-Frame-Options header below (frameguard) — set both.
      frameAncestors: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  frameguard: {
    action: "sameorigin",
  }
}));
// Explicit body-size caps (default is 100kb, but stated here intentionally):
// admin job payloads bundle several free-text fields plus small JSON arrays,
// so 300kb gives headroom while still rejecting abusive oversized requests.
app.use(express.json({ limit: "300kb" }));
app.use(express.urlencoded({ extended: true, limit: "300kb", parameterLimit: 200 }));

// Request logger — logs method, path, status, duration, IP for every request
app.use(requestLogger);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/jobs", jobRoutes);
app.use("/api/apply", applyRoutes);

// Applicant PII (names, emails, CVs) and auth responses must never be cached
// by shared proxies or the browser's back/forward cache (ASVS V8.1).
app.use(["/api/auth", "/api/admin"], (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/config/public", (req, res) => {
  res.json({
    success: true,
    recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY || ""
  });
});

// robots.txt and sitemap.xml are served as static files from frontendDir,
// but explicit routes ensure correct Content-Type headers and prevent the
// SPA catch-all from intercepting them on clean-URL requests.
app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.sendFile(path.join(frontendDir, "robots.txt"));
});

app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.sendFile(path.join(frontendDir, "sitemap.xml"));
});

// Static assets caching: 1 week TTL for CSS/JS/Images to improve repeat load speeds
const staticOptions = {
  maxAge: IS_PRODUCTION ? "7d" : 0,
  setHeaders: (res, path) => {
    // Only cache static files (fonts, images, css, js). HTML is served via routes.
    if (path.match(/\.(css|js|png|jpg|jpeg|svg|woff2?|ico)$/)) {
      res.setHeader("Cache-Control", `public, max-age=${7 * 24 * 60 * 60}`);
    }
  }
};

app.use(express.static(frontendDir, staticOptions));
app.use("/frontend", express.static(frontendDir, staticOptions));

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendDir, "index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(frontendDir, "admin.html"));
});

app.get("/auth-zone", (req, res) => {
  res.sendFile(path.join(frontendDir, "auth-zone.html"));
});

app.get(["/job", "/job.html"], (req, res) => {
  res.sendFile(path.join(frontendDir, "job.html"));
});

app.get("/jobs/:slug", (req, res) => {
  res.sendFile(path.join(frontendDir, "job.html"));
});

app.get(["/thank-you", "/thank-you.html"], (req, res) => {
  res.sendFile(path.join(frontendDir, "thank-you.html"));
});

app.get(["/quy-dinh-bao-mat", "/privacy-policy", "/privacy-policy.html"], (req, res) => {
  res.sendFile(path.join(frontendDir, "privacy-policy.html"));
});

// Development-only demo route — disabled in production to avoid leaking
// internal HTML prototypes to the public internet.
if (!IS_PRODUCTION) {
  app.get(["/demo", "/htmldemo", "/htmldemo.html"], (req, res) => {
    res.sendFile(htmlDemoFile);
  });
}

// Health check endpoint — used by Render.com and monitoring tools.
// Performs a lightweight DB ping so the status reflects real connectivity,
// not just "process is running".
app.get("/health", async (req, res) => {
  const mem = process.memoryUsage();
  const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

  let dbStatus = "ok";
  let dbLatencyMs = null;
  try {
    const db = require("./config/db");
    const dbStart = process.hrtime.bigint();
    await db.query("SELECT 1");
    dbLatencyMs = Number(process.hrtime.bigint() - dbStart) / 1_000_000;
  } catch (err) {
    dbStatus = "error";
    log.warn("Health check DB ping failed", { error: err.message });
  }

  const status = dbStatus === "ok" ? 200 : 503;
  res.status(status).json({
    status: dbStatus === "ok" ? "ok" : "degraded",
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || "1.0.0",
    env: IS_PRODUCTION ? "production" : "development",
    db: { status: dbStatus, latency: dbLatencyMs ? `${dbLatencyMs.toFixed(1)}ms` : null },
    memory: { rss: mb(mem.rss), heapUsed: mb(mem.heapUsed), heapTotal: mb(mem.heapTotal) }
  });
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found."
    });
  }

  // Serve a proper 404 page for unknown frontend routes instead of silently
  // falling back to index.html, which would mislead search engines (soft 404).
  return res.status(404).sendFile(path.join(frontendDir, "404.html"));
});

// Catches errors thrown by middleware (e.g. the CORS origin check) before they
// reach a route handler's own try/catch. Without this, Express's default
// handler renders the raw Error with its stack trace — including full
// filesystem paths — straight into the HTTP response (ASVS V7.4).
app.use((err, req, res, _next) => {
  if (err && err.message === "Not allowed by CORS") {
    log.warn("CORS blocked request", {
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin || "(none)"
    });
    return res.status(403).json({ success: false, message: "Origin khong duoc phep." });
  }

  // Oversized/malformed bodies come from express.json()/urlencoded() as
  // thrown errors before any route handler runs — surface them as clean
  // 4xx responses instead of falling through to the generic 500 below.
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({ success: false, message: "Du lieu gui len qua lon." });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ success: false, message: "Du lieu gui len khong dung dinh dang." });
  }

  log.error("Unhandled error", {
    method: req.method,
    path: req.originalUrl,
    error: err?.message,
    stack: IS_PRODUCTION ? undefined : err?.stack
  });
  res.status(500).json({ success: false, message: "Loi he thong." });
});

const { runRetentionCleanup } = require("./services/retentionCleanupService");

async function startServer() {
  await ensureSchema();

  // Run periodic retention cleanup on startup and schedule every 24 hours
  runRetentionCleanup().catch((err) => log.error("Initial retention cleanup error", { error: err.message }));
  setInterval(() => {
    runRetentionCleanup().catch((err) => log.error("Scheduled retention cleanup error", { error: err.message }));
  }, 24 * 60 * 60 * 1000);

  const server = app.listen(port, "0.0.0.0", () => {
    log.info("ADC Careers server started", { port, env: IS_PRODUCTION ? "production" : "development" });
  });

  process.on("SIGTERM", () => {
    log.info("SIGTERM received, closing server gracefully");
    server.close(() => process.exit(0));
  });
}

startServer().catch((error) => {
  log.error("Failed to start ADC Careers server", { error: error.message, stack: error.stack });
  process.exit(1);
});

