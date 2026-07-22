const cors = require("cors");
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

const app = express();
const port = process.env.PORT || 5000;
const frontendDir = path.join(__dirname, "..", "frontend");
const htmlDemoFile = path.join(__dirname, "..", "htmldemo.html");
const uploadsDir = path.join(__dirname, "uploads", "cvs");

fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.google.com/recaptcha/", "https://www.gstatic.com/recaptcha/"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: ["'self'", "https://www.google.com/recaptcha/"],
      imgSrc: ["'self'", "data:"]
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/jobs", jobRoutes);
app.use("/api/apply", applyRoutes);
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

async function startServer() {
  await ensureSchema();

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
