import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { socket } from '../services/socket';
import * as api from '../services/api';

const SwarmContext = createContext(null);

const DEFAULT_PATROL_ROUTES = {
  'UAV-Alpha': [
    { x: 170, y: 130, z: 8, floor: 1 },
    { x: 260, y: 140, z: 8, floor: 1 },
    { x: 220, y: 220, z: 8, floor: 1 },
    { x: 140, y: 180, z: 8, floor: 1 }
  ],
  'UAV-Beta': [
    { x: 380, y: 130, z: 8, floor: 1 },
    { x: 480, y: 140, z: 8, floor: 1 },
    { x: 420, y: 240, z: 8, floor: 1 },
    { x: 340, y: 190, z: 8, floor: 1 }
  ],
  'UAV-Gamma': [
    { x: 590, y: 130, z: 8, floor: 1 },
    { x: 670, y: 190, z: 8, floor: 1 },
    { x: 580, y: 260, z: 8, floor: 1 },
    { x: 520, y: 160, z: 8, floor: 1 }
  ],
  'UAV-Delta': [
    { x: 400, y: 310, z: 18, floor: 2 },
    { x: 490, y: 360, z: 18, floor: 2 },
    { x: 340, y: 400, z: 18, floor: 2 },
    { x: 280, y: 330, z: 18, floor: 2 }
  ],
  'UAV-Epsilon': [
    { x: 600, y: 310, z: 18, floor: 2 },
    { x: 680, y: 380, z: 18, floor: 2 },
    { x: 560, y: 430, z: 18, floor: 2 },
    { x: 490, y: 340, z: 18, floor: 2 }
  ],
  'UAV-Zeta': [
    { x: 390, y: 310, z: 18, floor: 2 },
    { x: 410, y: 330, z: 18, floor: 2 },
    { x: 370, y: 300, z: 18, floor: 2 },
    { x: 390, y: 310, z: 18, floor: 2 }
  ]
};

function createDefaultSimulationState(count = 6, complexity = 'MEDIUM') {
  const numFloors = complexity === 'HIGH' ? 5 : complexity === 'LOW' ? 2 : 3;

  const initialDrones = [
    {
      drone_id: 'UAV-Alpha',
      x: 170,
      y: 130,
      z: 8,
      floor: 1,
      current_role: 'Search and exploration',
      initial_role: 'Search and exploration',
      operational_status: 'HEALTHY',
      battery: 98,
      battery_drain_rate: 0.35,
      diagnostic_confidence: 0.98,
      assigned_color: '#EF4444',
      speed: 16.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 1.0, c_Thermal: 1.0, c_LiDAR: 1.0, c_Communication: 1.0, c_Mobility: 1.0 },
      trajectory: [{ x: 130, y: 100 }, { x: 170, y: 130 }]
    },
    {
      drone_id: 'UAV-Beta',
      x: 380,
      y: 130,
      z: 8,
      floor: 1,
      current_role: 'Search and exploration',
      initial_role: 'Search and exploration',
      operational_status: 'HEALTHY',
      battery: 97,
      battery_drain_rate: 0.35,
      diagnostic_confidence: 0.98,
      assigned_color: '#10B981',
      speed: 16.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 1.0, c_Thermal: 1.0, c_LiDAR: 1.0, c_Communication: 1.0, c_Mobility: 1.0 },
      trajectory: [{ x: 340, y: 110 }, { x: 380, y: 130 }]
    },
    {
      drone_id: 'UAV-Gamma',
      x: 590,
      y: 130,
      z: 8,
      floor: 1,
      current_role: 'Search and exploration',
      initial_role: 'Search and exploration',
      operational_status: 'HEALTHY',
      battery: 96,
      battery_drain_rate: 0.35,
      diagnostic_confidence: 0.98,
      assigned_color: '#3B82F6',
      speed: 16.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 1.0, c_Thermal: 1.0, c_LiDAR: 1.0, c_Communication: 1.0, c_Mobility: 1.0 },
      trajectory: [{ x: 550, y: 110 }, { x: 590, y: 130 }]
    },
    {
      drone_id: 'UAV-Delta',
      x: 400,
      y: 310,
      z: 18,
      floor: 2,
      current_role: 'Search and exploration',
      initial_role: 'Search and exploration',
      operational_status: 'HEALTHY',
      battery: 95,
      battery_drain_rate: 0.35,
      diagnostic_confidence: 0.97,
      assigned_color: '#00F0FF',
      speed: 16.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 1.0, c_Thermal: 1.0, c_LiDAR: 1.0, c_Communication: 1.0, c_Mobility: 1.0 },
      trajectory: [{ x: 360, y: 280 }, { x: 400, y: 310 }]
    },
    {
      drone_id: 'UAV-Epsilon',
      x: 600,
      y: 310,
      z: 18,
      floor: 2,
      current_role: 'Search and exploration',
      initial_role: 'Search and exploration',
      operational_status: 'HEALTHY',
      battery: 94,
      battery_drain_rate: 0.35,
      diagnostic_confidence: 0.96,
      assigned_color: '#F59E0B',
      speed: 16.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 1.0, c_Thermal: 1.0, c_LiDAR: 1.0, c_Communication: 1.0, c_Mobility: 1.0 },
      trajectory: [{ x: 560, y: 280 }, { x: 600, y: 310 }]
    },
    {
      drone_id: 'UAV-Zeta',
      x: 390,
      y: 310,
      z: 18,
      floor: 2,
      current_role: 'Communication relay',
      initial_role: 'Communication relay',
      operational_status: 'HEALTHY',
      battery: 99,
      battery_drain_rate: 0.10,
      role_adapted: true,
      diagnostic_confidence: 0.99,
      assigned_color: '#8B5CF6',
      speed: 8.0,
      wpt_idx: 0,
      capabilities: { c_RGB: 0.3, c_Thermal: 0.3, c_LiDAR: 0.8, c_Communication: 1.0, c_Mobility: 0.9 },
      trajectory: [{ x: 390, y: 290 }, { x: 390, y: 310 }]
    }
  ].slice(0, count);

  const initialVictims = [
    {
      id: 'victim_1',
      name: 'Trapped Resident in Living Room',
      x: 170,
      y: 130,
      z: 8,
      floor: 1,
      vital_temp_c: 37.6,
      pulse_bpm: 98,
      urgency: 0.94,
      triage_tag: 'RED',
      triage_desc: 'IMMEDIATE: Elevated pulse & critical urgency',
      payload_status: 'DELIVERED',
      payload_delivered_by: 'UAV-Beta',
      payload_type: 'FIRST_AID_RF_BEACON',
      detected: true,
      detected_by: 'UAV-Beta'
    },
    {
      id: 'victim_2',
      name: 'Resident behind Kitchen Cabinets',
      x: 380,
      y: 130,
      z: 8,
      floor: 1,
      vital_temp_c: 37.0,
      pulse_bpm: 82,
      urgency: 0.84,
      triage_tag: 'YELLOW',
      triage_desc: 'DELAYED: Trapped behind collapsed cabinetry',
      payload_status: 'PENDING',
      detected: false
    },
    {
      id: 'victim_3',
      name: 'Resident in Garage Rubble',
      x: 590,
      y: 130,
      z: 8,
      floor: 1,
      vital_temp_c: 36.8,
      pulse_bpm: 76,
      urgency: 0.72,
      triage_tag: 'GREEN',
      triage_desc: 'MINOR: Ambulatory with superficial cuts',
      payload_status: 'PENDING',
      detected: false
    },
    {
      id: 'victim_4',
      name: 'Resident in 2F Master Bed Rubble',
      x: 400,
      y: 310,
      z: 18,
      floor: 2,
      vital_temp_c: 38.1,
      pulse_bpm: 104,
      urgency: 0.96,
      triage_tag: 'RED',
      triage_desc: 'IMMEDIATE: Severe trauma & acute distress',
      payload_status: 'DELIVERED',
      payload_delivered_by: 'UAV-Delta',
      payload_type: 'FIRST_AID_RF_BEACON',
      detected: true,
      detected_by: 'UAV-Delta'
    }
  ];

  return {
    sim_time: 0,
    step: 0,
    coverage_percent: 22,
    victims_detected: 2,
    total_victims: initialVictims.length,
    drones: initialDrones,
    environment: {
      complexity,
      num_floors: numFloors,
      global_dust_level: 0.20,
      victims: initialVictims
    },
    topology: {
      nodes: initialDrones.map(d => ({ id: d.drone_id, x: d.x, y: d.y, floor: d.floor })),
      edges: [
        { source: 'UAV-Alpha', target: 'UAV-Beta', distance: 110, loss_prob: 0.04, is_stairwell_bridge: false },
        { source: 'UAV-Beta', target: 'UAV-Gamma', distance: 120, loss_prob: 0.05, is_stairwell_bridge: false },
        { source: 'UAV-Beta', target: 'UAV-Zeta', distance: 95, loss_prob: 0.06, is_stairwell_bridge: true },
        { source: 'UAV-Delta', target: 'UAV-Zeta', distance: 80, loss_prob: 0.03, is_stairwell_bridge: true },
        { source: 'UAV-Delta', target: 'UAV-Epsilon', distance: 115, loss_prob: 0.05, is_stairwell_bridge: false }
      ]
    },
    recent_events: [
      {
        eventType: 'AUTONOMOUS_MESH_RELAY_DISPATCH',
        droneId: 'UAV-Zeta',
        message: 'UAV-Zeta anchored at Stairwell Waveguide Shaft (2F) for multi-floor mesh healing',
        timestamp: 0.0
      },
      {
        eventType: 'EMERGENCY_PAYLOAD_DELIVERED',
        droneId: 'UAV-Beta',
        victimId: 'victim_1',
        message: 'UAV-Beta deployed emergency first-aid RF beacon to survivor victim_1',
        timestamp: 0.0
      }
    ]
  };
}

function stepLocalSimulation(prevState, complexity = 'MEDIUM') {
  if (!prevState || !prevState.drones) {
    return createDefaultSimulationState(6, complexity);
  }

  const dt = 0.5;
  const drones = prevState.drones.map((d) => {
    const route = DEFAULT_PATROL_ROUTES[d.drone_id] || [
      { x: d.x + 80, y: d.y },
      { x: d.x - 80, y: d.y }
    ];

    let wptIdx = d.wpt_idx || 0;
    let target = route[wptIdx % route.length];

    const dx = target.x - d.x;
    const dy = target.y - d.y;
    const dist = Math.hypot(dx, dy);

    const isRelay = d.current_role === 'Communication relay';
    const moveSpeed = isRelay ? 6.0 : (d.speed || 16.0);

    let nextX = d.x;
    let nextY = d.y;

    if (dist > 8.0) {
      nextX += (dx / dist) * moveSpeed * dt;
      nextY += (dy / dist) * moveSpeed * dt;
    } else {
      wptIdx = (wptIdx + 1) % route.length;
    }

    // Battery drain
    const drain = (d.battery_drain_rate || (isRelay ? 0.10 : 0.35)) * dt;
    const nextBattery = Math.max(8, (d.battery || 100) - drain);

    // Append to trajectory breadcrumbs
    const traj = [...(d.trajectory || [])];
    if (traj.length === 0 || Math.hypot(nextX - traj[traj.length - 1].x, nextY - traj[traj.length - 1].y) > 8.0) {
      traj.push({ x: Math.round(nextX), y: Math.round(nextY), z: d.z });
      if (traj.length > 50) traj.shift();
    }

    return {
      ...d,
      x: nextX,
      y: nextY,
      wpt_idx: wptIdx,
      battery: Math.round(nextBattery * 10) / 10,
      trajectory: traj
    };
  });

  // Victim discovery and payload deployment
  const victims = (prevState.environment?.victims || []).map((v) => {
    if (v.detected) return v;

    // Check distance to any drone
    const discoveringDrone = drones.find((d) => Math.hypot(d.x - v.x, d.y - v.y) < 85.0);
    if (discoveringDrone) {
      const isCritical = v.triage_tag === 'RED' || v.triage_tag === 'YELLOW';
      return {
        ...v,
        detected: true,
        detected_by: discoveringDrone.drone_id,
        payload_status: isCritical ? 'DELIVERED' : v.payload_status,
        payload_delivered_by: isCritical ? discoveringDrone.drone_id : v.payload_delivered_by
      };
    }
    return v;
  });

  const detectedCount = victims.filter((v) => v.detected).length;
  const simTime = (prevState.sim_time || 0) + dt;
  const coverage = Math.min(98, (prevState.coverage_percent || 22) + 0.35);

  return {
    ...prevState,
    sim_time: Math.round(simTime * 10) / 10,
    step: (prevState.step || 0) + 1,
    coverage_percent: Math.round(coverage),
    victims_detected: detectedCount,
    total_victims: victims.length,
    drones,
    environment: {
      ...prevState.environment,
      victims
    },
    topology: {
      ...prevState.topology,
      nodes: drones.map((d) => ({ id: d.drone_id, x: d.x, y: d.y, floor: d.floor }))
    }
  };
}

export const SwarmProvider = ({ children }) => {
  const [simState, setSimState] = useState(() => createDefaultSimulationState(6, 'MEDIUM'));
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [selectedDroneId, setSelectedDroneId] = useState('UAV-Alpha');
  const [droneCount, setDroneCount] = useState(6);
  const [buildingComplexity, setBuildingComplexity] = useState('MEDIUM');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [eventLog, setEventLog] = useState([]);

  // Fetch initial state from backend
  const fetchInitialState = useCallback(async () => {
    try {
      const res = await api.getSimulationStatus();
      if (res.data) {
        setIsRunning(Boolean(res.data.isRunning));
        setSimSpeed(res.data.speed || 1.0);
        if (res.data.state) {
          setSimState(res.data.state);
        }
      }
      setLoading(false);
    } catch (err) {
      console.warn('Initial state fetch error (using autonomous fallback):', err.message);
      setSimState((prev) => prev || createDefaultSimulationState(droneCount, buildingComplexity));
      setLoading(false);
    }
  }, [droneCount, buildingComplexity]);

  // Socket listener setup
  useEffect(() => {
    fetchInitialState();

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('telemetry_update', (data) => {
      if (data) {
        setSimState(data);
        if (data.recent_events && data.recent_events.length > 0) {
          setEventLog((prev) => {
            const newEvents = data.recent_events.filter(
              (e) => !prev.some((p) => p.timestamp === e.timestamp && p.eventType === e.eventType)
            );
            return [...newEvents, ...prev].slice(0, 50);
          });
        }
      }
    });

    socket.on('simulation_status', (data) => {
      if (data) {
        setIsRunning(Boolean(data.isRunning));
        if (data.speed) setSimSpeed(data.speed);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry_update');
      socket.off('simulation_status');
    };
  }, [fetchInitialState]);

  // Autonomous simulation loop:
  // Runs whenever simulation is started and backend socket is not connected
  useEffect(() => {
    if (!isRunning) return;
    if (connectionStatus === 'connected') return;

    const intervalMs = Math.max(120, Math.floor(450 / simSpeed));
    const timer = setInterval(() => {
      setSimState((prev) => stepLocalSimulation(prev, buildingComplexity));
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, simSpeed, connectionStatus, buildingComplexity]);

  const handleStart = async () => {
    setIsRunning(true);
    try {
      await api.startSimulation();
    } catch (err) {
      console.warn('Backend startSimulation failed, running autonomous local mode:', err.message);
    }
  };

  const handlePause = async () => {
    setIsRunning(false);
    try {
      await api.pauseSimulation();
    } catch (err) {
      console.warn('Backend pauseSimulation failed:', err.message);
    }
  };

  const handleStep = async () => {
    try {
      const res = await api.stepSimulation();
      setSimState(res.data);
    } catch (err) {
      setSimState((prev) => stepLocalSimulation(prev, buildingComplexity));
    }
  };

  const handleReset = async (numDrones = droneCount, seed = 42, complexity = buildingComplexity) => {
    setDroneCount(numDrones);
    setBuildingComplexity(complexity);
    try {
      await api.resetSimulation(numDrones, seed, complexity);
      await fetchInitialState();
    } catch (err) {
      setSimState(createDefaultSimulationState(numDrones, complexity));
    }
  };

  const handleSpeedChange = async (speed) => {
    setSimSpeed(speed);
    try {
      await api.setSimulationSpeed(speed);
    } catch (err) {
      console.warn('Backend speed change failed:', err.message);
    }
  };

  const handleInjectFault = async (payload) => {
    try {
      const res = await api.injectFault(payload);
      return res.data;
    } catch (err) {
      // Local fault injection
      setSimState((prev) => {
        if (!prev || !prev.drones) return prev;
        const drones = prev.drones.map((d) => {
          if (d.drone_id === payload.droneId) {
            return {
              ...d,
              operational_status: 'DEGRADED',
              current_role: 'Communication relay',
              role_adapted: true,
              battery_drain_rate: 0.10,
              speed: 8.0,
              adaptation_reason: `Hardware fault on ${payload.component}: adapted to Communication relay`
            };
          }
          return d;
        });
        return {
          ...prev,
          drones,
          recent_events: [
            {
              eventType: 'ROLE_CHANGED',
              droneId: payload.droneId,
              newRole: 'Communication relay',
              reason: `Failure in ${payload.component}`,
              timestamp: prev.sim_time
            },
            ...(prev.recent_events || [])
          ]
        };
      });
      return { success: true };
    }
  };

  const handleClearFault = async (droneId, component) => {
    try {
      const res = await api.clearFault({ droneId, component });
      return res.data;
    } catch (err) {
      setSimState((prev) => {
        if (!prev || !prev.drones) return prev;
        const drones = prev.drones.map((d) => {
          if (d.drone_id === droneId) {
            return {
              ...d,
              operational_status: 'HEALTHY',
              current_role: d.initial_role || 'Search and exploration',
              role_adapted: false,
              battery_drain_rate: 0.35,
              speed: 16.0
            };
          }
          return d;
        });
        return { ...prev, drones };
      });
      return { success: true };
    }
  };

  const handleUpdateEnvironment = async (params) => {
    try {
      const res = await api.updateEnvironment(params);
      return res.data;
    } catch (err) {
      return { success: true };
    }
  };

  const selectedDroneState =
    simState?.detailed_drone_states?.[selectedDroneId] ||
    simState?.drones?.find((d) => d.drone_id === selectedDroneId) ||
    null;

  return (
    <SwarmContext.Provider
      value={{
        simState,
        isRunning,
        simSpeed,
        selectedDroneId,
        setSelectedDroneId,
        selectedDroneState,
        droneCount,
        setDroneCount,
        buildingComplexity,
        setBuildingComplexity,
        connectionStatus,
        eventLog,
        loading,
        handleStart,
        handlePause,
        handleStep,
        handleReset,
        handleSpeedChange,
        handleInjectFault,
        handleClearFault,
        handleUpdateEnvironment,
        refreshState: fetchInitialState
      }}
    >
      {children}
    </SwarmContext.Provider>
  );
};

export const useSwarm = () => {
  const context = useContext(SwarmContext);
  if (!context) {
    throw new Error('useSwarm must be used within a SwarmProvider');
  }
  return context;
};

