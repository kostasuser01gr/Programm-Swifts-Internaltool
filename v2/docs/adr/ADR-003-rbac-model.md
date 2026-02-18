# ADR-003: RBAC Model — Workspace Membership with Anti-Enumeration

**Status:** Accepted  
**Date:** 2026-02-18  
**Deciders:** Security Engineer, Lead Architect

## Context

V1 had no server-side authorization on table/record endpoints. Any authenticated user could read or write any table, regardless of workspace membership.

## Decision

### Role model

Three roles per workspace membership:

| Role | Read | Write (create/edit/delete) | Manage workspace | Delete workspace |
|------|------|--------|------------------|------------------|
| `viewer` | ✅ | ❌ (403) | ❌ | ❌ |
| `editor` | ✅ | ✅ | ❌ | ❌ |
| `owner` | ✅ | ✅ | ✅ | ✅ |

### Enforcement points

1. **Workspace endpoints:** `GET /workspaces/:id` returns 404 if user is not a member (anti-enumeration). `POST /workspaces` creates with user as `owner`.
2. **Table endpoints:** `GET /tables/:id` JOINs through `tables → bases → workspaces → workspace_members` to verify membership. Non-members get **404** (not 403) to prevent resource enumeration.
3. **Record endpoints:** Write operations (`POST`, `PATCH`, `DELETE`) additionally check role ≥ `editor`. Viewers get **403**.
4. **Admin endpoints:** Require global `role = 'admin'` on the user record (distinct from workspace membership).

### Anti-enumeration: 404 vs 403

- **Read denied → 404:** If a user is not a workspace member, they get 404 for any resource in that workspace. This prevents attackers from discovering valid resource IDs.
- **Write denied → 403:** If a user IS a member but has `viewer` role, they get 403. This is safe because they already know the resource exists (they can read it).
- **Not authenticated → 401:** Standard.

### Implementation

The `requireWorkspaceAccess(env, userId, workspaceId)` helper returns `{ role }` or `null`:

```sql
SELECT wm.role
FROM workspace_members wm
WHERE wm.workspace_id = ? AND wm.user_id = ?
```

The `requireTableAccess(env, userId, tableId)` helper JOINs through the hierarchy:

```sql
SELECT wm.role, w.id as workspace_id
FROM tables t
JOIN bases b ON t.base_id = b.id
JOIN workspaces w ON b.workspace_id = w.id
JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id = ?
WHERE t.id = ?
```

### No per-request D1 writes

V1 had `trackUsage()` writing to D1 on every request. V2 does **not** track per-request usage in D1. Monitoring is handled by:
- Cloudflare Analytics (built-in, free).
- Admin `/stats` endpoint that runs COUNT queries on demand.

## Consequences

- All data access is gated by workspace membership.
- Attackers cannot enumerate workspace/table/record IDs.
- Viewer role is useful for read-only stakeholders.
- No D1 write amplification from usage tracking.
