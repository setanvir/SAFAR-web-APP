/**
 * SAFAR API Gateway — Node.js / Express
 *
 * Canonical Architectural Layer:
 *   • Proxies /api routes to FastAPI backend
 *   • Explicit CORS configuration with origin filtering
 *   • Security headers & body size limits
 *   • Rate limiting for authentication endpoints
 *   • Health & Readiness probes (/health, /ready)
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.GATEWAY_PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

// ── Environment & CORS ────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by Gateway CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ── Security Headers ──────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ── Simple In-Memory Rate Limiter for Auth ─────────────────────────────
const authRateMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_AUTH_ATTEMPTS = 30;

function authRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = authRateMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    entry.count += 1;
  }
  authRateMap.set(ip, entry);

  if (entry.count > MAX_AUTH_ATTEMPTS) {
    return res.status(429).json({
      error: 'Too many authentication attempts. Please wait a minute before retrying.'
    });
  }
  next();
}

// ── Health & Readiness Endpoints ──────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SAFAR API Gateway',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (_req, res) => {
  const backendHealthUrl = new URL('/', BACKEND_URL);
  const checkReq = http.get(backendHealthUrl, (backendRes) => {
    if (backendRes.statusCode === 200) {
      res.json({
        status: 'ready',
        gateway: 'online',
        backend: 'connected',
        backend_url: BACKEND_URL
      });
    } else {
      res.status(503).json({
        status: 'degraded',
        gateway: 'online',
        backend_status_code: backendRes.statusCode
      });
    }
  });

  checkReq.on('error', (err) => {
    res.status(503).json({
      status: 'unready',
      gateway: 'online',
      backend: 'unreachable',
      error: err.message
    });
  });

  checkReq.setTimeout(3000, () => {
    checkReq.destroy();
    res.status(504).json({
      status: 'timeout',
      gateway: 'online',
      backend: 'timeout'
    });
  });
});

// ── Apply Auth Rate Limiter ───────────────────────────────────────────
app.use('/api/auth', authRateLimiter);

// ── Proxy all /api and other routes to FastAPI Backend ────────────────
const proxyMiddleware = createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  ws: true,
  on: {
    proxyReq: (proxyReq, req) => {
      // Re-stream JSON body if parsed
      if (req.body && Object.keys(req.body).length > 0 && req.method !== 'GET') {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    error: (err, req, res) => {
      console.error(`[Gateway Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
      if (!res.headersSent) {
        res.status(502).json({
          error: 'Bad Gateway. FastAPI backend service is unavailable.',
          detail: err.message
        });
      }
    }
  }
});

app.use('/api', proxyMiddleware);

// ── Start Server ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 SAFAR API Gateway running on http://localhost:${PORT}`);
    console.log(`🔗 Forwarding all /api calls to FastAPI at ${BACKEND_URL}`);
  });
}

module.exports = app;
