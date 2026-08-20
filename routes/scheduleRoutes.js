const express = require("express");
const router = express.Router();
const {
  getSchedules,
  getBlocksAndRooms,
  uploadTimetable,
  requestOverride,
  approveOverride,
} = require("../controllers/scheduleController");

// Schedule & Power Grid Endpoints
router.get("/", getSchedules);
router.get("/blocks", getBlocksAndRooms);
router.post("/upload-excel", uploadTimetable);
router.post("/request-override", requestOverride);
router.patch("/approve-override", approveOverride);

module.exports = router;
