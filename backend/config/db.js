const mysql = require('mysql2');
require('dotenv').config();

// Tạo một pool kết nối
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Chuyển pool sang dạng promise để dùng được async/await
const db = pool.promise();

// Test kết nối khi khởi động server
db.getConnection()
    .then(connection => {
        console.log('✅ Kết nối MySQL Localhost thành công!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối MySQL:', err.message);
    });

module.exports = db;