# UAV Swarm Resilience Platform: REST & Socket.IO API Documentation

## 1. REST Endpoints

### Simulation Lifecycle
- **`GET /api/simulation/status`**
  - Returns current simulation state snapshot, running flag, and speed multiplier.
- **`POST /api/simulation/start`**
  - Resumes or starts live background simulation ticking.
- **`POST /api/simulation/pause`**
  - Freezes active simulation clock.
- **`POST /api/simulation/step`**
  - Advances simulation clock by $\Delta t = 1.0$s and returns updated swarm state.
- **`POST /api/simulation/reset`**
  - Body: `{ "numDrones": 6, "seed": 42 }`
  - Resets environment obstacles, victims, coverage, and drone positions.
- **`POST /api/simulation/environment`**
  - Body: `{ "dustLevel": 0.45, "commRange": 250 }`
  - Updates atmospheric smoke/dust density or wireless transmission radius.

### Drones & Fleet Telemetry
- **`GET /api/drones`**
  - Lists summary cards for all drones.
- **`GET /api/drones/:droneId`**
  - Returns detailed subsystem diagnostic dossier, raw telemetry streams, and capability vectors for specified drone.

### Fault Injection & Edge Diagnosis
- **`POST /api/faults/inject`**
  - Body:
    ```json
    {
      "droneId": "UAV-Alpha",
      "component": "rgb_camera",
      "faultType": "hardware_failure",
      "severity": 0.95,
      "gradual": false
    }
    ```
  - Injects hardware or sensor fault into designated drone.
- **`POST /api/faults/clear`**
  - Body: `{ "droneId": "UAV-Alpha", "component": "rgb_camera" }`
  - Clears active fault.
- **`GET /api/faults/history`**
  - Returns historic log of injected faults and assessment results.

### Coordination & Network Topology
- **`GET /api/coordination/topology`**
  - Returns current NetworkX mesh topology (nodes, edges, distances, packet loss, partitions) and tasks.
- **`GET /api/coordination/events`**
  - Returns chronological auction negotiation events and task transfer timeline.

### Analytics & Empirical Benchmarks
- **`POST /api/analytics/run`**
  - Body:
    ```json
    {
      "numDrones": 6,
      "numVictims": 8,
      "faultProbability": 0.35,
      "commReliability": 0.90,
      "disasterSeverity": "HIGH",
      "simulationDurationSec": 60,
      "randomSeed": 42
    }
    ```
  - Executes empirical comparison across Baselines A (Fixed), B (Anomaly Only), C (Basic Adapt), and D (Proposed).
- **`POST /api/analytics/export-csv`**
  - Exports benchmark metrics as an academic research CSV table.

---

## 2. Real-Time Socket.IO Channels

Connected to default port `5001`:
- **`telemetry_update`**: Emits full simulation tick state payload (2Hz).
- **`simulation_status`**: Emits `{ isRunning: boolean, speed: number }`.
- **`anomaly_detected`**: Triggered when a drone's edge detector flags an anomaly.
- **`role_changed`**: Broadcasts when a drone adapts its mission role.
- **`task_reallocation_requested`**: Emitted when a degraded drone initiates an auction.
- **`task_reassigned`**: Broadcasts winning peer drone and transfer details.
