import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from './types';
import { authMiddleware } from './middleware/auth';
import { rateLimiter, authRateLimiter } from './middleware/rate-limit';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import tableRoutes from './routes/tables';

const app = new Hono<AppEnv>();

// ─── CORS ───────────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: (origin, c) => c.env.CORS_ORIGIN || origin,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  }),
);

// ─── Global rate limiter ────────────────────────────────────
app.use('*', rateLimiter());

// ─── Health ─────────────────────────────────────────────────
app.get('/api/health', (c) => c.json({ ok: true, version: 'v2', timestamp: new Date().toISOString() }));

// ─── Auth routes (stricter rate limit, session optional for login/register) ──
app.use('/api/auth/*', authRateLimiter());
app.route('/api/auth', authRoutes);

// ─── Authenticated routes ───────────────────────────────────
app.use('/api/*', authMiddleware);
app.route('/api/workspaces', workspaceRoutes);
app.route('/api/tables', tableRoutes);

// ─── Global error handler ───────────────────────────────────
app.onError((err, c) => {
  console.error('[API Error]', err.message, err.stack);

  if (err.message?.includes('D1_ERROR') || err.message?.includes('quota')) {
    return c.json({ ok: false, error: 'Service temporarily unavailable. Please retry later.' }, 503);
  }

  return c.json({ ok: false, error: 'Internal server error' }, 500);
});

// ─── 404 ────────────────────────────────────────────────────
app.notFound((c) => c.json({ ok: false, error: 'Not found' }, 404));

export default app;
