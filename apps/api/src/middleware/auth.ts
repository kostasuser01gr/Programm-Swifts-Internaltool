import { Hono } from 'hono';
import type { Env, AuthContext, User, Session } from '../types';
import { hashToken } from '../utils/crypto';

// ─── Auth Middleware ─────────────────────────────────────────
// Validates session cookie, attaches user to context

type AuthEnv = { Bindings: Env; Variables: { auth: AuthContext } };

export function authMiddleware() {
  return async (c: { req: { header: (name: string) => string | undefined }; env: Env; set: (key: string, value: unknown) => void; json: (body: unknown, status?: number) => Response }, next: () => Promise<void>) => {
    const env = c.env;

    // Extract token from cookie or Authorization header
    const cookieHeader = c.req.header('Cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [k, ...v] = c.trim().split('=');
        return [k, v.join('=')];
      })
    );
    let token = cookies['session_token'];

    if (!token) {
      const authHeader = c.req.header('Authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return c.json({ ok: false, error: 'Authentication required' }, 401);
    }

    // Lookup session
    const tokenHash = await hashToken(token);
    const session = await env.DB.prepare(
      `SELECT s.*, u.id as uid, u.email, u.display_name, u.role, u.avatar_url, u.is_active
       FROM sessions s JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND s.expires_at > datetime('now')`
    )
      .bind(tokenHash)
      .first<Session & { uid: string; email: string; display_name: string; role: string; avatar_url: string | null; is_active: number }>();

    if (!session) {
      return c.json({ ok: false, error: 'Invalid or expired session' }, 401);
    }

    if (!session.is_active) {
      return c.json({ ok: false, error: 'Account disabled' }, 403);
    }

    const user: User = {
      id: session.uid,
      email: session.email,
      display_name: session.display_name,
      role: session.role as User['role'],
      avatar_url: session.avatar_url,
      is_active: Boolean(session.is_active),
      created_at: '',
      updated_at: '',
    };

    c.set('auth', { user, session: { id: session.id, user_id: session.user_id, token_hash: session.token_hash, expires_at: session.expires_at, created_at: session.created_at } });
    await next();
  };
}

// ─── Admin-Only Middleware ───────────────────────────────────

export function adminOnly() {
  return async (c: { get: (key: string) => unknown; json: (body: unknown, status?: number) => Response }, next: () => Promise<void>) => {
    const auth = c.get('auth') as AuthContext;
    if (auth.user.role !== 'admin') {
      return c.json({ ok: false, error: 'Admin access required' }, 403);
    }
    await next();
  };
}
