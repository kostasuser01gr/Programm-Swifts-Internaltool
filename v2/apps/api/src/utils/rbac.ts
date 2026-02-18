import type { Env } from '../types';

// ─── RBAC helpers ───────────────────────────────────────────
// Anti-enumeration: returns null (caller sends 404) if user is not a member.

interface AccessResult {
  workspaceId: string;
  memberRole: 'owner' | 'editor' | 'viewer';
}

/**
 * Check if userId is a member of the workspace that owns this table.
 * JOINs: tables → bases → workspaces → workspace_members.
 * Returns { workspaceId, memberRole } or null (not a member → 404).
 */
export async function requireTableAccess(
  env: Env,
  userId: string,
  tableId: string,
): Promise<AccessResult | null> {
  const row = await env.DB.prepare(
    `SELECT wm.role, w.id as workspace_id
     FROM tables t
     JOIN bases b ON t.base_id = b.id
     JOIN workspaces w ON b.workspace_id = w.id
     JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
     WHERE t.id = ?`,
  )
    .bind(userId, tableId)
    .first<{ role: string; workspace_id: string }>();

  if (!row) return null;
  return { workspaceId: row.workspace_id, memberRole: row.role as AccessResult['memberRole'] };
}

/**
 * Check if userId is a member of the given workspace.
 */
export async function requireWorkspaceAccess(
  env: Env,
  userId: string,
  workspaceId: string,
): Promise<AccessResult | null> {
  const row = await env.DB.prepare(
    `SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?`,
  )
    .bind(workspaceId, userId)
    .first<{ role: string }>();

  if (!row) return null;
  return { workspaceId, memberRole: row.role as AccessResult['memberRole'] };
}

/**
 * Returns true if the role can perform write operations (create/update/delete).
 */
export function canWrite(role: string): boolean {
  return role === 'owner' || role === 'editor';
}
