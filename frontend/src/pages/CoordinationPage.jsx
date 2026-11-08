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
  Play
} from 'lucide-react';

export const CoordinationPage = () => {
  const { simState, handleInjectFault, isRunning } = useSwarm();

  const topology = simState?.topology || {};
  const tasks = simState?.tasks || [];
  const events = simState?.recent_events || [];
  const nodes = topology.nodes || [];
  const edges = topology.edges || [];
  const components = topology.connected_components || [];
  const isPartitioned = topology.is_partitioned || false;

  const [simulatingWalkthrough, setSimulatingWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  // Trigger practical academic research walkthrough sequence from Section 3, Page 5 of user prompt
  const runPracticalExampleWalkthrough = async () => {
    setSimulatingWalkthrough(true);
    setWalkthroughStep(1); // 1. Drone A experiences RGB camera failure

    try {
      await handleInjectFault({
        droneId: 'UAV-Alpha',
        component: 'rgb_camera',
        faultType: 'hardware_failure',
        severity: 1.0,
        gradual: false
      });

      setTimeout(() => {
        setWalkthroughStep(2); // 2. UAV-Alpha detects fault & shares updated capability
      }, 1500);

      setTimeout(() => {
        setWalkthroughStep(3); // 3. UAV-Beta / UAV-Epsilon evaluate bids & accept search task
      }, 3000);

      setTimeout(() => {
        setWalkthroughStep(4); // 4. UAV-Alpha switches role to Communication Relay / Mapping
      }, 4500);

      setTimeout(() => {
        setSimulatingWalkthrough(false);
        setWalkthroughStep(0);
      }, 7000);
    } catch (err) {
      setSimulatingWalkthrough(false);
      setWalkthroughStep(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-charcoal-900 leading-tight">
            Decentralized Coordination & Distributed Bidding
          </h2>
          <p className="text-sm text-charcoal-600">
            Ad-hoc peer-to-peer wireless mesh topology, distributed auction task reassignment, and consensus tracking.
          </p>
        </div>

        <button
          onClick={runPracticalExampleWalkthrough}
          disabled={simulatingWalkthrough}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-semibold shadow-sm hover:bg-terracotta-600 disabled:opacity-50 transition"
        >
          <Play className="w-4 h-4" />
          <span>Run Research Walkthrough</span>
        </button>
      </div>

      {/* Practical Walkthrough Step Banner (if active) */}
      {simulatingWalkthrough && (
        <div className="bg-terracotta-50 border border-terracotta-300 rounded-2xl p-4 shadow-sm animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-terracotta-800 uppercase tracking-wider">
              Live Walkthrough Scenario (Section 3, Page 5)
            </span>
            <span className="text-xs font-mono text-terracotta-600 font-semibold">
              Step {walkthroughStep} / 4
            </span>
          </div>

          <div className="text-xs text-charcoal-800 font-mono">
            {walkthroughStep === 1 && (
              <span>[Phase 1] UAV-Alpha experiences sudden RGB camera failure during search mission.</span>
            )}
            {walkthroughStep === 2 && (
              <span>[Phase 2] UAV-Alpha edge AI isolates camera fault and broadcasts task-reassignment request.</span>
            )}
            {walkthroughStep === 3 && (
              <span>[Phase 3] Connected peers evaluate capability utility and submit auction bids.</span>
            )}
            {walkthroughStep === 4 && (
              <span>[Phase 4] Winning peer takes search ownership; UAV-Alpha adapts to Relay / Safe state.</span>
            )}
          </div>
        </div>
      )}

      {/* Topology Overview & Network Partition Indicator */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <span className="text-charcoal-500 text-xs font-mono block mb-1">Mesh Nodes</span>
          <span className="text-2xl font-bold text-charcoal-900 font-mono">{nodes.length}</span>
          <span className="text-[11px] text-charcoal-500 block mt-1">Autonomous UAV peers</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <span className="text-charcoal-500 text-xs font-mono block mb-1">Active P2P Links</span>
          <span className="text-2xl font-bold text-sage-700 font-mono">{edges.length}</span>
          <span className="text-[11px] text-sage-600 block mt-1">1-hop wireless links</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <span className="text-charcoal-500 text-xs font-mono block mb-1">Network Subnets</span>
          <span className="text-2xl font-bold text-charcoal-900 font-mono">
            {components.length}
          </span>
          <span className="text-[11px] text-charcoal-500 block mt-1">Connected components</span>
        </div>

        <div className="bg-white border border-cream-300 rounded-xl p-4 shadow-2xs">
          <span className="text-charcoal-500 text-xs font-mono block mb-1">Partition State</span>
          <span
            className={`text-sm font-bold font-mono px-2 py-1 rounded inline-block mt-1 ${
              isPartitioned
                ? 'bg-critical-100 text-critical-700'
                : 'bg-sage-100 text-sage-700'
            }`}
          >
            {isPartitioned ? 'PARTITIONED MESH' : 'FULLY CONNECTED'}
          </span>
          <span className="text-[11px] text-charcoal-500 block mt-1">
            {isPartitioned ? 'Isolated clusters detected' : 'Global gossip reachable'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task Assignment Board & Distributed Auction Bids */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <Gavel className="w-4 h-4 mr-2 text-terracotta-500" />
                Decentralized Task Registry & Ownership
              </h3>
              <span className="text-xs font-mono text-charcoal-500">
                {tasks.length} Active Tasks
              </span>
            </div>

            <div className="space-y-3">
              {tasks.map((tsk) => (
                <div
                  key={tsk.taskId}
                  className="p-3.5 rounded-xl border border-cream-200 bg-cream-50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-charcoal-900">
                        {tsk.taskId}
                      </span>
                      <span className="text-xs text-charcoal-700 font-medium">{tsk.title}</span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        tsk.taskStatus === 'IN_PROGRESS'
                          ? 'bg-sage-100 text-sage-700 border border-sage-200'
                          : tsk.taskStatus === 'BIDDING'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-cream-200 text-charcoal-600'
                      }`}
                    >
                      {tsk.taskStatus}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-charcoal-600 pt-1">
                    <span>
                      Type: <strong className="text-charcoal-800">{tsk.taskType}</strong>
                    </span>
                    <span>
                      Location: X {Math.round(tsk.location?.x ?? 0)}, Y{' '}
                      {Math.round(tsk.location?.y ?? 0)}
                    </span>
                    <span>
                      Owner:{' '}
                      <strong className="text-terracotta-600">
                        {tsk.assignedDrone || 'Auctioning / None'}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Negotiation Event Timeline */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-cream-300 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200">
              <h3 className="text-sm font-bold font-mono text-charcoal-900 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-charcoal-600" />
                Coordination Negotiation Timeline
              </h3>
              <span className="text-xs font-mono text-charcoal-500">Live P2P Gossip</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-xs text-charcoal-400 py-8 text-center italic">
                  No coordination events yet. Run simulation or trigger walkthrough.
                </div>
              ) : (
                events.map((evt, idx) => {
                  const isReassign = evt.eventType === 'TASK_REASSIGNED';
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
                          {evt.timestamp ? `${evt.timestamp}s` : 'Now'}
                        </span>
                      </div>

                      <p className="text-charcoal-600 font-sans text-xs">
                        {isRole &&
                          `${evt.droneId} adapted role to '${evt.newRole}'. Reason: ${evt.reason}`}
                        {isReassign &&
                          `Task ${evt.taskId} transferred to ${evt.awardedTo || evt.winner}`}
                        {isBid &&
                          `Peer ${evt.droneId} submitted auction bid score of ${evt.bidScore}`}
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
