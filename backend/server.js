const cors = require("cors");
const cookieParser = require("cookie-parser");
const express = require("express");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const applyRoutes = require("./routes/applyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const { ensureSchema } = require("./config/schema");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is not set. Refusing to start with a guessable/default signing secret.");
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
allowedOrigins.push("null");

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

app.use(express.static(frontendDir));
app.use("/frontend", express.static(frontendDir));

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

app.get(["/demo", "/htmldemo", "/htmldemo.html"], (req, res) => {
  res.sendFile(htmlDemoFile);
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      message: "API endpoint not found."
    });
  }

  return res.sendFile(path.join(frontendDir, "index.html"));
});

// Catches errors thrown by middleware (e.g. the CORS origin check) before they
// reach a route handler's own try/catch. Without this, Express's default
// handler renders the raw Error with its stack trace — including full
// filesystem paths — straight into the HTTP response (ASVS V7.4).
app.use((err, req, res, next) => {
  if (err && err.message === "Not allowed by CORS") {
    console.warn(`CORS blocked ${req.method} ${req.originalUrl} from origin: ${req.headers.origin || "(none)"}`);
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

  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Loi he thong." });
});

const { runRetentionCleanup } = require("./services/retentionCleanupService");

async function startServer() {
  await ensureSchema();

  // Run periodic retention cleanup on startup and schedule every 24 hours
  runRetentionCleanup().catch((err) => console.error("Initial retention cleanup error:", err));
  setInterval(() => {
    runRetentionCleanup().catch((err) => console.error("Scheduled retention cleanup error:", err));
  }, 24 * 60 * 60 * 1000);

  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`ADC Careers server running at http://localhost:${port}`);
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
}

startServer().catch((error) => {
  console.error("Failed to start ADC Careers server:", error);
  process.exit(1);
});

