const express = require("express");
const router = express.Router();

const kendaraanController = require("../controllers/kendaraanController");
const verifyToken = require("../middleware/authMiddleware");

// GET semua kendaraan
router.get("/", verifyToken, kendaraanController.getKendaraan);

// POST tambah kendaraan
router.post("/", verifyToken, kendaraanController.createKendaraan);

// PUT update kendaraan
router.put("/:id", verifyToken, kendaraanController.updateKendaraan);

// DELETE kendaraan
router.delete("/:id", verifyToken, kendaraanController.deleteKendaraan);

module.exports = router;