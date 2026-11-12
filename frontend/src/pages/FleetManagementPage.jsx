import React, { useState } from 'react';
import { useSwarm } from '../context/SwarmContext';
import {
  Cpu,
  BatteryCharging,
  Radio,
  Eye,
  Crosshair,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Activity,
  CheckCircle2,
  XCircle,
  X
} from 'lucide-react';

export const FleetManagementPage = () => {
  const { simState, setSelectedDroneId } = useSwarm();
  const [activeModalDroneId, setActiveModalDroneId] = useState(null);

  const drones = simState?.drones || [];
  const detailedStates = simState?.detailed_drone_states || {};
  const tasks = simState?.tasks || [];

  const modalDrone = activeModalDroneId ? detailedStates[activeModalDroneId] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">
            UAV Fleet Telemetry & Capability Registry
          </h2>
          <p className="text-sm text-charcoal-600">
            Real-time health telemetry, remaining capability vectors, and constraint gating across all swarm nodes.
          </p>
        </div>
        <div className="text-xs font-mono text-charcoal-500 bg-cream-100 px-3 py-1.5 rounded-lg border border-cream-300">
          Swarm Count: <span className="font-bold text-charcoal-900">{drones.length} UAVs</span>
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drones.map((drone) => {
          const detail = detailedStates[drone.drone_id] || {};
          const status = drone.operational_status || drone.operationalStatus || 'HEALTHY';
          const cap = detail.capabilities || drone.capabilities || {};
          const battery = Math.round(drone.battery);

          return (
            <div
              key={drone.drone_id}
              onClick={() => {
                setActiveModalDroneId(drone.drone_id);
                setSelectedDroneId(drone.drone_id);
              }}
              className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-terracotta-300 transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-cream-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-cream-100 border border-cream-300 flex items-center justify-center font-mono font-bold text-xs text-charcoal-800">
                      {drone.drone_id.split('-')[1]}
                    </div>
                    <div>
                      <h3 className="font-bold text-charcoal-900 font-mono text-sm leading-tight">
                        {drone.drone_id}
                      </h3>
                      <span className="text-[11px] text-charcoal-500 font-mono">
                        X: {Math.round(drone.x)} Y: {Math.round(drone.y)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                      status === 'HEALTHY'
                        ? 'bg-sage-50 text-sage-700 border border-sage-200'
                        : status === 'DEGRADED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-critical-50 text-critical-700 border border-critical-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {/* Role Pill & Assigned Tasks */}
                <div className="mt-3 bg-cream-50 rounded-xl p-2.5 border border-cream-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-charcoal-500 font-mono">Mission Role</span>
                    <span className="text-xs font-semibold text-charcoal-900">
                      {drone.current_role || drone.currentRole}
                    </span>
                  </div>

                  {/* Assigned Task(s) & Lineage */}
                  <div className="pt-1.5 border-t border-cream-200">
                    <span className="text-[10px] text-charcoal-400 font-mono block mb-1">
                      Assigned Mission Task(s):
                    </span>
                    {tasks.filter((t) => t.assignedDrone === drone.drone_id).length === 0 ? (
                      <span className="text-[11px] text-charcoal-400 italic font-mono block">
                        No active task (Standby / RTL)
                      </span>
                    ) : (
                      <div className="space-y-1">
                        {tasks
                          .filter((t) => t.assignedDrone === drone.drone_id)
                          .map((t) => {
                            const wasAcquired = !!(t.acquiredFrom || t.previousDrone);
                            return (
                              <div
                                key={t.taskId}
                                className={`px-2 py-1 rounded text-[11px] font-mono flex items-center justify-between ${
                                  wasAcquired
                                    ? 'bg-terracotta-100/70 text-terracotta-800 border border-terracotta-300'
                                    : t.taskId.includes('RELAY')
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-white text-charcoal-800 border border-cream-200'
                                }`}
                              >
                                <span className="font-bold">{t.taskId}</span>
                                {wasAcquired ? (
                                  <span className="text-[10px] font-bold text-terracotta-700 bg-white px-1.5 py-0.2 rounded border border-terracotta-300">
                                    Acquired from {t.acquiredFrom || t.previousDrone}
                                  </span>
                                ) : t.taskId.includes('RELAY') ? (
                                  <span className="text-[10px] text-amber-800 font-semibold">
                                    Autonomously Assigned
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-charcoal-500 font-normal">
                                    {t.taskType}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Subsystem Quick Gauges */}
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div className="bg-cream-50 p-2 rounded-lg border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Battery</span>
                    <span className="font-semibold text-charcoal-800 flex items-center">
                      <BatteryCharging className="w-3.5 h-3.5 mr-1 text-terracotta-500" />
                      {battery}%
                    </span>
                  </div>

                  <div className="bg-cream-50 p-2 rounded-lg border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Propulsion</span>
                    <span className="font-semibold text-charcoal-800 flex items-center">
                      <Activity className="w-3.5 h-3.5 mr-1 text-sage-600" />
                      {((cap.c_Mobility ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bg-cream-50 p-2 rounded-lg border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Optical Vision</span>
                    <span className="font-semibold text-charcoal-800 flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1 text-charcoal-600" />
                      {((cap.c_RGB ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bg-cream-50 p-2 rounded-lg border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Thermal FLIR</span>
                    <span className="font-semibold text-charcoal-800 flex items-center">
                      <Crosshair className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      {((cap.c_Thermal ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between text-xs text-charcoal-500 font-mono">
                <span>Diag Conf: {(detail.diagnostic_confidence ?? 0.98).toFixed(2)}</span>
                <span className="text-terracotta-600 font-medium hover:underline">
                  Inspect Subsystems &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Drill-down Modal Drawer */}
      {modalDrone && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-cream-300 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-cream-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-center font-mono font-bold text-terracotta-700">
                  {modalDrone.drone_id.split('-')[1]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-charcoal-900 font-mono leading-tight">
                    {modalDrone.drone_id} Subsystem Diagnostic Dossier
                  </h3>
                  <span className="text-xs text-charcoal-500 font-mono">
                    Role: {modalDrone.current_role} • Status: {modalDrone.operational_status}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalDroneId(null)}
                className="p-1.5 text-charcoal-400 hover:text-charcoal-800 hover:bg-cream-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage 1: Live Physical Telemetry Raw Values */}
            {modalDrone.telemetry && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-charcoal-700 uppercase tracking-wider">
                  Stage 1: Onboard Telemetry Streams
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Battery Voltage</span>
                    <span className="font-semibold text-charcoal-800">
                      {modalDrone.telemetry.battery.voltage_v} V
                    </span>
                    <span className="text-[10px] text-charcoal-500 block">
                      {modalDrone.telemetry.battery.temperature_c} °C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Motor Vibration</span>
                    <span className="font-semibold text-charcoal-800">
                      {modalDrone.telemetry.motor.vibration_g} G
                    </span>
                    <span className="text-[10px] text-charcoal-500 block">
                      Temp: {modalDrone.telemetry.motor.temperature_c} °C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">Thermal NETD</span>
                    <span className="font-semibold text-charcoal-800">
                      {modalDrone.telemetry.thermal_camera.netd_mk} mK
                    </span>
                    <span className="text-[10px] text-charcoal-500 block">
                      Drift: {modalDrone.telemetry.thermal_camera.drift_offset}°C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-cream-50 border border-cream-200">
                    <span className="text-[10px] text-charcoal-400 block">GPS HDOP / Sats</span>
                    <span className="font-semibold text-charcoal-800">
                      HDOP {modalDrone.telemetry.localization.hdop}
                    </span>
                    <span className="text-[10px] text-charcoal-500 block">
                      {modalDrone.telemetry.localization.satellites} Sats
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 4: Remaining Capability Vector vs Diagnostic Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-charcoal-700 uppercase tracking-wider">
                  Stage 4: Normalized Capability Vector [0.0 - 1.0]
                </h4>
                <span className="text-xs font-mono text-charcoal-500">
                  Diagnostic Confidence:{' '}
                  <span className="font-bold text-terracotta-600">
                    {modalDrone.diagnostic_confidence}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {Object.entries(modalDrone.capabilities || {}).map(([key, val]) => (
                  <div key={key} className="bg-cream-50 p-2.5 rounded-xl border border-cream-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-charcoal-600 font-medium">{key}</span>
                      <span className="font-bold text-charcoal-800">{Number(val).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-cream-200 h-1.5 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${
                          val > 0.6 ? 'bg-sage-600' : val > 0.35 ? 'bg-amber-500' : 'bg-critical-500'
                        }`}
                        style={{ width: `${Math.round(val * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 5: Safety Constrained Feasible Roles */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold font-mono text-charcoal-700 uppercase tracking-wider">
                Stage 5: Role Constraint Evaluation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  'Search and exploration',
                  'Victim detection',
                  'Mapping and reconnaissance',
                  'Communication relay',
                  'Return to Home / Land'
                ].map((role) => {
                  const isFeasible = modalDrone.feasible_roles?.includes(role);
                  const isCurrent = modalDrone.current_role === role;

                  return (
                    <div
                      key={role}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isCurrent
                          ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-800 font-semibold'
                          : isFeasible
                          ? 'bg-sage-50 border-sage-200 text-sage-800'
                          : 'bg-cream-100 border-cream-200 text-charcoal-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isFeasible ? (
                          <CheckCircle2 className="w-4 h-4 text-sage-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-critical-500" />
                        )}
                        <span>{role}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-terracotta-200 text-terracotta-800">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-cream-200">
              <button
                onClick={() => setActiveModalDroneId(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium bg-charcoal-800 text-white hover:bg-charcoal-900 transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
