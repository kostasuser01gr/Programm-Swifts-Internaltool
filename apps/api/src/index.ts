import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Env, AuthContext } from './types';
import { authMiddleware } from './middleware/auth';
import { rateLimiter, authRateLimiter } from './middleware/rateLimit';
import { failClosedGuard } from './middleware/failClosed';
import { AuditEntrySchema } from '@repo/shared';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import tableRoutes from './routes/tables';
import adminRoutes from './routes/admin';

// ─── App Setup ──────────────────────────────────────────────

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };
const app = new Hono<AppEnv>();

// ─── Global Middleware ──────────────────────────────────────

// Security headers
app.use('*', secureHeaders());

// CORS — allow frontend origins (uses ALLOWED_ORIGINS env, falls back to CORS_ORIGIN)
app.use('*', async (c, next) => {
  const allowed = c.env.ALLOWED_ORIGINS || c.env.CORS_ORIGIN || '*';
  const origins = allowed === '*' ? '*' : allowed.split(',').map((o) => o.trim());
  const corsMiddleware = cors({
    origin: origins,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400,
  });
  return corsMiddleware(c, next);
});

// Fail-closed guard (blocks when approaching free-tier limits)
app.use('*', failClosedGuard());

// Rate limiting
app.use('/api/*', rateLimiter());

// ─── Health Check ───────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({
    ok: true,
    version: c.env.VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// ─── Audit Endpoint ─────────────────────────────────────────
app.post('/v1/audit', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) {
    return c.json({ ok: false, error: 'Invalid JSON body' }, 400);
  }
  const result = AuditEntrySchema.safeParse(body);
  if (!result.success) {
    return c.json(
      { ok: false, error: result.error.issues.map((i) => i.message).join(', ') },
      422
    );
  }
  const id = crypto.randomUUID();
  // In production, persist to D1 — for now return the generated ID
  return c.json({
    ok: true,
    id,
    timestamp: new Date().toISOString(),
  }, 201);
});

// ─── Auth Routes (public + auth rate limiter) ───────────────
app.use('/api/auth/login', authRateLimiter());
app.use('/api/auth/register', authRateLimiter());
app.route('/api/auth', authRoutes);

// ─── Protected Routes ───────────────────────────────────────
app.use('/api/*', authMiddleware());

// Data routes
app.route('/api/workspaces', workspaceRoutes);
app.route('/api/tables', tableRoutes);

// Admin routes
app.route('/api/admin', adminRoutes);

// ─── 404 Fallback ───────────────────────────────────────────
app.notFound((c) => {
  return c.json({ ok: false, error: 'Not found' }, 404);
});

// ─── Error Handler ──────────────────────────────────────────
app.onError((err, c) => {
  console.error('[API Error]', err.message, err.stack);
  return c.json(
    {
      ok: false,
      error: c.env.ENVIRONMENT === 'production' ? 'Internal server error' : err.message,
    },
    500
  );
});

export default app;
