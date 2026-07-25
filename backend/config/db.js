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
  // Aiven signs with its own CA, which Node doesn't trust out of the box, so
  // rejectUnauthorized defaults to false here (accepts any cert — no MITM
  // protection). Download the Aiven CA certificate, set DB_SSL_CA to its path
  // and DB_SSL_REJECT_UNAUTHORIZED=true to close this gap without breaking
  // the connection; see ca.pem under the service's Overview tab in Aiven console.
  dbConfig.ssl = {
    rejectUnauthorized: String(envValue("DB_SSL_REJECT_UNAUTHORIZED") || "false").toLowerCase() === "true"
  };

  if (envValue("DB_SSL_CA")) {
    dbConfig.ssl.ca = require("fs").readFileSync(envValue("DB_SSL_CA"));
  }
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
