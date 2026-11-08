# Research Evaluation Methodology & Experimental Design

## 1. Experimental Paradigms

To rigorously evaluate the contribution of confidence-aware edge intelligence and decentralized coordination, four distinct baselines are evaluated under identical environmental seeds and disaster configurations:

| Paradigm | Description | Role Adaptation | Task Reassignment | Diagnostic Confidence Aware |
|---|---|---|---|---|
| **A: Fixed Roles** | Standard static assignment; drones never alter roles regardless of component degradation | Disabled | Disabled | No |
| **B: Anomaly Only** | Drones detect and flag telemetry anomalies, but lack autonomous adaptation or coordination | Disabled | Disabled | No |
| **C: Basic Adaptation** | Heuristic role switching without diagnostic confidence or capability gating | Centralized / Rule-based | Greedy Handover | No |
| **D: Proposed Architecture** | 5-stage edge pipeline + NetworkX P2P mesh + distributed auction reallocation | Autonomous & Constraint-Gated | Distributed Bidding | **Yes (Decoupled)** |

## 2. Evaluated Quantitative Metrics

1. **Fault Detection Precision, Recall, and F1 Score**:
   $$\text{Precision} = \frac{\text{TP}}{\text{TP} + \text{FP}}, \quad \text{Recall} = \frac{\text{TP}}{\text{TP} + \text{FN}}, \quad F_1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}$$
   Measured against ground-truth injected faults vs detected anomalies.

2. **False Alarm Rate (FAR)**:
   $$\text{FAR} = \frac{\text{FP}}{\text{Total Nominal Observation Windows}}$$

3. **Detection Latency ($T_{\text{detect}}$)**:
   Elapsed time from physical component fault onset to Stage 2 edge anomaly triggering (milliseconds).

4. **Role Adaptation Delay ($T_{\text{adapt}}$)**:
   Time from fault diagnosis to successful task reallocation and new role adoption (seconds).

5. **Victim Detection Rate ($\%$ Reached)**:
   Percentage of disaster casualties located within the active operational duration.

6. **Area Coverage Efficiency ($\%$)**:
   Percentage of the search grid traversed by operational sensor FOVs.

7. **Task Recovery Rate ($\%$)**:
   Percentage of orphaned or abandoned tasks successfully claimed and continued by neighboring peers.

8. **Cumulative Energy Consumption (Joules)**:
   Integral of motor propulsion, sensor payload, and computing power draw across all nodes over mission time.

9. **Communication Overhead (Message Count)**:
   Total count of peer-to-peer heartbeat, diagnostic gossip, and auction negotiation messages transmitted.
