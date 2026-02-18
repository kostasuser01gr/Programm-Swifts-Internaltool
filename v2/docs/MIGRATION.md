# V1 → V2 Migration Plan

## Overview

V2 lives in `v2/` alongside the existing production code. The migration is incremental — V1 continues serving traffic until V2 is validated and cut over.

## Phase 1: Parallel Development (current)

- V2 code in `v2/` folder, separate pnpm workspace
- V1 continues in production, unchanged
- V2 CI runs on `v2/**` path changes only
- No shared runtime between V1 and V2

## Phase 2: Data Migration

### Users & Auth
- Export users from V1 D1 database
- Import into V2 D1 (schema is compatible)
- Password hashes are portable (same PBKDF2 format)
- Sessions will NOT be migrated — users re-login

### Workspaces & Data
- V2 introduces workspaces (V1 has flat tables)
- Migration script creates a "Default" workspace per user
- Tables, fields, and records move under the default workspace
- Record data (JSON) is schema-compatible

### Migration Script
```bash
# 1. Export from V1
wrangler d1 export dataos-v1 --output=v1-dump.sql

# 2. Transform (create workspace wrappers)
node scripts/migrate-v1-to-v2.js v1-dump.sql > v2-import.sql

# 3. Import to V2
wrangler d1 execute dataos-v2 --file=v2-import.sql
```

## Phase 3: DNS Cutover

1. Deploy V2 API worker to `api-v2.dataos.app`
2. Deploy V2 web to `v2.dataos.app`
3. Internal testing on `v2.` subdomain
4. Update DNS: `dataos.app` → V2 web, `api.dataos.app` → V2 worker
5. Keep V1 running on `v1.dataos.app` for 30 days (rollback safety)

## Phase 4: Cleanup

- Remove `v2/` folder isolation — promote to repo root
- Archive V1 code to `archive/v1/` branch
- Update CI workflows to remove `v2/**` path filters
- Remove V1 Cloudflare Worker

## Rollback Plan

At any point during Phase 3:
1. Revert DNS to point to V1
2. V1 is still deployed and running
3. No data loss — V1 database was not modified

## Breaking Changes

| Area | V1 | V2 |
|------|----|----|
| Auth | localStorage token | HttpOnly cookie |
| API prefix | `/api/` | `/api/` (same) |
| Data model | Flat tables per user | Workspaces → Bases → Tables |
| RBAC | Admin-only | Workspace membership (viewer/editor/owner) |
| Frontend | Vite SPA (React 18) | Next.js 15 App Router (React 19) |

## Timeline Estimate

| Phase | Duration | Risk |
|-------|----------|------|
| Phase 1 (dev) | 2–4 weeks | Low |
| Phase 2 (data) | 1 week | Medium (data integrity) |
| Phase 3 (cutover) | 1 day | Low (DNS only) |
| Phase 4 (cleanup) | 1 week | Low |
