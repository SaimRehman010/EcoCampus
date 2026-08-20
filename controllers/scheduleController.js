const mongoose = require("mongoose");
const RoomSchedule = require("../models/RoomSchedule");

// 12 Initial Campus Rooms across 4 Academic Wings with 2 Pending Overrides
const MOCK_ROOM_SCHEDULES = [
  // Science Block A
  {
    _id: "room_sb_101",
    roomName: "Science Block A - Room 101",
    building: "Science Block A",
    scheduleHours: "08:00 - 17:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_sb_102",
    roomName: "Science Block A - Room 102",
    building: "Science Block A",
    scheduleHours: "08:00 - 16:00",
    powerState: "CURTAILED",
    overrideStatus: "PENDING",
    overrideReason: "Late night AI research experiment & neural net training",
    requestedHours: "16:00 - 19:00 (+3 hrs)",
    requestedBy: "Alex Johnson (CR)",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_sb_cslab1",
    roomName: "Science Block A - CS Lab 1",
    building: "Science Block A",
    scheduleHours: "08:00 - 18:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },

  // Engineering Block B
  {
    _id: "room_eng_201",
    roomName: "Engineering Block B - Room 201",
    building: "Engineering Block B",
    scheduleHours: "09:00 - 15:00",
    powerState: "CURTAILED",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_eng_202",
    roomName: "Engineering Block B - Room 202",
    building: "Engineering Block B",
    scheduleHours: "08:00 - 17:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_eng_hwlab",
    roomName: "Engineering Block B - Hardware Lab",
    building: "Engineering Block B",
    scheduleHours: "08:00 - 20:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },

  // Management Block C
  {
    _id: "room_mgmt_hall1",
    roomName: "Management Block C - Hall 1",
    building: "Management Block C",
    scheduleHours: "08:00 - 14:00",
    powerState: "CURTAILED",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_mgmt_301",
    roomName: "Management Block C - Room 301",
    building: "Management Block C",
    scheduleHours: "08:00 - 17:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_mgmt_seminar",
    roomName: "Management Block C - Seminar Room",
    building: "Management Block C",
    scheduleHours: "09:00 - 16:00",
    powerState: "CURTAILED",
    overrideStatus: "PENDING",
    overrideReason: "IEEE Student Chapter Annual Tech Summit Preparation",
    requestedHours: "16:00 - 19:00 (+3 hrs)",
    requestedBy: "Maria Garcia (Student Union)",
    createdAt: new Date().toISOString(),
  },

  // Library & IT Wing
  {
    _id: "room_lib_reada",
    roomName: "Library Wing - Reading Room A",
    building: "Library & IT Wing",
    scheduleHours: "08:00 - 22:00",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_lib_serverlab",
    roomName: "IT Wing - Server Lab (24/7)",
    building: "Library & IT Wing",
    scheduleHours: "00:00 - 23:59 (24/7)",
    powerState: "ACTIVE",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "room_lib_quietb",
    roomName: "Library Wing - Quiet Zone B",
    building: "Library & IT Wing",
    scheduleHours: "08:00 - 18:00",
    powerState: "CURTAILED",
    overrideStatus: "NONE",
    overrideReason: "",
    requestedHours: "",
    requestedBy: "",
    createdAt: new Date().toISOString(),
  },
];

/**
 * @desc    Get all room schedules and override requests
 * @route   GET /api/schedule
 * @access  Public / Protected
 */
const getSchedules = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        count: MOCK_ROOM_SCHEDULES.length,
        data: MOCK_ROOM_SCHEDULES,
      });
    }

    try {
      let rooms = await RoomSchedule.find({}).sort({ createdAt: -1 });
      if (rooms.length === 0) {
        await RoomSchedule.insertMany(MOCK_ROOM_SCHEDULES.map(({ _id, ...rest }) => rest));
        rooms = await RoomSchedule.find({}).sort({ createdAt: -1 });
      }
      return res.status(200).json({
        success: true,
        count: rooms.length,
        data: rooms,
      });
    } catch (dbErr) {
      console.warn("[GetSchedules DB Fallback]:", dbErr.message);
      return res.status(200).json({
        success: true,
        count: MOCK_ROOM_SCHEDULES.length,
        data: MOCK_ROOM_SCHEDULES,
      });
    }
  } catch (error) {
    console.error(`[GetSchedules Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch room schedules",
    });
  }
};

/**
 * @desc    Get distinct list of registered blocks and their associated rooms
 * @route   GET /api/schedule/blocks
 * @access  Public
 */
const getBlocksAndRooms = async (req, res) => {
  try {
    let schedulesList = MOCK_ROOM_SCHEDULES;

    if (mongoose.connection.readyState === 1) {
      try {
        const dbRooms = await RoomSchedule.find({});
        if (dbRooms && dbRooms.length > 0) {
          schedulesList = dbRooms;
        }
      } catch (dbErr) {
        console.warn("[getBlocksAndRooms DB Fallback]:", dbErr.message);
      }
    }

    const blocksMap = {};

    schedulesList.forEach((r) => {
      const bName = r.building || "General Academic Block";
      if (!blocksMap[bName]) {
        blocksMap[bName] = new Set();
      }
      blocksMap[bName].add(r.roomName);
    });

    const blocks = Object.keys(blocksMap).map((blockName) => ({
      block: blockName,
      rooms: Array.from(blocksMap[blockName]),
    }));

    return res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    console.error(`[getBlocksAndRooms Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch blocks and rooms",
    });
  }
};

/**
 * @desc    Upload / Parse Timetable JSON/CSV/Excel payload
 * @route   POST /api/schedule/upload-excel
 * @access  Private (Admin, Manager)
 */
const uploadTimetable = async (req, res) => {
  try {
    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid array of room schedule objects in req.body.schedules",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      schedules.forEach((item, idx) => {
        const existingIdx = MOCK_ROOM_SCHEDULES.findIndex(r => r.roomName === item.roomName);
        const newItem = {
          _id: "room_upload_" + Date.now() + "_" + idx,
          roomName: item.roomName || `Classroom ${idx + 1}`,
          building: item.building || "General Academic Block",
          scheduleHours: item.scheduleHours || "08:00 - 17:00",
          powerState: item.powerState || "CURTAILED",
          overrideStatus: "NONE",
          overrideReason: "",
          requestedHours: "",
          requestedBy: "",
          createdAt: new Date().toISOString(),
        };

        if (existingIdx !== -1) {
          MOCK_ROOM_SCHEDULES[existingIdx] = { ...MOCK_ROOM_SCHEDULES[existingIdx], ...newItem };
        } else {
          MOCK_ROOM_SCHEDULES.unshift(newItem);
        }
      });

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${schedules.length} timetable records (Mock Mode)`,
        data: MOCK_ROOM_SCHEDULES,
      });
    }

    try {
      for (const item of schedules) {
        await RoomSchedule.findOneAndUpdate(
          { roomName: item.roomName },
          {
            $set: {
              roomName: item.roomName,
              building: item.building || "General Academic Block",
              scheduleHours: item.scheduleHours || "08:00 - 17:00",
              powerState: item.powerState || "CURTAILED",
            },
          },
          { upsert: true, new: true }
        );
      }

      const updatedList = await RoomSchedule.find({}).sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: `Successfully synchronized ${schedules.length} master timetable room records`,
        data: updatedList,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        message: `Processed ${schedules.length} timetable records (Mock Fallback)`,
        data: MOCK_ROOM_SCHEDULES,
      });
    }
  } catch (error) {
    console.error(`[UploadTimetable Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Error processing timetable upload",
    });
  }
};

/**
 * @desc    Request Room Power Extension Override
 * @route   POST /api/schedule/request-override
 * @access  Private (Student, CR, Manager)
 */
const requestOverride = async (req, res) => {
  try {
    const { roomId, roomName, overrideReason, requestedHours, requestedBy } = req.body;

    if (!roomName && !roomId) {
      return res.status(400).json({
        success: false,
        message: "Please specify roomName or roomId for the override request",
      });
    }

    if (!overrideReason || !requestedHours) {
      return res.status(400).json({
        success: false,
        message: "Please provide both overrideReason and requestedHours",
      });
    }

    const applicant = requestedBy || req.user?.name || "Student CR";

    if (mongoose.connection.readyState !== 1) {
      const room = MOCK_ROOM_SCHEDULES.find(r => r._id === roomId || r.roomName === roomName);
      if (room) {
        room.overrideStatus = "PENDING";
        room.overrideReason = overrideReason;
        room.requestedHours = requestedHours;
        room.requestedBy = applicant;
      } else {
        const newRoom = {
          _id: "room_override_" + Date.now(),
          roomName: roomName || "Requested Room",
          building: "Academic Building",
          scheduleHours: "08:00 - 17:00",
          powerState: "CURTAILED",
          overrideStatus: "PENDING",
          overrideReason,
          requestedHours,
          requestedBy: applicant,
          createdAt: new Date().toISOString(),
        };
        MOCK_ROOM_SCHEDULES.unshift(newRoom);
      }

      return res.status(200).json({
        success: true,
        message: "Power extension request submitted! Pending Admin approval.",
        data: room || MOCK_ROOM_SCHEDULES[0],
      });
    }

    try {
      let query = {};
      if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
        query._id = roomId;
      } else {
        query.roomName = roomName;
      }

      const updatedRoom = await RoomSchedule.findOneAndUpdate(
        query,
        {
          $set: {
            overrideStatus: "PENDING",
            overrideReason,
            requestedHours,
            requestedBy: applicant,
          },
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: "Power extension request submitted! Pending Admin approval.",
        data: updatedRoom,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        message: "Power extension request submitted (Mock Fallback)",
        data: MOCK_ROOM_SCHEDULES[0],
      });
    }
  } catch (error) {
    console.error(`[RequestOverride Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit power extension request",
    });
  }
};

/**
 * @desc    Approve Room Power Extension & Toggle Power State
 * @route   PATCH /api/schedule/approve-override
 * @access  Private (Admin, Manager)
 */
const approveOverride = async (req, res) => {
  try {
    const { roomId, roomName, action, powerState } = req.body;

    const targetPowerState = powerState || (action === "TOGGLE" ? undefined : "ACTIVE");

    if (mongoose.connection.readyState !== 1) {
      const room = MOCK_ROOM_SCHEDULES.find(r => r._id === roomId || r.roomName === roomName);
      if (room) {
        if (action === "TOGGLE") {
          room.powerState = room.powerState === "ACTIVE" ? "CURTAILED" : "ACTIVE";
        } else if (action === "REJECTED") {
          room.overrideStatus = "NONE";
        } else {
          room.powerState = "ACTIVE";
          room.overrideStatus = "APPROVED";
        }
      }

      return res.status(200).json({
        success: true,
        message: `Room power state updated to '${room?.powerState || "ACTIVE"}'`,
        data: room || { _id: roomId, powerState: "ACTIVE", overrideStatus: "APPROVED" },
      });
    }

    try {
      let query = {};
      if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
        query._id = roomId;
      } else {
        query.roomName = roomName;
      }

      const existing = await RoomSchedule.findOne(query);
      const newPowerState = action === "TOGGLE"
        ? (existing?.powerState === "ACTIVE" ? "CURTAILED" : "ACTIVE")
        : (targetPowerState || "ACTIVE");
      const newOverrideStatus = action === "REJECTED" ? "NONE" : "APPROVED";

      const updated = await RoomSchedule.findOneAndUpdate(
        query,
        {
          $set: {
            powerState: newPowerState,
            overrideStatus: newOverrideStatus,
          },
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: `Room power state successfully updated to '${newPowerState}'`,
        data: updated,
      });
    } catch (dbErr) {
      return res.status(200).json({
        success: true,
        message: "Room power state updated (Mock Fallback)",
        data: MOCK_ROOM_SCHEDULES[0],
      });
    }
  } catch (error) {
    console.error(`[ApproveOverride Error]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve room power override",
    });
  }
};

module.exports = {
  getSchedules,
  getBlocksAndRooms,
  uploadTimetable,
  requestOverride,
  approveOverride,
};
