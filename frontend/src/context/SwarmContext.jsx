import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { socket } from '../services/socket';
import * as api from '../services/api';

const SwarmContext = createContext(null);

export const SwarmProvider = ({ children }) => {
  const [simState, setSimState] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1.0);
  const [selectedDroneId, setSelectedDroneId] = useState('UAV-Alpha');
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [eventLog, setEventLog] = useState([]);

  // Fetch initial state
  const fetchInitialState = useCallback(async () => {
    try {
      const res = await api.getSimulationStatus();
      if (res.data) {
        setIsRunning(res.data.isRunning);
        setSimSpeed(res.data.speed || 1.0);
        if (res.data.state) {
          setSimState(res.data.state);
        }
      }
      setLoading(false);
    } catch (err) {
      console.warn('Initial state fetch error:', err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialState();

    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('telemetry_update', (data) => {
      setSimState(data);
      if (data.recent_events && data.recent_events.length > 0) {
        setEventLog((prev) => {
          const newEvents = data.recent_events.filter(
            (e) => !prev.some((p) => p.timestamp === e.timestamp && p.eventType === e.eventType)
          );
          return [...newEvents, ...prev].slice(0, 50);
        });
      }
    });

    socket.on('simulation_status', (data) => {
      setIsRunning(data.isRunning);
      if (data.speed) setSimSpeed(data.speed);
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('telemetry_update');
      socket.off('simulation_status');
    };
  }, [fetchInitialState]);

  const handleStart = async () => {
    try {
      await api.startSimulation();
      setIsRunning(true);
    } catch (err) {
      console.error('Start error:', err);
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseSimulation();
      setIsRunning(false);
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const handleStep = async () => {
    try {
      const res = await api.stepSimulation();
      setSimState(res.data);
    } catch (err) {
      console.error('Step error:', err);
    }
  };

  const handleReset = async (numDrones = 6, seed = 42) => {
    try {
      await api.resetSimulation(numDrones, seed);
      await fetchInitialState();
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleSpeedChange = async (speed) => {
    try {
      await api.setSimulationSpeed(speed);
      setSimSpeed(speed);
    } catch (err) {
      console.error('Speed change error:', err);
    }
  };

  const handleInjectFault = async (payload) => {
    try {
      const res = await api.injectFault(payload);
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const handleClearFault = async (droneId, component) => {
    try {
      const res = await api.clearFault({ droneId, component });
      return res.data;
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateEnvironment = async (params) => {
    try {
      const res = await api.updateEnvironment(params);
      return res.data;
    } catch (err) {
      throw err;
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
