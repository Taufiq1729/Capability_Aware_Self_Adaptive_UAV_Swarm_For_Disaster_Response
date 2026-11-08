# Confidence-Aware Edge Intelligence for Self-Adaptive UAV Swarms: Architecture Specification

## 1. System Overview

The system realizes a fully decentralized, self-adaptive multi-UAV swarm architecture engineered for resilient disaster response. Unlike centralized ground control station (GCS) frameworks that suffer from single points of failure, communication latency, and fragility during physical RF jamming or building shadowing, each UAV executes a five-stage local edge intelligence pipeline coupled with peer-to-peer (P2P) gossip and distributed auction reallocation.

```
+---------------------------------------------------------------------------------------+
|                                    UAV Agent (Node)                                   |
|                                                                                       |
|  [Stage 1: Telemetry Generator / Sensors]                                             |
|        |                                                                              |
|        v                                                                              |
|  [Stage 2: Lightweight Edge Anomaly Detection (Statistical Z-Score / Limits)]         |
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

## 2. Five-Stage Local Edge Pipeline

### Stage 1: Onboard Component Telemetry
Each UAV tracks high-frequency physical dynamics:
- **Motor / Propulsion**: Vibration RMS (G), stator temperature (°C), health index.
- **Energy Storage**: 6S LiPo terminal voltage (V), discharge rate, State-of-Charge (SoC %).
- **Vision Subsystems**: RGB stream framerate (FPS), contrast/sharpness index, hardware status.
- **Thermal Radiometric Camera**: Sensor noise equivalent temperature difference (NETD in mK), calibration drift (°C).
- **LiDAR Scanner**: Point return rate (pts/s), range noise standard deviation (cm).
- **GNSS / Localization**: Horizontal Dilution of Precision (HDOP), satellite constellation count, drift distance (m).
- **Communication Radio**: RSSI (dBm), Signal-to-Noise Ratio (SNR in dB), packet loss rate (PER).
- **Edge Compute Module**: CPU load (%), thermal junction temp (°C), deep inference latency (ms).

### Stage 2: Lightweight Edge Anomaly Detection
Continuously operates at high frequency on constrained onboard processors. Compares instantaneous sensor vectors against nominal empirical envelopes. Detects sudden anomalies and gradual degradation while tracking consecutive anomaly counts before waking deeper diagnostic routines.

### Stage 3: Deeper Fault Assessment
Triggered conditionally upon persistent anomalies or critical telemetry anomalies. Distinguishes intrinsic hardware faults (e.g. camera sensor failure with 0 FPS) from external environmental degradation (e.g. dense chemical fire smoke obscuring visual acuity while the hardware camera remains undamaged). Computes a Bayesian/fused **Diagnostic Confidence** score in $[0.0, 1.0]$.

### Stage 4: Remaining Capability Vector Estimation
Computes a normalized capability vector:
$$\mathbf{c} = [c_{\text{RGB}}, c_{\text{Thermal}}, c_{\text{LiDAR}}, c_{\text{Comm}}, c_{\text{Mobility}}, c_{\text{Loc}}, c_{\text{Energy}}, c_{\text{Compute}}] \in [0, 1]^8$$

**Critical Decoupling Principle**: Diagnostic confidence is mathematically decoupled from capability magnitudes. If a UAV possesses 95% confidence that its RGB camera is completely broken, $c_{\text{RGB}} = 0.0$ and $\text{Confidence} = 0.95$.

### Stage 5: Safety-Constrained Adaptive Role Selection
Enforces **strict, non-compensable hard constraints**. A high overall weighted score in other subsystems cannot compensate for the total loss of a mandatory sensor or sub-critical battery level ($< 18\%$). Roles:
1. **Search and exploration**: Mandates mobility $\ge 0.45$, localization $\ge 0.40$, energy $\ge 0.22$, compute $\ge 0.30$, and at least one optical modality ($c_{\text{RGB}} \ge 0.45$ or $c_{\text{Thermal}} \ge 0.55$).
2. **Victim detection**: Mandates thermal capability ($c_{\text{Thermal}} \ge 0.50$) or pristine high-res visual sensor under clear atmosphere.
3. **Mapping and reconnaissance**: Mandates LiDAR ($c_{\text{LiDAR}} \ge 0.48$) and high GNSS accuracy ($c_{\text{Loc}} \ge 0.50$).
4. **Communication relay**: Dedicated to high-throughput wireless bridging; requires strong radio link ($c_{\text{Comm}} \ge 0.55$) and minimal loitering mobility ($c_{\text{Mobility}} \ge 0.25$).
5. **Return to Home / Safe Land (RTL)**: Local safety abort triggered automatically when battery drops below 18% or mobility collapses below 0.25.

## 3. Decentralized Swarm Coordination

### Stage 6: Peer-to-Peer Communication Mesh
NetworkX models dynamic geometric graphs $G = (V, E)$. Edges exist when Euclidean distance $d(u, v) \le R_{\text{comm}} \times \min(c_{\text{Comm}}(u), c_{\text{Comm}}(v))$. Packet loss is calculated as a quadratic function of separation distance. Network partitions are detected locally by checking connected components.

### Stage 7: Distributed Auction Reallocation
When a drone's capability drops, it relinquishes its assigned task and announces a local auction to 1-hop reachable peers. Neighboring drones compute a composite bid score:
$$\text{Bid} = 0.50 \cdot c_{\text{task\_req}} + 0.30 \cdot \left(1 - \frac{d}{d_{\max}}\right) + 0.20 \cdot \text{SoC}_{\text{battery}}$$
The highest eligible bidder accepts ownership atomically, eliminating duplicate assignments.
