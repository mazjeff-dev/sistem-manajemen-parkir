const express = require("express");
const router = express.Router();

const jenisController = require("../controllers/jenisController");
const verifyToken = require("../middleware/authMiddleware");

// GET semua jenis kendaraan
router.get("/", verifyToken, jenisController.getJenis);

// POST tambah jenis kendaraan
router.post("/", verifyToken, jenisController.createJenis);

// PUT update jenis kendaraan
router.put("/:id", verifyToken, jenisController.updateJenis);

// DELETE hapus jenis kendaraan
router.delete("/:id", verifyToken, jenisController.deleteJenis);

module.exports = router;