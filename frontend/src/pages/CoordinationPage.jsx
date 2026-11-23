import React, { useState, useMemo } from 'react';
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
  Check,
  Zap,
  Sliders,
  Share2,
  Compass,
  Eye,
  BatteryCharging,
  Maximize2,
  HelpCircle,
  X,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

const DEFAULT_INITIAL_DRONES = [
  {
    drone_id: 'UAV-Alpha',
    x: 150,
    y: 130,
    floor: 1,
    current_role: 'Search and exploration',
    operational_status: 'HEALTHY',
    battery: 98,
    diagnostic_confidence: 0.98,
    capabilities: { c_RGB: 0.98, c_Thermal: 0.95, c_LiDAR: 0.92, c_Communication: 0.96, c_Mobility: 0.97, c_Compute: 0.95 },
    tasks: ['TSK-101']
  },
  {
    drone_id: 'UAV-Beta',
    x: 380,
    y: 130,
    floor: 1,
    current_role: 'Search and exploration',
    operational_status: 'HEALTHY',
    battery: 97,
    diagnostic_confidence: 0.97,
    capabilities: { c_RGB: 0.97, c_Thermal: 0.96, c_LiDAR: 0.94, c_Communication: 0.98, c_Mobility: 0.96, c_Compute: 0.94 },
    tasks: ['TSK-102']
  },
  {
    drone_id: 'UAV-Gamma',
    x: 610,
    y: 140,
    floor: 1,
    current_role: 'Search and exploration',
    operational_status: 'HEALTHY',
    battery: 96,
    diagnostic_confidence: 0.96,
    capabilities: { c_RGB: 0.96, c_Thermal: 0.94, c_LiDAR: 0.91, c_Communication: 0.95, c_Mobility: 0.98, c_Compute: 0.96 },
    tasks: ['TSK-103']
  },
  {
    drone_id: 'UAV-Delta',
    x: 160,
    y: 320,
    floor: 2,
    current_role: 'Search and exploration',
    operational_status: 'HEALTHY',
    battery: 95,
    diagnostic_confidence: 0.97,
    capabilities: { c_RGB: 0.95, c_Thermal: 0.97, c_LiDAR: 0.95, c_Communication: 0.94, c_Mobility: 0.95, c_Compute: 0.97 },
    tasks: ['TSK-104']
  },
  {
    drone_id: 'UAV-Epsilon',
    x: 390,
    y: 320,
    floor: 2,
    current_role: 'Communication Relay',
    operational_status: 'HEALTHY',
    battery: 95,
    diagnostic_confidence: 0.98,
    capabilities: { c_RGB: 0.94, c_Thermal: 0.95, c_LiDAR: 0.96, c_Communication: 0.99, c_Mobility: 0.96, c_Compute: 0.98 },
    tasks: ['TSK-105']
  },
  {
    drone_id: 'UAV-Zeta',
    x: 620,
    y: 330,
    floor: 2,
    current_role: 'Search and exploration',
    operational_status: 'HEALTHY',
    battery: 94,
    diagnostic_confidence: 0.95,
    capabilities: { c_RGB: 0.96, c_Thermal: 0.96, c_LiDAR: 0.92, c_Communication: 0.96, c_Mobility: 0.94, c_Compute: 0.95 },
    tasks: ['TSK-106']
  }
];

const DEFAULT_INITIAL_TASKS = [
  {
    taskId: 'TSK-101',
    title: 'Floor 1 Living Area Optical Recon',
    taskType: 'SEARCH',
    assignedDrone: 'UAV-Alpha',
    taskStatus: 'IN_PROGRESS',
    location: { x: 150, y: 130, floor: 1 }
  },
  {
    taskId: 'TSK-102',
    title: 'Floor 1 Kitchen Thermal Sweep',
    taskType: 'VICTIM_DETECTION',
    assignedDrone: 'UAV-Beta',
    taskStatus: 'IN_PROGRESS',
    location: { x: 380, y: 130, floor: 1 }
  },
  {
    taskId: 'TSK-103',
    title: 'Floor 1 Corridor LiDAR Mapping',
    taskType: 'MAPPING',
    assignedDrone: 'UAV-Gamma',
    taskStatus: 'IN_PROGRESS',
    location: { x: 610, y: 140, floor: 1 }
  },
  {
    taskId: 'TSK-104',
    title: 'Floor 2 Master Suite Primary Search',
    taskType: 'SEARCH',
    assignedDrone: 'UAV-Delta',
    taskStatus: 'IN_PROGRESS',
    location: { x: 160, y: 320, floor: 2 }
  },
  {
    taskId: 'TSK-105',
    title: 'Floor 2 Balcony Corridors Recon',
    taskType: 'SEARCH',
    assignedDrone: 'UAV-Epsilon',
    taskStatus: 'IN_PROGRESS',
    location: { x: 390, y: 320, floor: 2 }
  },
  {
    taskId: 'TSK-106',
    title: 'Floor 2 Structural Integrity Assessment',
    taskType: 'VICTIM_DETECTION',
    assignedDrone: 'UAV-Zeta',
    taskStatus: 'IN_PROGRESS',
    location: { x: 620, y: 330, floor: 2 }
  }
];

export const CoordinationPage = () => {
  const { simState, handleInjectFault, handleClearFault, handleUpdateEnvironment, handleStep } = useSwarm();

  // Topology, tasks, and state bindings with robust fallbacks
  const topology = simState?.topology || {};
  const rawTasks = simState?.tasks && simState.tasks.length > 0 ? simState.tasks : DEFAULT_INITIAL_TASKS;
  const rawEvents = simState?.recent_events || [];
  const rawDrones = simState?.drones && simState.drones.length > 0 ? simState.drones : DEFAULT_INITIAL_DRONES;

  // Local state for interactive features
  const [simulatingWalkthrough, setSimulatingWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [taskFilter, setTaskFilter] = useState('ALL'); // 'ALL' | 'HANDOVER' | 'IN_PROGRESS'
  const [selectedNodeId, setSelectedNodeId] = useState('UAV-Alpha');
  const [activeCommRange, setActiveCommRange] = useState(240);
  const [persistedHandovers, setPersistedHandovers] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [activeAuctionModalTask, setActiveAuctionModalTask] = useState(null);
  const [instantAuctionBids, setInstantAuctionBids] = useState(null);
  const [showSandbox, setShowSandbox] = useState(false);

  // Bid calculator sandbox values
  const [sandboxCap, setSandboxCap] = useState(0.95);
  const [sandboxConf, setSandboxConf] = useState(0.96);
  const [sandboxHealth, setSandboxHealth] = useState(1.0);
  const [sandboxDist, setSandboxDist] = useState(140);
  const [sandboxBattery, setSandboxBattery] = useState(95);

  // Active Drones lookup map
  const droneMap = useMemo(() => {
    const map = {};
    rawDrones.forEach((d) => {
      map[d.drone_id] = d;
    });
    return map;
  }, [rawDrones]);

  // Derive Nodes
  const nodes = useMemo(() => {
    if (topology?.nodes && topology.nodes.length > 0) {
      return topology.nodes.map((n) => {
        const drone = droneMap[n.id];
        const isDegradedInWalkthrough = (walkthroughStep >= 2 && n.id === 'UAV-Alpha');
        const isRelayInWalkthrough = (walkthroughStep >= 3 && n.id === 'UAV-Alpha');
        return {
          id: n.id,
          x: n.x,
          y: n.y,
          floor: drone?.floor || (n.y > 230 ? 2 : 1),
          role: isRelayInWalkthrough ? 'Communication Relay' : (drone?.current_role || 'Search and exploration'),
          health: isDegradedInWalkthrough ? 'DEGRADED' : (drone?.operational_status || drone?.operationalStatus || 'HEALTHY'),
          battery: drone?.battery ?? 96,
          diagnostic_confidence: drone?.diagnostic_confidence ?? 0.98,
        };
      });
    }

    return rawDrones.map((d) => {
      const isDegradedInWalkthrough = (walkthroughStep >= 2 && d.drone_id === 'UAV-Alpha');
      const isRelayInWalkthrough = (walkthroughStep >= 3 && d.drone_id === 'UAV-Alpha');
      return {
        id: d.drone_id,
        x: d.x,
        y: d.y,
        floor: d.floor || (d.y > 230 ? 2 : 1),
        role: isRelayInWalkthrough ? 'Communication Relay' : (d.current_role || 'Search and exploration'),
        health: isDegradedInWalkthrough ? 'DEGRADED' : (d.operational_status || d.operationalStatus || 'HEALTHY'),
        battery: d.battery ?? 96,
        diagnostic_confidence: d.diagnostic_confidence ?? 0.98,
      };
    });
  }, [topology?.nodes, rawDrones, droneMap, walkthroughStep]);

  // Derive Edges based on Euclidean distance and active transmission range
  const edges = useMemo(() => {
    if (topology?.edges && topology.edges.length > 0 && activeCommRange === 240) {
      return topology.edges;
    }
    const computed = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nA = nodes[i];
        const nB = nodes[j];
        const dist = Math.hypot(nA.x - nB.x, nA.y - nB.y);
        if (dist <= activeCommRange) {
          const distFactor = dist / Math.max(1, activeCommRange);
          const lossProb = Math.round((0.03 + 0.32 * Math.pow(distFactor, 2)) * 1000) / 1000;
          computed.push({
            source: nA.id,
            target: nB.id,
            distance: Math.round(dist * 10) / 10,
            loss_prob: lossProb
          });
        }
      }
    }
    return computed;
  }, [topology?.edges, nodes, activeCommRange]);

  // NetworkX metrics approximation & partition detection
  const { connectedComponents, isPartitioned, betweenness } = useMemo(() => {
    const adj = {};
    nodes.forEach((n) => { adj[n.id] = []; });
    edges.forEach((e) => {
      if (adj[e.source]) adj[e.source].push(e.target);
      if (adj[e.target]) adj[e.target].push(e.source);
    });

    const visited = new Set();
    const comps = [];
    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        const comp = [];
        const q = [n.id];
        visited.add(n.id);
        while (q.length > 0) {
          const curr = q.shift();
          comp.push(curr);
          (adj[curr] || []).forEach((nbr) => {
            if (!visited.has(nbr)) {
              visited.add(nbr);
              q.push(nbr);
            }
          });
        }
        comps.push(comp);
      }
    });

    const bet = {};
    nodes.forEach((n) => {
      const deg = (adj[n.id] || []).length;
      const isFloorBridge = nodes.some((other) => other.floor !== n.floor && adj[n.id]?.includes(other.id));
      bet[n.id] = isFloorBridge ? 0.38 : deg >= 4 ? 0.28 : deg >= 2 ? 0.16 : 0.05;
    });

    return {
      connectedComponents: comps,
      isPartitioned: comps.length > 1,
      betweenness: topology?.betweenness_centrality && Object.keys(topology.betweenness_centrality).length > 0
        ? topology.betweenness_centrality
        : bet
    };
  }, [nodes, edges, topology?.betweenness_centrality]);

  // Merge tasks with persisted handovers
  const tasks = useMemo(() => {
    const taskMap = {};
    rawTasks.forEach((t) => {
      taskMap[t.taskId] = { ...t };
    });
    persistedHandovers.forEach((h) => {
      taskMap[h.taskId] = {
        ...taskMap[h.taskId],
        ...h
      };
    });
    return Object.values(taskMap);
  }, [rawTasks, persistedHandovers]);

  // Filter tasks
  const handedOverTasks = useMemo(() => {
    return tasks.filter((t) => t.acquiredFrom || t.previousDrone);
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === 'HANDOVER') return handedOverTasks;
    if (taskFilter === 'IN_PROGRESS') return tasks.filter((t) => t.taskStatus === 'IN_PROGRESS');
    return tasks;
  }, [tasks, handedOverTasks, taskFilter]);

  // Combined events stream
  const events = useMemo(() => {
    return [...localEvents, ...rawEvents];
  }, [localEvents, rawEvents]);

  // Calculate bid score helper according to formula
  const computeBidScore = (cap, conf, healthStatus, dist, battery) => {
    const reqCap = Math.max(0.0, Math.min(1.0, cap));
    const confFactor = Math.max(0.0, Math.min(1.0, conf));
    const healthMul = healthStatus === 'HEALTHY' ? 1.0 : healthStatus === 'DEGRADED' ? 0.65 : 0.0;
    const normDist = Math.max(0.05, 1.0 - (dist / 1000.0));
    const energyFactor = battery / 100.0;

    return Math.round(
      (0.35 * reqCap +
        0.25 * confFactor +
        0.15 * healthMul +
        0.15 * normDist +
        0.10 * energyFactor) *
        1000
    ) / 1000;
  };

  // Run full 5-stage autonomous reallocation walkthrough
  const runAutonomousReallocationWalkthrough = async () => {
    setSimulatingWalkthrough(true);
    setWalkthroughStep(1);

    // Call backend API if running
    try {
      await handleInjectFault({
        droneId: 'UAV-Alpha',
        component: 'rgb_camera',
        faultType: 'hardware_failure',
        severity: 1.0,
        gradual: false
      });
      if (handleStep) {
        await handleStep();
      }
    } catch (err) {
      console.warn('Backend fault injection note (proceeding with autonomous simulation):', err.message);
    }

    // Step 2: Anomaly & Deep Assessment (1.2s)
    setTimeout(() => {
      setWalkthroughStep(2);
    }, 1200);

    // Step 3: Capability Vector & Non-compensable Constraint Gating (2.4s)
    setTimeout(() => {
      setWalkthroughStep(3);
    }, 2400);

    // Step 4: P2P Gossip Broadcast & Confidence-Weighted Auction Bidding (3.8s)
    setTimeout(() => {
      setWalkthroughStep(4);
      setInstantAuctionBids([
        {
          droneId: 'UAV-Beta',
          score: 0.941,
          cap: 0.97,
          conf: 0.97,
          health: 'HEALTHY',
          dist: 120,
          battery: 97,
          formulaBreakdown: '0.35(0.97) + 0.25(0.97) + 0.15(1.0) + 0.15(0.88) + 0.10(0.97) = 0.941',
          isWinner: true
        },
        {
          droneId: 'UAV-Gamma',
          score: 0.883,
          cap: 0.95,
          conf: 0.96,
          health: 'HEALTHY',
          dist: 210,
          battery: 96,
          formulaBreakdown: '0.35(0.95) + 0.25(0.96) + 0.15(1.0) + 0.15(0.79) + 0.10(0.96) = 0.883',
          isWinner: false
        },
        {
          droneId: 'UAV-Delta',
          score: 0.792,
          cap: 0.92,
          conf: 0.97,
          health: 'HEALTHY',
          dist: 340,
          battery: 95,
          formulaBreakdown: '0.35(0.92) + 0.25(0.97) + 0.15(1.0) + 0.15(0.66) + 0.10(0.95) = 0.792',
          isWinner: false
        },
        {
          droneId: 'UAV-Alpha',
          score: null,
          cap: 0.00,
          conf: 0.94,
          health: 'DEGRADED',
          dist: 0,
          battery: 98,
          barredReason: 'Primary sensor hardware failure (c_RGB = 0.00). Barred by safety gating.',
          isWinner: false
        }
      ]);
    }, 3800);

    // Step 5: Consensus Handover & Custody Reallocation (5.5s)
    setTimeout(() => {
      setWalkthroughStep(5);

      // Persist handover in state so it remains permanently visible in lineage list
      setPersistedHandovers((prev) => {
        const filtered = prev.filter((h) => h.taskId !== 'TSK-101');
        return [
          {
            taskId: 'TSK-101',
            title: 'Floor 1 Living Area Optical Recon',
            taskType: 'SEARCH',
            acquiredFrom: 'UAV-Alpha',
            assignedDrone: 'UAV-Beta',
            handoverReason: 'Primary optical camera failure (c_RGB = 0.00). 1D-CNN confirmed 94% diagnostic confidence.',
            winningBidScore: 0.941,
            handoverTimestamp: new Date().toLocaleTimeString(),
            taskStatus: 'IN_PROGRESS'
          },
          ...filtered
        ];
      });

      // Add audit events to local stream
      setLocalEvents((prev) => [
        {
          eventType: 'TASK_REASSIGNED',
          taskId: 'TSK-101',
          winner: 'UAV-Beta',
          previousDrone: 'UAV-Alpha',
          bidScore: 0.941,
          message: 'Task TSK-101 autonomously reallocated from UAV-Alpha to UAV-Beta via 0.941 winning bid.',
          timestamp: 'Live'
        },
        {
          eventType: 'ROLE_CHANGED',
          droneId: 'UAV-Alpha',
          previousRole: 'Search and exploration',
          newRole: 'Communication Relay',
          reason: 'Hard non-compensable camera fault; re-roled to bridge ad-hoc mesh backbone.',
          timestamp: 'Live'
        },
        ...prev
      ]);
    }, 5500);

    // End walkthrough animation state (banner can remain completed)
    setTimeout(() => {
      setSimulatingWalkthrough(false);
    }, 8500);
  };

  // Reset faults and restore swarm
  const handleResetFaults = async () => {
    try {
      for (const d of rawDrones) {
        await handleClearFault(d.drone_id);
      }
      if (handleStep) {
        await handleStep();
      }
    } catch (e) {
      console.warn('Backend clear fault note:', e.message);
    }
    setWalkthroughStep(0);
    setSimulatingWalkthrough(false);
    setPersistedHandovers([]);
    setInstantAuctionBids(null);
    setActiveAuctionModalTask(null);
    setLocalEvents([]);
  };

  // Toggle network partition
  const handleTogglePartition = async () => {
    const newRange = activeCommRange > 150 ? 110 : 240;
    setActiveCommRange(newRange);
    try {
      if (handleUpdateEnvironment) {
        await handleUpdateEnvironment({ commRange: newRange });
      }
    } catch (e) {
      console.warn('Update env note:', e.message);
    }
  };

  // Trigger Instant Local Auction on any task
  const handleTriggerTaskAuction = (task) => {
    setActiveAuctionModalTask(task);

    // Compute real bids for all peers
    const candidateBids = nodes
      .filter((n) => n.id !== task.assignedDrone)
      .map((n) => {
        const drone = droneMap[n.id] || n;
        const dist = Math.round(Math.hypot(n.x - (task.location?.x || 300), n.y - (task.location?.y || 200)));
        const cap = drone.capabilities?.c_RGB ?? 0.95;
        const conf = drone.diagnostic_confidence ?? 0.97;
        const score = computeBidScore(cap, conf, n.health, dist, n.battery);

        return {
          droneId: n.id,
          score,
          cap,
          conf,
          health: n.health,
          dist,
          battery: n.battery,
          formulaBreakdown: `0.35(${cap}) + 0.25(${conf}) + 0.15(${n.health === 'HEALTHY' ? '1.0' : '0.65'}) + 0.15(${Math.round(Math.max(0.05, 1.0 - dist / 1000) * 100) / 100}) + 0.10(${Math.round(n.battery / 10) / 10}) = ${score}`
        };
      })
      .sort((a, b) => b.score - a.score);

    if (candidateBids.length > 0) {
      candidateBids[0].isWinner = true;
    }

    setInstantAuctionBids(candidateBids);
  };

  // Award the instant auction
  const handleAwardInstantAuction = () => {
    if (!activeAuctionModalTask || !instantAuctionBids || instantAuctionBids.length === 0) return;
    const winner = instantAuctionBids[0];
    const prevDrone = activeAuctionModalTask.assignedDrone;

    setPersistedHandovers((prev) => {
      const filtered = prev.filter((h) => h.taskId !== activeAuctionModalTask.taskId);
      return [
        {
          taskId: activeAuctionModalTask.taskId,
          title: activeAuctionModalTask.title,
          taskType: activeAuctionModalTask.taskType,
          acquiredFrom: prevDrone,
          assignedDrone: winner.droneId,
          handoverReason: `Reallocated to ${winner.droneId} with top composite bid (${winner.score}) via distributed auction.`,
          winningBidScore: winner.score,
          handoverTimestamp: new Date().toLocaleTimeString(),
          taskStatus: 'IN_PROGRESS'
        },
        ...filtered
      ];
    });

    setLocalEvents((prev) => [
      {
        eventType: 'TASK_REASSIGNED',
        taskId: activeAuctionModalTask.taskId,
        winner: winner.droneId,
        previousDrone: prevDrone,
        bidScore: winner.score,
        message: `Task ${activeAuctionModalTask.taskId} awarded to ${winner.droneId} (Winning Bid: ${winner.score}).`,
        timestamp: 'Live'
      },
      ...prev
    ]);

    setActiveAuctionModalTask(null);
  };

  const selectedDrone = nodes.find((n) => n.id === selectedNodeId) || nodes[0];
  const sandboxCalculatedScore = computeBidScore(sandboxCap, sandboxConf, sandboxHealth === 1.0 ? 'HEALTHY' : 'DEGRADED', sandboxDist, sandboxBattery);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div>
          <div className="flex items-center space-x-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30 flex items-center">
              <Network className="w-3 h-3 mr-1 text-cyan-400" />
              Stages 06 & 07: Ad-Hoc Mesh & Distributed Auction
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center">
              <Radio className="w-2.5 h-2.5 mr-1 animate-pulse" /> Zero Central Gateway
            </span>
            {isPartitioned && (
              <span className="text-[10px] font-mono text-red-400 bg-red-950/80 border border-red-500/40 px-2 py-0.5 rounded flex items-center">
                <WifiOff className="w-2.5 h-2.5 mr-1" /> Partitioned ({connectedComponents.length} Clusters)
              </span>
            )}
          </div>
          <h2 className="text-xl font-extrabold text-slate-100 font-mono tracking-tight leading-tight flex items-center space-x-2">
            <span>Decentralized P2P Mesh & Autonomous Task Reallocation</span>
          </h2>
          <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-3xl">
            Fully distributed NetworkX spatial mesh modeling, multi-hop broadcast gossip, and health-weighted distributed auction consensus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={runAutonomousReallocationWalkthrough}
            disabled={simulatingWalkthrough}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-mono font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {simulatingWalkthrough
                ? `Executing Stage ${walkthroughStep}/5...`
                : 'Simulate Camera Failure & Handover'}
            </span>
          </button>

          <button
            onClick={handleTogglePartition}
            className={`inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
              activeCommRange < 150
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle wireless range to simulate ad-hoc network partition"
          >
            <Network className="w-3.5 h-3.5 text-cyan-400" />
            <span>Range: {activeCommRange}m</span>
          </button>

          <button
            onClick={() => setShowSandbox(!showSandbox)}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>{showSandbox ? 'Hide Sandbox' : 'Bid Sandbox'}</span>
          </button>

          <button
            onClick={handleResetFaults}
            className="inline-flex items-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Swarm</span>
          </button>
        </div>
      </div>

      {/* 7-Stage Architectural Pipeline Reference Strip */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center">
            <Layers className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            End-to-End System Pipeline Flow (Edge Intelligence ➔ P2P Consensus)
          </span>
          <span className="text-[10px] font-mono text-cyan-400">Autonomous Edge Execution</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs font-mono">
          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 1 ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-cyan-400 font-bold block">01. TELEMETRY</span>
            <span className="text-slate-200 font-semibold text-[11px] block">12-Dim Multimodal</span>
            <span className="text-[9px] text-slate-500 block">Motor, Bat, Cam, GPS</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 1 ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-cyan-400 font-bold block">02. LIGHT MONITOR</span>
            <span className="text-slate-200 font-semibold text-[11px] block">Z-Score Anomaly</span>
            <span className="text-[9px] text-slate-500 block">Low compute edge</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 2 ? 'bg-amber-950/80 border-amber-400 ring-2 ring-amber-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-amber-400 font-bold block">03. DEEP ASSESS</span>
            <span className="text-slate-200 font-semibold text-[11px] block">PyTorch 1D-CNN</span>
            <span className="text-[9px] text-slate-500 block">Smoke vs HW fault</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 3 ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-purple-400 font-bold block">04. CAPABILITY</span>
            <span className="text-slate-200 font-semibold text-[11px] block">8D Vector (c_k)</span>
            <span className="text-[9px] text-slate-500 block">Decoupled confidence</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 3 ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-purple-400 font-bold block">05. ROLE SELECT</span>
            <span className="text-slate-200 font-semibold text-[11px] block">Safety Gating</span>
            <span className="text-[9px] text-slate-500 block">Autonomous Utility</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 4 ? 'bg-emerald-950/80 border-emerald-400 ring-2 ring-emerald-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-emerald-400 font-bold block">06. P2P SHARING</span>
            <span className="text-slate-200 font-semibold text-[11px] block">NetworkX Mesh</span>
            <span className="text-[9px] text-slate-500 block">Ad-hoc broadcast</span>
          </div>

          <div className={`p-2.5 rounded-xl border transition ${walkthroughStep === 5 ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50' : 'bg-slate-950/80 border-slate-800'}`}>
            <span className="text-[10px] text-cyan-400 font-bold block">07. TASK AUCTION</span>
            <span className="text-slate-200 font-semibold text-[11px] block">Confidence Bids</span>
            <span className="text-[9px] text-slate-500 block">Autonomous swap</span>
          </div>
        </div>
      </div>

      {/* Practical Walkthrough Step Banner (if active) */}
      {walkthroughStep > 0 && (
        <div className="bg-gradient-to-r from-cyan-950/90 to-blue-950/90 border border-cyan-500/50 rounded-2xl p-4 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400 animate-spin" />
              Live Scenario Walkthrough: Optical Failure & Distributed Handover
            </span>
            <span className="text-xs font-mono text-cyan-200 font-bold px-2.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40">
              Stage {walkthroughStep} of 5
            </span>
          </div>

          <div className="text-xs text-slate-200 font-mono space-y-1">
            {walkthroughStep === 1 && (
              <p>
                <strong>[01-02. Telemetry & Anomaly]</strong> Injected complete RGB camera sensor breakdown on UAV-Alpha (0 FPS). Edge anomaly detector flags optical stream deviation.
              </p>
            )}
            {walkthroughStep === 2 && (
              <p>
                <strong>[03. Deep Fault Assessment]</strong> UAV-Alpha executes 1D-CNN deep diagnostic inference: isolates <em>Optical Hardware Failure</em> with <strong>94% Diagnostic Confidence</strong> (distinguishing from atmospheric smoke).
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
              <p className="text-emerald-300 font-bold">
                ✓ <strong>[Mission Continuity Handover Complete]</strong> Healthy peer UAV-Beta <strong>acquired TSK-101</strong> with highest composite bid (0.941)! UAV-Alpha is <strong>autonomously assigned a new Relay task</strong> to support the swarm wireless backbone.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Interactive Bid Calculator Sandbox (Collapsible) */}
      {showSandbox && (
        <div className="bg-[#0B111E] border border-purple-500/40 rounded-2xl p-5 shadow-[0_0_25px_rgba(168,85,247,0.2)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold font-mono text-white">
                Decentralized Bid Calculation Sandbox (Equation Verification)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
              Score: {sandboxCalculatedScore} / 1.000
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs font-mono">
            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>0.35 C_k (Cap)</span>
                <span className="text-cyan-400">{sandboxCap}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={sandboxCap}
                onChange={(e) => setSandboxCap(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>0.25 Γ_i (Conf)</span>
                <span className="text-emerald-400">{sandboxConf}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={sandboxConf}
                onChange={(e) => setSandboxConf(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>0.15 H_i (Health)</span>
                <span className="text-amber-400">{sandboxHealth === 1.0 ? '1.0 (OK)' : '0.65 (Deg)'}</span>
              </div>
              <select
                value={sandboxHealth}
                onChange={(e) => setSandboxHealth(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
              >
                <option value={1.0}>1.0 (Healthy)</option>
                <option value={0.65}>0.65 (Degraded)</option>
                <option value={0.0}>0.0 (Critical)</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>0.15 Prox (Dist)</span>
                <span className="text-purple-400">{sandboxDist}m</span>
              </div>
              <input
                type="range"
                min="10"
                max="800"
                step="10"
                value={sandboxDist}
                onChange={(e) => setSandboxDist(parseInt(e.target.value, 10))}
                className="w-full accent-purple-400"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>0.10 Bat (B_i)</span>
                <span className="text-blue-400">{sandboxBattery}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={sandboxBattery}
                onChange={(e) => setSandboxBattery(parseInt(e.target.value, 10))}
                className="w-full accent-blue-400"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
            <strong>Formula Evaluation:</strong>{' '}
            <span className="text-cyan-300">0.35 × {sandboxCap}</span> +{' '}
            <span className="text-emerald-300">0.25 × {sandboxConf}</span> +{' '}
            <span className="text-amber-300">0.15 × {sandboxHealth}</span> +{' '}
            <span className="text-purple-300">0.15 × {Math.round(Math.max(0.05, 1.0 - sandboxDist / 1000) * 100) / 100}</span> +{' '}
            <span className="text-blue-300">0.10 × {Math.round((sandboxBattery / 100) * 100) / 100}</span> ={' '}
            <strong className="text-white text-xs">{sandboxCalculatedScore}</strong>
          </div>
        </div>
      )}

      {/* Topology & Mesh KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <span className="text-slate-400 text-[11px] font-mono block mb-0.5">Active Mesh Nodes</span>
          <span className="text-xl font-bold text-white font-mono">{nodes.length} UAVs</span>
          <span className="text-[10px] text-cyan-400 block mt-0.5">Ad-hoc wireless peers</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <span className="text-slate-400 text-[11px] font-mono block mb-0.5">1-Hop P2P Links</span>
          <span className="text-xl font-bold text-emerald-400 font-mono">{edges.length} Links</span>
          <span className="text-[10px] text-emerald-500 block mt-0.5">NetworkX dynamic edges</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <span className="text-slate-400 text-[11px] font-mono block mb-0.5">Mesh Clustering Coeff</span>
          <span className="text-xl font-bold text-cyan-300 font-mono">{topology.clustering_coefficient ?? 0.68}</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Triadic closure metric</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <span className="text-cyan-400 text-[11px] font-mono font-semibold block mb-0.5">
            Handed Over Tasks
          </span>
          <span className="text-xl font-bold text-cyan-300 font-mono">
            {handedOverTasks.length}
          </span>
          <span className="text-[10px] text-cyan-500 block mt-0.5">Acquired from prior drone</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-xl p-3.5 shadow-lg">
          <span className="text-slate-400 text-[11px] font-mono block mb-0.5">Mesh Partition Status</span>
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-0.5 ${
              isPartitioned
                ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isPartitioned ? 'PARTITIONED' : 'FULLY CONNECTED'}
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {connectedComponents.length} connected cluster(s)
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive P2P Topology Graph & Auction Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Live P2P Mesh Topology Graph Visualizer */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
                  <Network className="w-4 h-4 mr-2 text-cyan-400" />
                  Live Decentralized P2P Mesh Topology Graph
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  NetworkX spatial graph • Click any node to inspect telemetry & neighbors
                </span>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-500/30 px-2 py-1 rounded">
                Range: {activeCommRange}m
              </span>
            </div>

            {/* SVG Interactive Topology Canvas */}
            <div className="relative w-full h-[400px] bg-[#070B14] rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full select-none" viewBox="0 0 800 460">
                <defs>
                  <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Grid guidelines & Floor Zones */}
                <rect x="20" y="20" width="760" height="190" fill="#0B132B" fillOpacity="0.3" rx="8" />
                <text x="35" y="45" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
                  ZONE 1 • GROUND FLOOR (ROOMS 101-104)
                </text>

                <rect x="20" y="230" width="760" height="200" fill="#1C1427" fillOpacity="0.25" rx="8" />
                <text x="35" y="255" fill="#C084FC" fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.6">
                  ZONE 2 • UPPER FLOORS (ROOMS 201-204 & RELAY CORRIDOR)
                </text>

                {/* Floor Boundary / RF Attenuation Line */}
                <line x1="20" y1="220" x2="780" y2="220" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 6" />
                <text x="400" y="216" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  INTER-FLOOR RF ATTENUATION BOUNDARY
                </text>

                {/* P2P Edges (Wireless Links) */}
                {edges.map((edge, eIdx) => {
                  const nodeA = nodes.find((n) => n.id === edge.source);
                  const nodeB = nodes.find((n) => n.id === edge.target);
                  if (!nodeA || !nodeB) return null;

                  const midX = (nodeA.x + nodeB.x) / 2;
                  const midY = (nodeA.y + nodeB.y) / 2;
                  const lossPct = Math.round((edge.loss_prob || 0.03) * 100);

                  return (
                    <g key={`edge-${eIdx}`}>
                      <line
                        x1={nodeA.x}
                        y1={nodeA.y}
                        x2={nodeB.x}
                        y2={nodeB.y}
                        stroke="url(#linkGradient)"
                        strokeWidth={Math.max(1.5, 3.5 - edge.distance / 150)}
                        strokeDasharray={edge.loss_prob > 0.15 ? '4 4' : undefined}
                        opacity={Math.max(0.35, 1.0 - edge.loss_prob)}
                      />
                      {/* Midpoint link telemetry tag */}
                      <rect
                        x={midX - 22}
                        y={midY - 8}
                        width="44"
                        height="16"
                        rx="4"
                        fill="#0A101D"
                        stroke="#1E293B"
                        strokeWidth="1"
                      />
                      <text
                        x={midX}
                        y={midY + 3}
                        fill="#94A3B8"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {lossPct}% loss
                      </text>
                    </g>
                  );
                })}

                {/* UAV Nodes */}
                {nodes.map((node) => {
                  const drone = droneMap[node.id] || node;
                  const role = node.role || drone.current_role || 'Search';
                  const isRelay = role.toLowerCase().includes('relay');
                  const health = node.health || 'HEALTHY';
                  const isDegraded = health === 'DEGRADED';
                  const isSelected = selectedNodeId === node.id;
                  const betVal = betweenness[node.id] || 0.0;
                  const isBridge = betVal > 0.25;
                  const isWinnerInAuction = walkthroughStep >= 4 && node.id === 'UAV-Beta';

                  const color = isRelay
                    ? '#A855F7' // Purple
                    : isDegraded
                    ? '#F59E0B' // Amber
                    : health === 'CRITICAL'
                    ? '#EF4444' // Red
                    : '#10B981'; // Green

                  return (
                    <g
                      key={`node-${node.id}`}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => setSelectedNodeId(node.id)}
                    >
                      {/* Consensus Winner Halo */}
                      {isWinnerInAuction && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="32"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                          className="animate-spin"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Bridge halo if betweenness centrality is high */}
                      {isBridge && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="28"
                          fill="none"
                          stroke="#A855F7"
                          strokeWidth="2"
                          strokeDasharray="3 3"
                          opacity="0.8"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Selection ring */}
                      {isSelected && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r="24"
                          fill="none"
                          stroke="#00F0FF"
                          strokeWidth="3"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Main node disc */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="18"
                        fill="#0B111E"
                        stroke={color}
                        strokeWidth="3"
                      />

                      {/* Node Center Dot */}
                      <circle cx={node.x} cy={node.y} r="5" fill={color} />

                      {/* Node Name Tag */}
                      <rect
                        x={node.x - 32}
                        y={node.y + 24}
                        width="64"
                        height="18"
                        rx="4"
                        fill="#0F172A"
                        stroke={color}
                        strokeWidth="1"
                      />
                      <text
                        x={node.x}
                        y={node.y + 36}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {node.id}
                      </text>

                      {/* Role Badge above node */}
                      <text
                        x={node.x}
                        y={node.y - 24}
                        fill={isRelay ? '#C084FC' : isDegraded ? '#FBBF24' : '#38BDF8'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {isRelay ? '⚡ RELAY' : isDegraded ? '⚠ DEGRADED' : '🔍 SEARCH'}
                      </text>

                      {/* Winner Badge tag if active */}
                      {isWinnerInAuction && (
                        <text
                          x={node.x}
                          y={node.y - 36}
                          fill="#34D399"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                          textAnchor="middle"
                        >
                          ★ WINNING BID
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Legend overlay */}
              <div className="absolute bottom-2 left-2 flex items-center space-x-3 bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-300 shadow">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Healthy Search</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span>Eco-Relay Bridge</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Degraded Node</span>
                </span>
              </div>
            </div>

            {/* Selected Node Details Drawer */}
            {selectedDrone && (
              <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-950/30 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white text-sm">{selectedDrone.id || selectedDrone.drone_id}</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                      Floor {selectedDrone.floor || 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {selectedDrone.role || selectedDrone.current_role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      selectedDrone.health === 'HEALTHY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedDrone.health || 'HEALTHY'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Battery State</span>
                    <span className="font-bold text-emerald-400">🔋 {Math.round(selectedDrone.battery || 95)}%</span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Betweenness Centrality</span>
                    <span className="font-bold text-purple-300">
                      {betweenness[selectedDrone.id || selectedDrone.drone_id] ?? 0.28}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">1-Hop Wireless Peers</span>
                    <span className="font-bold text-cyan-300">
                      {edges.filter((e) => e.source === (selectedDrone.id || selectedDrone.drone_id) || e.target === (selectedDrone.id || selectedDrone.drone_id)).length} Peers
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-400 block text-[9px]">Diagnostic Confidence</span>
                    <span className="font-bold text-white">
                      {Math.round((selectedDrone.diagnostic_confidence || 0.98) * 100)}%
                    </span>
                  </div>
                </div>

                {/* 1-Hop Neighbors table */}
                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 block mb-1">Direct 1-Hop Wireless Mesh Neighbors:</span>
                  <div className="flex flex-wrap gap-2">
                    {edges
                      .filter((e) => e.source === (selectedDrone.id || selectedDrone.drone_id) || e.target === (selectedDrone.id || selectedDrone.drone_id))
                      .map((e, idx) => {
                        const neighborId = e.source === (selectedDrone.id || selectedDrone.drone_id) ? e.target : e.source;
                        return (
                          <span
                            key={idx}
                            onClick={() => setSelectedNodeId(neighborId)}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[10px] cursor-pointer hover:border-cyan-400 transition"
                          >
                            <strong>{neighborId}</strong> • {e.distance}m ({Math.round(e.loss_prob * 100)}% loss)
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Decentralized Auction Formula & Bidding Breakdown Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
                <Gavel className="w-4 h-4 mr-2 text-cyan-400" />
                Decentralized Auction Scoring Formula
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                Stage 07 Consensus
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#070B14] border border-cyan-500/30 font-mono text-xs text-slate-200 space-y-2">
              <div className="text-cyan-300 font-bold text-[13px] tracking-wide">
                Bid(i, k) = 0.35 · C_k + 0.25 · Γ_i + 0.15 · H_i + 0.15 · (1 - d/R) + 0.10 · B_i
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                <div><strong className="text-cyan-300">0.35 C_k:</strong> Sensor Capability</div>
                <div><strong className="text-cyan-300">0.25 Γ_i:</strong> Diagnostic Conf</div>
                <div><strong className="text-cyan-300">0.15 H_i:</strong> Health Multiplier</div>
                <div><strong className="text-cyan-300">0.15 Prox:</strong> Distance Penalty</div>
                <div><strong className="text-cyan-300">0.10 B_i:</strong> Battery Reserve</div>
              </div>
            </div>

            {/* Live Bidding Table for Active Auction Round */}
            {instantAuctionBids && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-200 font-bold flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Candidate Peer Bids (Task: {activeAuctionModalTask?.taskId || 'TSK-101'})</span>
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded border border-emerald-500/40">
                    Consensus Winner: {instantAuctionBids[0]?.droneId}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-1.5">Candidate Node</th>
                        <th className="pb-1.5">Health</th>
                        <th className="pb-1.5">Capability (C_k)</th>
                        <th className="pb-1.5">Confidence (Γ_i)</th>
                        <th className="pb-1.5">Distance</th>
                        <th className="pb-1.5">Calculated Bid</th>
                        <th className="pb-1.5">Consensus Outcome</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {instantAuctionBids.map((b) => (
                        <tr key={b.droneId} className={b.isWinner ? 'bg-cyan-950/40 text-cyan-200 font-bold' : 'text-slate-400'}>
                          <td className="py-2.5">{b.droneId}</td>
                          <td className="py-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] ${b.health === 'HEALTHY' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}`}>
                              {b.health}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-200">{b.cap}</td>
                          <td className="py-2.5 text-slate-200">{Math.round(b.conf * 100)}%</td>
                          <td className="py-2.5">{b.dist}m</td>
                          <td className="py-2.5 font-bold text-white">{b.score ?? 'BARRED'}</td>
                          <td className="py-2.5">
                            {b.isWinner ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                                ★ AWARDED
                              </span>
                            ) : b.barredReason ? (
                              <span className="text-red-400 text-[10px]">{b.barredReason}</span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">Outbid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {activeAuctionModalTask && (
                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setActiveAuctionModalTask(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAwardInstantAuction}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                    >
                      Execute Handover to {instantAuctionBids[0]?.droneId}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Task Assignment Registry & Live Handover Chain of Custody */}
        <div className="lg:col-span-5 space-y-5">
          {/* Autonomous Task Handover Lineage Flowboard */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2 text-cyan-400" />
                Live Handover Chain of Custody
              </h3>
              <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                {handedOverTasks.length} Reallocations
              </span>
            </div>

            <div className="space-y-3">
              {handedOverTasks.length === 0 ? (
                <div className="text-xs text-slate-400 py-6 text-center italic font-mono bg-slate-950/60 rounded-xl border border-dashed border-slate-800 space-y-2">
                  <p>No task reallocations recorded yet.</p>
                  <button
                    onClick={runAutonomousReallocationWalkthrough}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 font-bold cursor-pointer transition text-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run Camera Failure & Handover Simulation</span>
                  </button>
                </div>
              ) : (
                handedOverTasks.map((t) => (
                  <div
                    key={t.taskId}
                    className="p-3.5 rounded-xl border border-cyan-500/40 bg-slate-950/90 space-y-2.5 text-xs font-mono shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{t.taskId}</span>
                      <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                        {t.taskType}
                      </span>
                    </div>

                    {/* Source -> Target Visual Nodes */}
                    <div className="grid grid-cols-5 items-center gap-1 bg-[#070B14] p-2.5 rounded-lg border border-slate-800 text-center">
                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-500 block uppercase">Source Node</span>
                        <span className="font-bold text-slate-300 block">{t.acquiredFrom || t.previousDrone}</span>
                        <span className="text-[9px] text-amber-400 font-semibold px-1 rounded bg-amber-950/60 border border-amber-500/30 inline-block">
                          FAULTED
                        </span>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <ArrowRight className="w-4 h-4 text-cyan-400 animate-pulse" />
                      </div>

                      <div className="col-span-2">
                        <span className="text-[9px] text-slate-500 block uppercase">Acquiring Node</span>
                        <span className="font-bold text-emerald-400 block">{t.assignedDrone}</span>
                        <span className="text-[9px] text-emerald-400 font-semibold px-1 rounded bg-emerald-950/60 border border-emerald-500/30 inline-block">
                          ACQUIRED
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-sans leading-tight">
                      <strong>Handover Reason:</strong> {t.handoverReason || 'Camera hardware degradation diagnosed on prior drone.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Decentralized Task Registry */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div>
                <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
                  <Gavel className="w-4 h-4 mr-2 text-cyan-400" />
                  Task Assignment & Lineage Registry
                </h3>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {['ALL', 'HANDOVER', 'IN_PROGRESS'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTaskFilter(tab)}
                    className={`px-2 py-1 rounded-md transition cursor-pointer ${
                      taskFilter === tab
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'ALL' ? `All (${tasks.length})` : tab === 'HANDOVER' ? `Handover (${handedOverTasks.length})` : 'Active'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {filteredTasks.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center italic font-mono">
                  No tasks matching the selected filter.
                </div>
              ) : (
                filteredTasks.map((tsk) => {
                  const wasHandedOver = !!(tsk.acquiredFrom || tsk.previousDrone);
                  return (
                    <div
                      key={tsk.taskId}
                      className={`p-3.5 rounded-xl border transition space-y-2 ${
                        wasHandedOver
                          ? 'border-cyan-500/40 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-950/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {tsk.taskId}
                            </span>
                            <span className="text-xs font-bold text-white font-mono">
                              {tsk.title}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 pt-0.5">
                            Type: <strong className="text-slate-200">{tsk.taskType}</strong> • Assigned: <strong className="text-emerald-400">{tsk.assignedDrone || 'Auctioning'}</strong>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleTriggerTaskAuction(tsk)}
                            className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900 transition cursor-pointer"
                            title="Trigger an on-demand auction for this task across 1-hop peers"
                          >
                            Auction
                          </button>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            {tsk.taskStatus}
                          </span>
                        </div>
                      </div>

                      {wasHandedOver && (
                        <div className="text-[10px] font-mono text-cyan-300/90 bg-slate-900/80 p-1.5 rounded border border-cyan-500/20">
                          ✓ Acquired from <span className="line-through text-slate-500">{tsk.acquiredFrom || tsk.previousDrone}</span> after autonomous fault diagnosis.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Autonomous Negotiation Timeline */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider flex items-center">
                <Clock className="w-4 h-4 mr-2 text-cyan-400" />
                Live P2P Gossip Negotiation Stream
              </h3>
              <span className="text-xs font-mono text-slate-400">NetworkX Ad-Hoc</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {events.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center italic font-mono">
                  No negotiation events yet. Run a simulation walkthrough or trigger an auction.
                </div>
              ) : (
                events.map((evt, idx) => {
                  const isReassign = evt.eventType === 'TASK_REASSIGNED' || evt.eventType === 'AUTONOMOUS_WORK_REALLOCATION';
                  const isRole = evt.eventType === 'ROLE_CHANGED' || evt.eventType === 'ROLE_ADAPTED';
                  const isBid = evt.eventType === 'BID_SUBMITTED';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-xs space-y-1 font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-bold ${
                            isReassign
                              ? 'text-cyan-400'
                              : isRole
                              ? 'text-purple-400'
                              : isBid
                              ? 'text-emerald-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {evt.eventType}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {evt.timestamp !== undefined ? `${evt.timestamp}s` : 'Live'}
                        </span>
                      </div>

                      <p className="text-slate-300 font-sans text-[11px] leading-snug">
                        {isRole &&
                          `${evt.droneId} adapted role to '${evt.newRole}'. Reason: ${evt.reason}`}
                        {isReassign &&
                          (evt.message ||
                            `Task ${evt.taskId} acquired by ${evt.awardedTo || evt.winner} from ${
                              evt.previousDrone || evt.initiator
                            }`)}
                        {isBid &&
                          `Peer ${evt.droneId} submitted bid of ${evt.bidScore}`}
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
