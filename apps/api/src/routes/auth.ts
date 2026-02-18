import { Hono } from 'hono';
import type { Env, AuthContext, User } from '../types';
import { hashPassword, verifyPassword, generateToken, hashToken, generateId } from '../utils/crypto';
import { validateLogin, validateRegister } from '../utils/validate';
import { trackUsage } from '../middleware/failClosed';

type AuthEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const auth = new Hono<AuthEnv>();

// ─── POST /auth/register ────────────────────────────────────
auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateRegister(body);
  if (!validation.ok) {
    return c.json({ ok: false, errors: validation.errors }, 400);
  }

  const { email, password, display_name } = validation.data;
  const env = c.env;

  // Check user limit (fail-closed)
  const userCount = await env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>();
  const maxUsers = parseInt(env.MAX_USERS, 10) || 50;
  if ((userCount?.cnt ?? 0) >= maxUsers) {
    return c.json({ ok: false, error: `Maximum user limit (${maxUsers}) reached` }, 403);
  }

  // Check duplicate
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ ok: false, error: 'Email already registered' }, 409);
  }

  // Create user
  const userId = generateId('usr');
  const passwordHash = await hashPassword(password);
  const isFirstUser = (userCount?.cnt ?? 0) === 0;

  await env.DB.prepare(
    `INSERT INTO users (id, email, display_name, password_hash, role, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`
  )
    .bind(userId, email, display_name, passwordHash, isFirstUser ? 'admin' : 'user')
    .run();

  await trackUsage(env, 'd1_writes', 1);

  // Create session
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId('ses');
  const ttl = parseInt(env.SESSION_TTL_SECONDS, 10) || 86400;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  )
    .bind(sessionId, userId, tokenHash, c.req.header('CF-Connecting-IP') || '', expiresAt)
    .run();

  // Audit log
  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'register', 'user', ?, ?)`
  )
    .bind(generateId('aud'), userId, userId, c.req.header('CF-Connecting-IP') || '')
    .run();

  await trackUsage(env, 'd1_writes', 2);

  // Set cookie
  const cookie = `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttl}`;

  return c.json(
    {
      ok: true,
      data: {
        user: { id: userId, email, display_name, role: isFirstUser ? 'admin' : 'user' },
        token,
      },
    },
    201,
    { 'Set-Cookie': cookie }
  );
});

// ─── POST /auth/login ───────────────────────────────────────
auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateLogin(body);
  if (!validation.ok) {
    return c.json({ ok: false, errors: validation.errors }, 400);
  }

  const { email, password } = validation.data;
  const env = c.env;

  await trackUsage(env, 'd1_reads', 1);

  const user = await env.DB.prepare(
    'SELECT id, email, display_name, password_hash, role, avatar_url, is_active FROM users WHERE email = ?'
  )
    .bind(email)
    .first<User & { password_hash: string }>();

  if (!user) {
    return c.json({ ok: false, error: 'Invalid credentials' }, 401);
  }

  if (!user.is_active) {
    return c.json({ ok: false, error: 'Account disabled' }, 403);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    // Audit failed login
    await env.DB.prepare(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, ?, 'login_failed', 'auth', ?, '{"reason":"invalid_password"}', ?)`
    )
      .bind(generateId('aud'), user.id, user.id, c.req.header('CF-Connecting-IP') || '')
      .run();
    return c.json({ ok: false, error: 'Invalid credentials' }, 401);
  }

  // Create session
  const token = generateToken();
  const tokenHash = await hashToken(token);
  const sessionId = generateId('ses');
  const ttl = parseInt(env.SESSION_TTL_SECONDS, 10) || 86400;
  const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(sessionId, user.id, tokenHash, c.req.header('CF-Connecting-IP') || '', c.req.header('User-Agent') || '', expiresAt)
    .run();

  // Audit
  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'login', 'auth', ?, ?)`
  )
    .bind(generateId('aud'), user.id, user.id, c.req.header('CF-Connecting-IP') || '')
    .run();

  await trackUsage(env, 'd1_writes', 2);

  const cookie = `session_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${ttl}`;

  return c.json(
    {
      ok: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          role: user.role,
          avatar_url: user.avatar_url,
        },
        token,
      },
    },
    200,
    { 'Set-Cookie': cookie }
  );
});

// ─── POST /auth/logout ──────────────────────────────────────
auth.post('/logout', async (c) => {
  const auth = c.get('auth') as AuthContext | undefined;
  if (auth?.session) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(auth.session.id).run();
    await c.env.DB.prepare(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
       VALUES (?, ?, 'logout', 'auth', ?, ?)`
    )
      .bind(generateId('aud'), auth.user.id, auth.user.id, c.req.header('CF-Connecting-IP') || '')
      .run();
  }

  const cookie = 'session_token=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
  return c.json({ ok: true }, 200, { 'Set-Cookie': cookie });
});

// ─── GET /auth/me ───────────────────────────────────────────
auth.get('/me', async (c) => {
  const auth = c.get('auth') as AuthContext | undefined;
  if (!auth) {
    return c.json({ ok: false, error: 'Not authenticated' }, 401);
  }

  return c.json({
    ok: true,
    data: {
      id: auth.user.id,
      email: auth.user.email,
      display_name: auth.user.display_name,
      role: auth.user.role,
      avatar_url: auth.user.avatar_url,
    },
  });
});

export default auth;
