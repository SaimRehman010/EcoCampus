const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Report title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Report description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: ["Electricity", "Water", "Waste", "AC/HVAC", "Other"],
        message: "{VALUE} is not a valid category. Choose from Electricity, Water, Waste, AC/HVAC, Other",
      },
    },
    location: {
      type: String,
      required: [true, "Location is required (e.g., Block B, 2nd Floor, Room 204)"],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ["Pending", "Assigned In Progress", "Resolved"],
        message: "{VALUE} is not a valid status. Allowed values are: Pending, Assigned In Progress, Resolved",
      },
      default: "Pending",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter reference (User) is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient filtering on status and category
reportSchema.index({ status: 1, category: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
