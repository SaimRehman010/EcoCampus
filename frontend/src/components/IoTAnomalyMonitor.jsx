import React, { useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Droplets,
  Loader2,
  Radio,
  RefreshCw,
  ShieldAlert,
  Ticket,
  Zap,
} from "lucide-react";
import { iotService } from "../services/api";

// ─── Helper: Badge colour for power state ────────────────────────────────────
const powerStateBadge = (state) =>
  state === "ACTIVE"
    ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : "bg-red-100 text-red-700 border-red-200";

// ─── Helper: Anomaly severity colour ─────────────────────────────────────────
const anomalyBadge = (anomalyState) =>
  anomalyState === "ANOMALY_DETECTED"
    ? "border-l-4 border-l-red-500 bg-red-50"
    : "border-l-4 border-l-emerald-400 bg-emerald-50/40";

// ─── Telemetry Card ───────────────────────────────────────────────────────────
function TelemetryCard({ room }) {
  const isAnomaly = room.anomalyState === "ANOMALY_DETECTED";
  return (
    <div
      className={`rounded-xl border border-slate-200 p-3 shadow-xs transition-all ${anomalyBadge(
        room.anomalyState
      )}`}
    >
      {/* Room header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-slate-800 text-xs leading-snug">
            {room.roomName}
          </p>
          <p className="text-[10px] text-slate-400">{room.building}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${powerStateBadge(
              room.powerState
            )}`}
          >
            {room.powerState}
          </span>
          {isAnomaly && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
              ⚡ ANOMALY
            </span>
          )}
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-2">
        {/* Power Draw */}
        <div
          className={`flex items-center space-x-1.5 rounded-lg px-2 py-1.5 ${
            room.anomalyTypes?.includes("POWER")
              ? "bg-red-100 border border-red-300"
              : "bg-white border border-slate-200"
          }`}
        >
          <Zap
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              room.anomalyTypes?.includes("POWER")
                ? "text-red-600"
                : "text-amber-500"
            }`}
          />
          <div>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">
              Live Draw
            </p>
            <p
              className={`text-xs font-bold ${
                room.anomalyTypes?.includes("POWER")
                  ? "text-red-700"
                  : "text-slate-700"
              }`}
            >
              {room.powerDraw}W
            </p>
          </div>
        </div>

        {/* Water Flow */}
        <div
          className={`flex items-center space-x-1.5 rounded-lg px-2 py-1.5 ${
            room.anomalyTypes?.includes("WATER")
              ? "bg-blue-100 border border-blue-300"
              : "bg-white border border-slate-200"
          }`}
        >
          <Droplets
            className={`w-3.5 h-3.5 flex-shrink-0 ${
              room.anomalyTypes?.includes("WATER")
                ? "text-blue-700"
                : "text-blue-400"
            }`}
          />
          <div>
            <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">
              Water Flow
            </p>
            <p
              className={`text-xs font-bold ${
                room.anomalyTypes?.includes("WATER")
                  ? "text-blue-700"
                  : "text-slate-700"
              }`}
            >
              {room.waterFlow} L/min
            </p>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <p className="text-[10px] text-slate-400 mt-1.5">
        🕐 Schedule: {room.scheduleHours} &nbsp;|&nbsp;{" "}
        {room.isWithinSchedule ? (
          <span className="text-emerald-600 font-semibold">Within Hours</span>
        ) : (
          <span className="text-orange-500 font-semibold">Outside Hours</span>
        )}
      </p>
    </div>
  );
}

// ─── Auto-ticket Banner ───────────────────────────────────────────────────────
function TicketBanner({ ticket }) {
  const isPower = ticket.type === "POWER";
  return (
    <div
      className={`flex items-start space-x-3 rounded-xl border p-3 ${
        isPower
          ? "border-red-300 bg-red-50"
          : "border-blue-300 bg-blue-50"
      }`}
    >
      <Ticket
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
          isPower ? "text-red-600" : "text-blue-600"
        }`}
      />
      <div>
        <p
          className={`text-xs font-bold ${
            isPower ? "text-red-700" : "text-blue-700"
          }`}
        >
          {isPower ? "⚡ Critical Energy Ticket" : "💧 Water Anomaly Ticket"}
        </p>
        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
          {ticket.title}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 font-mono">
          ID: {ticket.ticketId}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function IoTAnomalyMonitor() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL"); // ALL | ANOMALY | NORMAL

  const handleScan = async () => {
    setScanning(true);
    setError("");
    setScanResult(null);
    try {
      const result = await iotService.scanAnomalies();
      setScanResult(result);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "IoT scan failed — ensure the backend is running on port 5000."
      );
    } finally {
      setScanning(false);
    }
  };

  // Filter telemetry cards
  const displayedTelemetry = scanResult?.telemetry?.filter((r) => {
    if (filter === "ANOMALY") return r.anomalyState === "ANOMALY_DETECTED";
    if (filter === "NORMAL") return r.anomalyState === "NORMAL";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-red-500/30 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>IoT Telemetry Engine</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            IoT Telemetry &amp; Anomaly Alerts
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulates real-time campus sensor data. Detects power spikes &amp;
            water leaks. Auto-raises Tier-1 incident tickets.
          </p>
        </div>

        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-md transition-all cursor-pointer"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Cpu className="w-4 h-4" />
          )}
          <span>{scanning ? "Scanning Sensors…" : "Run Live IoT Scan"}</span>
        </button>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-start space-x-3 bg-red-50 border border-red-300 text-red-700 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* ── Scan Summary ── */}
      {scanResult && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "Rooms Scanned",
                value: scanResult.totalRoomsScanned,
                icon: <Activity className="w-5 h-5 text-slate-600" />,
                color: "bg-slate-50 border-slate-200",
              },
              {
                label: "Anomalies Found",
                value: scanResult.anomalyCount,
                icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
                color:
                  scanResult.anomalyCount > 0
                    ? "bg-red-50 border-red-200"
                    : "bg-emerald-50 border-emerald-200",
              },
              {
                label: "Auto-Tickets Filed",
                value: scanResult.ticketsCreated?.length,
                icon: <Ticket className="w-5 h-5 text-orange-500" />,
                color:
                  scanResult.ticketsCreated?.length > 0
                    ? "bg-orange-50 border-orange-200"
                    : "bg-emerald-50 border-emerald-200",
              },
              {
                label: "Systems Normal",
                value:
                  scanResult.totalRoomsScanned - scanResult.anomalyCount,
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
                color: "bg-emerald-50 border-emerald-200",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-4 flex items-center justify-between ${stat.color}`}
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
                    {stat.value}
                  </p>
                </div>
                {stat.icon}
              </div>
            ))}
          </div>

          {/* ── Auto-Generated Critical Tickets ── */}
          {scanResult.ticketsCreated?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <h3 className="font-bold text-slate-800 text-sm">
                  🚨 Auto-Generated Tier-1 Incident Tickets (
                  {scanResult.ticketsCreated.length})
                </h3>
              </div>
              <div className="space-y-2">
                {scanResult.ticketsCreated.map((t, i) => (
                  <TicketBanner key={i} ticket={t} />
                ))}
              </div>
            </div>
          )}

          {/* ── Telemetry Filter Bar ── */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-1">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-semibold mr-2">
              Filter:
            </span>
            {["ALL", "ANOMALY", "NORMAL"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                  filter === f
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-500 border-slate-300 hover:border-slate-500"
                }`}
              >
                {f === "ALL"
                  ? `All Rooms (${scanResult.telemetry?.length})`
                  : f === "ANOMALY"
                  ? `⚠ Anomalies (${scanResult.anomalyCount})`
                  : `✅ Normal (${scanResult.totalRoomsScanned - scanResult.anomalyCount})`}
              </button>
            ))}
          </div>

          {/* ── Live Telemetry Feed Grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayedTelemetry?.map((room, idx) => (
              <TelemetryCard key={idx} room={room} />
            ))}
          </div>

          <p className="text-[11px] text-slate-400 text-right">
            Last scan: {new Date(scanResult.scannedAt).toLocaleTimeString()} —{" "}
            {scanResult.totalRoomsScanned} sensor nodes polled
          </p>
        </>
      )}

      {/* ── Empty State (before first scan) ── */}
      {!scanResult && !scanning && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
            <Radio className="w-7 h-7 text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-600 text-sm">
              No scan data yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click <strong>"Run Live IoT Scan"</strong> to poll all campus
              sensor nodes and detect anomalies in real time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
