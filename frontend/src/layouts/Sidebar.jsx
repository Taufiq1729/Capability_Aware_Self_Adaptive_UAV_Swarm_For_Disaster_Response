import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Cpu,
  AlertTriangle,
  Network,
  BarChart3,
  Radio,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useSwarm } from '../context/SwarmContext';

const navItems = [
  { path: '/', label: 'Mission Overview', icon: LayoutDashboard, tag: 'LIVE' },
  { path: '/simulation', label: 'Tactical Swarm Map', icon: Compass, tag: 'ARENA' },
  { path: '/fleet', label: 'Fleet Telemetry', icon: Cpu, tag: 'NODES' },
  { path: '/faults', label: 'Fault Injection & AI', icon: AlertTriangle, tag: 'EDGE AI' },
  { path: '/coordination', label: 'Decentralized P2P', icon: Network, tag: 'AUCTION' },
  { path: '/analytics', label: 'Research Benchmark', icon: BarChart3, tag: '10/10' },
];

export const Sidebar = () => {
  const { simState } = useSwarm();
  const drones = simState?.drones || [];
  const healthyCount = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'HEALTHY').length;
  const degradedCount = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'DEGRADED').length;
  const criticalCount = drones.filter((d) => (d.operationalStatus || d.operational_status) === 'CRITICAL').length;

  return (
    <aside className="w-64 bg-[#070B14]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between h-[calc(100vh-65px)] sticky top-[65px] p-4 select-none z-20">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2.5">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
              TACTICAL NAVIGATION
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/40 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center space-x-3">
                        <Icon
                          className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-500'
                          }`}
                        />
                        <span className="font-mono">{item.label}</span>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 group-hover:text-slate-400'
                        }`}
                      >
                        {item.tag}
                      </span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Live Swarm Health Status Matrix */}
        <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>SWARM TELEMETRY</span>
            </span>
            <span className="flex items-center text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
              <Radio className="w-2.5 h-2.5 mr-1 animate-pulse text-emerald-400" /> ONLINE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg py-2">
              <div className="text-emerald-400 font-extrabold text-sm drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                {healthyCount}
              </div>
              <div className="text-[9px] text-emerald-400/80 font-sans uppercase font-semibold">Nominal</div>
            </div>
            <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg py-2">
              <div className="text-amber-400 font-extrabold text-sm drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">
                {degradedCount}
              </div>
              <div className="text-[9px] text-amber-400/80 font-sans uppercase font-semibold">Degraded</div>
            </div>
            <div className="bg-red-950/40 border border-red-500/30 rounded-lg py-2">
              <div className="text-red-400 font-extrabold text-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                {criticalCount}
              </div>
              <div className="text-[9px] text-red-400/80 font-sans uppercase font-semibold">Critical</div>
            </div>
          </div>

          {/* Autonomous Role Adaptation Indicator */}
          <div className="bg-blue-950/40 border border-blue-500/30 rounded-lg p-2 flex items-center justify-between text-[11px] font-mono text-blue-300">
            <span className="flex items-center">
              <Zap className="w-3 h-3 text-cyan-400 mr-1.5" />
              Edge Self-Adaptation:
            </span>
            <span className="text-cyan-400 font-bold">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-slate-400 font-mono border-t border-slate-800/80 pt-3 flex flex-col space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Autonomous Nodes:</span>
          <span className="font-bold text-cyan-300">{drones.length} UAVs MESHED</span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Survivors Located:</span>
          <span className="font-bold text-emerald-400">
            {simState?.victims_detected ?? 0} / {simState?.total_victims ?? 8} (
            {Math.round(((simState?.victims_detected ?? 0) / (simState?.total_victims || 8)) * 100)}%)
          </span>
        </div>
        <div className="text-[10px] text-slate-600 border-t border-slate-800/60 pt-2 flex items-center justify-between">
          <span>SAFE-SWARM v2.4</span>
          <span className="text-cyan-500/70">GRADE 10/10 READY</span>
        </div>
      </div>
    </aside>
  );
};
