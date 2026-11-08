import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { configureSockets } from './sockets/socketHandler.js';
import { checkPythonServiceHealth } from './services/pythonClient.js';

import simulationRoutes from './routes/simulationRoutes.js';
import droneRoutes from './routes/droneRoutes.js';
import faultRoutes from './routes/faultRoutes.js';
import coordinationRoutes from './routes/coordinationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Sockets with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', limiter);

// Mount API routes
app.use('/api/simulation', simulationRoutes);
app.use('/api/drones', droneRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/coordination', coordinationRoutes);
app.use('/api/analytics', analyticsRoutes);

// System health check
app.get('/api/health', async (req, res) => {
  const pyHealth = await checkPythonServiceHealth();
  res.json({
    status: 'healthy',
    backend: 'Express Node.js',
    python_service: pyHealth,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Backend Error]:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Configure Socket.IO
configureSockets(io);

// Connect DB & Start Server
const PORT = process.env.PORT || 5001;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`[Backend Server] Running on http://localhost:${PORT}`);
    console.log(`[Socket.IO Gateway] Ready for live telemetry streaming`);
  });
});
