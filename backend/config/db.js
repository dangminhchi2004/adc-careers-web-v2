const mysql = require("mysql2");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

if (String(process.env.DB_SSL || "").toLowerCase() === "true") {
  dbConfig.ssl = {
    rejectUnauthorized: String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "false").toLowerCase() === "true"
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
