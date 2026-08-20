const mongoose = require("mongoose");
const Report = require("../models/Report");

// In-memory fallback mock reports store when MongoDB is not connected
const MOCK_REPORTS = [
  {
    _id: "mock_report_1",
    title: "Broken AC in Computer Lab 3",
    description: "AC unit leaking water and making loud noise.",
    category: "AC/HVAC",
    location: "Engineering Block, Room 302",
    status: "Assigned In Progress",
    reportedBy: { name: "Alex Johnson", email: "alex@campus.edu", role: "student" },
    createdAt: new Date().toISOString(),
  },
  {
    _id: "mock_report_2",
    title: "Leaking Water Pipe in Library Restroom",
    description: "Continuous water flow causing water wastage.",
    category: "Water",
    location: "Main Library, 2nd Floor",
    status: "Pending",
    reportedBy: { name: "Sam Lee", email: "sam@campus.edu", role: "student" },
    createdAt: new Date().toISOString(),
  },
  {
    _id: "mock_report_3",
    title: "Classroom Lights Left On Overnight",
    description: "Lights active in empty Science Hall overnight.",
    category: "Electricity",
    location: "Science Block A, Room 101",
    status: "Resolved",
    reportedBy: { name: "Manager Taylor", email: "taylor@campus.edu", role: "Manager" },
    createdAt: new Date().toISOString(),
  },
];

/**
 * @desc    Create a new sustainability/issue report
 * @route   POST /api/reports
 * @access  Private (Student, Admin)
 */
const createReport = async (req, res) => {
  try {
    const { title, description, category, location, imageUrl, assignedTo } = req.body;

    if (!title || !description || !category || !location) {
      return res.status(400).json({
        success: false,
        message: "Please provide title, description, category, and location",
      });
    }

    const validCategories = ["Electricity", "Water", "Waste", "AC/HVAC", "Other"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category '${category}'. Allowed categories: ${validCategories.join(", ")}`,
      });
    }

    // Fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      const mockReport = {
        _id: "mock_report_" + Date.now(),
        title,
        description,
        category,
        location,
        imageUrl: imageUrl || "",
        status: "Pending",
        reportedBy: {
          name: req.user?.name || "Student",
          email: req.user?.email || "student@campus.edu",
          role: req.user?.role || "student",
        },
        createdAt: new Date().toISOString(),
      };
      MOCK_REPORTS.unshift(mockReport);
      return res.status(201).json({
        success: true,
        message: "Report created successfully (Mock Mode)",
        data: mockReport,
      });
    }

    try {
      const reportData = {
        title,
        description,
        category,
        location,
        imageUrl: imageUrl || "",
        reportedBy: req.user._id,
      };

      if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
        reportData.assignedTo = assignedTo;
      }

      const report = await Report.create(reportData);

      const populatedReport = await Report.findById(report._id)
        .populate("reportedBy", "name email role")
        .populate("assignedTo", "name email role");

      return res.status(201).json({
        success: true,
        message: "Report created successfully",
        data: populatedReport,
      });
    } catch (dbErr) {
      console.warn("[CreateReport DB Error - Fallback]:", dbErr.message);
      const mockReport = {
        _id: "mock_report_" + Date.now(),
        title,
        description,
        category,
        location,
        imageUrl: imageUrl || "",
        status: "Pending",
        reportedBy: { name: req.user?.name || "Student" },
        createdAt: new Date().toISOString(),
      };
      MOCK_REPORTS.unshift(mockReport);
      return res.status(201).json({
        success: true,
        message: "Report created successfully (Mock Fallback)",
        data: mockReport,
      });
    }
  } catch (error) {
    console.error(`[CreateReport Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while creating report",
    });
  }
};

/**
 * @desc    Get all reports with optional filtering by status or category
 * @route   GET /api/reports
 * @access  Public or Protected
 */
const getReports = async (req, res) => {
  try {
    const { status, category, location } = req.query;

    // Fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      let result = [...MOCK_REPORTS];
      if (status && status !== "All") {
        result = result.filter((r) => r.status === status);
      }
      if (category) {
        result = result.filter((r) => r.category === category);
      }
      return res.status(200).json({
        success: true,
        count: result.length,
        data: result,
      });
    }

    try {
      const filter = {};

      if (status && status !== "All") {
        const validStatuses = ["Pending", "Assigned In Progress", "Resolved"];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status filter '${status}'. Allowed values: ${validStatuses.join(", ")}`,
          });
        }
        filter.status = status;
      }

      if (category) {
        filter.category = category;
      }

      if (location) {
        filter.location = { $regex: location, $options: "i" };
      }

      const reports = await Report.find(filter)
        .populate("reportedBy", "name email role")
        .populate("assignedTo", "name email role")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (dbErr) {
      console.warn("[GetReports DB Error - Fallback]:", dbErr.message);
      return res.status(200).json({
        success: true,
        count: MOCK_REPORTS.length,
        data: MOCK_REPORTS,
      });
    }
  } catch (error) {
    console.error(`[GetReports Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while retrieving reports",
    });
  }
};

/**
 * @desc    Get a single report by ID
 * @route   GET /api/reports/:id
 * @access  Public or Protected
 */
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const report = MOCK_REPORTS.find((r) => r._id === id) || MOCK_REPORTS[0];
      return res.status(200).json({
        success: true,
        data: report,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID format",
      });
    }

    const report = await Report.findById(id)
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error(`[GetReportById Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while fetching report",
    });
  }
};

/**
 * @desc    Update report status and optionally assign a manager/handler
 * @route   PATCH /api/reports/:id/status
 * @access  Private (Admin, Manager)
 */
const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please provide a status field",
      });
    }

    const validStatuses = ["Pending", "Assigned In Progress", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    if (mongoose.connection.readyState !== 1) {
      const report = MOCK_REPORTS.find((r) => r._id === id);
      if (report) {
        report.status = status;
      }
      return res.status(200).json({
        success: true,
        message: `Report status successfully updated to '${status}' (Mock Mode)`,
        data: report || { _id: id, status },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid report ID format",
      });
    }

    const updateFields = { status };

    if (assignedTo !== undefined) {
      if (assignedTo === null || assignedTo === "") {
        updateFields.assignedTo = null;
      } else if (mongoose.Types.ObjectId.isValid(assignedTo)) {
        updateFields.assignedTo = assignedTo;
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid assignedTo User ID format",
        });
      }
    }

    const updatedReport = await Report.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .populate("reportedBy", "name email role")
      .populate("assignedTo", "name email role");

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        message: "Report not found with given ID",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Report status successfully updated to '${status}'`,
      data: updatedReport,
    });
  } catch (error) {
    console.error(`[UpdateReportStatus Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error while updating report status",
    });
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReportStatus,
};
