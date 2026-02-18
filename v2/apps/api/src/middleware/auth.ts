import type { Context, Next } from 'hono';
import type { AppEnv, Env } from '../types';
import { hashToken } from '../utils/crypto';

// ─── Auth Middleware ─────────────────────────────────────────
// Extracts session token from cookie or Bearer header, validates, attaches user.

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const env = c.env as Env;

  // Extract token from cookie first, then Authorization header
  const cookieHeader = c.req.header('Cookie') ?? '';
  const cookies = parseCookies(cookieHeader);
  let token = cookies['session_token'];

  if (!token) {
    const authHeader = c.req.header('Authorization') ?? '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return c.json({ ok: false, error: 'Authentication required' }, 401);
  }

  const tokenHash = await hashToken(token);
  const session = await env.DB.prepare(
    `SELECT s.id, s.user_id, s.token_hash, s.expires_at, s.created_at,
            u.id as uid, u.email, u.display_name, u.role, u.avatar_url, u.is_active
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token_hash = ? AND s.expires_at > datetime('now')`,
  )
    .bind(tokenHash)
    .first<{
      id: string; user_id: string; token_hash: string; expires_at: string; created_at: string;
      uid: string; email: string; display_name: string; role: string; avatar_url: string | null; is_active: number;
    }>();

  if (!session) {
    return c.json({ ok: false, error: 'Invalid or expired session' }, 401);
  }

  if (!session.is_active) {
    return c.json({ ok: false, error: 'Account disabled' }, 403);
  }

  c.set('auth', {
    user: {
      id: session.uid,
      email: session.email,
      display_name: session.display_name,
      role: session.role as 'admin' | 'user',
      avatar_url: session.avatar_url,
      is_active: Boolean(session.is_active),
    },
    session: {
      id: session.id,
      user_id: session.user_id,
      token_hash: session.token_hash,
      expires_at: session.expires_at,
      created_at: session.created_at,
    },
  });

  await next();
}

// ─── Admin-Only Middleware ───────────────────────────────────

export async function adminOnly(c: Context<AppEnv>, next: Next) {
  const auth = c.get('auth');
  if (auth.user.role !== 'admin') {
    return c.json({ ok: false, error: 'Admin access required' }, 403);
  }
  await next();
}

// ─── Cookie parser ──────────────────────────────────────────

function parseCookies(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) result[k] = v.join('=');
  }
  return result;
}
