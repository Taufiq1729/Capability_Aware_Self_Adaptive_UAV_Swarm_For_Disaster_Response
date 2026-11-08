import { simulationBridge } from '../services/simulationBridge.js';

export const configureSockets = (io) => {
  simulationBridge.setSocketIO(io);

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Immediately transmit current cached simulation state and status
    if (simulationBridge.latestState) {
      socket.emit('telemetry_update', simulationBridge.latestState);
    }
    socket.emit('simulation_status', {
      isRunning: simulationBridge.isRunning,
      speed: simulationBridge.simSpeed
    });

    socket.on('request_state', () => {
      if (simulationBridge.latestState) {
        socket.emit('telemetry_update', simulationBridge.latestState);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};
