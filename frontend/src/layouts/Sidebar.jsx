import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Cpu,
  AlertTriangle,
  Network,
  BarChart3,
  Flame,
  Radio
} from 'lucide-react';
import { useSwarm } from '../context/SwarmContext';

const navItems = [
  { path: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { path: '/simulation', label: 'Live Swarm Simulation', icon: Compass },
  { path: '/fleet', label: 'Fleet Management', icon: Cpu },
  { path: '/faults', label: 'Fault Injection & AI', icon: AlertTriangle },
  { path: '/coordination', label: 'Decentralized P2P', icon: Network },
  { path: '/analytics', label: 'Research Evaluation', icon: BarChart3 },
];

export const Sidebar = () => {
  const { simState } = useSwarm();
  const drones = simState?.drones || [];
  const healthyCount = drones.filter((d) => d.operationalStatus === 'HEALTHY').length;
  const degradedCount = drones.filter((d) => d.operationalStatus === 'DEGRADED').length;
  const criticalCount = drones.filter((d) => d.operationalStatus === 'CRITICAL').length;

  return (
    <aside className="w-64 bg-cream-50 border-r border-cream-300 flex flex-col justify-between h-[calc(100vh-61px)] sticky top-[61px] p-4 select-none">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider px-3 mb-2 font-mono">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200 shadow-xs'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Live Swarm Health Quick Badge */}
        <div className="bg-white rounded-xl p-3.5 border border-cream-300 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-charcoal-700 font-mono">
            <span>Swarm Health Status</span>
            <span className="flex items-center text-[10px] text-sage-600 font-sans">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> Live
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="bg-sage-50 border border-sage-200 rounded-md py-1.5">
              <div className="text-sage-700 font-bold">{healthyCount}</div>
              <div className="text-[10px] text-sage-600 font-sans">Healthy</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md py-1.5">
              <div className="text-amber-700 font-bold">{degradedCount}</div>
              <div className="text-[10px] text-amber-600 font-sans">Degraded</div>
            </div>
            <div className="bg-critical-50 border border-critical-200 rounded-md py-1.5">
              <div className="text-critical-700 font-bold">{criticalCount}</div>
              <div className="text-[10px] text-critical-600 font-sans">Critical</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-charcoal-500 font-mono border-t border-cream-300 pt-3 flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <span>Active Nodes:</span>
          <span className="font-semibold text-charcoal-800">{drones.length} UAVs</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Victims Found:</span>
          <span className="font-semibold text-terracotta-600">
            {simState?.victims_detected ?? 0} / {simState?.total_victims ?? 8}
          </span>
        </div>
      </div>
    </aside>
  );
};
