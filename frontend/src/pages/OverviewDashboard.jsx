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
  FileSpreadsheet
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
  const healthyUAVs = drones.filter((d) => d.operationalStatus === 'HEALTHY').length;
  const degradedUAVs = drones.filter((d) => d.operationalStatus === 'DEGRADED').length;
  const criticalUAVs = drones.filter((d) => d.operationalStatus === 'CRITICAL').length;
  const activeUAVs = drones.filter((d) => d.currentRole !== 'Return to Home / Land').length;

  const tasks = simState?.tasks || [];
  const inProgressTasks = tasks.filter((t) => t.taskStatus === 'IN_PROGRESS').length;
  const victimsFound = simState?.victims_detected || 0;
  const totalVictims = simState?.total_victims || 8;
  const coveragePct = simState?.coverage_percent || 0;

  // Role distribution data for Pie Chart
  const roleCounts = drones.reduce((acc, d) => {
    acc[d.currentRole] = (acc[d.currentRole] || 0) + 1;
    return acc;
  }, {});

  const roleChartData = Object.keys(roleCounts).map((role) => ({
    name: role,
    value: roleCounts[role]
  }));

  const ROLE_COLORS = {
    'Search and exploration': '#C85A32',
    'Victim detection': '#3D7A5A',
    'Mapping and reconnaissance': '#D97706',
    'Communication relay': '#4F46E5',
    'Return to Home / Land': '#9CA3AF'
  };

  // Battery Chart Data
  const batteryChartData = drones.map((d) => ({
    id: d.droneId,
    battery: d.battery,
    status: d.operationalStatus
  }));

  const recentEvents = simState?.recent_events || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 text-xs font-mono font-medium rounded-md bg-sage-50 text-sage-700 border border-sage-200">
              {isRunning ? 'SIMULATION RUNNING' : 'SIMULATION STANDBY'}
            </span>
            <span className="text-xs text-charcoal-500 font-mono">
              Step #{simState?.step || 0} ({simState?.sim_time || 0}s elapsed)
            </span>
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 mt-1">
            Swarm Mission Operations & Resilience Center
          </h2>
          <p className="text-sm text-charcoal-600">
            Decentralized confidence-aware edge intelligence monitoring active search and rescue operations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/simulation"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-terracotta-500 text-white text-sm font-medium shadow-sm hover:bg-terracotta-600 transition"
          >
            <Compass className="w-4 h-4" />
            <span>Launch Live Swarm Map</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-mono mb-1">
            <span>Total Fleet</span>
            <Users className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="text-2xl font-bold text-charcoal-900">{totalUAVs}</div>
          <div className="text-[11px] text-charcoal-500 mt-1">
            {activeUAVs} airborne nodes
          </div>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-sage-600 text-xs font-mono mb-1">
            <span>Healthy</span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-sage-700">{healthyUAVs}</div>
          <div className="text-[11px] text-sage-600 mt-1">Nominal state</div>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 text-xs font-mono mb-1">
            <span>Degraded</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{degradedUAVs}</div>
          <div className="text-[11px] text-amber-600 mt-1">Self-adapting roles</div>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-critical-600 text-xs font-mono mb-1">
            <span>Critical</span>
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-critical-700">{criticalUAVs}</div>
          <div className="text-[11px] text-critical-600 mt-1">Safe RTL fallback</div>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-mono mb-1">
            <span>Survivors Found</span>
            <Target className="w-4 h-4 text-terracotta-500" />
          </div>
          <div className="text-2xl font-bold text-terracotta-600">
            {victimsFound} <span className="text-xs text-charcoal-400 font-normal">/ {totalVictims}</span>
          </div>
          <div className="text-[11px] text-charcoal-500 mt-1">
            {Math.round((victimsFound / totalVictims) * 100)}% rescued
          </div>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-charcoal-500 text-xs font-mono mb-1">
            <span>Area Coverage</span>
            <Activity className="w-4 h-4 text-charcoal-400" />
          </div>
          <div className="text-2xl font-bold text-charcoal-900">{coveragePct}%</div>
          <div className="w-full bg-cream-200 rounded-full h-1.5 mt-2">
            <div
              className="bg-terracotta-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${coveragePct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Charts & Swarm Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Distribution Chart */}
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-charcoal-900 font-mono uppercase tracking-wider">
              Role Distribution
            </h3>
            <span className="text-xs text-charcoal-500 font-mono">Dynamic Swarm Split</span>
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
                      fill={ROLE_COLORS[entry.name] || '#C85A32'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderColor: '#E8DFD0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 text-xs">
            {roleChartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-charcoal-700">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ROLE_COLORS[item.name] || '#C85A32' }}
                  />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono font-semibold">{item.value} UAV</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Battery Levels */}
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-charcoal-900 font-mono uppercase tracking-wider">
              Battery Reserves
            </h3>
            <span className="text-xs text-charcoal-500 font-mono">SoC %</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={batteryChartData}>
                <XAxis dataKey="id" stroke="#78716C" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#78716C" fontSize={11} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Battery']}
                  contentStyle={{
                    backgroundColor: '#FAF7F2',
                    borderColor: '#E8DFD0',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="battery" radius={[4, 4, 0, 0]}>
                  {batteryChartData.map((entry, index) => {
                    const color =
                      entry.battery < 20 ? '#C53030' : entry.battery < 45 ? '#D97706' : '#3D7A5A';
                    return <Cell key={`bar-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-charcoal-500 pt-3 border-t border-cream-200">
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-sage-500 mr-1.5" /> &gt; 45% Nominal
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" /> 20-45% Low
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-critical-500 mr-1.5" /> &lt; 20% RTL
            </span>
          </div>
        </div>

        {/* Live Swarm Coordination Events */}
        <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-charcoal-900 font-mono uppercase tracking-wider">
                Recent Swarm Events
              </h3>
              <Radio className="w-4 h-4 text-sage-600 animate-pulse" />
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="text-xs text-charcoal-400 py-6 text-center italic">
                  Awaiting simulation activity...
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
                      className="p-2.5 rounded-lg border border-cream-200 bg-cream-50 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold font-mono ${
                            isFault
                              ? 'text-critical-600'
                              : isRoleChange
                              ? 'text-amber-600'
                              : isVictim
                              ? 'text-sage-600'
                              : 'text-terracotta-600'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-charcoal-400 font-mono">
                          {evt.timestamp ? `${evt.timestamp}s` : 'Live'}
                        </span>
                      </div>
                      <p className="text-charcoal-600 line-clamp-2">
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
            className="mt-3 text-xs text-terracotta-600 font-medium hover:text-terracotta-700 flex items-center justify-end"
          >
            <span>View P2P Coordination Timeline</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};
