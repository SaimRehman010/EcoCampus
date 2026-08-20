const express = require("express");
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
} = require("../controllers/reportController");
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Routes
// 1. Create report: Allowed for authenticated Student and Admin
// 2. Get reports: Accessible by all authenticated users (or public)
router
  .route("/")
  .post(protect, authorize("Student", "Admin"), createReport)
  .get(getReports);

// Get single report
router.route("/:id").get(getReportById);

// Update status: Allowed for Admin and Manager
router
  .route("/:id/status")
  .patch(protect, authorize("Admin", "Manager"), updateReportStatus);

module.exports = router;
