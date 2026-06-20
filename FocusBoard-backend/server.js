import path from 'path';
import { randomUUID } from 'crypto';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import logger from './utils/logger.js';
import config from './config/index.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const isPrimaryWorker = true;

if (config.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

const corsOptionsDelegate = (origin, callback) => {
  if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  }
};
// Routes
import activityRoutes from './routes/activityRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import authRoutes from './routes/authRoutes.js';
import activityMappingRoutes from './routes/activityMappingRoutes.js';
import categoryGoalRoutes from './routes/categoryGoalRoutes.js';
import issueTypeRoutes from './routes/issueTypeRoutes.js';
import supportTicketRoutes from './routes/supportTicketRoutes.js';
import ticketResolutionRoutes from './routes/ticketResolutionRoutes.js';
import userFeedbackRoutes from './routes/userFeedbackRoutes.js';
import trackingRuleRoutes from './routes/trackingRuleRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import inviteRoutes from './routes/inviteRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import metricsRoutes from './routes/metricsRoutes.js';

// Power User Features
import projectRuleRoutes from './routes/projectRuleRoutes.js';
import zenModeRoutes from './routes/zenModeRoutes.js';
import advancedAnalyticsRoutes from './routes/advancedAnalyticsRoutes.js';

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: corsOptionsDelegate,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  })
);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Required for some CORS setups
  hsts: config.ENFORCE_HTTPS
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
}));

if (config.ENFORCE_HTTPS) {
  app.use((req, res, next) => {
    if (req.path === '/health') return next();
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    if (proto !== 'https') {
      return res.status(400).json({ success: false, message: 'HTTPS required.' });
    }
    next();
  });
}

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOptionsDelegate,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }
});

// Make io accessible in routes
app.set('io', io);

io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

app.use(express.json({ limit: '10mb' }));

// ── Database (NeDB embedded) ─────────────────────────────────────────────────
import { startBackgroundJobs } from './services/backgroundCategorization.js';
import { startCronService } from './services/cronService.js';
if (isPrimaryWorker) {
  startBackgroundJobs();
  startCronService();
}

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isNaN(config.RATE_LIMIT_MAX) ? 1500 : config.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.user && req.user.id) return `user:${req.user.id}`;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        if (decoded?.id) return `user:${decoded.id}`;
      } catch (error) {
        // fall through to IP-based key
      }
    }
    return ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    res.status(429).json({
      success: false,
      message: options.message,
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  },
  skip: (req) => {
    return req.path === '/health' || req.path === '/';
  }
});
app.use('/api', apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/activities', activityRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/activity-mappings', activityMappingRoutes);
app.use('/api/category-goals', categoryGoalRoutes);
app.use('/api/issue-types', issueTypeRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/ticket-resolutions', ticketResolutionRoutes);
app.use('/api/user-feedback', userFeedbackRoutes);
app.use('/api/tracking-rules', trackingRuleRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/metrics', metricsRoutes);

// Power User Routes
app.use('/api/project-rules', projectRuleRoutes);
app.use('/api/zen-mode', zenModeRoutes);
app.use('/api/advanced-analytics', advancedAnalyticsRoutes);

// Root route
app.get('/', (_req, res) =>
  res.json({ message: 'FocusBoard API' })
);

app.get('/health', (_req, res) =>
  res.json({
    status: 'ok',
    database: 'connected',
    storage: 'nedb',
    timestamp: new Date().toISOString(),
  })
);

// Expose Prometheus metrics
import { register } from './utils/metrics.js';
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (e) {
    res.status(500).send('Failed to collect metrics');
  }
});

// ── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────────────────
const PORT = config.PORT;
server.listen(PORT, () => {
  logger.info(`FocusBoard API running on http://localhost:${PORT}`);
});

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
