const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const verifyToken = require("../middleware/authMiddleware");

// Dashboard
router.get("/", verifyToken, dashboardController.dashboard);

// Dashboard Analytics (chart, ringkasan, recent activity)
router.get("/analytics", verifyToken, dashboardController.analytics);

module.exports = router;