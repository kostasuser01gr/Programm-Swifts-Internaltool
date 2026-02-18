import { Hono } from 'hono';
import { createTableSchema, createRecordSchema, updateRecordSchema } from '@dataos/shared';
import type { AppEnv } from '../types';
import { requireTableAccess, requireWorkspaceAccess, canWrite } from '../utils/rbac';
import { generateId } from '../utils/crypto';

const tables = new Hono<AppEnv>();

// ─── GET /tables/by-base/:baseId ────────────────────────────
// List tables in a base (requires workspace membership via base).
tables.get('/by-base/:baseId', async (c) => {
  const auth = c.get('auth');
  const baseId = c.req.param('baseId');

  // Verify membership through base → workspace
  const row = await c.env.DB.prepare(
    `SELECT wm.role, w.id as workspace_id
     FROM bases b
     JOIN workspaces w ON b.workspace_id = w.id
     JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE b.id = ?`,
  )
    .bind(auth.user.id, baseId)
    .first<{ role: string; workspace_id: string }>();

  if (!row) {
    return c.json({ ok: false, error: 'Not found' }, 404);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM tables WHERE base_id = ? ORDER BY position ASC`,
  )
    .bind(baseId)
    .all();

  return c.json({ ok: true, data: results });
});

// ─── POST /tables ───────────────────────────────────────────
tables.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  const result = createTableSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  const auth = c.get('auth');
  const { base_id, name, description } = result.data;

  // Verify membership + write permission via base → workspace
  const row = await c.env.DB.prepare(
    `SELECT wm.role
     FROM bases b
     JOIN workspaces w ON b.workspace_id = w.id
     JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE b.id = ?`,
  )
    .bind(auth.user.id, base_id)
    .first<{ role: string }>();

  if (!row) return c.json({ ok: false, error: 'Not found' }, 404);
  if (!canWrite(row.role)) return c.json({ ok: false, error: 'Insufficient permissions' }, 403);

  const tableId = generateId('tbl');
  const fieldId = generateId('fld');

  await c.env.DB.batch([
    c.env.DB.prepare(
      `INSERT INTO tables (id, base_id, name, description) VALUES (?, ?, ?, ?)`,
    ).bind(tableId, base_id, name, description ?? null),
    c.env.DB.prepare(
      `INSERT INTO fields (id, table_id, name, type, is_primary, position) VALUES (?, ?, 'Name', 'text', 1, 0)`,
    ).bind(fieldId, tableId),
  ]);

  return c.json({ ok: true, data: { id: tableId, field_id: fieldId } }, 201);
});

// ─── GET /tables/:id ────────────────────────────────────────
// Returns table + fields + records.
tables.get('/:id', async (c) => {
  const auth = c.get('auth');
  const tableId = c.req.param('id');
  const access = await requireTableAccess(c.env, auth.user.id, tableId);
  if (!access) return c.json({ ok: false, error: 'Not found' }, 404);

  const [table, fieldsResult, recordsResult] = await Promise.all([
    c.env.DB.prepare('SELECT * FROM tables WHERE id = ?').bind(tableId).first(),
    c.env.DB.prepare('SELECT * FROM fields WHERE table_id = ? ORDER BY position ASC').bind(tableId).all(),
    c.env.DB.prepare('SELECT * FROM records WHERE table_id = ? ORDER BY created_at DESC LIMIT 1000').bind(tableId).all(),
  ]);

  return c.json({
    ok: true,
    data: {
      ...table,
      member_role: access.memberRole,
      fields: fieldsResult.results,
      records: recordsResult.results.map((r) => ({
        ...r,
        data: typeof r.data === 'string' ? JSON.parse(r.data as string) : r.data,
      })),
    },
  });
});

// ─── POST /tables/:id/records ───────────────────────────────
tables.post('/:id/records', async (c) => {
  const auth = c.get('auth');
  const tableId = c.req.param('id');
  const access = await requireTableAccess(c.env, auth.user.id, tableId);
  if (!access) return c.json({ ok: false, error: 'Not found' }, 404);
  if (!canWrite(access.memberRole)) return c.json({ ok: false, error: 'Insufficient permissions' }, 403);

  const body = await c.req.json().catch(() => null);
  const result = createRecordSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  const recordId = generateId('rec');
  await c.env.DB.prepare(
    `INSERT INTO records (id, table_id, data, created_by) VALUES (?, ?, ?, ?)`,
  )
    .bind(recordId, tableId, JSON.stringify(result.data.data), auth.user.id)
    .run();

  return c.json({ ok: true, data: { id: recordId } }, 201);
});

// ─── PATCH /tables/:tableId/records/:recordId ───────────────
tables.patch('/:tableId/records/:recordId', async (c) => {
  const auth = c.get('auth');
  const tableId = c.req.param('tableId');
  const recordId = c.req.param('recordId');
  const access = await requireTableAccess(c.env, auth.user.id, tableId);
  if (!access) return c.json({ ok: false, error: 'Not found' }, 404);
  if (!canWrite(access.memberRole)) return c.json({ ok: false, error: 'Insufficient permissions' }, 403);

  const body = await c.req.json().catch(() => null);
  const result = updateRecordSchema.safeParse(body);
  if (!result.success) {
    return c.json({ ok: false, errors: result.error.issues.map((i) => ({ field: String(i.path[0]), message: i.message })) }, 400);
  }

  // Merge with existing data
  const existing = await c.env.DB.prepare(
    'SELECT data FROM records WHERE id = ? AND table_id = ?',
  )
    .bind(recordId, tableId)
    .first<{ data: string }>();

  if (!existing) return c.json({ ok: false, error: 'Not found' }, 404);

  const existingData = JSON.parse(existing.data);
  const merged = { ...existingData, ...result.data.data };

  await c.env.DB.prepare(
    `UPDATE records SET data = ?, updated_at = datetime('now') WHERE id = ? AND table_id = ?`,
  )
    .bind(JSON.stringify(merged), recordId, tableId)
    .run();

  return c.json({ ok: true, data: { id: recordId, data: merged } });
});

// ─── DELETE /tables/:tableId/records/:recordId ──────────────
tables.delete('/:tableId/records/:recordId', async (c) => {
  const auth = c.get('auth');
  const tableId = c.req.param('tableId');
  const recordId = c.req.param('recordId');
  const access = await requireTableAccess(c.env, auth.user.id, tableId);
  if (!access) return c.json({ ok: false, error: 'Not found' }, 404);
  if (!canWrite(access.memberRole)) return c.json({ ok: false, error: 'Insufficient permissions' }, 403);

  await c.env.DB.prepare('DELETE FROM records WHERE id = ? AND table_id = ?')
    .bind(recordId, tableId)
    .run();

  return c.json({ ok: true });
});

export default tables;
