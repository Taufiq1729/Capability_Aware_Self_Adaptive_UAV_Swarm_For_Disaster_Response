import React, { useState } from 'react';
import { useSwarm } from '../context/SwarmContext';
import {
  Network,
  Radio,
  ArrowRight,
  Gavel,
  CheckCircle2,
  Clock,
  Send,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  Cpu,
  Layers,
  ArrowRightLeft,
  Activity,
  Check
} from 'lucide-react';

export const CoordinationPage = () => {
  const { simState, handleInjectFault, handleClearFault, isRunning } = useSwarm();

  const topology = simState?.topology || {};
  const tasks = simState?.tasks || [];
  const events = simState?.recent_events || [];
  const drones = simState?.drones || [];
  const detailedStates = simState?.detailed_drone_states || {};
  const nodes = topology.nodes || [];
  const edges = topology.edges || [];
  const components = topology.connected_components || [];
  const isPartitioned = topology.is_partitioned || false;

  const [simulatingWalkthrough, setSimulatingWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [taskFilter, setTaskFilter] = useState('ALL'); // 'ALL' | 'HANDOVER' | 'IN_PROGRESS'

  // Map drones to quick lookup dictionary
  const droneMap = {};
  drones.forEach((d) => {
    droneMap[d.drone_id] = d;
  });

  // Calculate task counts
  const handedOverTasks = tasks.filter((t) => t.acquiredFrom || t.previousDrone);
  const inProgressTasks = tasks.filter((t) => t.taskStatus === 'IN_PROGRESS');
  const biddingTasks = tasks.filter((t) => t.taskStatus === 'BIDDING');

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'HANDOVER') return t.acquiredFrom || t.previousDrone;
    if (taskFilter === 'BIDDING') return t.taskStatus === 'BIDDING';
    return true;
  });

  // Run full 7-stage autonomous reallocation walkthrough
  const runAutonomousReallocationWalkthrough = async () => {
    setSimulatingWalkthrough(true);
    setWalkthroughStep(1); // 1. Camera failure on UAV-Alpha

    try {
      await handleInjectFault({
        droneId: 'UAV-Alpha',
        component: 'rgb_camera',
        faultType: 'hardware_failure',
        severity: 1.0,
        gradual: false
      });

      setTimeout(() => {
        setWalkthroughStep(2); // 2. Stage 2 anomaly -> Stage 3 deep assessment
      }, 1400);

      setTimeout(() => {
        setWalkthroughStep(3); // 3. Stage 4 capabilities -> Stage 5 role adaptation
      }, 2800);

      setTimeout(() => {
        setWalkthroughStep(4); // 4. Stage 6 P2P gossip & Stage 7 auction bidding
      }, 4200);

      setTimeout(() => {
        setWalkthroughStep(5); // 5. Task acquired by UAV-Beta, UAV-Alpha assigned relay task
      }, 5800);

      setTimeout(() => {
        setSimulatingWalkthrough(false);
        setWalkthroughStep(0);
      }, 9500);
    } catch (err) {
      setSimulatingWalkthrough(false);
      setWalkthroughStep(0);
    }
  };

  const handleResetFaults = async () => {
    try {
      for (const d of drones) {
        await handleClearFault(d.drone_id);
      }
    } catch (e) {
      console.warn('Error clearing faults:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-terracotta-600 bg-terracotta-50 px-2.5 py-0.5 rounded border border-terracotta-200">
              Stages 06 & 07: Distributed Swarm Coordination
            </span>
          </div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">
            Autonomous Task Reallocation & Handover Lineage
          </h2>
          <p className="text-sm text-charcoal-600">
            Every drone diagnoses itself, bids based on health status & diagnostic confidence, and autonomously swaps or acquires tasks without predefined rules.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={runAutonomousReallocationWalkthrough}
            disabled={simulatingWalkthrough}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-semibold shadow-sm hover:bg-terracotta-600 disabled:opacity-50 transition"
          >
            <Play className="w-4 h-4" />
            <span>Simulate Camera Failure & Autonomous Handover</span>
          </button>

          <button
            onClick={handleResetFaults}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-cream-100 text-charcoal-700 text-xs font-medium border border-cream-300 hover:bg-cream-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Swarm</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Architectural Pipeline Reference Strip */}
      <div className="bg-cream-50 border border-cream-300 rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-charcoal-800 uppercase tracking-wider flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-terracotta-500" />
            End-to-End System Pipeline Flow (Edge Intelligence ➔ P2P Consensus)
          </span>
          <span className="text-[11px] font-mono text-charcoal-500">Autonomous Edge Execution</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-white border border-cream-200">
            <span className="text-[10px] text-terracotta-600 font-bold block">01. TELEMETRY</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">Multi-channel</span>
            <span className="text-[9px] text-charcoal-400 block">Motor, Bat, Cam, GPS</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200">
            <span className="text-[10px] text-terracotta-600 font-bold block">02. LIGHT MONITOR</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">Z-Score Anomaly</span>
            <span className="text-[9px] text-charcoal-400 block">Low compute edge</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200 border-l-2 border-l-amber-500">
            <span className="text-[10px] text-amber-700 font-bold block">03. DEEP ASSESS</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">Fault & Conf</span>
            <span className="text-[9px] text-charcoal-400 block">Smoke vs HW fault</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200">
            <span className="text-[10px] text-terracotta-600 font-bold block">04. CAPABILITY</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">8D Cap Vector</span>
            <span className="text-[9px] text-charcoal-400 block">Decoupled confidence</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200">
            <span className="text-[10px] text-terracotta-600 font-bold block">05. ROLE SELECT</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">Hard Gating</span>
            <span className="text-[9px] text-charcoal-400 block">Autonomous Utility</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200">
            <span className="text-[10px] text-sage-600 font-bold block">06. P2P SHARING</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">NetworkX Mesh</span>
            <span className="text-[9px] text-charcoal-400 block">Zero central broker</span>
          </div>
          <div className="p-2 rounded-lg bg-white border border-cream-200 border-l-2 border-l-sage-600">
            <span className="text-[10px] text-sage-700 font-bold block">07. TASK AUCTION</span>
            <span className="text-charcoal-800 font-semibold text-[11px]">Confidence Bids</span>
            <span className="text-[9px] text-charcoal-400 block">Autonomous swap</span>
          </div>
        </div>
      </div>

      {/* Practical Walkthrough Step Banner (if active) */}
      {simulatingWalkthrough && (
        <div className="bg-terracotta-50 border border-terracotta-300 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-terracotta-800 uppercase tracking-wider flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-terracotta-600 animate-spin" />
              Live Scenario: Autonomous Camera Failure & Work Reallocation
            </span>
            <span className="text-xs font-mono text-terracotta-700 font-bold px-2 py-0.5 rounded bg-terracotta-100">
              Stage {walkthroughStep} of 5
            </span>
          </div>

          <div className="text-xs text-charcoal-800 font-mono space-y-1">
            {walkthroughStep === 1 && (
              <p>
                <strong>[01-02. Telemetry & Anomaly]</strong> Injected complete RGB camera sensor breakdown on UAV-Alpha (0 FPS). Edge anomaly detector flags camera channel deviation.
              </p>
            )}
            {walkthroughStep === 2 && (
              <p>
                <strong>[03. Deep Fault Assessment]</strong> UAV-Alpha executes deep diagnostic assessment: isolates <em>Optical Hardware Failure</em> with <strong>94% Diagnostic Confidence</strong>.
              </p>
            )}
            {walkthroughStep === 3 && (
              <p>
                <strong>[04-05. Capabilities & Role Selection]</strong> c_RGB drops to 0.00. Search and exploration role is barred by hard non-compensable constraints. UAV-Alpha autonomously transitions to <strong>Communication Relay</strong> based on surviving RF & mobility.
              </p>
            )}
            {walkthroughStep === 4 && (
              <p>
                <strong>[06-07. P2P Sharing & Bidding]</strong> UAV-Alpha surrenders Task TSK-101. Connected peers evaluate health status, diagnostic confidence, and capabilities to compute auction bids.
              </p>
            )}
            {walkthroughStep === 5 && (
              <p>
                <strong>[Mission Continuity]</strong> Healthy peer (e.g. UAV-Beta) <strong>acquires TSK-101</strong> from UAV-Alpha! UAV-Alpha is <strong>autonomously assigned a new Relay task</strong> to support the swarm backbone.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Topology & Mesh KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white border border-cream-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-charcoal-500 text-[11px] font-mono block mb-0.5">Active Mesh Nodes</span>
          <span className="text-xl font-bold text-charcoal-900 font-mono">{nodes.length} UAVs</span>
          <span className="text-[10px] text-charcoal-400 block mt-0.5">Autonomous peers</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-charcoal-500 text-[11px] font-mono block mb-0.5">1-Hop P2P Links</span>
          <span className="text-xl font-bold text-sage-700 font-mono">{edges.length} Links</span>
          <span className="text-[10px] text-sage-600 block mt-0.5">Ad-hoc wireless mesh</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-charcoal-500 text-[11px] font-mono block mb-0.5">Total Tasks</span>
          <span className="text-xl font-bold text-charcoal-900 font-mono">{tasks.length}</span>
          <span className="text-[10px] text-charcoal-500 block mt-0.5">{inProgressTasks.length} in progress</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-terracotta-600 text-[11px] font-mono font-semibold block mb-0.5">
            Handed Over Tasks
          </span>
          <span className="text-xl font-bold text-terracotta-700 font-mono">
            {handedOverTasks.length}
          </span>
          <span className="text-[10px] text-terracotta-600 block mt-0.5">Acquired from prior drone</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-charcoal-500 text-[11px] font-mono block mb-0.5">Mesh Status</span>
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-0.5 ${
              isPartitioned ? 'bg-critical-100 text-critical-700' : 'bg-sage-100 text-sage-700'
            }`}
          >
            {isPartitioned ? 'PARTITIONED' : 'FULLY CONNECTED'}
          </span>
          <span className="text-[10px] text-charcoal-400 block mt-0.5">
            {components.length} connected cluster(s)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Decentralized Task Registry & Lineage Cards */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cream-200 gap-2">
              <div>
                <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                  <Gavel className="w-4 h-4 mr-2 text-terracotta-500" />
                  Task Assignment & Handover Registry
                </h3>
                <span className="text-[11px] text-charcoal-500 font-mono">
                  Autonomous ownership assignment based on health status & diagnostic confidence
                </span>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center space-x-1 bg-cream-100 p-1 rounded-lg border border-cream-300 text-xs font-mono">
                <button
                  onClick={() => setTaskFilter('ALL')}
                  className={`px-2 py-1 rounded-md transition ${
                    taskFilter === 'ALL'
                      ? 'bg-white font-bold text-charcoal-900 shadow-2xs'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  All ({tasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('HANDOVER')}
                  className={`px-2 py-1 rounded-md transition ${
                    taskFilter === 'HANDOVER'
                      ? 'bg-white font-bold text-terracotta-600 shadow-2xs'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  Handed Over ({handedOverTasks.length})
                </button>
              </div>
            </div>

            <div className="space-y-3.5">
              {filteredTasks.length === 0 ? (
                <div className="text-xs text-charcoal-400 py-8 text-center italic font-mono">
                  No tasks matching the selected filter.
                </div>
              ) : (
                filteredTasks.map((tsk) => {
                  const assignedDroneObj = tsk.assignedDrone ? droneMap[tsk.assignedDrone] : null;
                  const droneHealth =
                    assignedDroneObj?.operational_status ||
                    assignedDroneObj?.operationalStatus ||
                    tsk.assignedBasedOnHealth?.healthStatus ||
                    'UNKNOWN';
                  const droneConf =
                    assignedDroneObj?.diagnostic_confidence ??
                    tsk.assignedBasedOnHealth?.confidence ??
                    0.98;
                  const wasHandedOver = !!(tsk.acquiredFrom || tsk.previousDrone);

                  return (
                    <div
                      key={tsk.taskId}
                      className={`p-4 rounded-xl border transition space-y-3 ${
                        wasHandedOver
                          ? 'border-terracotta-300 bg-terracotta-50/40 shadow-xs'
                          : 'border-cream-200 bg-cream-50/80 hover:bg-cream-50'
                      }`}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-charcoal-900 bg-white px-2 py-0.5 rounded border border-cream-300">
                              {tsk.taskId}
                            </span>
                            <span className="text-xs font-bold text-charcoal-900 font-mono">
                              {tsk.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] font-mono text-charcoal-500 pt-0.5">
                            <span>Type: <strong className="text-charcoal-700">{tsk.taskType}</strong></span>
                            <span>•</span>
                            <span>Location: X {Math.round(tsk.location?.x ?? 0)}, Y {Math.round(tsk.location?.y ?? 0)}</span>
                            <span>•</span>
                            <span>Priority: <strong className="text-charcoal-700">{tsk.priority ?? 5}</strong></span>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold shrink-0 ${
                            tsk.taskStatus === 'IN_PROGRESS'
                              ? 'bg-sage-100 text-sage-800 border border-sage-200'
                              : tsk.taskStatus === 'BIDDING'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                              : 'bg-cream-200 text-charcoal-700'
                          }`}
                        >
                          {tsk.taskStatus}
                        </span>
                      </div>

                      {/* Current Owner & Health Badge */}
                      <div className="bg-white p-2.5 rounded-lg border border-cream-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-charcoal-500">Assigned Drone:</span>
                          {tsk.assignedDrone ? (
                            <span className="font-bold text-charcoal-900 px-2 py-0.5 rounded bg-cream-100 border border-cream-300">
                              {tsk.assignedDrone}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-bold italic">
                              Auction In Progress / Unassigned
                            </span>
                          )}
                        </div>

                        {tsk.assignedDrone && (
                          <div className="flex items-center space-x-2">
                            <span className="text-charcoal-500">Drone Health:</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                droneHealth === 'HEALTHY'
                                  ? 'bg-sage-100 text-sage-800 border border-sage-200'
                                  : droneHealth === 'DEGRADED'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-critical-100 text-critical-800 border border-critical-200'
                              }`}
                            >
                              {droneHealth}
                            </span>
                            <span className="text-[10px] text-charcoal-600 font-bold bg-cream-100 px-1.5 py-0.5 rounded border border-cream-300">
                              Conf: {Math.round(droneConf * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lineage Box: Which drone acquired the task of the previous drone */}
                      {wasHandedOver ? (
                        <div className="p-2.5 rounded-lg bg-white border border-terracotta-200 text-xs font-mono space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5 text-terracotta-700 font-bold">
                              <ArrowRightLeft className="w-3.5 h-3.5 text-terracotta-600" />
                              <span>Autonomous Task Acquisition Lineage:</span>
                            </div>
                            {tsk.handoverTimestamp !== undefined && (
                              <span className="text-[10px] text-charcoal-400">
                                Handed over at {tsk.handoverTimestamp}s
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2 text-xs">
                            <div className="flex items-center space-x-1">
                              <span className="text-charcoal-400 text-[10px]">Previous Owner:</span>
                              <span className="font-bold text-charcoal-800 line-through">
                                {tsk.acquiredFrom || tsk.previousDrone}
                              </span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-terracotta-500" />
                            <div className="flex items-center space-x-1">
                              <span className="text-charcoal-400 text-[10px]">Acquired by:</span>
                              <span className="font-bold text-sage-700">
                                {tsk.assignedDrone}
                              </span>
                            </div>
                          </div>

                          <p className="text-[11px] text-charcoal-600 font-sans leading-tight pt-0.5">
                            <strong>Reason: </strong>
                            {tsk.handoverReason ||
                              `Transferred autonomously due to primary sensor degradation on ${
                                tsk.acquiredFrom || tsk.previousDrone
                              }.`}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-charcoal-500 font-sans flex items-center justify-between pt-0.5 px-1">
                          <span>
                            <strong>Assignment Basis:</strong>{' '}
                            {tsk.assignedBasedOnHealth?.reason ||
                              'Assigned to healthy drone with intact capability payload.'}
                          </span>
                          <span className="text-sage-600 font-mono text-[10px] flex items-center shrink-0 ml-2">
                            <Check className="w-3 h-3 mr-0.5" /> Initial Healthy Allocation
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Visual Handover Flowboard & Negotiation Timeline */}
        <div className="lg:col-span-5 space-y-5">
          {/* Autonomous Task Handover Lineage Flowboard */}
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-terracotta-500" />
                Live Handover Chain of Custody
              </h3>
              <span className="text-xs font-mono font-bold text-terracotta-600 bg-terracotta-50 px-2 py-0.5 rounded border border-terracotta-200">
                {handedOverTasks.length} Reallocations
              </span>
            </div>

            <div className="space-y-3">
              {handedOverTasks.length === 0 ? (
                <div className="text-xs text-charcoal-500 py-6 text-center italic font-mono bg-cream-50 rounded-xl border border-dashed border-cream-300">
                  No task reallocations yet.
                  <button
                    onClick={runAutonomousReallocationWalkthrough}
                    className="block mx-auto mt-2 text-terracotta-600 font-bold hover:underline"
                  >
                    Click here to simulate camera failure
                  </button>
                </div>
              ) : (
                handedOverTasks.map((t) => (
                  <div
                    key={t.taskId}
                    className="p-3.5 rounded-xl border border-terracotta-200 bg-terracotta-50/50 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-charcoal-900">{t.taskId}</span>
                      <span className="text-[10px] text-terracotta-700 font-bold bg-white px-2 py-0.5 rounded border border-terracotta-200">
                        {t.taskType}
                      </span>
                    </div>

                    {/* Source -> Target Visual Nodes */}
                    <div className="grid grid-cols-5 items-center gap-1 bg-white p-2.5 rounded-lg border border-cream-200 text-center">
                      <div className="col-span-2">
                        <span className="text-[9px] text-charcoal-400 block uppercase">Source Node</span>
                        <span className="font-bold text-charcoal-900 block">{t.acquiredFrom || t.previousDrone}</span>
                        <span className="text-[9px] text-amber-700 font-semibold px-1 rounded bg-amber-50 inline-block">
                          FAULTED
                        </span>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <ArrowRight className="w-4 h-4 text-terracotta-500 animate-pulse" />
                      </div>

                      <div className="col-span-2">
                        <span className="text-[9px] text-charcoal-400 block uppercase">Acquiring Node</span>
                        <span className="font-bold text-sage-800 block">{t.assignedDrone}</span>
                        <span className="text-[9px] text-sage-700 font-semibold px-1 rounded bg-sage-50 inline-block">
                          ACQUIRED
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-charcoal-600 font-sans leading-tight">
                      <strong>Handover Reason:</strong> {t.handoverReason || 'Camera hardware degradation on prior drone.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coordination Negotiation Timeline */}
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-charcoal-600" />
                Autonomous Negotiation Timeline
              </h3>
              <span className="text-xs font-mono text-charcoal-500">Live P2P Gossip</span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-xs text-charcoal-400 py-6 text-center italic font-mono">
                  No negotiation events yet.
                </div>
              ) : (
                events.map((evt, idx) => {
                  const isReassign = evt.eventType === 'TASK_REASSIGNED' || evt.eventType === 'AUTONOMOUS_WORK_REALLOCATION';
                  const isRole = evt.eventType === 'ROLE_CHANGED';
                  const isBid = evt.eventType === 'BID_SUBMITTED';

                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-cream-200 bg-cream-50 text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            isReassign
                              ? 'text-terracotta-600'
                              : isRole
                              ? 'text-amber-600'
                              : isBid
                              ? 'text-sage-600'
                              : 'text-charcoal-700'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-charcoal-400">
                          {evt.timestamp !== undefined ? `${evt.timestamp}s` : 'Now'}
                        </span>
                      </div>

                      <p className="text-charcoal-600 font-sans text-xs leading-snug">
                        {isRole &&
                          `${evt.droneId} autonomously adapted role to '${evt.newRole}'. Reason: ${evt.reason}`}
                        {isReassign &&
                          (evt.message ||
                            `Task ${evt.taskId} acquired by ${evt.awardedTo || evt.winner} from ${
                              evt.previousDrone || evt.initiator
                            } (Winning Score: ${evt.winningScore || 0.89})`)}
                        {isBid &&
                          `Peer ${evt.droneId} submitted bid score of ${evt.bidScore} (Health: ${
                            evt.healthStatus || 'HEALTHY'
                          }, Conf: ${Math.round((evt.diagnosticConfidence || 0.98) * 100)}%)`}
                        {!isRole && !isReassign && !isBid && (evt.message || JSON.stringify(evt))}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
