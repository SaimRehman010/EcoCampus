const RoomSchedule = require("../models/RoomSchedule");
const Report = require("../models/Report");
const User = require("../models/User");
const mongoose = require("mongoose");

// ─── Thresholds ───────────────────────────────────────────────────────────────
const POWER_ANOMALY_THRESHOLD_W = 350;   // Watts: CURTAILED room spike limit
const WATER_ANOMALY_THRESHOLD_LPM = 12; // L/min: off-hours water flow limit

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Returns a simulated current hour (0-23) based on real system time.
 */
const getCurrentHour = () => new Date().getHours();

/**
 * Parses "HH:MM-HH:MM" schedule string, returns { start, end } as integers.
 */
const parseSchedule = (scheduleHours = "08:00-17:00") => {
  const parts = scheduleHours.split("-");
  const start = parseInt(parts[0]?.split(":")[0] || "8", 10);
  const end = parseInt(parts[1]?.split(":")[0] || "17", 10);
  return { start, end };
};

/**
 * Generates reproducible-ish pseudo-random telemetry per room so results
 * feel realistic but vary between scans.
 */
const simulateTelemetry = (room) => {
  const seed = Date.now() % 10000;
  const baseNoise = (Math.sin(seed + room.roomName.length * 3.7) + 1) / 2; // 0..1

  const { start, end } = parseSchedule(room.scheduleHours);
  const hour = getCurrentHour();
  const isWithinSchedule = hour >= start && hour < end;

  // Power simulation
  let powerDraw;
  if (room.powerState === "CURTAILED") {
    // CURTAILED rooms occasionally spike (the anomaly scenario)
    powerDraw = Math.round(100 + baseNoise * 500); // 100W–600W, sometimes above threshold
  } else {
    powerDraw = Math.round(800 + baseNoise * 1200); // normal active: 800W–2000W
  }

  // Water simulation — elevated outside schedule hours
  const waterBase = isWithinSchedule ? baseNoise * 10 : baseNoise * 18;
  const waterFlow = parseFloat(waterBase.toFixed(1)); // L/min

  return { powerDraw, waterFlow, isWithinSchedule, hour };
};

/**
 * Resolves (or creates) the system IoT sentinel user for auto-tickets.
 * Falls back gracefully if DB is unreachable.
 */
const getSystemUserId = async () => {
  try {
    let systemUser = await User.findOne({ email: "iot-sentinel@ecocampus.sys" });
    if (!systemUser) {
      systemUser = await User.create({
        name: "System IoT Sensor",
        email: "iot-sentinel@ecocampus.sys",
        password: `sentinel_${Date.now()}`,
        role: "admin",
      });
    }
    return systemUser._id;
  } catch {
    return new mongoose.Types.ObjectId("000000000000000000000001");
  }
};

const MOCK_ROOMS = [
  { roomName: "Room 101", building: "Science Block A", scheduleHours: "08:00-17:00", powerState: "ACTIVE", _id: "mock_001" },
  { roomName: "Room 102", building: "Science Block A", scheduleHours: "08:00-16:00", powerState: "CURTAILED", _id: "mock_002" },
  { roomName: "CS Lab 1", building: "Science Block A", scheduleHours: "08:00-18:00", powerState: "ACTIVE", _id: "mock_003" },
  { roomName: "Room 201", building: "Engineering Block B", scheduleHours: "09:00-15:00", powerState: "CURTAILED", _id: "mock_004" },
  { roomName: "Room 202", building: "Engineering Block B", scheduleHours: "08:00-17:00", powerState: "ACTIVE", _id: "mock_005" },
  { roomName: "Hardware Lab", building: "Engineering Block B", scheduleHours: "08:00-20:00", powerState: "ACTIVE", _id: "mock_006" },
  { roomName: "Hall 1", building: "Management Block C", scheduleHours: "08:00-14:00", powerState: "CURTAILED", _id: "mock_007" },
  { roomName: "Room 301", building: "Management Block C", scheduleHours: "08:00-17:00", powerState: "ACTIVE", _id: "mock_008" },
  { roomName: "Seminar Room", building: "Management Block C", scheduleHours: "09:00-16:00", powerState: "CURTAILED", _id: "mock_009" },
  { roomName: "Reading Room A", building: "Library & IT Wing", scheduleHours: "08:00-22:00", powerState: "ACTIVE", _id: "mock_010" },
  { roomName: "Server Lab", building: "Library & IT Wing", scheduleHours: "00:00-23:59", powerState: "ACTIVE", _id: "mock_011" },
  { roomName: "Quiet Zone B", building: "Library & IT Wing", scheduleHours: "08:00-18:00", powerState: "CURTAILED", _id: "mock_012" },
];

// ─── Controller ───────────────────────────────────────────────────────────────
/**
 * POST /api/iot/scan-anomalies
 * Scans all rooms, simulates telemetry, flags anomalies, auto-creates tickets.
 */
const scanAnomalies = async (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  let rooms = [];
  let usingMock = false;

  try {
    if (isDbConnected) {
      rooms = await RoomSchedule.find({});
    }
  } catch (_) {
    // DB query failed; fall through to mock
  }

  if (!rooms || rooms.length === 0) {
    rooms = MOCK_ROOMS;
    usingMock = true;
  }

  try {
    const systemUserId = isDbConnected ? await getSystemUserId() : new mongoose.Types.ObjectId("000000000000000000000001");
    const telemetryFeed = [];
    const anomalies = [];
    const ticketsCreated = [];


    for (const room of rooms) {
      const { powerDraw, waterFlow, isWithinSchedule } = simulateTelemetry(room);

      // ── Anomaly Check 1: CURTAILED room drawing too much power ──────────────
      const isPowerAnomaly =
        room.powerState === "CURTAILED" && powerDraw > POWER_ANOMALY_THRESHOLD_W;

      // ── Anomaly Check 2: Water flow spike outside operational hours ─────────
      const isWaterAnomaly = !isWithinSchedule && waterFlow > WATER_ANOMALY_THRESHOLD_LPM;

      const anomalyTypes = [];
      if (isPowerAnomaly) anomalyTypes.push("POWER");
      if (isWaterAnomaly) anomalyTypes.push("WATER");
      const hasAnomaly = anomalyTypes.length > 0;

      // Build telemetry card
      telemetryFeed.push({
        roomName: room.roomName,
        building: room.building,
        scheduleHours: room.scheduleHours,
        powerState: room.powerState,
        powerDraw,
        waterFlow,
        isWithinSchedule,
        anomalyState: hasAnomaly ? "ANOMALY_DETECTED" : "NORMAL",
        anomalyTypes,
      });

      // ── Auto-ticket generation ───────────────────────────────────────────────
      if (hasAnomaly) {
        anomalies.push({
          room: room.roomName,
          building: room.building,
          types: anomalyTypes,
          powerDraw,
          waterFlow,
        });

        const createdTickets = [];

        // Power ticket
        if (isPowerAnomaly) {
          try {
            const powerTicket = await Report.create({
              title: `[AUTO-ALERT] Critical Energy Spike Detected in ${room.roomName}`,
              category: "Electricity",
              description:
                `IoT Sensor Alert: ${room.roomName} (${room.building}) is scheduled CURTAILED ` +
                `but detected active draw of ${powerDraw}W (threshold: ${POWER_ANOMALY_THRESHOLD_W}W). ` +
                `Potential unattended AC/appliances. Schedule: ${room.scheduleHours}. ` +
                `Immediate inspection recommended.`,
              location: `${room.building}, ${room.roomName}`,
              reportedBy: systemUserId,
              status: "Pending",
            });
            createdTickets.push({ type: "POWER", ticketId: powerTicket._id, title: powerTicket.title });
          } catch (ticketErr) {
            console.error(`[IoT] Failed to create power ticket for ${room.roomName}:`, ticketErr.message);
          }
        }

        // Water ticket
        if (isWaterAnomaly) {
          try {
            const waterTicket = await Report.create({
              title: `[AUTO-ALERT] Abnormal Water Flow Detected in ${room.roomName}`,
              category: "Water",
              description:
                `IoT Sensor Alert: ${room.roomName} (${room.building}) detected water flow of ` +
                `${waterFlow} L/min outside operational hours (threshold: ${WATER_ANOMALY_THRESHOLD_LPM} L/min). ` +
                `Schedule: ${room.scheduleHours}. Possible leak or unauthorized usage.`,
              location: `${room.building}, ${room.roomName}`,
              reportedBy: systemUserId,
              status: "Pending",
            });
            createdTickets.push({ type: "WATER", ticketId: waterTicket._id, title: waterTicket.title });
          } catch (ticketErr) {
            console.error(`[IoT] Failed to create water ticket for ${room.roomName}:`, ticketErr.message);
          }
        }

        ticketsCreated.push(...createdTickets);
      }
    }

    console.log(`[IoT Scan] Scanned ${rooms.length} rooms. Anomalies: ${anomalies.length}. Tickets: ${ticketsCreated.length}`);

    return res.status(200).json({
      success: true,
      scannedAt: new Date().toISOString(),
      totalRoomsScanned: rooms.length,
      anomalyCount: anomalies.length,
      ticketsCreated,
      anomalies,
      telemetry: telemetryFeed,
    });
  } catch (err) {
    console.error("[IoT Scan Error]:", err.message);
    return res.status(500).json({
      success: false,
      message: "IoT scan failed: " + err.message,
    });
  }
};

module.exports = { scanAnomalies };
