// ─── Authorization Helpers (RBAC) ───────────────────────────
// Checks workspace membership via table → base → workspace chain.
// Returns 404 for non-members (anti-enumeration).

import type { Env } from '../types';

export interface TableAccess {
  workspaceId: string;
  memberRole: 'owner' | 'editor' | 'viewer';
}

/**
 * Verify the requesting user has access to a table via workspace membership.
 *
 * Joins: tables → bases → workspaces → workspace_members
 * Returns null if the table doesn't exist OR user is not a member (anti-enum).
 */
export async function requireTableAccess(
  env: Env,
  userId: string,
  tableId: string
): Promise<TableAccess | null> {
  const row = await env.DB.prepare(
    `SELECT w.id AS workspace_id, wm.role
     FROM tables t
     JOIN bases b ON t.base_id = b.id
     JOIN workspaces w ON b.workspace_id = w.id
     JOIN workspace_members wm ON w.id = wm.workspace_id AND wm.user_id = ?
     WHERE t.id = ?`
  )
    .bind(userId, tableId)
    .first<{ workspace_id: string; role: string }>();

  if (!row) return null;

  return {
    workspaceId: row.workspace_id,
    memberRole: row.role as TableAccess['memberRole'],
  };
}

/** Returns true if the role allows write operations (create/update/delete) */
export function canWrite(role: string): boolean {
  return role === 'owner' || role === 'editor';
}
