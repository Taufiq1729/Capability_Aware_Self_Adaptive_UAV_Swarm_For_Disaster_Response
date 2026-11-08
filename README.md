# Confidence-Aware Edge Intelligence for Self-Adaptive and Resilient UAV Swarms in Disaster Response

An academic-grade, full-stack research prototype demonstrating how a decentralized swarm of autonomous Unmanned Aerial Vehicles (UAVs) can maintain mission continuity in disaster environments when individual drones suffer hardware failures, sensor degradation, battery depletion, or RF communication partitions.

![Research Theme: Cream / Terracotta / Sage](https://img.shields.io/badge/Aesthetic-Research%20Grade%20Warm%20Neutral-c85a32)
![Stack: MERN + Python FastAPI](https://img.shields.io/badge/Stack-MERN%20%2B%20FastAPI%20%2B%20NetworkX-3d7a5a)
![Tests: 100% Passing](https://img.shields.io/badge/Unit%20Tests-8%20Passed-brightgreen)

---

## 1. System Architecture

Each autonomous UAV executes a 5-stage onboard edge intelligence pipeline and coordinates over an ad-hoc Peer-to-Peer (P2P) wireless mesh without any permanent central ground controller:

```
+---------------------------------------------------------------------------------------+
|                                    UAV Agent (Node)                                   |
|                                                                                       |
|  [Stage 1: Telemetry Generator / Sensors]                                             |
|        |                                                                              |
|        v                                                                              |
|  [Stage 2: Lightweight Edge Anomaly Detection (Statistical Limits & Z-Score)]         |
|        |                                                                              |
|        v (Trigger when anomaly > 0.65 or consecutive flags)                           |
|  [Stage 3: Deeper Fault Assessment & Environmental Disambiguation]                    |
|        |                                                                              |
|        v (Decoupled Output)                                                           |
|  [Stage 4: Remaining Capability Vector [c_RGB ... c_Compute] + Diagnostic Confidence] |
|        |                                                                              |
|        v                                                                              |
|  [Stage 5: Safety-Constrained Adaptive Role Selector (Non-Compensable Hard Gates)]    |
+---------------------------------------------------------------------------------------+
        |                               ^
        v (Role switched or task lost)  | (Distributed bids)
+---------------------------------------------------------------------------------------+
|            Stage 6: P2P Communication Mesh & Stage 7: Distributed Auction             |
|                  (NetworkX Dynamic Graph Topology, Zero-Central-Broker)               |
+---------------------------------------------------------------------------------------+
```

### The 7 Core Architectural Stages
1. **Stage 1: Onboard Component Telemetry**: Simulates high-frequency physical dynamics for motor vibration & temperature, battery voltage & SoC, RGB framerate & sharpness, thermal NETD & drift, LiDAR point rate, GNSS HDOP & satellite constellation, RF RSSI & packet loss, and CPU compute load.
2. **Stage 2: Lightweight Edge Anomaly Detection**: Fast statistical threshold and rolling-baseline detector flagging sudden and gradual degradation without compute overload.
3. **Stage 3: Deeper Fault Assessment**: Multi-sensor diagnostic engine isolating component failure modes and calculating Bayesian diagnostic confidence while disambiguating environmental smoke/dust obscuration from physical hardware failure.
4. **Stage 4: Remaining Capability Estimation**: Computes normalized capability vector $\mathbf{c} = [c_{\text{RGB}}, c_{\text{Thermal}}, c_{\text{LiDAR}}, c_{\text{Comm}}, c_{\text{Mobility}}, c_{\text{Loc}}, c_{\text{Energy}}, c_{\text{Compute}}] \in [0, 1]^8$. Confidence is decoupled from capability level.
5. **Stage 5: Safety-Constrained Adaptive Role Selection**: Strictly enforces non-compensable hard constraints and battery safety margins ($< 18\%$ triggers RTL).
6. **Stage 6: Peer-to-Peer Communication Mesh**: NetworkX dynamic geometric graph simulating transmission range, attenuation, packet loss, and temporary network partitions.
7. **Stage 7: Decentralized Task Reallocation**: Distributed auction/bidding engine executing atomic task handover to the highest capable neighbor.

---

## 2. Application Pages & Interfaces

1. **Overview Dashboard** (`/`): High-level mission command center featuring fleet KPI cards, role distribution pie chart, battery reserves, active rescue stats, and real-time swarm event logs.
2. **Live Swarm Simulation** (`/simulation`): Interactive 2D Canvas disaster arena showing obstacles, smoke plumes, trapped survivors, drones with directional headings, dynamic P2P wireless links, coverage heatmaps, environmental visibility sliders, and quick drone inspector.
3. **Fleet Management** (`/fleet`): Grid of UAV cards showing live telemetry gauges, capability vectors, diagnostic confidence, and full drill-down modal dossiers.
4. **Fault Injection & Diagnosis** (`/faults`): Interactive console for injecting hardware failures (RGB fail, thermal drift, LiDAR fail, motor seizure, battery drain, GPS drift, comm jamming, gradual wear) with side-by-side environmental smoke control and 5-stage explainable AI outputs.
5. **Decentralized Coordination** (`/coordination`): Visual peer-to-peer network graph, task ownership board, distributed auction bids, and live walkthrough scenario (Drone A fails RGB $\to$ broadcasts request $\to$ Drone B accepts search $\to$ Drone A adapts to relay).
6. **Research Evaluation & Analytics** (`/analytics`): Empirical benchmark runner comparing 4 experimental paradigms (A: Fixed Roles, B: Anomaly Only, C: Basic Adapt, D: Proposed Confidence-Aware Decentralized Approach) with configurable seeds, precision/recall/F1 charts, mission success rates, latency charts, and CSV export.

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS (Warm Neutral: Cream `#FAF7F2`, Terracotta `#C85A32`, Sage Green `#3D7A5A`), Framer Motion, Recharts, Lucide React, Socket.IO Client, Axios.
- **Backend Gateway**: Node.js, Express.js, MongoDB with Mongoose (with in-memory fallback), Socket.IO, Helmet, CORS, Rate Limit, Dotenv.
- **AI & Simulation Microservice**: Python 3.11+, FastAPI, Uvicorn, NumPy, Pandas, Scikit-learn, NetworkX, Pydantic, HTTPX.

---

## 4. Local Execution Guide

### Prerequisites
- Node.js v18+ & npm
- Python 3.11+
- MongoDB (running on `localhost:27017` or in Docker)

### Option A: Running Services Locally

#### 1. Start Python Simulation Microservice
```bash
cd simulation-service
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### 2. Start Node.js Express Backend & Socket Gateway
```bash
cd backend
npm install
npm run dev
# Running on http://localhost:5001
```

#### 3. Start Vite React Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

### Option B: Docker Compose (All-in-One)

```bash
docker-compose up --build
```
Access the application at:
- **Frontend Dashboard**: `http://localhost:5173`
- **Node Backend & Sockets**: `http://localhost:5001/api/health`
- **Python AI Microservice**: `http://localhost:8000/docs`

---

## 5. Running the Test Suite

### Python AI Core Unit Tests
```bash
cd simulation-service
PYTHONPATH=. python3 tests/test_core_ai.py
```
*Outputs: 8 tests passed covering telemetry, anomaly detection, smoke disambiguation, capability decoupling, hard constraints, RTL safety, NetworkX mesh, and distributed auctions.*

### Backend Integration Tests
```bash
cd backend
node test_api.js
```
*Outputs: 6 passed integration tests covering health, simulation status, step ticking, fault injection, P2P topology, and benchmark execution.*
