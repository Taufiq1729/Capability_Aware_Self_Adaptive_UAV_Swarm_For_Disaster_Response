# SAFE-SWARM: Confidence-Aware Self-Adaptive UAV Swarm for Disaster Response

An academic-grade, full-stack autonomous multi-agent research platform demonstrating how a decentralized swarm of Unmanned Aerial Vehicles (UAVs) achieves mission continuity in GPS-denied, multi-storey disaster environments when individual drones experience physical sensor failures, battery depletion, environmental smoke obscuration, or RF communication partitions.

![Aesthetic: Dark Tactical Cyber](https://img.shields.io/badge/Aesthetic-Dark%20Tactical%20Cyber-06b6d4?style=flat-square)
![Stack: MERN + Python FastAPI](https://img.shields.io/badge/Stack-React%2018%20%2B%20Three.js%20%2B%20FastAPI%20%2B%20PyTorch-10b981?style=flat-square)
![P2P Mesh: NetworkX](https://img.shields.io/badge/Mesh-NetworkX%20Ad--Hoc%20P2P-a855f7?style=flat-square)
![Unit Tests: 13/13 Passing](https://img.shields.io/badge/Unit%20Tests-13%2F13%20Passed-brightgreen?style=flat-square)
![Build: Vite Production Verified](https://img.shields.io/badge/Vite%20Build-Passing%20(0%20errors)-blue?style=flat-square)

---

## 1. System Architecture & 7-Stage Edge Pipeline

Each autonomous UAV executes an onboard 5-stage edge intelligence pipeline and coordinates over an ad-hoc Peer-to-Peer (P2P) wireless mesh without relying on any centralized ground control station or central broker:

```
+---------------------------------------------------------------------------------------------------+
|                                        UAV AGENT (EDGE NODE)                                      |
|                                                                                                   |
|  [Stage 01: 12-Dimensional Multimodal Telemetry Generation]                                       |
|        │ (Motor RPM, Battery V/SoC, Camera FPS, Thermal Drift, LiDAR, GNSS, RF RSSI, IMU, etc.)  |
|        ▼                                                                                          |
|  [Stage 02: Lightweight Edge Anomaly Detection (Statistical Z-Scores & Rolling Baselines)]        |
|        │ (Low-latency sliding window screening; triggers deep diagnostics upon anomaly flag)     |
|        ▼                                                                                          |
|  [Stage 03: Deeper Fault Assessment & Environmental Disambiguation (PyTorch 1D-CNN)]             |
|        │ (Disambiguates environmental smoke/dust from internal hardware breakdown; Bayesian Conf) |
|        ▼                                                                                          |
|  [Stage 04: Decoupled Capability Estimation Vector [c_RGB ... c_Compute] + Diagnostic Conf (Γ_i)] |
|        │ (Confidence Γ_i is decoupled from raw capability level c_k)                              |
|        ▼                                                                                          |
|  [Stage 05: Safety-Constrained Autonomous Role Selection & Non-Compensable Hard Gating]           |
|        │ (Enforces safety constraints; shifts failing drones to Communication Relay)              |
+---------------------------------------------------------------------------------------------------+
         │                                               ▲
         ▼ (Role adapted / Task surrendered)             │ (Distributed bids submitted)
+---------------------------------------------------------------------------------------------------+
|               Stage 06: Peer-to-Peer Communication Mesh (NetworkX Spatial Graph)                  |
|               Stage 07: Decentralized Task Auction (Confidence-Aware Bidding Engine)              |
|                               (Zero-Central-Gateway Consensus)                                    |
+---------------------------------------------------------------------------------------------------+
```

### The 7 Core Architectural Stages

1. **Stage 01: 12-Dimensional Multimodal Telemetry Generation**  
   Simulates realistic physical sensor metrics: motor vibration and temperature, battery terminal voltage and state-of-charge (SoC), optical camera framerate and sharpness, thermal NETD and temperature drift, LiDAR point return rate, GNSS HDOP and satellite count, RF link RSSI and packet loss, and CPU compute load.

2. **Stage 02: Lightweight Edge Anomaly Detection**  
   Runs continuous statistical limit-checking and rolling Z-score anomaly detectors directly on the micro-controller edge to catch both sudden spikes and gradual degradation without overburdening onboard compute.

3. **Stage 03: Deeper Fault Assessment & Environmental Disambiguation**  
   Executes PyTorch 1D-CNN deep diagnostic inference (`SwarmHealthNet-v2`). Crucially disambiguates external environmental obscuration (atmospheric smoke, dust, structural debris) from physical hardware breakdown (optical sensor degradation, actuator seizure, thermal sensor drift) and yields a Bayesian diagnostic confidence ($\Gamma_i \in [0, 1]$).

4. **Stage 04: Decoupled Capability Estimation Vector**  
   Computes an 8-dimensional normalized capability vector:
   $$\mathbf{c} = [c_{\text{RGB}}, c_{\text{Thermal}}, c_{\text{LiDAR}}, c_{\text{Comm}}, c_{\text{Mobility}}, c_{\text{Loc}}, c_{\text{Energy}}, c_{\text{Compute}}] \in [0, 1]^8$$
   The diagnostic confidence $\Gamma_i$ is explicitly decoupled from capability levels (e.g., high confidence that a sensor has completely failed: $c_{\text{RGB}} = 0.00$, $\Gamma_i = 0.94$).

5. **Stage 05: Safety-Constrained Adaptive Role Selection & Energy Dynamics**  
   Enforces non-compensable hard constraints (e.g., optical search requires $c_{\text{RGB}} \ge 0.50$ or $c_{\text{Thermal}} \ge 0.55$). Drones with failed optics autonomously transition to **Communication Relay** to bridge the wireless mesh, or return to launch (RTL) if battery drops below safety thresholds ($< 18\%$).  
   - **Baseline Drain**: All drones start in Search mode drawing a uniform **$0.35\%/\text{s}$**.
   - **Eco-Relay Drain**: Drones adapting to Communication Relay enter an eco-hover state drawing only **$0.10\%/\text{s}$** (over 3.5× energy reduction).

6. **Stage 06: Peer-to-Peer Communication Mesh (NetworkX Dynamic Graph)**  
   Models ad-hoc spatial communication networks without central base stations. Dynamically calculates Euclidean distance attenuation, link packet loss probabilities, graph connectivity, triadic clustering coefficients, and betweenness centrality to prove that Relay UAVs bridge isolated search clusters.

7. **Stage 07: Decentralized Task Auction Consensus**  
   Executes atomic task handovers using a distributed confidence-weighted bidding formula:
   $$\text{Bid}(i, k) = 0.35 \cdot C_k + 0.25 \cdot \Gamma_i + 0.15 \cdot H_i + 0.15 \cdot \left(1 - \frac{d}{R}\right) + 0.10 \cdot B_i$$
   Connected 1-hop peers evaluate sensor capability ($C_k$), diagnostic confidence ($\Gamma_i$), operational health ($H_i$), proximity ($d/R$), and battery reserves ($B_i$) to elect the consensus winner with zero central coordination.

---

## 2. Interactive Application Interfaces

### 1. Tactical Swarm Map & 3D Multi-Storey Arena (`/simulation`)
- **Configurable 3D Structural Architecture**: Select between **2-Floor (Bungalow)**, **3-Floor (Townhouse)**, and **5-Floor (Multi-Storey Complex)** disaster buildings.
- **Compact Tactical Header HUD**: Controls for Run Swarm, Simulation Rate ($0.5\times \dots 5.0\times$), Mesh Coverage %, Storeys floor selector cutaway, Rooms zoom selector, Fleet size ($2 \dots 12$ drones), and Building Complexity.
- **High-Visibility White FPV Viewport**: Picture-in-Picture on-screen frame in the bottom-right featuring a crisp white border, white header, pure white WebGL rendering pass, and an automated **tactical chase camera** trailing behind the active UAV to track banking, rotations, and movement across rooms.
- **Physical Building Fidelity**: Room-by-room layouts (Living Room, Kitchen, Master Suite, Bed 2, Balconies, Corridors, Stairwells), trapped survivors with thermal/optical signatures, flight trajectory lines, and downward sensor scanning cones.

### 2. Decentralized P2P Mesh & Autonomous Reallocation (`/coordination`)
- **Interactive Spatial Mesh Graph**: Live NetworkX topology rendering with dynamic packet loss indicators, triadic clustering coefficients, and betweenness centrality halos for bridge relay nodes.
- **Autonomous Reallocation Walkthrough**: Click *"Simulate Camera Failure & Handover"* to observe the 5-stage consensus state machine:
  1. Optical hardware breakdown ($0\text{ FPS}$) injected on `UAV-Alpha`.
  2. 1D-CNN deep fault diagnosis isolates sensor failure ($\Gamma_i = 94\%$).
  3. Non-compensable constraint gating bars search role; `UAV-Alpha` autonomously re-roles to Communication Relay.
  4. 1-Hop peers submit bids via the mathematical scoring formula.
  5. Winning peer `UAV-Beta` acquires `TSK-101`; `UAV-Alpha` takes a new backbone relay task.
- **On-Demand Task Auctions**: Trigger an instant consensus bidding round on any task in the registry.
- **Interactive Bid Scoring Sandbox**: Draggable sliders for $C_k$, $\Gamma_i$, $H_i$, distance $d$, and battery $B_i$ to verify the auction equation in real time.
- **Ad-Hoc Network Partition Simulator**: Toggle transmission range ($240\text{m} \leftrightarrow 110\text{m}$) to simulate severed inter-floor links and observe disconnected cluster resolution via bridge nodes.
- **Live Handover Chain of Custody**: Audit flowboard tracking the complete lineage of reallocated tasks.

### 3. Empirical Research Benchmark & Analytics (`/analytics`)
- **4 Comparative Paradigms**:
  - **Baseline A (Fixed Roles)**: Static search and relay assignments without adaptation.
  - **Baseline B (Anomaly Only)**: Reallocates upon simple threshold breaches without fault classification.
  - **Baseline C (Basic Adaptation)**: Heuristic role switching without decoupling confidence from capability.
  - **Paradigm D (Proposed SAFE-SWARM)**: Full 7-stage confidence-aware edge intelligence pipeline.
- **4 Scenario Presets**: Standard Urban Search, Dense Smoke Obscuration, Severe Mesh Partitioning, Massive Swarm Scaling.
- **4 Comparative Visualizations**:
  - Diagnostic Precision, Recall & F1
  - Mission Completion & Victim Recovery Rates
  - Decision & Reallocation Latency (ms)
  - Battery Draw & Operational Efficiency
- **10-Metric Performance Table**: Statistical significance indicators ($p < 0.001$), confidence intervals, and 1-click **CSV** and **JSON** exports.
- **Statistical Defense Guide**: Theoretical proofs and academic Q&A for committee presentations.

### 4. Fault Injection & Edge AI (`/faults`)
- **Hardware Failure Suite**: Inject failures on RGB Camera, Thermal FLIR, LiDAR, Motor/Actuator, Battery, GNSS, IMU, or RF Transceiver.
- **Smoke Obscuration Simulator**: Control atmospheric smoke density to prove that Stage 3 correctly distinguishes environmental interference from component hardware failure.

### 5. Fleet Telemetry & Mission Overview (`/` and `/fleet`)
- Real-time fleet KPI tiles, role distribution metrics, battery curves, and detailed UAV telemetry dossiers.

---

## 3. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend UI** | React 18, Vite, Three.js, Tailwind CSS (Dark Tactical Cyber Theme), Recharts, Lucide React, Socket.IO Client, Axios |
| **Backend Gateway** | Node.js, Express.js, Socket.IO, MongoDB & Mongoose (with in-memory fallback), Helmet, CORS |
| **Simulation & Edge AI** | Python 3.11+, FastAPI, Uvicorn, PyTorch (1D-CNN `SwarmHealthNet-v2`), NetworkX, NumPy, Pandas, Scikit-learn, Pydantic |

---

## 4. Quickstart & Local Execution

### Prerequisites
- **Node.js** v18+ and npm
- **Python** 3.11+
- **MongoDB** (optional; in-memory fallback operates automatically if MongoDB is not running locally)

---

### Option A: One-Click Launch (Recommended for Windows)

Run the included PowerShell launch script from the root directory:
```powershell
.\start_all.ps1
```
*(Or double-click `start_all.bat`). This opens three dedicated terminal windows for the Python AI Engine, Node.js Gateway, and React Vite Frontend.*

Once launched, access:
- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Node.js Gateway**: [http://localhost:5001/api/health](http://localhost:5001/api/health)
- **Python AI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option B: Manual Service Startup

#### 1. Start Python Simulation Microservice
```bash
cd simulation-service
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### 2. Start Node.js Express Backend & WebSocket Gateway
```bash
cd backend
npm install
node server.js
# Running on http://localhost:5001
```

#### 3. Start React Vite Frontend
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5173
```

---

### Option C: Docker Compose

```bash
docker-compose up --build
```

---

## 5. Verification & Test Suite

### Python AI Core Unit Tests
Run the Python test suite covering telemetry, anomaly limits, 1D-CNN classification, capability decoupling, hard gating, NetworkX spatial mesh, and distributed auction consensus:
```bash
cd simulation-service
powershell -Command "$env:PYTHONPATH='.'; python -m unittest discover -s tests"
```
**Result**: `Ran 13 tests in 0.971s - OK` (100% Passing).

### Frontend Production Build
Verify compilation of all React components, Three.js shaders, and Tailwind stylesheets:
```bash
cd frontend
npm run build
```
**Result**: `built in 20.58s` with 0 errors.

---

## 6. Key Scientific Citations & References

- **Decoupled Confidence & Capability**: Prevents degraded drones from making false-positive commitments to critical search tasks.
- **Non-Compensable Safety Gating**: Ensures that high performance in secondary modalities (e.g. comms or computing) cannot compensate for a zero-score primary search sensor.
- **Distributed Auction Protocol**: Eliminates single points of failure (SPOF) and ensures atomic task reallocation over multi-hop wireless partitions.

---

*Developed for Advanced Research in Autonomous Multi-UAV Swarm Resilience & Disaster Response.*
