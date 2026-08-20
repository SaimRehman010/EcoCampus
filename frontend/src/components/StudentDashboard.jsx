import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
  MapPin,
  Zap,
  Droplet,
  Trash2,
  Wind,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Building,
  Navigation
} from "lucide-react";
import { reportService, scheduleService } from "../services/api";

const CATEGORY_ICONS = {
  Electricity: <Zap className="w-4 h-4 text-amber-500" />,
  Water: <Droplet className="w-4 h-4 text-blue-500" />,
  Waste: <Trash2 className="w-4 h-4 text-emerald-500" />,
  "AC/HVAC": <Wind className="w-4 h-4 text-cyan-500" />,
  Other: <Layers className="w-4 h-4 text-slate-500" />,
};

const NEARBY_OTHER_OPTION = "Any other Problem nearby";

export default function StudentDashboard({ user, onRequireAuth }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  // Dynamic Campus Blocks & Rooms State
  const [blocksData, setBlocksData] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [customLocation, setCustomLocation] = useState("");

  // Power Extension Modal State
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    roomName: "Science Block A - Room 102",
    requestedHours: "16:00 - 19:00 (+3 hrs)",
    overrideReason: "Late night AI research experiment & neural net training",
    requestedBy: user?.name || "Alex Johnson (CR)",
  });
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideMsg, setOverrideMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Electricity",
    location: "",
    imageUrl: "",
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getAll();
      setReports(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateLocationPayload = (block, room, customText) => {
    let loc = "";
    if (room === NEARBY_OTHER_OPTION) {
      loc = customText ? `${block}, ${customText}` : `${block}, Nearby Area`;
    } else {
      loc = room ? `${block}, ${room}` : block;
    }
    setFormData((prev) => ({
      ...prev,
      location: loc,
    }));
  };

  const fetchBlocks = async () => {
    try {
      const res = await scheduleService.getBlocks();
      if (res.success && res.blocks && res.blocks.length > 0) {
        setBlocksData(res.blocks);
        const firstBlock = res.blocks[0];
        setSelectedBlock(firstBlock.block);
        const firstRoom = firstBlock.rooms?.[0] || NEARBY_OTHER_OPTION;
        setSelectedRoom(firstRoom);
        updateLocationPayload(firstBlock.block, firstRoom, customLocation);
      }
    } catch (err) {
      console.error("Failed to load blocks & rooms", err);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchBlocks();
  }, []);

  const handleBlockChange = (blockName) => {
    setSelectedBlock(blockName);
    const found = blocksData.find((b) => b.block === blockName);
    const rooms = found ? found.rooms : [];
    const defaultRoom = rooms[0] || NEARBY_OTHER_OPTION;
    setSelectedRoom(defaultRoom);
    updateLocationPayload(blockName, defaultRoom, customLocation);
  };

  const handleRoomChange = (roomName) => {
    setSelectedRoom(roomName);
    updateLocationPayload(selectedBlock, roomName, customLocation);
  };

  const handleCustomLocationChange = (text) => {
    setCustomLocation(text);
    updateLocationPayload(selectedBlock, selectedRoom, text);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMsg("");

    try {
      await reportService.create(formData);
      setSuccessMsg("Issue ticket successfully logged! Facilities team notified.");
      setFormData((prev) => ({
        ...prev,
        title: "",
        description: "",
        category: "Electricity",
        imageUrl: "",
      }));
      setCustomLocation("");
      fetchReports();
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit report. Please verify all fields."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }

    setOverrideSubmitting(true);
    setOverrideMsg("");

    try {
      const res = await scheduleService.requestOverride({
        roomName: overrideForm.roomName,
        requestedHours: overrideForm.requestedHours,
        overrideReason: overrideForm.overrideReason,
        requestedBy: overrideForm.requestedBy || user?.name || "Student CR",
      });

      setOverrideMsg(res.message || "Power extension request submitted to Admin Grid Hub!");
      setTimeout(() => {
        setOverrideModalOpen(false);
        setOverrideMsg("");
      }, 2000);
    } catch (err) {
      setOverrideMsg(err.response?.data?.message || "Failed to submit power extension request.");
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (selectedFilter === "All") return true;
    return r.status === selectedFilter;
  });

  const activeBlockData = blocksData.find((b) => b.block === selectedBlock);
  const activeRoomsList = [...(activeBlockData?.rooms || []), NEARBY_OTHER_OPTION];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner - Dark Slate Navy with subtle emerald border */}
      <div className="bg-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-3 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Sustainability & Maintenance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Report an Environmental Issue
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl mt-1">
            Spot a water leak, AC running in an empty room, or broken lighting? Select registered campus blocks & rooms below to submit an incident.
          </p>
        </div>

        {/* Quick Power Extension Button */}
        <button
          onClick={() => {
            if (!user) {
              onRequireAuth();
            } else {
              setOverrideModalOpen(true);
            }
          }}
          className="relative z-10 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap"
        >
          <Zap className="w-4 h-4 text-emerald-300" />
          <span>Request Room Power Extension</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Issue Reporting Form */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2 mb-4">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Log New Incident / Report</span>
            </h2>

            {error && (
              <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken valve dripping continuously"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="Electricity">Electricity</option>
                  <option value="Water">Water</option>
                  <option value="Waste">Waste</option>
                  <option value="AC/HVAC">AC/HVAC</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Linked Dynamic Dropdowns: Block & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Campus Block *</span>
                  </label>
                  <select
                    value={selectedBlock}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs"
                  >
                    {blocksData.map((b) => (
                      <option key={b.block} value={b.block}>
                        {b.block}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Room / Location *</span>
                  </label>
                  <select
                    value={selectedRoom}
                    onChange={(e) => handleRoomChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs"
                  >
                    {activeRoomsList.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Input for "Any other Problem nearby" */}
              {selectedRoom === NEARBY_OTHER_OPTION && (
                <div className="animate-fade-in space-y-1">
                  <label className="block font-semibold text-slate-700 text-xs flex items-center space-x-1">
                    <Navigation className="w-3 h-3 text-emerald-600" />
                    <span>Specify Precise Nearby Location *</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Specify precise location (e.g., 2nd Floor Corridor, Main Staircase)"
                    value={customLocation}
                    onChange={(e) => handleCustomLocationChange(e.target.value)}
                    className="w-full px-3.5 py-2 border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs bg-emerald-50/30"
                  />
                </div>
              )}

              {/* Display Computed Combined Location */}
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Submitted Location Payload:</span>{" "}
                <code className="text-emerald-700 font-mono">{formData.location || "N/A"}</code>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the severity, duration, or any safety hazards observed..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evidence Photo URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-sm flex items-center justify-center space-x-2 cursor-pointer"
              >
                {submitting ? (
                  <span>Submitting Incident...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>Submit Sustainability Report</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List of Submitted Reports */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Campus Issue Feed</h2>
                <p className="text-xs text-slate-500">Live track status of reported campus defects and resolution pipeline</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchReports}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="Refresh Reports"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Status Filter Chips */}
            <div className="flex space-x-2 my-4 overflow-x-auto pb-1">
              {["All", "Pending", "Assigned In Progress", "Resolved"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedFilter(status)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedFilter === status
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            {/* Reports List */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                Loading campus reports...
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No reports found matching selected status filter.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {filteredReports.map((report) => (
                  <div
                    key={report._id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                          {CATEGORY_ICONS[report.category] || CATEGORY_ICONS.Other}
                        </span>
                        <h3 className="font-semibold text-slate-800 text-sm">{report.title}</h3>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1 ${
                          report.status === "Resolved"
                            ? "bg-emerald-100 text-emerald-800"
                            : report.status === "Assigned In Progress"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {report.status === "Resolved" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : report.status === "Assigned In Progress" ? (
                          <Clock className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        <span>{report.status}</span>
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mb-3">{report.description}</p>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/60 gap-2">
                      <div className="flex items-center space-x-1 text-slate-500 font-medium">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{report.location}</span>
                      </div>
                      <div>
                        Reported by: <span className="font-medium text-slate-700">{report.reportedBy?.name || "Anonymous"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STUDENT POWER EXTENSION REQUEST MODAL */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative">
            <button
              onClick={() => setOverrideModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="bg-slate-900 border-b border-emerald-500/20 p-6 text-white text-center relative overflow-hidden">
              <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl mb-3">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">Request Room Power Extension</h2>
              <p className="text-slate-300 text-xs mt-1">
                For CRs & Students needing extra power hours outside timetable schedules
              </p>
            </div>

            {overrideMsg && (
              <div className="mx-6 mt-4 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-medium">
                {overrideMsg}
              </div>
            )}

            <form onSubmit={handleOverrideSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Classroom / Lab Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Science Block B - Room 302"
                  value={overrideForm.roomName}
                  onChange={(e) => setOverrideForm({ ...overrideForm, roomName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Requested Extension Hours *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 17:00 - 20:00 (+3 hrs)"
                  value={overrideForm.requestedHours}
                  onChange={(e) => setOverrideForm({ ...overrideForm, requestedHours: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Override Reason / Event *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe the reason (e.g. AI project lab testing, IEEE workshop, exam study)..."
                  value={overrideForm.overrideReason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, overrideReason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Applicant Name / Role</label>
                <input
                  type="text"
                  value={overrideForm.requestedBy}
                  onChange={(e) => setOverrideForm({ ...overrideForm, requestedBy: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={overrideSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-2.5 rounded-xl shadow-md shadow-emerald-600/20 text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                {overrideSubmitting ? (
                  <span>Submitting Request...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Submit Extension Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
