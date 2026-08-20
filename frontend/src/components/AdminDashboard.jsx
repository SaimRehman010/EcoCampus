import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calculator,
  Filter,
  RefreshCw,
  Zap,
  Sparkles,
  Sliders,
  ClipboardList,
  Radio,
} from "lucide-react";
import { reportService, energyService } from "../services/api";
import PowerGridManagement from "./PowerGridManagement";
import IoTAnomalyMonitor from "./IoTAnomalyMonitor";


export default function AdminDashboard({ user }) {
  const [activeAdminSubTab, setActiveAdminSubTab] = useState("grid"); // 'grid' | 'triage'
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  // Energy Calculator State
  const [calcForm, setCalcForm] = useState({
    resource_type: "AC/HVAC",
    device_name: "Lecture Hall AC Split Units",
    power_watts: 2500,
    hours_per_day: 10,
    days: 30,
    device_count: 6,
    rate_per_kwh: 0.15,
  });
  const [calcResult, setCalcResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState("");

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

  useEffect(() => {
    fetchReports();
  }, []);

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      await reportService.updateStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCalculateEnergy = async (e) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcError("");
    setCalcResult(null);

    try {
      const res = await energyService.analyze(calcForm);
      setCalcResult(res);
    } catch (err) {
      setCalcError(
        err.response?.data?.message || "Error calling Python Resource Analyzer on Port 5001."
      );
    } finally {
      setCalcLoading(false);
    }
  };

  // Metrics
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === "Pending").length;
  const inProgressCount = reports.filter((r) => r.status === "Assigned In Progress").length;
  const resolvedCount = reports.filter((r) => r.status === "Resolved").length;

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "All") return true;
    return r.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-slate-900 border border-emerald-500/20 text-white px-3 py-1 rounded-full text-xs font-semibold mb-2">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span>Campus Sustainability Operations & Facilities Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Manager & Admin Operations Hub
          </h1>
        </div>

        <button
          onClick={fetchReports}
          className="flex items-center space-x-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-medium shadow-2xs transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Refresh Operations Data</span>
        </button>
      </div>

      {/* Admin Sub-Tabs Header */}
      <div className="flex border-b border-slate-200 space-x-2">
        <button
          onClick={() => setActiveAdminSubTab("grid")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeAdminSubTab === "grid"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Smart Power Grid & Overrides</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab("triage")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeAdminSubTab === "triage"
              ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Incident Ticket Triage & Energy Load</span>
        </button>

        <button
          onClick={() => setActiveAdminSubTab("iot")}
          className={`flex items-center space-x-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeAdminSubTab === "iot"
              ? "border-red-500 text-red-700 bg-red-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Radio className="w-4 h-4 text-red-500" />
          <span>IoT Anomaly Monitor</span>
        </button>
      </div>

      {/* TAB 1: Smart Power Grid Management */}
      {activeAdminSubTab === "grid" && (
        <PowerGridManagement />
      )}

      {/* TAB 3: IoT Anomaly Monitor */}
      {activeAdminSubTab === "iot" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <IoTAnomalyMonitor />
        </div>
      )}

      {/* TAB 2: Incident Triage & Energy Calculator */}
      {activeAdminSubTab === "triage" && (
        <div className="space-y-8">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Reports</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-bold">
                All
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-500">Pending Escalation</p>
                <p className="text-3xl font-black text-rose-600 mt-1">{pendingCount}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">In Progress</p>
                <p className="text-3xl font-black text-amber-600 mt-1">{inProgressCount}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Resolved Defects</p>
                <p className="text-3xl font-black text-emerald-600 mt-1">{resolvedCount}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Main Content Grid: Report Management Table (Left) + Python Calculator Panel (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Reports Management Table */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Incident Ticket Triage</h2>
                  <p className="text-xs text-slate-400">Update issue status pipeline in real-time</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Assigned In Progress">Assigned In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-12 text-center text-slate-400 text-sm">Loading reports...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">No reports to display.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Issue & Category</th>
                        <th className="p-3.5">Location</th>
                        <th className="p-3.5">Reported By</th>
                        <th className="p-3.5">Status Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredReports.map((report) => (
                        <tr key={report._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{report.title}</div>
                            <span className="text-[10px] text-slate-400">{report.category}</span>
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium">{report.location}</td>
                          <td className="p-3.5 text-slate-600">
                            {report.reportedBy?.name || "Student"}
                          </td>
                          <td className="p-3.5">
                            <select
                              disabled={updatingId === report._id}
                              value={report.status}
                              onChange={(e) => handleStatusChange(report._id, e.target.value)}
                              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-all cursor-pointer outline-none ${
                                report.status === "Resolved"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : report.status === "Assigned In Progress"
                                  ? "bg-amber-50 text-amber-800 border-amber-300"
                                  : "bg-rose-50 text-rose-800 border-rose-300"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Assigned In Progress">Assigned In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Python Energy Calculator Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center space-x-2.5 mb-4">
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Resource Load & Cost Calculator</h2>
                    <p className="text-xs text-slate-400">Powered by Python OOP Microservice (Port 5001)</p>
                  </div>
                </div>

                {calcError && (
                  <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
                    {calcError}
                  </div>
                )}

                <form onSubmit={handleCalculateEnergy} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Resource Type</label>
                      <select
                        value={calcForm.resource_type}
                        onChange={(e) => setCalcForm({ ...calcForm, resource_type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                      >
                        <option value="AC/HVAC">AC/HVAC</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Lighting">Lighting</option>
                        <option value="Water">Water Heating/Pumps</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Unit / Device Count</label>
                      <input
                        type="number"
                        min="1"
                        value={calcForm.device_count}
                        onChange={(e) => setCalcForm({ ...calcForm, device_count: parseInt(e.target.value) || 1 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Equipment / Location Name</label>
                    <input
                      type="text"
                      value={calcForm.device_name}
                      onChange={(e) => setCalcForm({ ...calcForm, device_name: e.target.value })}
                      placeholder="e.g. Auditorium HVAC Chillers"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Power Draw (Watts / Unit)</label>
                      <input
                        type="number"
                        min="1"
                        value={calcForm.power_watts}
                        onChange={(e) => setCalcForm({ ...calcForm, power_watts: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Daily Usage (Hours/Day)</label>
                      <input
                        type="number"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={calcForm.hours_per_day}
                        onChange={(e) => setCalcForm({ ...calcForm, hours_per_day: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={calcLoading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                  >
                    {calcLoading ? (
                      <span>Calling Microservice...</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Run Python OOP Consumption Analysis</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Analysis Output Cards */}
                {calcResult && (
                  <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-800 text-xs">{calcResult.device_name}</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                        {calcResult.resource_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Monthly Consumption</p>
                        <p className="text-lg font-black text-slate-800">{calcResult.consumption_kwh} <span className="text-xs font-normal">kWh</span></p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-slate-200">
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost</p>
                        <p className="text-lg font-black text-emerald-600">${calcResult.estimated_cost_usd} <span className="text-xs font-normal">USD</span></p>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900 mb-1 flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resource Analyzer Recommendation:</span>
                      </p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{calcResult.recommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
