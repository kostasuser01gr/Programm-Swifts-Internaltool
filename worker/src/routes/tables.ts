import { Hono } from 'hono';
import type { Env, AuthContext } from '../types';
import { generateId } from '../utils/crypto';
import { validateCreateTable, validateCreateRecord, validateUpdateRecord, parsePagination } from '../utils/validate';
import { trackUsage } from '../middleware/failClosed';

type AppEnv = { Bindings: Env; Variables: { auth: AuthContext } };

const tables = new Hono<AppEnv>();

// ─── GET /tables/:tableId ───────────────────────────────────
tables.get('/:tableId', async (c) => {
  const env = c.env;
  const tableId = c.req.param('tableId');

  await trackUsage(env, 'd1_reads', 3);

  const table = await env.DB.prepare('SELECT * FROM tables WHERE id = ?').bind(tableId).first();
  if (!table) return c.json({ ok: false, error: 'Table not found' }, 404);

  const { results: fields } = await env.DB.prepare(
    'SELECT * FROM fields WHERE table_id = ? ORDER BY position'
  )
    .bind(tableId)
    .all();

  const { results: views } = await env.DB.prepare(
    'SELECT * FROM views WHERE table_id = ? ORDER BY position'
  )
    .bind(tableId)
    .all();

  return c.json({ ok: true, data: { ...table, fields, views } });
});

// ─── GET /tables/:tableId/records ───────────────────────────
tables.get('/:tableId/records', async (c) => {
  const env = c.env;
  const tableId = c.req.param('tableId');
  const url = new URL(c.req.url);
  const { page, limit } = parsePagination(url);
  const offset = (page - 1) * limit;

  await trackUsage(env, 'd1_reads', 2);

  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM records WHERE table_id = ?'
  )
    .bind(tableId)
    .first<{ total: number }>();

  const { results } = await env.DB.prepare(
    'SELECT * FROM records WHERE table_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
  )
    .bind(tableId, limit, offset)
    .all();

  // Parse JSON data field
  const records = (results || []).map((r: Record<string, unknown>) => ({
    ...r,
    data: typeof r.data === 'string' ? JSON.parse(r.data as string) : r.data,
  }));

  return c.json({
    ok: true,
    data: records,
    meta: { total: countRow?.total ?? 0, page, limit },
  });
});

// ─── POST /tables/:tableId/records ──────────────────────────
tables.post('/:tableId/records', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateCreateRecord(body);
  if (!validation.ok) {
    return c.json({ ok: false, errors: validation.errors }, 400);
  }

  const auth = c.get('auth');
  const env = c.env;
  const tableId = c.req.param('tableId');

  // Check record limit
  const maxRecords = parseInt(env.MAX_RECORDS_PER_TABLE, 10) || 10000;
  const countRow = await env.DB.prepare(
    'SELECT COUNT(*) as cnt FROM records WHERE table_id = ?'
  )
    .bind(tableId)
    .first<{ cnt: number }>();

  if ((countRow?.cnt ?? 0) >= maxRecords) {
    return c.json({ ok: false, error: `Record limit (${maxRecords}) reached for this table` }, 403);
  }

  const id = generateId('rec');
  const dataJson = JSON.stringify(validation.data.data);

  await env.DB.prepare(
    `INSERT INTO records (id, table_id, data, created_by) VALUES (?, ?, ?, ?)`
  )
    .bind(id, tableId, dataJson, auth.user.id)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'create', 'record', ?, ?)`
  )
    .bind(generateId('aud'), auth.user.id, id, c.req.header('CF-Connecting-IP') || '')
    .run();

  await trackUsage(env, 'd1_writes', 2);

  return c.json({ ok: true, data: { id, table_id: tableId, data: validation.data.data } }, 201);
});

// ─── PATCH /tables/:tableId/records/:recordId ───────────────
tables.patch('/:tableId/records/:recordId', async (c) => {
  const body = await c.req.json().catch(() => null);
  const validation = validateUpdateRecord(body);
  if (!validation.ok) {
    return c.json({ ok: false, errors: validation.errors }, 400);
  }

  const auth = c.get('auth');
  const env = c.env;
  const recordId = c.req.param('recordId');
  const tableId = c.req.param('tableId');

  await trackUsage(env, 'd1_reads', 1);

  const existing = await env.DB.prepare(
    'SELECT data FROM records WHERE id = ? AND table_id = ?'
  )
    .bind(recordId, tableId)
    .first<{ data: string }>();

  if (!existing) return c.json({ ok: false, error: 'Record not found' }, 404);

  const existingData = JSON.parse(existing.data);
  const merged = { ...existingData, ...validation.data.data };
  const mergedJson = JSON.stringify(merged);

  await env.DB.prepare(
    `UPDATE records SET data = ?, updated_at = datetime('now') WHERE id = ?`
  )
    .bind(mergedJson, recordId)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'update', 'record', ?, ?, ?)`
  )
    .bind(
      generateId('aud'),
      auth.user.id,
      recordId,
      JSON.stringify({ fields: Object.keys(validation.data.data) }),
      c.req.header('CF-Connecting-IP') || ''
    )
    .run();

  await trackUsage(env, 'd1_writes', 2);

  return c.json({ ok: true, data: { id: recordId, data: merged } });
});

// ─── DELETE /tables/:tableId/records/:recordId ──────────────
tables.delete('/:tableId/records/:recordId', async (c) => {
  const auth = c.get('auth');
  const env = c.env;
  const recordId = c.req.param('recordId');
  const tableId = c.req.param('tableId');

  const existing = await env.DB.prepare(
    'SELECT id FROM records WHERE id = ? AND table_id = ?'
  )
    .bind(recordId, tableId)
    .first();

  if (!existing) return c.json({ ok: false, error: 'Record not found' }, 404);

  await env.DB.prepare('DELETE FROM records WHERE id = ?').bind(recordId).run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'delete', 'record', ?, ?)`
  )
    .bind(generateId('aud'), auth.user.id, recordId, c.req.header('CF-Connecting-IP') || '')
    .run();

  await trackUsage(env, 'd1_writes', 2);

  return c.json({ ok: true });
});

// ─── POST /tables/:tableId/records/bulk-delete ──────────────
tables.post('/:tableId/records/bulk-delete', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || !Array.isArray(body.ids) || body.ids.length === 0 || body.ids.length > 100) {
    return c.json({ ok: false, error: 'Provide 1-100 record ids' }, 400);
  }

  const auth = c.get('auth');
  const env = c.env;
  const tableId = c.req.param('tableId');
  const ids: string[] = body.ids;

  const placeholders = ids.map(() => '?').join(',');
  await env.DB.prepare(`DELETE FROM records WHERE table_id = ? AND id IN (${placeholders})`)
    .bind(tableId, ...ids)
    .run();

  await env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'bulk_delete', 'record', ?, ?, ?)`
  )
    .bind(
      generateId('aud'),
      auth.user.id,
      tableId,
      JSON.stringify({ count: ids.length }),
      c.req.header('CF-Connecting-IP') || ''
    )
    .run();

  await trackUsage(env, 'd1_writes', 2);

  return c.json({ ok: true, data: { deleted: ids.length } });
});

export default tables;
