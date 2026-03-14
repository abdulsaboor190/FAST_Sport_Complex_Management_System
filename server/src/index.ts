import http from 'http';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config.js';
import { prisma } from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import facilitiesRoutes from './routes/facilities.js';
import bookingsRoutes from './routes/bookings.js';
import tournamentsRoutes from './routes/tournaments.js';
import teamsRoutes from './routes/teams.js';
import equipmentRoutes from './routes/equipment.js';
import coachesRoutes from './routes/coaches.js';
import eventsRoutes from './routes/events.js';
import analyticsRoutes from './routes/analytics.js';
import { startReportScheduler } from './jobs/reportScheduler.js';
import issuesRoutes from './routes/issues.js';

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: { origin: config.clientUrl, credentials: true },
  path: '/socket.io',
});
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('subscribe:facility', (data: { facilityId: string; date: string }) => {
    if (data?.facilityId && data?.date) {
      socket.join(`facility:${data.facilityId}:${data.date}`);
    }
  });
  socket.on('unsubscribe:facility', (data: { facilityId: string; date: string }) => {
    if (data?.facilityId && data?.date) {
      socket.leave(`facility:${data.facilityId}:${data.date}`);
    }
  });
});

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'blob:', '*'],
        'connect-src': ["'self'", '*', 'ws:', 'wss:'],
      },
    },
  })
);

const uploadsPath = path.resolve(config.uploadDir);
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/tournaments', tournamentsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/coaches', coachesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/issues', issuesRoutes);

// Helpful routes when you accidentally open the API port in browser
app.get('/', (_req, res) => {
  res
    .status(200)
    .type('html')
    .send(
      `<!doctype html><html><head><meta charset="utf-8"/><title>FSCM API</title></head><body style="font-family:system-ui;padding:24px"><h2>FSCM API is running</h2><p>Open the web app at <a href="${config.clientUrl}">${config.clientUrl}</a>.</p><p>Health check: <a href="/api/health">/api/health</a></p></body></html>`
    );
});

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health/db', async (_req, res) => {
  try {
    // Quick connectivity check
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err: unknown) {
    console.error('DB health check failed:', err);
    res.status(500).json({
      status: 'error',
      db: 'disconnected',
      message:
        'Cannot connect to PostgreSQL. Check that the service is running and server/.env DATABASE_URL is correct.',
    });
  }
});

// Serve static files from the React frontend app
const clientDistPath = path.resolve('..', 'client', 'dist');
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).json({ message: 'Not found' });
    }
  });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

server.listen(config.port, () => {
  console.log(`FSCM API running at http://localhost:${config.port}`);
  startReportScheduler();
});
