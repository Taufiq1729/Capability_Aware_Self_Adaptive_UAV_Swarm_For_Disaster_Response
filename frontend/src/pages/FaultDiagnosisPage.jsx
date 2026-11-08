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
  Layers
} from 'lucide-react';

const FAULT_SCENARIOS = [
  {
    id: 'rgb_camera_fail',
    name: 'RGB Camera Complete Failure',
    component: 'rgb_camera',
    faultType: 'hardware_failure',
    severity: 1.0,
    gradual: false,
    desc: 'Image sensor pipeline ceases output (0 FPS). Primary search cameras offline.'
  },
  {
    id: 'thermal_degrade',
    name: 'Thermal Camera Radiometric Drift',
    component: 'thermal_camera',
    faultType: 'sensor_drift',
    severity: 0.85,
    gradual: false,
    desc: 'NETD noise elevates to >180mK with calibration bias. Victim heat signatures obscured.'
  },
  {
    id: 'lidar_failure',
    name: 'LiDAR Optical Receiver Failure',
    component: 'lidar',
    faultType: 'hardware_failure',
    severity: 0.95,
    gradual: false,
    desc: 'Laser rangefinder return rate drops below 10k pts/s. High-resolution mapping compromised.'
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
    desc: 'Internal resistance causes accelerated voltage drop toward emergency RTL safety margin.'
  },
  {
    id: 'gps_drift',
    name: 'GNSS Satellite Multipath / Drift',
    component: 'gps',
    faultType: 'position_drift',
    severity: 0.80,
    gradual: false,
    desc: 'HDOP surges past 4.0; position drift exceeds 14 meters. Precision mapping impossible.'
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">
            Fault Injection & Explainable Edge Diagnosis
          </h2>
          <p className="text-sm text-charcoal-600">
            Inject component failures, simulate environmental smoke obscuration, and inspect the multi-stage AI diagnostic pipeline.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-mono text-charcoal-500">Target Node:</label>
          <select
            value={selectedDroneId}
            onChange={(e) => setSelectedDroneId(e.target.value)}
            className="text-xs font-bold font-mono text-charcoal-900 bg-cream-100 border border-cream-300 rounded-lg px-3 py-1.5 cursor-pointer"
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
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-terracotta-500" />
                Select Fault Scenario
              </h3>
              {actionNotice && (
                <span className="text-xs font-mono text-terracotta-600 font-semibold animate-pulse">
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
                      ? 'bg-terracotta-50 border-terracotta-400 shadow-2xs'
                      : 'bg-cream-50 border-cream-200 hover:bg-cream-100'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-xs text-charcoal-900 block font-mono">
                      {sc.name}
                    </span>
                    <p className="text-[11px] text-charcoal-500 line-clamp-1">{sc.desc}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyPreset(sc);
                    }}
                    className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-cream-300 text-charcoal-800 hover:bg-terracotta-500 hover:text-white hover:border-terracotta-500 transition shadow-2xs shrink-0"
                  >
                    Inject
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Tuning Controls */}
            <div className="pt-3 border-t border-cream-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-charcoal-600">Custom Severity Parameter:</span>
                <span className="font-bold text-charcoal-900">
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
                className="w-full accent-terracotta-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer font-mono text-charcoal-700">
                  <input
                    type="checkbox"
                    checked={gradualToggle}
                    onChange={(e) => setGradualToggle(e.target.checked)}
                    className="rounded border-cream-300 text-terracotta-600 focus:ring-terracotta-400"
                  />
                  <span>Gradual Degradation (Simulate Wear & Tear)</span>
                </label>

                <div className="space-x-2">
                  <button
                    onClick={handleCustomInject}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-terracotta-500 text-white hover:bg-terracotta-600 transition shadow-2xs"
                  >
                    Inject Selected
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cream-200 text-charcoal-700 hover:bg-cream-300 transition border border-cream-300"
                  >
                    Reset Node
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Environmental Smoke vs Hardware Fault Disambiguation Control */}
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <Wind className="w-4 h-4 mr-2 text-charcoal-600" />
                Environmental Obscuration Control
              </h3>
              <span className="text-xs font-mono font-bold text-charcoal-800">
                {Math.round(dustSlider * 100)}% Dust/Smoke
              </span>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              <strong>Core Research Principle:</strong> Environmental sensing degradation (dense smoke or dust) attenuates optical transmission but does <em>not</em> constitute a physical camera hardware failure. The AI diagnoser distinguishes between environmental obscuration and damaged camera chips.
            </p>

            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={dustSlider}
              onChange={handleDustChange}
              className="w-full accent-charcoal-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: 5-Stage AI Diagnosis Output Dossier */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider">
                {selectedDroneId} Multi-Stage Diagnosis Result
              </h3>
              <span className="text-xs font-mono text-charcoal-500">
                Inference Delay: {diagnosis?.inference_time_ms ?? 1.2}ms
              </span>
            </div>

            {/* Stage 2 Anomaly Detection Card */}
            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-charcoal-800 uppercase tracking-wide">
                  Stage 2: Edge Anomaly Detection
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    anomaly?.is_anomalous
                      ? 'bg-critical-100 text-critical-700'
                      : 'bg-sage-100 text-sage-700'
                  }`}
                >
                  {anomaly?.is_anomalous ? 'ANOMALY DETECTED' : 'NOMINAL LIMITS'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-charcoal-500">Anomaly Score (0 - 1):</span>
                <span className="font-bold text-charcoal-900">
                  {anomaly?.anomaly_score ?? 0.0}
                </span>
              </div>

              <div className="text-xs text-charcoal-600">
                <span className="font-mono text-charcoal-500 block text-[11px]">
                  Flagged Telemetry Channels:
                </span>
                {anomaly?.flagged_channels && anomaly.flagged_channels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {anomaly.flagged_channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px]"
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sage-600 text-[11px]">None (Within envelope)</span>
                )}
              </div>
            </div>

            {/* Stage 3 Deeper Fault Assessment Card */}
            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-charcoal-800 uppercase tracking-wide">
                  Stage 3: Deeper Fault Assessment
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-bold ${
                    diagnosis?.overall_severity === 'CRITICAL'
                      ? 'bg-critical-100 text-critical-700'
                      : diagnosis?.overall_severity === 'MODERATE'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sage-100 text-sage-700'
                  }`}
                >
                  {diagnosis?.overall_severity || 'NONE'} SEVERITY
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono">
                  <span className="text-charcoal-500">Fault Category:</span>
                  <span className="font-semibold text-charcoal-800">
                    {diagnosis?.primary_fault?.category || 'NOMINAL_OPERATION'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-charcoal-500">Affected Component:</span>
                  <span className="font-semibold text-charcoal-800">
                    {diagnosis?.primary_fault?.component || 'None'}
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-charcoal-500">Diagnostic Confidence:</span>
                  <span className="font-bold text-terracotta-600">
                    {(diagnosis?.diagnostic_confidence ?? 0.98) * 100}%
                  </span>
                </div>
                <div className="pt-1.5 border-t border-cream-200 text-charcoal-600 text-[11px]">
                  <span className="font-mono text-charcoal-500">Diagnostic Evidence: </span>
                  {diagnosis?.primary_fault?.evidence || 'Telemetry within normal operating variance.'}
                </div>
              </div>
            </div>

            {/* Stage 4: Remaining Capabilities */}
            <div className="p-3.5 rounded-xl bg-cream-50 border border-cream-200 space-y-2">
              <span className="font-semibold font-mono text-charcoal-800 uppercase tracking-wide text-xs block">
                Stage 4: Post-Diagnosis Capabilities
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(cap).map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-white px-2 py-1 rounded border border-cream-200">
                    <span className="text-charcoal-500">{k}</span>
                    <span
                      className={`font-bold ${
                        v < 0.35 ? 'text-critical-600' : v < 0.6 ? 'text-amber-600' : 'text-sage-700'
                      }`}
                    >
                      {Number(v).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Role Adaptation Outcome */}
            <div className="p-3.5 rounded-xl bg-terracotta-50 border border-terracotta-200 space-y-2">
              <span className="font-semibold font-mono text-terracotta-800 uppercase tracking-wide text-xs block">
                Stage 5: Safety Constrained Decision
              </span>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-charcoal-600">Adapted Operational Role:</span>
                <span className="font-bold text-terracotta-700 bg-white px-2 py-1 rounded border border-terracotta-200">
                  {droneDetails?.current_role || 'Search and exploration'}
                </span>
              </div>
              <p className="text-[11px] text-charcoal-600 leading-relaxed">
                {droneDetails?.adaptation_reason || 'Role constraints successfully satisfied.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
