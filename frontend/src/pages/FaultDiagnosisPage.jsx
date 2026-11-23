import React, { useState } from 'react';
import { useSwarm } from '../context/SwarmContext';
import {
  AlertTriangle,
  Flame,
  Wind,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Zap,
  Target
} from 'lucide-react';

const FAULT_SCENARIOS = [
  {
    id: 'rgb_camera_fail',
    name: 'RGB Camera Complete Failure',
    component: 'rgb_camera',
    faultType: 'hardware_failure',
    severity: 1.0,
    gradual: false,
    desc: 'Image sensor pipeline ceasing output (0 FPS). Forces autonomous role switch to Relay.'
  },
  {
    id: 'thermal_degrade',
    name: 'Thermal Camera Radiometric Drift',
    component: 'thermal_camera',
    faultType: 'sensor_drift',
    severity: 0.85,
    gradual: false,
    desc: 'NETD noise elevates to >180mK. Victim heat signatures obscured; task reallocated to peer.'
  },
  {
    id: 'lidar_failure',
    name: 'LiDAR Optical Receiver Failure',
    component: 'lidar',
    faultType: 'hardware_failure',
    severity: 0.95,
    gradual: false,
    desc: 'Laser rangefinder return rate drops below 10k pts/s. Mapping capability compromised.'
  },
  {
    id: 'motor_degradation',
    name: 'Motor Bearing Stator Seizure',
    component: 'motor',
    faultType: 'mechanical_vibration',
    severity: 0.90,
    gradual: false,
    desc: 'Vibration escalates to >5.0G, stator temp reaches 80°C. Mobility heavily degraded.'
  },
  {
    id: 'battery_drain',
    name: 'Battery Cell Rapid Discharge',
    component: 'battery',
    faultType: 'rapid_discharge',
    severity: 0.85,
    gradual: true,
    desc: 'Voltage drop triggers emergency RTL safety margin (<18% SoC).'
  },
  {
    id: 'gps_drift',
    name: 'GNSS Satellite Multipath / Drift',
    component: 'gps',
    faultType: 'position_drift',
    severity: 0.80,
    gradual: false,
    desc: 'HDOP surges past 4.0; position drift exceeds 14m. Precision search invalid.'
  },
  {
    id: 'comm_jamming',
    name: 'Radio Frequency Jamming / Loss',
    component: 'comm_radio',
    faultType: 'packet_corruption',
    severity: 0.90,
    gradual: false,
    desc: 'Packet error rate hits 90%, RSSI collapses. Isolates drone from swarm consensus.'
  }
];

export const FaultDiagnosisPage = () => {
  const {
    simState,
    selectedDroneId,
    setSelectedDroneId,
    handleInjectFault,
    handleClearFault,
    handleUpdateEnvironment
  } = useSwarm();

  const [activeScenario, setActiveScenario] = useState(FAULT_SCENARIOS[0].id);
  const [severitySlider, setSeveritySlider] = useState(0.85);
  const [gradualToggle, setGradualToggle] = useState(false);
  const [dustSlider, setDustSlider] = useState(0.15);
  const [actionNotice, setActionNotice] = useState(null);

  const drones = simState?.drones || [];
  const droneDetails = simState?.detailed_drone_states?.[selectedDroneId];
  const diagnosis = droneDetails?.diagnosis;
  const anomaly = droneDetails?.anomaly;
  const cap = droneDetails?.capabilities || {};

  const handleApplyPreset = async (scenario) => {
    try {
      setActionNotice('Injecting fault...');
      await handleInjectFault({
        droneId: selectedDroneId,
        component: scenario.component,
        faultType: scenario.faultType,
        severity: scenario.severity,
        gradual: scenario.gradual
      });
      setActionNotice(`Injected: ${scenario.name}`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionNotice('Error: ' + err.message);
    }
  };

  const handleCustomInject = async () => {
    const sc = FAULT_SCENARIOS.find((s) => s.id === activeScenario);
    if (!sc) return;
    try {
      setActionNotice('Injecting custom fault...');
      await handleInjectFault({
        droneId: selectedDroneId,
        component: sc.component,
        faultType: sc.faultType,
        severity: severitySlider,
        gradual: gradualToggle
      });
      setActionNotice(`Injected custom ${sc.component} fault (${Math.round(severitySlider * 100)}%)`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err) {
      setActionNotice('Error: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    try {
      await handleClearFault(selectedDroneId);
      setActionNotice('All injected faults cleared.');
      setTimeout(() => setActionNotice(null), 2500);
    } catch (err) {
      setActionNotice('Error: ' + err.message);
    }
  };

  const handleDustChange = async (e) => {
    const val = parseFloat(e.target.value);
    setDustSlider(val);
    await handleUpdateEnvironment({ dustLevel: val });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight leading-tight flex items-center space-x-2">
            <span>Fault Injection & Multi-Stage Edge AI Diagnosis</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              STAGE 2 & 3
            </span>
          </h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">
            Inject component failures, simulate environmental smoke obscuration, and inspect the 7-stage AI diagnostic pipeline in real-time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-mono text-cyan-400 font-bold uppercase">Target Node:</label>
          <select
            value={selectedDroneId}
            onChange={(e) => setSelectedDroneId(e.target.value)}
            className="text-xs font-bold font-mono text-cyan-300 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 cursor-pointer shadow-inner"
          >
            {drones.map((d) => (
              <option key={d.drone_id} value={d.drone_id}>
                {d.drone_id} ({d.current_role || d.currentRole})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fault Scenarios & Environment Visibility */}
        <div className="lg:col-span-6 space-y-5">
          {/* Preset Fault Scenarios Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-cyan-400" />
                Select Fault Scenario
              </h3>
              {actionNotice && (
                <span className="text-xs font-mono text-cyan-300 font-bold animate-pulse">
                  {actionNotice}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {FAULT_SCENARIOS.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => {
                    setActiveScenario(sc.id);
                    setSeveritySlider(sc.severity);
                    setGradualToggle(sc.gradual);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    activeScenario === sc.id
                      ? 'bg-cyan-950/50 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-200 block font-mono flex items-center space-x-1.5">
                      <span>{sc.name}</span>
                    </span>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{sc.desc}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPreset(sc);
                    }}
                    className="ml-3 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white transition shadow-sm shrink-0"
                  >
                    Inject
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Tuning Controls */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Custom Severity Parameter:</span>
                <span className="font-bold text-cyan-400">
                  {Math.round(severitySlider * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={severitySlider}
                onChange={(e) => setSeveritySlider(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs font-mono">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={gradualToggle}
                    onChange={(e) => setGradualToggle(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>Simulate Gradual Degradation</span>
                </label>

                <div className="space-x-2">
                  <button
                    onClick={handleCustomInject}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition shadow-sm"
                  >
                    Inject Custom
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition border border-slate-700"
                  >
                    Reset Node
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Smoke vs Hardware Fault Disambiguation Control */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center">
                <Wind className="w-4 h-4 mr-2 text-cyan-400" />
                Environmental Obscuration Control
              </h3>
              <span className="text-xs font-mono font-bold text-amber-400">
                {Math.round(dustSlider * 100)}% Dust/Smoke
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              <strong className="text-slate-200 font-mono">Core Research Principle:</strong> Environmental sensing degradation (dense smoke or dust) attenuates optical transmission but does <em>not</em> constitute a physical camera hardware failure. The AI diagnoser distinguishes between environmental obscuration and damaged camera chips.
            </p>

            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={dustSlider}
              onChange={handleDustChange}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: 5-Stage AI Diagnosis Output Dossier */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                {selectedDroneId} Multi-Stage Diagnosis Output
              </h3>
              <span className="text-xs font-mono text-cyan-400">
                Inference Latency: <strong>{diagnosis?.inference_time_ms ?? 1.2}ms</strong>
              </span>
            </div>

            {/* Stage 2 Anomaly Detection Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  Stage 2: Edge Anomaly Detection
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    anomaly?.is_anomalous
                      ? 'bg-red-950 text-red-400 border border-red-500/30 animate-pulse'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {anomaly?.is_anomalous ? 'ANOMALY DETECTED' : 'NOMINAL LIMITS'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Anomaly Score (0.0 - 1.0):</span>
                <span className="font-bold text-cyan-300">
                  {anomaly?.anomaly_score ?? 0.0}
                </span>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                <span className="text-slate-500 block text-[11px]">
                  Flagged Telemetry Channels:
                </span>
                {anomaly?.flagged_channels && anomaly.flagged_channels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {anomaly.flagged_channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-mono text-[10px]"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-emerald-400 text-[11px]">None (Within envelope)</span>
                )}
              </div>
            </div>

            {/* Stage 3 Deeper Fault Assessment Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-slate-200 uppercase tracking-wide">
                  Stage 3: Deep Fault Assessment
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    diagnosis?.overall_severity === 'CRITICAL'
                      ? 'bg-red-950 text-red-400 border border-red-500/30'
                      : diagnosis?.overall_severity === 'MODERATE'
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {diagnosis?.overall_severity || 'NONE'} SEVERITY
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Fault Category:</span>
                  <span className="font-bold text-slate-200">
                    {diagnosis?.primary_fault?.category || 'NOMINAL_OPERATION'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Affected Component:</span>
                  <span className="font-bold text-slate-200">
                    {diagnosis?.primary_fault?.component || 'None'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Diagnostic Confidence:</span>
                  <span className="font-extrabold text-cyan-400">
                    {((diagnosis?.diagnostic_confidence ?? 0.98) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 text-slate-300 text-[11px] font-sans">
                  <span className="font-mono text-cyan-400">Diagnostic Evidence: </span>
                  {diagnosis?.primary_fault?.evidence || 'Telemetry within normal operating variance.'}
                </div>
              </div>
            </div>

            {/* Stage 4: Remaining Capabilities */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="font-bold font-mono text-slate-200 uppercase tracking-wide text-xs block">
                Stage 4: Post-Diagnosis Capabilities
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(cap).map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="text-slate-400">{k}</span>
                    <span
                      className={`font-bold ${
                        v < 0.35 ? 'text-red-400' : v < 0.6 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {Number(v).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Role Adaptation Outcome */}
            <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/40 space-y-2">
              <span className="font-bold font-mono text-purple-300 uppercase tracking-wide text-xs block">
                Stage 5: Safety Constrained Decision
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Adapted Operational Role:</span>
                <span className="font-bold text-purple-300 bg-purple-900/60 px-2 py-1 rounded border border-purple-500/40">
                  {droneDetails?.current_role || 'Search and exploration'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {droneDetails?.adaptation_reason || 'Role constraints successfully satisfied.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
