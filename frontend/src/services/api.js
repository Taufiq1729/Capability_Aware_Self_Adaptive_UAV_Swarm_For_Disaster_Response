import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Simulation API
export const getSimulationStatus = () => api.get('/simulation/status');
export const startSimulation = () => api.post('/simulation/start');
export const pauseSimulation = () => api.post('/simulation/pause');
export const setSimulationSpeed = (speed) => api.post('/simulation/speed', { speed });
export const resetSimulation = (numDrones = 6, seed = 42) => api.post('/simulation/reset', { numDrones, seed });
export const stepSimulation = () => api.post('/simulation/step');
export const updateEnvironment = (params) => api.post('/simulation/environment', params);

// Drones API
export const getAllDrones = () => api.get('/drones');
export const getDroneDetails = (droneId) => api.get(`/drones/${droneId}`);

// Faults API
export const injectFault = (payload) => api.post('/faults/inject', payload);
export const clearFault = (payload) => api.post('/faults/clear', payload);
export const getFaultHistory = () => api.get('/faults/history');

// Coordination API
export const getCoordinationTopology = () => api.get('/coordination/topology');
export const getCoordinationEvents = () => api.get('/coordination/events');

// Analytics API
export const runBenchmark = (payload) => api.post('/analytics/run', payload);
export const exportBenchmarkCSV = (results) => api.post('/analytics/export-csv', { results }, { responseType: 'blob' });
export const getExperimentHistory = () => api.get('/analytics/history');
