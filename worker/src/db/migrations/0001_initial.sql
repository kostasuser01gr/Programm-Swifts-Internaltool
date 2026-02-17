-- DataOS D1 Schema — Initial Migration
-- Cloudflare D1 Free Tier: 5GB storage, 5M reads/day, 100K writes/day

-- ─── Users & Auth ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  avatar_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ─── Workspaces ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id TEXT NOT NULL REFERENCES users(id),
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#3b82f6',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (workspace_id, user_id)
);

-- ─── Bases (like Airtable bases) ─────────────────────────────
CREATE TABLE IF NOT EXISTS bases (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#8b5cf6',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Tables ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  base_id TEXT NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Fields (columns) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fields (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  options TEXT, -- JSON blob for field config
  is_primary INTEGER NOT NULL DEFAULT 0,
  required INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_fields_table ON fields(table_id);

-- ─── Records (rows) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS records (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}', -- JSON blob of field values
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_records_table ON records(table_id);
CREATE INDEX idx_records_created ON records(created_at);

-- ─── Views ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS views (
  id TEXT PRIMARY KEY,
  table_id TEXT NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grid' CHECK (type IN ('grid', 'kanban', 'calendar', 'gallery', 'timeline', 'form')),
  config TEXT NOT NULL DEFAULT '{}', -- JSON: filters, sorts, groups, hidden fields, etc.
  is_default INTEGER NOT NULL DEFAULT 0,
  is_locked INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_views_table ON views(table_id);

-- ─── Audit Log ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'user', 'workspace', 'base', 'table', 'record', 'auth'
  resource_id TEXT,
  details TEXT, -- JSON
  ip_address TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ─── Rate Limiting (KV-backed, but D1 fallback) ─────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── Usage Tracking (fail-closed guards) ─────────────────────
CREATE TABLE IF NOT EXISTS usage_counters (
  date TEXT NOT NULL,
  metric TEXT NOT NULL, -- 'd1_reads', 'd1_writes', 'kv_reads', 'requests'
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (date, metric)
);
