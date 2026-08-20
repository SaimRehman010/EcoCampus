const express = require("express");
const router = express.Router();
const { scanAnomalies } = require("../controllers/iotController");

// POST /api/iot/scan-anomalies
// Triggers live IoT telemetry simulation + anomaly detection + auto-ticket generation
router.post("/scan-anomalies", scanAnomalies);

module.exports = router;
