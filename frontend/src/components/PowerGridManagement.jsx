import React, { useState, useEffect } from "react";
import {
  Zap,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Sliders,
  ShieldCheck,
  XCircle,
  FileSpreadsheet
} from "lucide-react";
import { scheduleService } from "../services/api";

export default function PowerGridManagement() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await scheduleService.getAll();
      setSchedules(data.data || []);
    } catch (err) {
      console.error("Failed to load schedules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Handle CSV/Excel File Parse or Sample Load
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    setUploading(true);
    setMsg("");
    setError("");

    try {
      let parsedSchedules = [];

      if (file) {
        const text = await file.text();
        // Parse CSV or JSON text
        if (file.name.endsWith(".json")) {
          parsedSchedules = JSON.parse(text);
        } else {
          const lines = text.split("\n").filter((l) => l.trim().length > 0);
          const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
          parsedSchedules = lines.slice(1).map((line) => {
            const cols = line.split(",").map((c) => c.trim());
            return {
              roomName: cols[0] || "Classroom 101",
              building: cols[1] || "Academic Block",
              scheduleHours: cols[2] || "08:00 - 17:00",
              powerState: (cols[3] || "CURTAILED").toUpperCase(),
            };
          });
        }
      } else {
        // Sample Batch Load if file dialog canceled or sample triggered
        parsedSchedules = [
          { roomName: "Science Block B - Room 302", building: "Science Block B", scheduleHours: "08:00 - 16:30", powerState: "CURTAILED" },
          { roomName: "Engineering Hall 101", building: "Engineering Block", scheduleHours: "09:00 - 17:00", powerState: "ACTIVE" },
          { roomName: "Main Auditorium", building: "Central Complex", scheduleHours: "08:00 - 18:00", powerState: "CURTAILED" },
          { roomName: "Computer Lab 4", building: "IT Block", scheduleHours: "08:00 - 16:00", powerState: "ACTIVE" },
          { roomName: "Physics Lecture Hall A", building: "Science Block A", scheduleHours: "08:30 - 15:30", powerState: "CURTAILED" },
        ];
      }

      const res = await scheduleService.uploadExcel(parsedSchedules);
      setMsg(res.message || "Master timetable uploaded and grid synchronized successfully!");
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to process timetable file.");
    } finally {
      setUploading(false);
    }
  };

  const handleApprove = async (roomId, roomName, action) => {
    setActionId(roomId);
    setMsg("");
    setError("");

    try {
      const res = await scheduleService.approveOverride({
        roomId,
        roomName,
        action,
      });
      setMsg(res.message || "Power override updated successfully!");
      fetchSchedules();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update power state.");
    } finally {
      setActionId(null);
    }
  };

  const pendingRequests = schedules.filter((s) => s.overrideStatus === "PENDING");
  const activeRoomsCount = schedules.filter((s) => s.powerState === "ACTIVE").length;
  const curtailedRoomsCount = schedules.filter((s) => s.powerState === "CURTAILED").length;

  return (
    <div className="space-y-6">
      {/* Header Controls Banner */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 mb-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Smart Power Grid Automation</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Classroom Power Schedule & Curtailment Control</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl">
            Automate AC/lighting curtailment outside official timetable hours. Review student extension requests or sync master timetable schedules.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <label className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>{uploading ? "Parsing..." : "Upload Timetable (.csv/.xlsx)"}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={fetchSchedules}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
            title="Refresh Grid Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg("")} className="text-emerald-700 font-bold ml-2">×</button>
        </div>
      )}

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-700 font-bold ml-2">×</button>
        </div>
      )}

      {/* Grid Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Power Active Rooms</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeRoomsCount}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Power Curtailed</p>
            <p className="text-2xl font-black text-rose-600 mt-0.5">{curtailedRoomsCount}</p>
          </div>
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Extensions</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingRequests.length}</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Section 1: Pending Student Extension Requests */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Pending Student & CR Power Extension Requests</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review and 1-click approve extra power hours for evening labs, student events, or exams.
            </p>
          </div>
          <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
            {pendingRequests.length} Pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No pending room power extension requests.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((reqItem) => (
              <div
                key={reqItem._id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-300 transition-all"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-sm">{reqItem.roomName}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                      {reqItem.building}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong className="text-slate-800">Applicant:</strong> {reqItem.requestedBy || "Student CR"} |{" "}
                    <strong className="text-slate-800">Hours:</strong> {reqItem.requestedHours}
                  </p>
                  <p className="text-slate-500 italic">"{reqItem.overrideReason}"</p>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    disabled={actionId === reqItem._id}
                    onClick={() => handleApprove(reqItem._id, reqItem.roomName, "APPROVED")}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Approve Power Extension</span>
                  </button>

                  <button
                    disabled={actionId === reqItem._id}
                    onClick={() => handleApprove(reqItem._id, reqItem.roomName, "REJECTED")}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    title="Reject Request"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Room Status Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Campus Classroom Power Grid Status</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live power state badges and instant curtailment override switches.
            </p>
          </div>

          <span className="text-xs text-slate-400">Total Rooms: {schedules.length}</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading grid status...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedules.map((room) => (
              <div
                key={room._id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3 bg-slate-50/50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{room.roomName}</h4>
                    <span className="text-[10px] text-slate-400">{room.building}</span>
                  </div>

                  {/* Power State Badge */}
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                      room.powerState === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-rose-100 text-rose-800 border border-rose-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        room.powerState === "ACTIVE" ? "bg-emerald-600 animate-pulse" : "bg-rose-600"
                      }`}
                    ></span>
                    <span>{room.powerState === "ACTIVE" ? "ACTIVE (Power ON)" : "CURTAILED (Power OFF)"}</span>
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 border-t border-b border-slate-200/60 py-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Scheduled Hours:</span>
                    <span className="font-mono text-slate-800">{room.scheduleHours}</span>
                  </div>
                  {room.overrideStatus !== "NONE" && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Override Status:</span>
                      <span
                        className={`font-semibold ${
                          room.overrideStatus === "APPROVED" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {room.overrideStatus}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Switch Button */}
                <button
                  disabled={actionId === room._id}
                  onClick={() => handleApprove(room._id, room.roomName, "TOGGLE")}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
                    room.powerState === "ACTIVE"
                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{room.powerState === "ACTIVE" ? "Enable Curtailment" : "Activate Power ON"}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
