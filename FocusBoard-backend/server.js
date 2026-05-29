const path = require('path');
const cluster = require('cluster');
const os = require('os');
const { randomUUID } = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const logger = require('./utils/logger');
const config = require('./config');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const WORKERS = Math.max(1, Number.parseInt(process.env.WORKERS || '1', 10) || 1);

if (cluster.isPrimary) {
  const cpuCount = os.cpus().length;
  const workerCount = Math.min(WORKERS, cpuCount);
  logger.info(`Primary ${process.pid} running. Spawning ${workerCount} workers (requested ${WORKERS}, CPUs ${cpuCount}).`);

  for (let i = 0; i < workerCount; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} exited (code ${code}, signal ${signal}). Restarting...`);
    cluster.fork();
  });
} else {

const app = express();
const isPrimaryWorker = cluster.worker && cluster.worker.id === 1;

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
const activityRoutes = require('./routes/activityRoutes');
const goalRoutes = require('./routes/goalRoutes');
const eventRoutes = require('./routes/eventRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const leadRoutes = require('./routes/leadRoutes');
const authRoutes = require('./routes/authRoutes');
const activityMappingRoutes = require('./routes/activityMappingRoutes');
const categoryGoalRoutes = require('./routes/categoryGoalRoutes');
const issueTypeRoutes = require('./routes/issueTypeRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const ticketResolutionRoutes = require('./routes/ticketResolutionRoutes');
const userFeedbackRoutes = require('./routes/userFeedbackRoutes');
const trackingRuleRoutes = require('./routes/trackingRuleRoutes');
const projectRoutes = require('./routes/projectRoutes');
const clientRoutes = require('./routes/clientRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const taskRoutes = require('./routes/taskRoutes');
const teamRoutes = require('./routes/teamRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const metricsRoutes = require('./routes/metricsRoutes');

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
const { startBackgroundJobs } = require('./services/backgroundCategorization');
if (isPrimaryWorker) {
  startBackgroundJobs();
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

// Root route
app.get('/', (_req, res) =>
  res.json({ message: 'FocusBoard API', version: '1.0.0' })
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
const { register } = require('./utils/metrics');
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

}
