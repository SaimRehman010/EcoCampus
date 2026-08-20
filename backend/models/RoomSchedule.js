const mongoose = require("mongoose");

const roomScheduleSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: [true, "Room name is required"],
      trim: true,
    },
    building: {
      type: String,
      required: [true, "Building name is required"],
      trim: true,
    },
    scheduleHours: {
      type: String,
      default: "08:00-17:00",
    },
    powerState: {
      type: String,
      enum: ["ACTIVE", "CURTAILED"],
      default: "CURTAILED",
    },
    overrideStatus: {
      type: String,
      enum: ["NONE", "PENDING", "APPROVED"],
      default: "NONE",
    },
    overrideReason: {
      type: String,
      default: "",
    },
    requestedHours: {
      type: String,
      default: "",
    },
    requestedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const RoomSchedule = mongoose.model("RoomSchedule", roomScheduleSchema);

module.exports = RoomSchedule;
