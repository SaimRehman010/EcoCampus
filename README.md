# 🌱 EcoCampus: Smart Campus Sustainability & Autonomous Resource Management

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Ready-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io)

**EcoCampus** is a production-grade, microservice-powered sustainability platform engineered to monitor, report, analyze, and optimize institutional resource consumption (electricity, water, waste, and HVAC systems). By pairing a high-contrast React dashboard with an Express REST API, a Python OOP Energy Engine, and an Autonomous Agentic AI & RAG service, EcoCampus bridges student incident reporting with automated facility triage and decarbonization intelligence.

---

## 🎯 Alignment with UN Sustainable Development Goals (SDGs)

EcoCampus directly addresses four core United Nations Sustainable Development Goals:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       UNITED NATIONS SDG ALIGNMENT                          │
├─────────────────┬─────────────────┬───────────────────┬─────────────────────┤
│   ⚡ SDG 7      │   🏙️ SDG 11     │   ♻️ SDG 12       │   🌍 SDG 13         │
│ Affordable and  │ Sustainable     │ Responsible       │ Climate             │
│ Clean Energy    │ Cities and      │ Consumption and   │ Action              │
│                 │ Communities     │ Production        │                     │
├─────────────────┼─────────────────┼───────────────────┼─────────────────────┤
│ Calculates kWh  │ Transforms      │ Enforces 4-stream │ Mitigates greenhouse│
│ load & optimizes│ universities    │ waste recycling   │ emissions from      │
│ HVAC schedules  │ into resilient, │ segregation and   │ phantom loads and   │
│ to cut energy   │ eco-smart       │ rapid water leak  │ unmonitored HVAC    │
│ waste by 25%.   │ communities.    │ remediation.      │ operations.         │
└─────────────────┴─────────────────┴───────────────────┴─────────────────────┘
```

---

## 🏛️ System Architecture

EcoCampus follows a decoupled microservices architecture connected over high-performance REST APIs:

```
+-----------------------------------------------------------------------------------+
|                                 USER CLIENT                                       |
|                  React 18 + Tailwind CSS Web Application                          |
|                       (Vite / Nginx - Port 3000)                                  |
+------------------------------------------+----------------------------------------+
                                           |
                    +----------------------+-----------------------+
                    |                      |                       |
                    v                      v                       v
+-----------------------+  +-----------------------+  +-----------------------+
|  EXPRESS API GATEWAY  |  |  PYTHON ENERGY ENGINE |  |   PYTHON AI SERVICE   |
|   Node.js (Port 5000) |  |   Flask (Port 5001)   |  |   Flask (Port 5002)   |
+-----------+-----------+  +-----------+-----------+  +-----------+-----------+
| • JWT Auth & RBAC     |  | • OOP ResourceAnalyzer|  | • Policy RAG Engine   |
| • Incident Ticketing  |  | • kWh Load Calculator |  | • Multi-Tool Agent    |
| • MongoDB Mongoose    |  | • Cost Forecasting ($)|  | • Sustainability Advice|
+-----------+-----------+  +-----------------------+  +-----------+-----------+
            |                                                     |
            v                                                     | (Inter-Service
+-----------------------+                                         |  Tool Calls)
|   MONGODB DATABASE    |<----------------------------------------+
|      (Port 27017)     |
+-----------------------+
```

---

## 🧩 Microservices Breakdown

### 1. React Web Application (`frontend/` - Port 3000)
- **Role-Based Workspaces:** Context-aware UI for Students, Facilities Managers, and Administrators.
- **Incident Reporting Feed:** Submit and track campus defects with live status badges (`Pending`, `Assigned In Progress`, `Resolved`).
- **Interactive Energy Calculator:** UI interface to execute Python OOP resource calculations.
- **AI Intelligence Console:** Dual-tab interface for Policy RAG vector search and Agentic AI execution.

### 2. Express Backend API Gateway (`backend` / root - Port 5000)
- **Authentication & RBAC:** Salted bcrypt password hashing and signed JWT bearer tokens.
- **Mongoose Database Models:** Strictly validated `User` and `Report` schemas with compound indexing.
- **Triage Controller:** Real-time status pipeline transitions and technician assignments.

### 3. Python Resource Analyzer Microservice (`python-service/` - Port 5001)
- **OOP `ResourceAnalyzer` Class:**
  - `calculate_consumption(power_watts, hours_per_day, days, device_count)` -> Monthly kWh
  - `calculate_cost(consumption_kwh, rate_per_kwh)` -> USD cost projections
  - `generate_recommendation(consumption_kwh, resource_type)` -> Automated optimization heuristics

### 4. Python AI & RAG Microservice (`ai-service/` - Port 5002)
- **Policy RAG Vector Search (`rag.py`):** Ingests `campus_policy.md`, splits semantic sections, and provides grounded policy answers with source citations.
- **Agentic AI Orchestrator (`agent.py`):** Autonomous multi-tool planning loop:
  - *Tool 1 (`get_unresolved_reports_summary`):* Identifies high-complaint incident clusters.
  - *Tool 2 (`get_energy_recommendation`):* Dispatches calculations to Port 5001.
  - *Synthesis:* Compiles a structured 4-point diagnostic and remediation strategy.

---

## 🚀 Deployment & Installation Methods

### Method 1: Automated Local Setup (Script)
```bash
# Clone the repository and navigate to root
cd D:\EcoCampus

# Run automated dependency installer and environment validator
chmod +x scripts/setup.sh
./scripts/setup.sh
```

---

### Method 2: Multi-Container Docker Compose (Recommended)
Build and launch all 5 containerized services with MongoDB persistence:
```bash
# Quick deploy using the deploy script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Or directly with Docker Compose
docker compose up -d --build
```

**Accessing Services:**
- 🌐 **Web Dashboard:** `http://localhost:3000`
- 🔌 **Express API Gateway:** `http://localhost:5000/api/health`
- ⚡ **Python Resource Analyzer:** `http://localhost:5001/api/health`
- 🧠 **Python AI Microservice:** `http://localhost:5002/api/health`
- 🗄️ **MongoDB Database:** `mongodb://localhost:27017/ecocampus`

---

### Method 3: Kubernetes Deployment (`kubernetes/`)
Deploy to any CNCF-certified Kubernetes cluster (Minikube, Kind, EKS, GKE):
```bash
# 1. Apply Namespace, ConfigMap, and Secrets
kubectl apply -f kubernetes/configmap-secrets.yaml

# 2. Deploy MongoDB Stateful Storage
kubectl apply -f kubernetes/mongodb-deployment.yaml

# 3. Deploy Microservices
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/python-ai-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml

# 4. Verify Pods and Services
kubectl get pods -n ecocampus
kubectl get svc -n ecocampus
```

---

### Method 4: Infrastructure as Code with Terraform (`terraform/`)
Provision production cloud infrastructure (VPC, Subnets, EKS Cluster, ECR Registries):
```bash
cd terraform
terraform init
terraform plan
terraform apply -auto-approve
```

---

## 📚 Technical Documentation

Detailed architectural and developer guides are available in the [`docs/`](docs/) directory:
- 📖 [REST API Documentation](docs/api-documentation.md): Comprehensive schema and endpoint specifications.
- 🗄️ [Database Schema & Architecture](docs/database-schema.md): Mongoose schemas, relationships, and indexing strategies.
- 📋 [Campus Policy Manual](ai-service/knowledge_base/campus_policy.md): Standard operating procedures for HVAC, Water, Lighting, and Waste.

---

## 🛡️ License & Acknowledgements

Developed as a modern sustainable campus solution. Open source under the [MIT License](LICENSE).
