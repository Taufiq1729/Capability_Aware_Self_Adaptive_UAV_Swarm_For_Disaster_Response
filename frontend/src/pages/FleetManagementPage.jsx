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
  X,
  Zap,
  ArrowRight
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight leading-tight flex items-center space-x-2">
            <span>UAV Fleet Telemetry & Capability Registry</span>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              STAGE 1-5 ONBOARD
            </span>
          </h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">
            Real-time physical telemetry, remaining capability vectors, and constraint gating across all autonomous swarm nodes.
          </p>
        </div>
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3.5 py-2 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex items-center space-x-2">
          <span>Active Swarm Nodes:</span>
          <strong className="text-white font-bold">{drones.length} UAVs MESHED</strong>
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {drones.map((drone) => {
          const detail = detailedStates[drone.drone_id] || {};
          const status = drone.operational_status || drone.operationalStatus || 'HEALTHY';
          const cap = detail.capabilities || drone.capabilities || {};
          const battery = Math.round(drone.battery);
          const curRole = drone.current_role || drone.currentRole || 'Search and exploration';
          const initRole = drone.initial_role || drone.initialRole;
          const isRoleAdapted = drone.role_adapted || (initRole && curRole !== initRole);

          return (
            <div
              key={drone.drone_id}
              onClick={() => {
                setActiveModalDroneId(drone.drone_id);
                setSelectedDroneId(drone.drone_id);
              }}
              className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shadow-inner">
                      {drone.drone_id.split('-')[1]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 font-mono text-sm leading-tight flex items-center space-x-1.5">
                        <span>{drone.drone_id}</span>
                        {isRoleAdapted && (
                          <span className="text-[10px] text-purple-400 font-bold">⚡ ADAPTED</span>
                        )}
                      </h3>
                      <span className="text-[11px] text-slate-500 font-mono">
                        X: {Math.round(drone.x)} Y: {Math.round(drone.y)}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                      status === 'HEALTHY'
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                        : status === 'DEGRADED'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-500/30'
                        : 'bg-red-950/80 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {status}
                  </span>
                </div>

                {/* Role Pill & Assigned Tasks */}
                <div className="mt-3 bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">Operational Role</span>
                    <span className="text-xs font-bold font-mono text-cyan-300">
                      {curRole}
                    </span>
                  </div>

                  {isRoleAdapted && (
                    <div className="text-[10px] text-purple-300 font-mono bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded">
                      Adapted from: <strong className="line-through text-slate-400">{initRole}</strong>
                    </div>
                  )}

                  {/* Assigned Task(s) & Lineage */}
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">
                      Assigned Mission Task(s):
                    </span>
                    {tasks.filter((t) => t.assignedDrone === drone.drone_id).length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic font-mono block">
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
                                    ? 'bg-orange-950/60 text-orange-300 border border-orange-500/40'
                                    : t.taskId.includes('RELAY')
                                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                                }`}
                              >
                                <span className="font-bold">{t.taskId}</span>
                                {wasAcquired ? (
                                  <span className="text-[10px] font-bold text-orange-300 bg-orange-900/60 px-1.5 py-0.2 rounded border border-orange-500/40">
                                    Acquired from {t.acquiredFrom || t.previousDrone}
                                  </span>
                                ) : t.taskId.includes('RELAY') ? (
                                  <span className="text-[10px] text-purple-300 font-semibold">
                                    Autonomously Assigned
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-normal">
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
                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Battery</span>
                    <span className="font-bold text-slate-200 flex items-center">
                      <BatteryCharging className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      {battery}%
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Propulsion</span>
                    <span className="font-bold text-slate-200 flex items-center">
                      <Activity className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      {((cap.c_Mobility ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Optical Vision</span>
                    <span className="font-bold text-slate-200 flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                      {((cap.c_RGB ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Thermal FLIR</span>
                    <span className="font-bold text-slate-200 flex items-center">
                      <Crosshair className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      {((cap.c_Thermal ?? 1.0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Diag Conf: <strong className="text-cyan-400">{(detail.diagnostic_confidence ?? 0.98).toFixed(2)}</strong></span>
                <span className="text-cyan-400 font-semibold hover:text-cyan-300 flex items-center">
                  Inspect Dossier &rarr;
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Drill-down Modal Drawer */}
      {modalDrone && (
        <div className="fixed inset-0 z-50 bg-[#060A14]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-[0_0_50px_rgba(0,0,0,0.9)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  {modalDrone.drone_id.split('-')[1]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-mono leading-tight flex items-center space-x-2">
                    <span>{modalDrone.drone_id} Subsystem Diagnostic Dossier</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Role: <strong className="text-cyan-300">{modalDrone.current_role}</strong> • Status:{' '}
                    <strong className="text-emerald-400">{modalDrone.operational_status}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveModalDroneId(null)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stage 1: Live Physical Telemetry Raw Values */}
            {modalDrone.telemetry && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                  Stage 1: Onboard Telemetry Streams
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Battery Voltage</span>
                    <span className="font-bold text-slate-100">
                      {modalDrone.telemetry.battery.voltage_v} V
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {modalDrone.telemetry.battery.temperature_c} °C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Motor Vibration</span>
                    <span className="font-bold text-slate-100">
                      {modalDrone.telemetry.motor.vibration_g} G
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Temp: {modalDrone.telemetry.motor.temperature_c} °C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Thermal NETD</span>
                    <span className="font-bold text-slate-100">
                      {modalDrone.telemetry.thermal_camera.netd_mk} mK
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Drift: {modalDrone.telemetry.thermal_camera.drift_offset}°C
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">GPS HDOP / Sats</span>
                    <span className="font-bold text-slate-100">
                      HDOP {modalDrone.telemetry.localization.hdop}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {modalDrone.telemetry.localization.satellites} Sats
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 4: Remaining Capability Vector vs Diagnostic Confidence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                  Stage 4: Normalized Capability Vector [0.0 - 1.0]
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  Diagnostic Confidence:{' '}
                  <span className="font-bold text-cyan-300">
                    {modalDrone.diagnostic_confidence}
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                {Object.entries(modalDrone.capabilities || {}).map(([key, val]) => (
                  <div key={key} className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-300 font-medium">{key}</span>
                      <span className="font-bold text-cyan-300">{Number(val).toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full">
                      <div
                        className={`h-1.5 rounded-full ${
                          val > 0.6 ? 'bg-emerald-400' : val > 0.35 ? 'bg-amber-400' : 'bg-red-400'
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
              <h4 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-wider">
                Stage 5: Role Constraint Evaluation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
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
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : isFeasible
                          ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-600 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {isFeasible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span>{role}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-200">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setActiveModalDroneId(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition"
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
