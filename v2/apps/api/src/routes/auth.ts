import { Hono } from 'hono';
import { loginSchema, registerSchema } from '@dataos/shared';
import type { AppEnv } from '../types';
import { hashPassword, verifyPassword, generateToken, hashToken, generateId } from '../utils/crypto';

const auth = new Hono<AppEnv>();

// ─── POST /auth/register ────────────────────────────────────
auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = registerSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  const { email, password, display_name } = result.data;
  const env = c.env;

  // Check user limit
  const countRow = await env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>();
  const maxUsers = parseInt(env.MAX_USERS, 10) || 50;
  if ((countRow?.cnt ?? 0) >= maxUsers) {
    return c.json({ ok: false, error: `Maximum user limit (${maxUsers}) reached` }, 403);
  }

  // Check duplicate
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ ok: false, error: 'Email already registered' }, 409);
  }

  const userId = generateId('usr');
  const passwordHash = await hashPassword(password);
  const isFirstUser = (countRow?.cnt ?? 0) === 0;

  await env.DB.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
  )
    .bind(userId, email, display_name, passwordHash, isFirstUser ? 'admin' : 'user')
    .run();

  // Create session
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId('ses');
  const ttl = parseInt(env.SESSION_TTL_SECONDS, 10) || 86400;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, userId, tokenHash, c.req.header('CF-Connecting-IP') ?? '', expiresAt)
    .run();

  const secure = env.ENVIRONMENT !== 'development';
  const cookie = `session_token=${token}; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Max-Age=${ttl}`;

  return c.json(
    {
      ok: true,
      data: {
        user: { id: userId, email, display_name, role: isFirstUser ? 'admin' : 'user', avatar_url: null },
        token,
      },
    },
    201,
    { 'Set-Cookie': cookie },
  );
});

// ─── POST /auth/login ───────────────────────────────────────
auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  const { email, password } = result.data;
  const env = c.env;

  const user = await env.DB.prepare(
    'SELECT id, email, display_name, password_hash, role, avatar_url, is_active FROM users WHERE email = ?',
  )
    .bind(email)
    .first<{ id: string; email: string; display_name: string; password_hash: string; role: string; avatar_url: string | null; is_active: number }>();

  if (!user) {
    return c.json({ ok: false, error: 'Invalid credentials' }, 401);
  }

  if (!user.is_active) {
    return c.json({ ok: false, error: 'Account disabled' }, 403);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ ok: false, error: 'Invalid credentials' }, 401);
  }

  const token = generateToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId('ses');
  const ttl = parseInt(env.SESSION_TTL_SECONDS, 10) || 86400;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
    .bind(sessionId, user.id, tokenHash, c.req.header('CF-Connecting-IP') ?? '', c.req.header('User-Agent') ?? '', expiresAt)
    .run();

  const secure = env.ENVIRONMENT !== 'development';
  const cookie = `session_token=${token}; Path=/; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Max-Age=${ttl}`;

  return c.json(
    {
      ok: true,
      data: {
        user: { id: user.id, email: user.email, display_name: user.display_name, role: user.role, avatar_url: user.avatar_url },
        token,
      },
    },
    200,
    { 'Set-Cookie': cookie },
  );
});

// ─── POST /auth/logout ──────────────────────────────────────
auth.post('/logout', async (c) => {
  const authCtx = c.get('auth');
  if (authCtx?.session) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(authCtx.session.id).run();
  }
  const cookie = 'session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
  return c.json({ ok: true }, 200, { 'Set-Cookie': cookie });
});

// ─── GET /auth/me ───────────────────────────────────────────
auth.get('/me', async (c) => {
  const authCtx = c.get('auth');
  if (!authCtx) {
    return c.json({ ok: false, error: 'Not authenticated' }, 401);
  }
  return c.json({
    ok: true,
    data: {
      user: {
        id: authCtx.user.id,
        email: authCtx.user.email,
        display_name: authCtx.user.display_name,
        role: authCtx.user.role,
        avatar_url: authCtx.user.avatar_url,
      },
    },
  });
});

export default auth;
