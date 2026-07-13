const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const verifyToken = require("../middleware/authMiddleware");

// Dashboard
router.get("/", verifyToken, dashboardController.dashboard);

module.exports = router;