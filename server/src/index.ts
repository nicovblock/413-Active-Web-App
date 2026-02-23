import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './db/database.js';
import authRouter from './routes/auth.js';
import clientRouter from './routes/client.js';
import { authenticate, type AuthedRequest } from './middleware/auth.js';
import { createCoachRouter } from './routes/coach.js';
import { logger } from './utils/logger.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173', credentials: true }
});

app.use(helmet());
app.use(rateLimit({ windowMs: 60_000, limit: 120 }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  logger.info('http_request', { method: req.method, path: req.path });
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/client', clientRouter);
app.use('/api/coach', createCoachRouter(io));

app.get('/api/workouts', authenticate, (req: AuthedRequest, res) => {
  const room = req.user?.role === 'client' ? `client:${req.user.userId}` : `coach:${req.user?.userId}`;
  res.json({ room, message: 'Connected user context available for realtime updates.' });
});

io.use((socket, next) => {
  const { userId, role } = socket.handshake.auth as { userId?: number; role?: 'client' | 'coach' };
  if (!userId || !role) return next(new Error('Unauthorized'));
  socket.join(`${role}:${userId}`);
  if (role === 'client') socket.join(`client:${userId}`);
  return next();
});

io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Realtime channel connected' });
});

if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  app.use(express.static(clientDistPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

const port = Number(process.env.PORT || 4000);
httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  logger.info('server_started', { port });
});
