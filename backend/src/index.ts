import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { OrderFlowDatabase } from './database/schema.js';
import { KalshiService } from './services/kalshiService.js';
import { OrderFlowMonitor } from './services/orderFlowMonitor.js';
import { createApiRouter } from './routes/api.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const DB_PATH = process.env.DB_PATH || join(__dirname, '../data/orderflow.db');

// Middleware
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

// Initialize services
const db = new OrderFlowDatabase(DB_PATH);
const kalshiService = new KalshiService(
  process.env.KALSHI_API_KEY || '',
  process.env.KALSHI_PRIVATE_KEY || '',
  process.env.KALSHI_ENVIRONMENT || 'demo'
);

const monitor = new OrderFlowMonitor(kalshiService, db);

// WebSocket connections for real-time updates
const clients = new Set<any>();

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast order flow updates to all connected clients
monitor.on('orderFlow', (orderFlow) => {
  const message = JSON.stringify({ type: 'orderFlow', data: orderFlow });
  clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
});

// API routes
app.use('/api', createApiRouter(kalshiService, db, monitor));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: Date.now(),
    kalshiConnected: kalshiService.getIsConnected(),
    monitoredMarkets: monitor.getMonitoredMarkets().length
  });
});

// Initialize and start
async function start() {
  try {
    // Connect to Kalshi
    await kalshiService.connect();

    // Start monitoring
    await monitor.startMonitoring();

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 WebSocket server ready for connections`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  monitor.stop();
  db.close();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

start();
