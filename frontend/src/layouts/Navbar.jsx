import React from 'react';
import { Activity } from 'lucide-react';

export const Navbar = () => {
  return (
    <header className="bg-[#0B111E]/90 backdrop-blur-md border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-2xl">
      {/* Brand & Project Identity */}
      <div className="flex items-center space-x-3.5">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white font-black shadow-cyan-glow">
            <Activity className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0B111E] animate-ping" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#0B111E]" />
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-bold text-white tracking-wide font-display">
              SAFE-SWARM
            </h1>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight">
            Confidence-Aware Self-Adaptive UAV Swarm • Disaster Response Command Center
          </p>
        </div>
      </div>
    </header>
  );
};
