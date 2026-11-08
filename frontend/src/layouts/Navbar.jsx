import React from 'react';
import { useSwarm } from '../context/SwarmContext';
import { Play, Pause, RotateCcw, FastForward, Wifi, ShieldCheck, Activity } from 'lucide-react';

export const Navbar = () => {
  const {
    simState,
    isRunning,
    simSpeed,
    connectionStatus,
    handleStart,
    handlePause,
    handleReset,
    handleSpeedChange
  } = useSwarm();

  return (
    <header className="bg-cream-50 border-b border-cream-300 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-terracotta-500 flex items-center justify-center text-white font-bold shadow-sm">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-charcoal-900 leading-tight">
            Confidence-Aware Edge Swarm
          </h1>
          <p className="text-xs text-charcoal-500 font-mono">
            Self-Adaptive Disaster Response UAV Platform
          </p>
        </div>
        <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-terracotta-100 text-terracotta-700 ml-2 border border-terracotta-200">
          Research Prototype v1.0
        </span>
      </div>

      <div className="flex items-center space-x-4">
        {/* Simulation Controls */}
        <div className="flex items-center bg-cream-200 rounded-lg p-1 border border-cream-300">
          {isRunning ? (
            <button
              onClick={handlePause}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-amber-500 text-white shadow-sm hover:bg-amber-600 transition"
              title="Pause Simulation"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-sage-600 text-white shadow-sm hover:bg-sage-700 transition"
              title="Start / Resume Simulation"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run</span>
            </button>
          )}

          <button
            onClick={() => handleReset()}
            className="p-1.5 ml-1 text-charcoal-600 hover:text-charcoal-900 hover:bg-cream-300 rounded transition"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center ml-2 border-l border-cream-300 pl-2 space-x-1">
            <span className="text-[11px] text-charcoal-500 font-mono">Spd:</span>
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => handleSpeedChange(spd)}
                className={`px-1.5 py-0.5 text-xs rounded font-mono ${
                  simSpeed === spd
                    ? 'bg-terracotta-500 text-white font-semibold'
                    : 'text-charcoal-600 hover:bg-cream-300'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="hidden lg:flex items-center space-x-3 text-xs font-mono">
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-cream-300">
            <span className="text-charcoal-500">Coverage:</span>
            <span className="font-semibold text-terracotta-600">
              {simState?.coverage_percent ?? 0}%
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded-md border border-cream-300">
            <span className="text-charcoal-500">Sim T:</span>
            <span className="font-semibold text-charcoal-800">
              {simState?.sim_time ?? 0}s
            </span>
          </div>
        </div>

        {/* Network status */}
        <div className="flex items-center space-x-1.5 pl-2 border-l border-cream-300">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-sage-500 animate-pulse' : 'bg-critical-500'
            }`}
          />
          <span className="text-xs text-charcoal-600 font-mono hidden sm:inline capitalize">
            {connectionStatus}
          </span>
        </div>
      </div>
    </header>
  );
};
