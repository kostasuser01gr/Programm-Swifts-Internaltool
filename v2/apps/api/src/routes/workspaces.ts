import { Hono } from 'hono';
import { createWorkspaceSchema } from '@dataos/shared';
import type { AppEnv } from '../types';
import { requireWorkspaceAccess } from '../utils/rbac';
import { generateId } from '../utils/crypto';

const workspaces = new Hono<AppEnv>();

// ─── GET /workspaces ────────────────────────────────────────
// List workspaces the current user is a member of.
workspaces.get('/', async (c) => {
  const auth = c.get('auth');
  const { results } = await c.env.DB.prepare(
    `SELECT w.*, wm.role as member_role
     FROM workspaces w
     JOIN workspace_members wm ON wm.workspace_id = w.id
     WHERE wm.user_id = ?
     ORDER BY w.updated_at DESC`,
  )
    .bind(auth.user.id)
    .all();

  return c.json({ ok: true, data: results });
});

// ─── POST /workspaces ───────────────────────────────────────
workspaces.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = createWorkspaceSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  const auth = c.get('auth');
  const { name, description, icon, color } = result.data;
  const workspaceId = generateId('ws');
  const baseId = generateId('base');

  // Create workspace + default base + owner membership in a batch
  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO workspaces (id, name, description, owner_id, icon, color) VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(workspaceId, name, description ?? null, auth.user.id, icon, color),
    c.env.DB.prepare(
      `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')`,
    ).bind(workspaceId, auth.user.id),
    c.env.DB.prepare(
      `INSERT INTO bases (id, workspace_id, name, description) VALUES (?, ?, 'Default Base', 'Auto-created base')`,
    ).bind(baseId, workspaceId),
  ]);

  return c.json({ ok: true, data: { id: workspaceId, name, base_id: baseId } }, 201);
});

// ─── GET /workspaces/:id ────────────────────────────────────
// Returns workspace + bases. 404 for non-members (anti-enumeration).
workspaces.get('/:id', async (c) => {
  const auth = c.get('auth');
  const workspaceId = c.req.param('id');
  const access = await requireWorkspaceAccess(c.env, auth.user.id, workspaceId);
  if (!access) {
    return c.json({ ok: false, error: 'Not found' }, 404);
  }

  const workspace = await c.env.DB.prepare(`SELECT * FROM workspaces WHERE id = ?`).bind(workspaceId).first();
  const { results: bases } = await c.env.DB.prepare(
    `SELECT * FROM bases WHERE workspace_id = ? ORDER BY created_at ASC`,
  )
    .bind(workspaceId)
    .all();

  return c.json({ ok: true, data: { ...workspace, member_role: access.memberRole, bases } });
});

// ─── DELETE /workspaces/:id ─────────────────────────────────
workspaces.delete('/:id', async (c) => {
  const auth = c.get('auth');
  const workspaceId = c.req.param('id');
  const access = await requireWorkspaceAccess(c.env, auth.user.id, workspaceId);
  if (!access) {
    return c.json({ ok: false, error: 'Not found' }, 404);
  }
  if (access.memberRole !== 'owner') {
    return c.json({ ok: false, error: 'Only the owner can delete a workspace' }, 403);
  }

  await c.env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(workspaceId).run();
  return c.json({ ok: true });
});

export default workspaces;
