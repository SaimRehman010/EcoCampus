import axios from "axios";

// Base URLs
const EXPRESS_BASE_URL = import.meta.env.VITE_EXPRESS_URL || "http://localhost:5000/api";
const PYTHON_BASE_URL = import.meta.env.VITE_PYTHON_URL || "http://localhost:5001/api";
const AI_BASE_URL = import.meta.env.VITE_AI_URL || "http://localhost:5002/api/ai";

// 1. Express API Axios Client (Port 5000)
const expressClient = axios.create({
  baseURL: EXPRESS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization Token if available
expressClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ecocampus_token");
    config.headers.Authorization = token ? `Bearer ${token}` : "";
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Python Resource Analyzer Client (Port 5001)
const pythonClient = axios.create({
  baseURL: PYTHON_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 3. Python AI Microservice Client (Port 5002)
const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ==========================================
// EXPORTED SERVICES
// ==========================================

export const authService = {
  register: async (data) => {
    const res = await expressClient.post("/auth/register", data);
    return res.data;
  },
  login: async (credentials) => {
    const res = await expressClient.post("/auth/login", credentials);
    return res.data;
  },
  getMe: async () => {
    const res = await expressClient.get("/auth/me");
    return res.data;
  },
};

export const reportService = {
  create: async (reportData) => {
    const res = await expressClient.post("/reports", reportData);
    return res.data;
  },
  getAll: async (params = {}) => {
    const res = await expressClient.get("/reports", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await expressClient.get(`/reports/${id}`);
    return res.data;
  },
  updateStatus: async (id, status, assignedTo) => {
    const res = await expressClient.patch(`/reports/${id}/status`, {
      status,
      assignedTo,
    });
    return res.data;
  },
};

export const energyService = {
  analyze: async (payload) => {
    const res = await pythonClient.post("/analyze", payload);
    return res.data;
  },
};

export const aiService = {
  ragSearch: async (query, topK = 3) => {
    const res = await aiClient.post("/rag", { query, top_k: topK });
    return res.data;
  },
  runAgent: async (goal) => {
    const res = await aiClient.post("/agent", { goal });
    return res.data;
  },
  getAdvice: async (prompt, category = "Energy") => {
    const res = await aiClient.post("/advisor", { prompt, category });
    return res.data;
  },
};

export const scheduleService = {
  getAll: async () => {
    const res = await expressClient.get("/schedule");
    return res.data;
  },
  getBlocks: async () => {
    const res = await expressClient.get("/schedule/blocks");
    return res.data;
  },
  uploadExcel: async (schedules) => {
    const res = await expressClient.post("/schedule/upload-excel", { schedules });
    return res.data;
  },
  requestOverride: async (payload) => {
    const res = await expressClient.post("/schedule/request-override", payload);
    return res.data;
  },
  approveOverride: async (payload) => {
    const res = await expressClient.patch("/schedule/approve-override", payload);
    return res.data;
  },
};

export const iotService = {
  scanAnomalies: async () => {
    const res = await expressClient.post("/iot/scan-anomalies");
    return res.data;
  },
};

