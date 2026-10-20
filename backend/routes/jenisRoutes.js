const express = require("express");
const router = express.Router();

const jenisController = require("../controllers/jenisController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// GET semua jenis kendaraan — semua role boleh melihat (dipakai
// juga sebagai dropdown saat input kendaraan).
router.get("/", verifyToken, jenisController.getJenis);

// Tambah/ubah/hapus jenis kendaraan (termasuk kapasitas & tarif)
// dibatasi khusus admin.
router.post("/", verifyToken, requireAdmin, jenisController.createJenis);
router.put("/:id", verifyToken, requireAdmin, jenisController.updateJenis);
router.delete("/:id", verifyToken, requireAdmin, jenisController.deleteJenis);

module.exports = router;
