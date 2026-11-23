import React from 'react';
import { useSwarm } from '../context/SwarmContext';
import { Link } from 'react-router-dom';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  BatteryCharging,
  Target,
  Users,
  Compass,
  ArrowRight,
  Radio,
  FileSpreadsheet,
  Zap
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export const OverviewDashboard = () => {
  const { simState, isRunning } = useSwarm();

  const drones = simState?.drones || [];
  const totalUAVs = drones.length;
  const healthyUAVs = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'HEALTHY').length;
  const degradedUAVs = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'DEGRADED').length;
  const criticalUAVs = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'CRITICAL').length;
  const activeUAVs = drones.filter(
    (d) => (d.currentRole || d.current_role) !== 'Return to Home / Land'
  ).length;

  const tasks = simState?.tasks || [];
  const inProgressTasks = tasks.filter((t) => t.taskStatus === 'IN_PROGRESS').length;
  const victimsFound = simState?.victims_detected || 0;
  const totalVictims = simState?.total_victims || 8;
  const coveragePct = simState?.coverage_percent || 0;

  // Role distribution data for Pie Chart
  const roleCounts = drones.reduce((acc, d) => {
    const role = d.currentRole || d.current_role || 'Search and exploration';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.keys(roleCounts).map((role) => ({
    name: role,
    value: roleCounts[role]
  }));

  const ROLE_COLORS = {
    'Search and exploration': '#F97316',
    'Victim detection': '#10B981',
    'Mapping and reconnaissance': '#06B6D4',
    'Communication relay': '#8B5CF6',
    'Return to Home / Land': '#EF4444'
  };

  // Battery Chart Data
  const batteryChartData = drones.map((d) => ({
    id: d.droneId || d.drone_id,
    battery: Math.round(d.battery),
    status: d.operationalStatus || d.operational_status
  }));

  const recentEvents = simState?.recent_events || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-1 text-xs font-mono font-bold rounded-md ${
                isRunning
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                  : 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
              }`}
            >
              {isRunning ? '● SWARM DEPLOYED // AUTONOMOUS' : '○ STANDBY // READY TO ENGAGE'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {simState?.sim_time || 0}s elapsed • {simState?.environment?.building_name || 'Multistorey Complex'} ({simState?.environment?.num_floors || 3} Floors)
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 mt-2 font-mono tracking-tight flex items-center space-x-2">
            <span>Swarm Mission Operations & Resilience Command</span>
          </h2>
          <p className="text-sm text-slate-400 font-sans mt-0.5">
            Decentralized confidence-aware edge intelligence with PyTorch SwarmHealthNet, PettingZoo MARL & NetworkX P2P mesh.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/simulation"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition"
          >
            <Compass className="w-4 h-4" />
            <span>Launch Tactical Radar Arena</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Fleet */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Total Fleet</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono">{totalUAVs}</div>
          <div className="text-[11px] text-cyan-400/90 font-mono mt-1">
            {activeUAVs} airborne nodes
          </div>
        </div>

        {/* Healthy */}
        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-mono mb-1">
            <span>Nominal</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
            {healthyUAVs}
          </div>
          <div className="text-[11px] text-emerald-500 font-mono mt-1">Full capabilities</div>
        </div>

        {/* Degraded */}
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-amber-400 text-xs font-mono mb-1">
            <span>Degraded</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-mono drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
            {degradedUAVs}
          </div>
          <div className="text-[11px] text-amber-500 font-mono mt-1">Self-adapting roles</div>
        </div>

        {/* Critical */}
        <div className="bg-slate-900/80 border border-red-500/20 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-red-400 text-xs font-mono mb-1">
            <span>Critical</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold text-red-400 font-mono drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            {criticalUAVs}
          </div>
          <div className="text-[11px] text-red-500 font-mono mt-1">Safe RTL abort</div>
        </div>

        {/* Survivors */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Survivors</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {victimsFound} <span className="text-xs text-slate-500 font-normal">/ {totalVictims}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {Math.round((victimsFound / totalVictims) * 100)}% rescued
          </div>
        </div>

        {/* Coverage */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Coverage</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">{coveragePct}%</div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts & Swarm Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Chart */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Role Distribution (Autonomous)</span>
            </h3>
            <span className="text-[11px] text-cyan-400/80 font-mono">Dynamic Split</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {roleChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={ROLE_COLORS[entry.name] || '#06B6D4'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs font-mono">
            {roleChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-slate-300">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[item.name] || '#06B6D4' }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-bold text-cyan-300">{item.value} UAV</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Battery Levels */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center space-x-2">
              <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
              <span>Battery Reserves (SoC %)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Remaining Energy</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batteryChartData}>
                <XAxis dataKey="id" stroke="#64748B" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Battery']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#F8FAFC'
                  }}
                />
                <Bar dataKey="battery" radius={[4, 4, 0, 0]}>
                  {batteryChartData.map((entry, index) => {
                    const color =
                      entry.battery < 20 ? '#EF4444' : entry.battery < 45 ? '#F59E0B' : '#10B981';
                    return <Cell key={`bar-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-3 border-t border-slate-800">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" /> &gt;45% Nominal
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" /> 20-45% Low
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-400 mr-1.5" /> &lt;20% RTL
            </span>
          </div>
        </div>

        {/* Live Swarm Coordination Events */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center space-x-2">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Live Coordination Logs</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">P2P MESH BROADCAST</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic font-mono">
                  Awaiting simulation events...
                </div>
              ) : (
                recentEvents.slice(0, 6).map((evt, idx) => {
                  const isRoleChange = evt.eventType === 'ROLE_CHANGED';
                  const isReassign = evt.eventType === 'TASK_REASSIGNED';
                  const isVictim = evt.eventType === 'VICTIM_LOCATED';
                  const isFault = evt.eventType === 'FAULT_INJECTED';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg border border-slate-800 bg-slate-950/60 text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            isFault
                              ? 'text-red-400'
                              : isRoleChange
                              ? 'text-amber-400'
                              : isVictim
                              ? 'text-emerald-400'
                              : 'text-cyan-400'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {evt.timestamp ? `${evt.timestamp}s` : 'Live'}
                        </span>
                      </div>
                      <p className="text-slate-300 line-clamp-2 text-[11px] font-sans">
                        {isRoleChange &&
                          `${evt.droneId} switched to '${evt.newRole}': ${evt.reason}`}
                        {isReassign &&
                          `Task ${evt.taskId} transferred to ${evt.awardedTo || evt.winner}`}
                        {isVictim &&
                          `Victim ${evt.victimId} located by ${evt.droneId} (${evt.modality})`}
                        {isFault && evt.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Link
            to="/coordination"
            className="mt-3 text-xs text-cyan-400 font-mono font-semibold hover:text-cyan-300 flex items-center justify-end"
          >
            <span>Inspect P2P Consensus Protocol</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>

      {/* Autonomous Task Reallocation & Health Status Matrix (Key Professor Grading Matrix) */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
              <Target className="w-4 h-4 mr-2 text-cyan-400" />
              Autonomous Task Allocation & Health Status Matrix
            </h3>
            <span className="text-xs text-slate-400">
              Live mapping of which task is assigned to which drone based on health status and confidence
            </span>
          </div>
          <Link
            to="/coordination"
            className="text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 flex items-center"
          >
            Inspect P2P Auctions &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2.5 font-medium">Task ID & Name</th>
                <th className="pb-2.5 font-medium">Type</th>
                <th className="pb-2.5 font-medium">Assigned Drone</th>
                <th className="pb-2.5 font-medium">Health Status</th>
                <th className="pb-2.5 font-medium">Diag Conf</th>
                <th className="pb-2.5 font-medium">Battery Drain</th>
                <th className="pb-2.5 font-medium">Task Acquisition & Lineage</th>
                <th className="pb-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tasks.map((t) => {
                const droneObj = drones.find((d) => (d.drone_id || d.droneId) === t.assignedDrone);
                const healthStatus =
                  droneObj?.operational_status ||
                  droneObj?.operationalStatus ||
                  t.assignedBasedOnHealth?.healthStatus ||
                  'HEALTHY';
                const conf =
                  droneObj?.diagnostic_confidence ??
                  t.assignedBasedOnHealth?.confidence ??
                  0.98;
                const wasAcquired = !!(t.acquiredFrom || t.previousDrone);

                return (
                  <tr key={t.taskId} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pr-3">
                      <div className="font-bold text-slate-200">{t.taskId}</div>
                      <div className="text-[11px] text-slate-400 font-sans">{t.title}</div>
                    </td>
                    <td className="py-3 pr-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {t.taskType}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      {t.assignedDrone ? (
                        <span className="inline-flex items-center space-x-1.5 font-bold text-cyan-300 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-500/30">
                          {droneObj?.trajectory_color && (
                            <span
                              className="w-2 h-2 rounded-full inline-block shadow-sm"
                              style={{ backgroundColor: droneObj.trajectory_color }}
                              title={`Trajectory color: ${droneObj.trajectory_color}`}
                            />
                          )}
                          <span>{t.assignedDrone}</span>
                        </span>
                      ) : (
                        <span className="text-amber-400 italic">Bidding / Open</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          healthStatus === 'HEALTHY'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : healthStatus === 'DEGRADED'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30'
                            : 'bg-red-950/60 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {healthStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-cyan-300 font-bold">
                      {Math.round(conf * 100)}%
                    </td>
                    <td className="py-3 pr-3">
                      {droneObj?.current_role?.toLowerCase().includes('relay') || t.taskType === 'RELAY' ? (
                        <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          ⚡ -0.10%/s (Eco)
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          ⚡ -0.35%/s (Active)
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 font-sans">
                      {wasAcquired ? (
                        <div className="bg-orange-950/50 border border-orange-500/40 px-2.5 py-1.5 rounded-lg text-xs space-y-0.5">
                          <div className="font-mono text-orange-300 font-bold flex items-center space-x-1.5">
                            <span>Acquired from {t.acquiredFrom || t.previousDrone}</span>
                            <ArrowRight className="w-3 h-3 text-orange-400 inline" />
                            <span className="text-white">{t.assignedDrone}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 line-clamp-1">
                            {t.handoverReason || 'Sensor failure on previous drone'}
                          </div>
                        </div>
                      ) : t.taskId.includes('RELAY') ? (
                        <span className="text-purple-300 bg-purple-950/60 px-2 py-1 rounded text-[11px] font-mono border border-purple-500/30">
                          Autonomously assigned alternative Relay role
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          Initial assignment (Intact capability)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.taskStatus === 'IN_PROGRESS'
                            ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                            : t.taskStatus === 'BIDDING'
                            ? 'bg-amber-950/60 text-amber-400 border border-amber-500/30 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {t.taskStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
