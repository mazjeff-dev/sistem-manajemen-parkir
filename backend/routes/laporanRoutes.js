const express = require("express");
const router = express.Router();

const laporanController = require("../controllers/laporanController");
const verifyToken = require("../middleware/authMiddleware");

// GET seluruh data laporan parkir (mendukung ?start=&end=)
router.get("/", verifyToken, laporanController.getLaporan);

module.exports = router;
