import { Hono } from 'hono';
import type { Env, AuthContext } from '../types';
import { generateId } from '../utils/crypto';
import { getUsageSummary } from '../middleware/failClosed';
import { adminOnly } from '../middleware/auth';

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const admin = new Hono<AppEnv>();

// ─── All admin routes require admin role ────────────────────
admin.use('*', adminOnly());

// ─── GET /admin/users ───────────────────────────────────────
admin.get('/users', async (c) => {
  const env = c.env;

  const { results } = await env.DB.prepare(
    `SELECT id, email, display_name, role, avatar_url, is_active, created_at, updated_at
     FROM users ORDER BY created_at DESC`
  ).all();

  return c.json({ ok: true, data: results });
});

// ─── PATCH /admin/users/:id ─────────────────────────────────
admin.patch('/users/:id', async (c) => {
  const env = c.env;
  const userId = c.req.param('id');
  const auth = c.get('auth');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return c.json({ ok: false, error: 'Invalid body' }, 400);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (typeof body.role === 'string' && ['admin', 'user', 'viewer'].includes(body.role)) {
    // Cannot demote self
    if (userId === auth.user.id) {
      return c.json({ ok: false, error: 'Cannot change your own role' }, 400);
    }
    updates.push('role = ?');
    values.push(body.role);
  }

  if (typeof body.is_active === 'boolean') {
    if (userId === auth.user.id) {
      return c.json({ ok: false, error: 'Cannot deactivate yourself' }, 400);
    }
    updates.push('is_active = ?');
    values.push(body.is_active ? 1 : 0);
  }

  if (typeof body.display_name === 'string' && body.display_name.trim().length > 0) {
    updates.push('display_name = ?');
    values.push(body.display_name.trim());
  }

  if (updates.length === 0) {
    return c.json({ ok: false, error: 'No valid fields to update' }, 400);
  }

  updates.push("updated_at = datetime('now')");
  values.push(userId);

  await env.DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...values)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'update_user', 'user', ?, ?, ?)`
  )
    .bind(
      generateId('aud'),
      auth.user.id,
      userId,
      JSON.stringify(body),
      c.req.header('CF-Connecting-IP') || ''
    )
    .run();

  return c.json({ ok: true });
});

// ─── GET /admin/audit-log ───────────────────────────────────
admin.get('/audit-log', async (c) => {
  const env = c.env;
  const url = new URL(c.req.url);
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50', 10));
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  const { results } = await env.DB.prepare(
    `SELECT a.*, u.display_name as user_name
     FROM audit_log a
     LEFT JOIN users u ON a.user_id = u.id
     ORDER BY a.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const countRow = await env.DB.prepare('SELECT COUNT(*) as total FROM audit_log').first<{ total: number }>();

  return c.json({ ok: true, data: results, meta: { total: countRow?.total ?? 0 } });
});

// ─── GET /admin/usage ───────────────────────────────────────
admin.get('/usage', async (c) => {
  const summary = await getUsageSummary(c.env);
  return c.json({ ok: true, data: summary });
});

// ─── GET /admin/stats ───────────────────────────────────────
admin.get('/stats', async (c) => {
  const env = c.env;

  const [users, workspacesCount, tablesCount, recordsCount, sessionsCount] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as cnt FROM users').first<{ cnt: number }>(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM workspaces').first<{ cnt: number }>(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM tables').first<{ cnt: number }>(),
    env.DB.prepare('SELECT COUNT(*) as cnt FROM records').first<{ cnt: number }>(),
    env.DB.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE expires_at > datetime('now')").first<{ cnt: number }>(),
  ]);

  return c.json({
    ok: true,
    data: {
      users: users?.cnt ?? 0,
      workspaces: workspacesCount?.cnt ?? 0,
      tables: tablesCount?.cnt ?? 0,
      records: recordsCount?.cnt ?? 0,
      active_sessions: sessionsCount?.cnt ?? 0,
      limits: {
        max_users: parseInt(env.MAX_USERS, 10),
        max_records_per_table: parseInt(env.MAX_RECORDS_PER_TABLE, 10),
        max_tables_per_base: parseInt(env.MAX_TABLES_PER_BASE, 10),
      },
    },
  });
});

export default admin;
