import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env, AuthContext } from './types';
import { rateLimiter, authRateLimiter } from './middleware/rateLimit';
import { authMiddleware } from './middleware/auth';
import auth from './routes/auth';
import workspaces from './routes/workspaces';
import tables from './routes/tables';
import admin from './routes/admin';

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };

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
  })
);

// ─── Global rate limiter ────────────────────────────────────
app.use('*', rateLimiter());

// ─── Health ─────────────────────────────────────────────────
app.get('/api/health', (c) =>
  c.json({ ok: true, timestamp: new Date().toISOString() })
);

// ─── Auth routes (stricter rate limit, no session required) ─
app.use('/api/auth/*', authRateLimiter());
app.route('/api/auth', auth);

// ─── Authenticated routes ───────────────────────────────────
app.use('/api/*', authMiddleware());
app.route('/api/workspaces', workspaces);
app.route('/api/tables', tables);
app.route('/api/admin', admin);

// ─── Global error handler ───────────────────────────────────
app.onError((err, c) => {
  console.error('[Worker Error]', err.message, err.stack);

  // Map D1 quota errors to 503
  if (
    err.message?.includes('D1_ERROR') ||
    err.message?.includes('too many requests') ||
    err.message?.includes('quota')
  ) {
    return c.json(
      { ok: false, error: 'Daily quota exceeded. Please retry after 00:00 UTC.' },
      503
    );
  }

  return c.json(
    { ok: false, error: 'Internal server error' },
    500
  );
});

// ─── 404 fallback ───────────────────────────────────────────
app.notFound((c) =>
  c.json({ ok: false, error: 'Not found' }, 404)
);

export default app;
