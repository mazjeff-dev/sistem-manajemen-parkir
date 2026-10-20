const express = require("express");
const multer = require("multer");
const router = express.Router();

const anprController = require("../controllers/anprController");
const verifyToken = require("../middleware/authMiddleware");
const { anprLimiter } = require("../middleware/rateLimiter");

// Foto hanya diproses di memori (tidak disimpan ke disk).
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/scan", verifyToken, anprLimiter, upload.single("foto"), anprController.scan);

module.exports = router;
