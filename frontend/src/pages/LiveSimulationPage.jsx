import React, { useState } from 'react';
import { useSwarm } from '../context/SwarmContext';
import { CanvasSimulation } from '../simulation/CanvasSimulation';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Wind,
  Radio,
  Sliders,
  Layers,
  Zap,
  Activity,
  Cpu,
  Eye,
  AlertTriangle,
  Compass,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const LiveSimulationPage = () => {
  const {
    simState,
    isRunning,
    simSpeed,
    selectedDroneId,
    setSelectedDroneId,
    selectedDroneState,
    handleStart,
    handlePause,
    handleStep,
    handleReset,
    handleSpeedChange,
    handleUpdateEnvironment,
    handleInjectFault,
    handleClearFault
  } = useSwarm();

  const [showCoverage, setShowCoverage] = useState(true);
  const [showCommLinks, setShowCommLinks] = useState(true);
  const [showSmoke, setShowSmoke] = useState(true);

  const [dustLevel, setDustLevel] = useState(0.15);
  const [commRange, setCommRange] = useState(230);
  const [selectedComponent, setSelectedComponent] = useState('rgb_camera');
  const [faultType, setFaultType] = useState('hardware_failure');
  const [severity, setSeverity] = useState(0.85);
  const [isGradual, setIsGradual] = useState(false);
  const [injectStatus, setInjectStatus] = useState(null);

  const drones = simState?.drones || [];

  const onDustChange = async (e) => {
    const val = parseFloat(e.target.value);
    setDustLevel(val);
    await handleUpdateEnvironment({ dustLevel: val });
  };

  const onCommRangeChange = async (e) => {
    const val = parseFloat(e.target.value);
    setCommRange(val);
    await handleUpdateEnvironment({ commRange: val });
  };

  const triggerFault = async () => {
    try {
      setInjectStatus('Injecting...');
      await handleInjectFault({
        droneId: selectedDroneId,
        component: selectedComponent,
        faultType,
        severity,
        gradual: isGradual
      });
      setInjectStatus('Fault Injected!');
      setTimeout(() => setInjectStatus(null), 2500);
    } catch (err) {
      setInjectStatus('Error: ' + err.message);
      setTimeout(() => setInjectStatus(null), 3000);
    }
  };

  const clearCurrentFault = async () => {
    try {
      await handleClearFault(selectedDroneId, selectedComponent);
      setInjectStatus('Cleared!');
      setTimeout(() => setInjectStatus(null), 2000);
    } catch (err) {
      setInjectStatus('Error: ' + err.message);
    }
  };

  const droneDetails = simState?.detailed_drone_states?.[selectedDroneId];
  const cap = droneDetails?.capabilities || {};
  const diagnosis = droneDetails?.diagnosis;
  const anomaly = droneDetails?.anomaly;
  const telemetry = droneDetails?.telemetry;

  return (
    <div className="space-y-6">
      {/* Simulation Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-terracotta-50 text-terracotta-600 border border-terracotta-200">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-charcoal-900 leading-tight">
              2D Disaster Response Swarm Arena
            </h2>
            <p className="text-xs text-charcoal-500 font-mono">
              Mesh Range: {commRange}m • Step #{simState?.step || 0} • Sim Time: {simState?.sim_time || 0}s
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white shadow-xs hover:bg-amber-600 transition"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sage-600 text-white shadow-xs hover:bg-sage-700 transition"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}

          <button
            onClick={handleStep}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-cream-200 text-charcoal-700 hover:bg-cream-300 transition border border-cream-300"
            title="Advance 1 Step"
          >
            <SkipForward className="w-4 h-4" />
            <span>Step Tick</span>
          </button>

          <button
            onClick={() => handleReset(6, 42)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-cream-200 text-charcoal-700 hover:bg-cream-300 transition border border-cream-300"
            title="Reset to Initial Scenario"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          {/* Layer visibility toggles */}
          <div className="flex items-center bg-cream-100 rounded-xl p-1 border border-cream-300 text-xs font-mono">
            <button
              onClick={() => setShowCoverage(!showCoverage)}
              className={`px-2 py-1 rounded-lg transition ${
                showCoverage ? 'bg-white text-sage-700 shadow-2xs font-semibold' : 'text-charcoal-500'
              }`}
            >
              Coverage
            </button>
            <button
              onClick={() => setShowCommLinks(!showCommLinks)}
              className={`px-2 py-1 rounded-lg transition ${
                showCommLinks ? 'bg-white text-terracotta-700 shadow-2xs font-semibold' : 'text-charcoal-500'
              }`}
            >
              P2P Links
            </button>
            <button
              onClick={() => setShowSmoke(!showSmoke)}
              className={`px-2 py-1 rounded-lg transition ${
                showSmoke ? 'bg-white text-charcoal-900 shadow-2xs font-semibold' : 'text-charcoal-500'
              }`}
            >
              Smoke
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport & Live Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Canvas & Environmental Controls */}
        <div className="lg:col-span-8 space-y-4">
          <CanvasSimulation
            simState={simState}
            selectedDroneId={selectedDroneId}
            onSelectDrone={(id) => setSelectedDroneId(id)}
            showCoverage={showCoverage}
            showCommLinks={showCommLinks}
            showSmoke={showSmoke}
          />

          {/* Quick Environment Sliders */}
          <div className="bg-white border border-cream-300 rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="flex items-center text-charcoal-600">
                  <Wind className="w-3.5 h-3.5 mr-1 text-terracotta-500" /> Atmospheric Dust & Smoke:
                </span>
                <span className="font-semibold text-charcoal-900">{Math.round(dustLevel * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={dustLevel}
                onChange={onDustChange}
                className="w-full accent-terracotta-500 cursor-pointer"
              />
              <p className="text-[10px] text-charcoal-400 mt-0.5">
                Affects RGB sensor clarity without degrading camera hardware.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="flex items-center text-charcoal-600">
                  <Radio className="w-3.5 h-3.5 mr-1 text-sage-600" /> P2P Radio Transmission Range:
                </span>
                <span className="font-semibold text-charcoal-900">{commRange}m</span>
              </div>
              <input
                type="range"
                min="80"
                max="450"
                step="10"
                value={commRange}
                onChange={onCommRangeChange}
                className="w-full accent-sage-600 cursor-pointer"
              />
              <p className="text-[10px] text-charcoal-400 mt-0.5">
                Controls wireless mesh connectivity and network partitions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Selected Drone Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            {/* Drone Selection Dropdown */}
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <div>
                <label className="text-[10px] font-mono text-charcoal-400 uppercase tracking-wider block">
                  Inspected Node
                </label>
                <select
                  value={selectedDroneId}
                  onChange={(e) => setSelectedDroneId(e.target.value)}
                  className="text-base font-bold text-charcoal-900 bg-transparent font-mono outline-hidden cursor-pointer"
                >
                  {drones.map((d) => (
                    <option key={d.drone_id} value={d.drone_id}>
                      {d.drone_id} ({d.operational_status || d.operationalStatus})
                    </option>
                  ))}
                </select>
              </div>

              <span
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                  selectedDroneState?.operational_status === 'HEALTHY' ||
                  selectedDroneState?.operationalStatus === 'HEALTHY'
                    ? 'bg-sage-50 text-sage-700 border border-sage-200'
                    : selectedDroneState?.operational_status === 'DEGRADED' ||
                      selectedDroneState?.operationalStatus === 'DEGRADED'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-critical-50 text-critical-700 border border-critical-200'
                }`}
              >
                {selectedDroneState?.operational_status ||
                  selectedDroneState?.operationalStatus ||
                  'HEALTHY'}
              </span>
            </div>

            {/* Role & Battery Overview */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-cream-50 border border-cream-200 rounded-xl p-2.5">
                <span className="text-[10px] text-charcoal-500 block">Current Role</span>
                <span className="font-semibold text-charcoal-800 line-clamp-1">
                  {selectedDroneState?.current_role || selectedDroneState?.currentRole || 'Search'}
                </span>
              </div>
              <div className="bg-cream-50 border border-cream-200 rounded-xl p-2.5">
                <span className="text-[10px] text-charcoal-500 block">Battery SoC</span>
                <span className="font-semibold text-charcoal-800">
                  {Math.round(selectedDroneState?.battery ?? 100)}%
                </span>
              </div>
            </div>

            {/* Stage 4: Capability Vector Breakdown */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-charcoal-800 mb-2">
                <span>Normalized Capabilities</span>
                <span className="text-charcoal-500 font-normal">
                  Conf: {diagnosis?.diagnostic_confidence ?? 0.98}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {[
                  { key: 'c_RGB', label: 'RGB Vision', val: cap.c_RGB ?? 1.0 },
                  { key: 'c_Thermal', label: 'Thermal FLIR', val: cap.c_Thermal ?? 1.0 },
                  { key: 'c_LiDAR', label: 'LiDAR Range', val: cap.c_LiDAR ?? 1.0 },
                  { key: 'c_Communication', label: 'P2P Comm', val: cap.c_Communication ?? 1.0 },
                  { key: 'c_Mobility', label: 'Mobility/Motors', val: cap.c_Mobility ?? 1.0 },
                  { key: 'c_Localization', label: 'GPS Accuracy', val: cap.c_Localization ?? 1.0 },
                  { key: 'c_Energy', label: 'Energy Margin', val: cap.c_Energy ?? 1.0 },
                  { key: 'c_Compute', label: 'Edge Compute', val: cap.c_Compute ?? 1.0 }
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-charcoal-600 text-[11px] w-28">{item.label}</span>
                    <div className="flex-1 mx-2 bg-cream-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          item.val > 0.6
                            ? 'bg-sage-600'
                            : item.val > 0.35
                            ? 'bg-amber-500'
                            : 'bg-critical-500'
                        }`}
                        style={{ width: `${Math.round(item.val * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-semibold text-[11px] text-charcoal-800">
                      {item.val.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Role Adaptation Reasoning */}
            {droneDetails?.adaptation_reason && (
              <div className="p-3 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs text-charcoal-800">
                <span className="font-semibold text-terracotta-700 font-mono block mb-1">
                  Adaptation Engine Note:
                </span>
                <p className="text-charcoal-600 leading-relaxed text-[11px]">
                  {droneDetails.adaptation_reason}
                </p>
              </div>
            )}

            {/* Quick Fault Injector Box */}
            <div className="pt-3 border-t border-cream-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-mono text-charcoal-800 uppercase tracking-wider">
                  Edge Fault Injection
                </span>
                {injectStatus && (
                  <span className="text-[11px] font-mono font-medium text-terracotta-600">
                    {injectStatus}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] text-charcoal-500 font-mono block">Component</label>
                  <select
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-lg p-1.5 text-xs text-charcoal-800 font-mono"
                  >
                    <option value="rgb_camera">RGB Camera</option>
                    <option value="thermal_camera">Thermal Camera</option>
                    <option value="lidar">LiDAR Scanner</option>
                    <option value="motor">Motor / Propulsion</option>
                    <option value="battery">Battery Pack</option>
                    <option value="gps">GPS / GNSS</option>
                    <option value="comm_radio">Comm Radio</option>
                    <option value="compute">Edge Computer</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-charcoal-500 font-mono block">Fault Type</label>
                  <select
                    value={faultType}
                    onChange={(e) => setFaultType(e.target.value)}
                    className="w-full bg-cream-50 border border-cream-300 rounded-lg p-1.5 text-xs text-charcoal-800 font-mono"
                  >
                    <option value="hardware_failure">Hardware Failure</option>
                    <option value="sensor_degradation">Sensor Drift / Noise</option>
                    <option value="rapid_discharge">Rapid Discharge</option>
                    <option value="vibration_seizure">High Vibration</option>
                    <option value="packet_corruption">Comm Jamming</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={triggerFault}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold bg-terracotta-500 text-white shadow-xs hover:bg-terracotta-600 transition"
                >
                  Inject Fault
                </button>
                <button
                  onClick={clearCurrentFault}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-cream-200 text-charcoal-700 hover:bg-cream-300 transition border border-cream-300"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
