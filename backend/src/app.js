import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import config from './config/index.js';
import authRoutes from './routes/auth.routes.js';
import casesRoutes from './routes/cases.routes.js';
import documentsRoutes from './routes/documents.routes.js';
import qaRoutes from './routes/qa.routes.js';
import policiesRoutes from './routes/policies.routes.js';
import auditRoutes from './routes/audit.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import fclRoutes from './routes/fcl.routes.js';
import travelRoutes from './routes/travel.routes.js';
import violationsRoutes from './routes/violations.routes.js';
import contentRoutes from './routes/content.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import { requireAdmin } from './middleware/require-admin.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { apiLimiter, loginLimiter } from './middleware/rate-limit.js';

const app = express();

// Security headers — relax CSP for /cms (Payload admin loads its own scripts/styles)
app.use('/cms', helmet({ contentSecurityPolicy: false }));
app.use(helmet());

// CORS — only allow localhost in development
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const origins = [...ALLOWED_ORIGINS];
if (config.nodeEnv === 'development') {
  origins.push('http://localhost:5173', 'http://localhost:3000');
}

app.use(cors({
  origin: origins,
  credentials: true,
}));

// Global API rate limiter
app.use('/api/', apiLimiter);

// CMS proxy — must be mounted BEFORE body parsing (proxy handles its own body)
const PAYLOAD_TARGET = process.env.PAYLOAD_URL || 'http://localhost:3002';
app.use(
  '/cms',
  requireAdmin,
  createProxyMiddleware({
    target: PAYLOAD_TARGET,
    changeOrigin: true,
    ws: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes — login limiter on auth
app.use('/api/v1/auth', loginLimiter, authRoutes);
app.use('/api/v1/subjects', subjectsRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/qa', qaRoutes);
app.use('/api/v1/policies', policiesRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/fcl', fclRoutes);
app.use('/api/v1/travel', travelRoutes);
app.use('/api/v1/violations', violationsRoutes);
app.use('/api/v1/content', contentRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
