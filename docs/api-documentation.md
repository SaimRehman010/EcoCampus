# EcoCampus REST API Specification

Comprehensive documentation for all EcoCampus microservices:
- **Express Backend API Gateway** (`http://localhost:5000/api`)
- **Python Resource Analyzer Microservice** (`http://localhost:5001/api`)
- **Python AI & RAG Microservice** (`http://localhost:5002/api/ai`)

---

## 1. Authentication Endpoints (`/api/auth`)

Base URL: `http://localhost:5000/api/auth`

### 1.1 Register New User
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@campus.edu",
  "password": "Password123!",
  "role": "Student"
}
```
- **Allowed Roles:** `"Student"`, `"Manager"`, `"Admin"` (Defaults to `"Student"`)
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66c4a1b2c3d4e5f6a7b8c9d0",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "role": "Student"
  }
}
```

### 1.2 User Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "jane@campus.edu",
  "password": "Password123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66c4a1b2c3d4e5f6a7b8c9d0",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "role": "Student"
  }
}
```

### 1.3 Get Current User Profile
- **Endpoint:** `GET /api/auth/me`
- **Access:** Private (Requires `Authorization: Bearer <token>`)
- **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "_id": "66c4a1b2c3d4e5f6a7b8c9d0",
    "name": "Jane Doe",
    "email": "jane@campus.edu",
    "role": "Student"
  }
}
```

---

## 2. Sustainability & Issue Reports (`/api/reports`)

Base URL: `http://localhost:5000/api/reports`

### 2.1 Submit New Issue Report
- **Endpoint:** `POST /api/reports`
- **Access:** Private (`Student`, `Admin`)
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "title": "Continuous Water Leak Under Chemistry Lab Sink",
  "description": "Pipe joint valve is loose, leaking water onto electrical conduit floor.",
  "category": "Water",
  "location": "Chemistry Hall - Room 304",
  "imageUrl": "https://example.com/leak.jpg"
}
```
- **Allowed Categories:** `"Electricity"`, `"Water"`, `"Waste"`, `"AC/HVAC"`, `"Other"`
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Report created successfully",
  "data": {
    "_id": "66c4f9a1b2c3d4e5f6a7b8c1",
    "title": "Continuous Water Leak Under Chemistry Lab Sink",
    "description": "Pipe joint valve is loose...",
    "category": "Water",
    "location": "Chemistry Hall - Room 304",
    "imageUrl": "https://example.com/leak.jpg",
    "status": "Pending",
    "reportedBy": {
      "_id": "66c4a1b2c3d4e5f6a7b8c9d0",
      "name": "Jane Doe",
      "email": "jane@campus.edu",
      "role": "Student"
    },
    "assignedTo": null,
    "createdAt": "2026-08-20T13:00:00.000Z",
    "updatedAt": "2026-08-20T13:00:00.000Z"
  }
}
```

### 2.2 List All Reports
- **Endpoint:** `GET /api/reports`
- **Query Parameters:**
  - `status` (Optional): `"Pending"`, `"Assigned In Progress"`, `"Resolved"`
  - `category` (Optional): `"Electricity"`, `"Water"`, etc.
  - `location` (Optional): Regex search string
- **Response (200 OK):**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "66c4f9a1b2c3d4e5f6a7b8c1",
      "title": "Continuous Water Leak Under Chemistry Lab Sink",
      "category": "Water",
      "location": "Chemistry Hall - Room 304",
      "status": "Pending",
      "reportedBy": { "name": "Jane Doe", "email": "jane@campus.edu" }
    }
  ]
}
```

### 2.3 Update Report Status & Assignee
- **Endpoint:** `PATCH /api/reports/:id/status`
- **Access:** Private (`Admin`, `Manager`)
- **Request Body:**
```json
{
  "status": "Assigned In Progress",
  "assignedTo": "66c4a1b2c3d4e5f6a7b8c9d9"
}
```
- **Allowed Statuses:** `"Pending"`, `"Assigned In Progress"`, `"Resolved"`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Report status successfully updated to 'Assigned In Progress'",
  "data": {
    "_id": "66c4f9a1b2c3d4e5f6a7b8c1",
    "status": "Assigned In Progress",
    "assignedTo": {
      "_id": "66c4a1b2c3d4e5f6a7b8c9d9",
      "name": "Facilities Manager",
      "email": "manager@campus.edu"
    }
  }
}
```

---

## 3. Python Resource Analyzer Microservice (`/api/analyze`)

Base URL: `http://localhost:5001/api`

### 3.1 Calculate Energy Load & Cost Savings
- **Endpoint:** `POST /api/analyze`
- **Access:** Public / Internal
- **Request Body:**
```json
{
  "resource_type": "AC/HVAC",
  "device_name": "Main Auditorium Chillers",
  "power_watts": 3500,
  "hours_per_day": 12,
  "days": 30,
  "device_count": 3,
  "rate_per_kwh": 0.15
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "resource_type": "AC/HVAC",
  "device_name": "Main Auditorium Chillers",
  "consumption_kwh": 3780.0,
  "estimated_cost_usd": 567.0,
  "rate_applied_usd_per_kwh": 0.15,
  "recommendation": "High HVAC consumption (3780.0 kWh). Recommendation: Set campus thermostats to 24°C (75°F), service air filters, and install automated occupancy timers to reduce load by up to 25%."
}
```

---

## 4. Python AI & RAG Microservice (`/api/ai`)

Base URL: `http://localhost:5002/api/ai`

### 4.1 RAG Policy Vector Search
- **Endpoint:** `POST /api/ai/rag`
- **Request Body:**
```json
{
  "query": "What are the rules for AC usage in computer labs?",
  "top_k": 3
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "query": "What are the rules for AC usage in computer labs?",
    "answer": "Based on the official EcoCampus policy in '1.2 Specialized Facility Exceptions':\n- Thermostats are regulated between 21°C - 23°C to prevent server/GPU overheating.\n- Lab doors/windows must remain closed while AC is active.\n- If no motion is detected for 20 minutes, AC switches to low-power eco-mode (26°C).",
    "sources": [
      {
        "chunk_id": 3,
        "title": "1.2 Specialized Facility Exceptions (Computer Labs & Server Rooms)",
        "relevance_score": 14.8
      }
    ]
  }
}
```

### 4.2 Autonomous Agent Multi-Tool Execution
- **Endpoint:** `POST /api/ai/agent`
- **Request Body:**
```json
{
  "goal": "Which campus area has the highest electricity complaints and how can we reduce costs there?"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user_goal": "Which campus area has the highest electricity complaints and how can we reduce costs there?",
    "status": "completed",
    "steps_executed": [
      {
        "step": 1,
        "tool": "get_unresolved_reports_summary",
        "reasoning": "Fetch unresolved campus reports to identify hot spots with high sustainability issues."
      },
      {
        "step": 2,
        "tool": "get_energy_recommendation",
        "reasoning": "Query Python Resource Analyzer for Science Block B to compute kWh load and cost reduction measures."
      }
    ],
    "agent_synthesis": "**EcoCampus Agent Diagnostic Summary**:\n1. **Complaint Hotspot Identified:** Science Block B has 3 unresolved Electricity complaints.\n2. **Resource Load:** 4410.0 kWh/month ($661.50 USD/month).\n3. **Optimization Strategy:** Enforce automated occupancy shutoff timers and recalibrate thermostats to 24°C."
  }
}
```

### 4.3 Sustainability Advisor
- **Endpoint:** `POST /api/ai/advisor`
- **Request Body:**
```json
{
  "prompt": "How can we eliminate water waste across campus restrooms?",
  "category": "Water"
}
```
