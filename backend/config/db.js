const mysql = require("mysql2");
require("dotenv").config();

function envValue(key) {
  const value = process.env[key];
  return typeof value === "string" ? value.trim() : value;
}

const dbConfig = {
  host: envValue("DB_HOST"),
  port: envValue("DB_PORT") ? Number(envValue("DB_PORT")) : 3306,
  user: envValue("DB_USER"),
  password: envValue("DB_PASSWORD"),
  database: envValue("DB_NAME"),
  // The DB server stores TIMESTAMP/DATETIME values in UTC. Without this, mysql2
  // parses those raw values as if they were already in the Node process's local
  // timezone, silently shifting every timestamp (applied_at, created_at, ...) by
  // the local UTC offset (e.g. -7h for Vietnam) instead of representing the real UTC instant.
  timezone: "Z",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (String(envValue("DB_SSL") || "").toLowerCase() === "true") {
  dbConfig.ssl = {
    rejectUnauthorized: String(envValue("DB_SSL_REJECT_UNAUTHORIZED") || "false").toLowerCase() === "true"
  };
}

const pool = mysql.createPool(dbConfig);
const db = pool.promise();

db.getConnection()
  .then((connection) => {
    console.log("MySQL connection successful.");
    connection.release();
  })
  .catch((error) => {
    console.error("MySQL connection failed:", error.message);
  });

module.exports = db;
