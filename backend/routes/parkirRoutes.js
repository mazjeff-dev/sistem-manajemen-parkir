const express = require("express");
const router = express.Router();

const parkirController = require("../controllers/parkirController");
const verifyToken = require("../middleware/authMiddleware");

// GET semua data parkir
router.get("/", verifyToken, parkirController.getParkir);

// POST kendaraan masuk
router.post("/", verifyToken, parkirController.createParkir);

// PUT kendaraan keluar
router.put("/:id", verifyToken, parkirController.updateParkir);

// DELETE data parkir
router.delete("/:id", verifyToken, parkirController.deleteParkir);

module.exports = router;