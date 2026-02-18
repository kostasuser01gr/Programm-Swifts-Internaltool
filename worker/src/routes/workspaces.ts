import { Hono } from 'hono';
import type { Env, AuthContext } from '../types';
import { generateId } from '../utils/crypto';
import { validateCreateWorkspace } from '../utils/validate';

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const workspaces = new Hono<AppEnv>();

// ─── GET /workspaces ────────────────────────────────────────
workspaces.get('/', async (c) => {
  const auth = c.get('auth');
  const env = c.env;

  const { results } = await env.DB.prepare(
    `SELECT w.* FROM workspaces w
     JOIN workspace_members wm ON w.id = wm.workspace_id
     WHERE wm.user_id = ?
     ORDER BY w.updated_at DESC`
  )
    .bind(auth.user.id)
    .all();

  return c.json({ ok: true, data: results });
});

// ─── POST /workspaces ───────────────────────────────────────
workspaces.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateCreateWorkspace(body);
  if (!validation.ok) {
    return c.json({ ok: false, errors: validation.errors }, 400);
  }

  const auth = c.get('auth');
  const env = c.env;
  const { name, description, icon, color } = validation.data;
  const id = generateId('ws');

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO workspaces (id, name, description, owner_id, icon, color) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(id, name, description || null, auth.user.id, icon || '📊', color || '#3b82f6'),
    env.DB.prepare(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')`
    ).bind(id, auth.user.id),
    env.DB.prepare(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
       VALUES (?, ?, 'create', 'workspace', ?, ?)`
    ).bind(generateId('aud'), auth.user.id, id, c.req.header('CF-Connecting-IP') || ''),
  ]);

  return c.json(
    { ok: true, data: { id, name, description, icon: icon || '📊', color: color || '#3b82f6' } },
    201
  );
});

// ─── GET /workspaces/:id ────────────────────────────────────
workspaces.get('/:id', async (c) => {
  const auth = c.get('auth');
  const env = c.env;
  const wsId = c.req.param('id');

  // Check membership
  const member = await env.DB.prepare(
    `SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?`
  )
    .bind(wsId, auth.user.id)
    .first();

  if (!member) {
    return c.json({ ok: false, error: 'Workspace not found' }, 404);
  }

  const workspace = await env.DB.prepare('SELECT * FROM workspaces WHERE id = ?').bind(wsId).first();

  // Get bases in workspace
  const { results: bases } = await env.DB.prepare(
    'SELECT * FROM bases WHERE workspace_id = ? ORDER BY created_at'
  )
    .bind(wsId)
    .all();

  return c.json({ ok: true, data: { ...workspace, bases, memberRole: member.role } });
});

// ─── DELETE /workspaces/:id ─────────────────────────────────
workspaces.delete('/:id', async (c) => {
  const auth = c.get('auth');
  const env = c.env;
  const wsId = c.req.param('id');

  // Only owner can delete
  const member = await env.DB.prepare(
    `SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?`
  )
    .bind(wsId, auth.user.id)
    .first<{ role: string }>();

  if (!member || member.role !== 'owner') {
    return c.json({ ok: false, error: 'Only workspace owner can delete' }, 403);
  }

  await env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(wsId).run();
  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'delete', 'workspace', ?, ?)`
  )
    .bind(generateId('aud'), auth.user.id, wsId, c.req.header('CF-Connecting-IP') || '')
    .run();

  return c.json({ ok: true });
});

export default workspaces;
