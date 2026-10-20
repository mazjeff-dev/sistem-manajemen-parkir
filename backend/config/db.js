const mysql = require("mysql2");

require("dotenv").config();

// Memakai connection pool (bukan satu koneksi tunggal). Pool otomatis
// membuka koneksi baru kalau ada yang putus (misalnya karena MySQL
// menutup koneksi idle) dan bisa melayani beberapa query bersamaan.
// API-nya sama dengan createConnection: db.query(sql, params, callback),
// jadi semua controller yang sudah ada tidak perlu diubah.
const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
});

// Cek koneksi sekali saat server start, hanya untuk memberi info di log.
db.getConnection((err, connection) => {
    if (err) {
        console.log("Gagal terhubung ke database");
        console.log(err.message);
        return;
    }

    console.log("Database berhasil terhubung");
    connection.release();
});

module.exports = db;
