-- DataOS Seed Data
-- Default admin user (password: admin123 — hashed with PBKDF2-SHA256)
-- In production, change immediately after first login.

INSERT OR IGNORE INTO users (id, email, display_name, password_hash, role, is_active)
VALUES (
  'usr_admin_001',
  'admin@dataos.local',
  'Admin',
  -- bcrypt-like placeholder; actual hash generated at runtime during first setup
  '$pbkdf2$100000$c2FsdA$hashed_placeholder',
  'admin',
  1
);

-- Default workspace
INSERT OR IGNORE INTO workspaces (id, name, description, owner_id, icon, color)
VALUES (
  'ws_default',
  'Main Workspace',
  'Default workspace for DataOS',
  'usr_admin_001',
  '🏢',
  '#3b82f6'
);

INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role)
VALUES ('ws_default', 'usr_admin_001', 'owner');

-- Default base
INSERT OR IGNORE INTO bases (id, workspace_id, name, description, icon, color)
VALUES (
  'base_default',
  'ws_default',
  'Getting Started',
  'Your first database',
  '🚀',
  '#8b5cf6'
);

-- Default table
INSERT OR IGNORE INTO tables (id, base_id, name, description, position)
VALUES (
  'tbl_tasks',
  'base_default',
  'Tasks',
  'Track your team tasks',
  0
);

-- Default fields
INSERT OR IGNORE INTO fields (id, table_id, name, type, is_primary, position) VALUES
  ('fld_name',   'tbl_tasks', 'Name',   'text',     1, 0),
  ('fld_status', 'tbl_tasks', 'Status', 'select',   0, 1),
  ('fld_assign', 'tbl_tasks', 'Assignee', 'user',   0, 2),
  ('fld_due',    'tbl_tasks', 'Due Date', 'date',   0, 3),
  ('fld_done',   'tbl_tasks', 'Done',   'checkbox',  0, 4);

-- Field options for Status
UPDATE fields SET options = '{"choices":[{"id":"opt_todo","name":"To Do","color":"#6b7280"},{"id":"opt_wip","name":"In Progress","color":"#f59e0b"},{"id":"opt_rev","name":"Review","color":"#3b82f6"},{"id":"opt_done","name":"Done","color":"#10b981"}]}'
WHERE id = 'fld_status';

-- Default grid view
INSERT OR IGNORE INTO views (id, table_id, name, type, is_default, position, config)
VALUES (
  'vw_grid',
  'tbl_tasks',
  'Grid View',
  'grid',
  1,
  0,
  '{"filters":[],"sorts":[],"hiddenFields":[]}'
);

-- Default kanban view
INSERT OR IGNORE INTO views (id, table_id, name, type, is_default, position, config)
VALUES (
  'vw_kanban',
  'tbl_tasks',
  'Kanban',
  'kanban',
  0,
  1,
  '{"groupFieldId":"fld_status","filters":[],"sorts":[],"hiddenFields":[]}'
);

-- Sample records
INSERT OR IGNORE INTO records (id, table_id, data, created_by) VALUES
  ('rec_001', 'tbl_tasks', '{"fld_name":"Set up project","fld_status":"opt_done","fld_assign":"usr_admin_001","fld_due":"2026-02-20","fld_done":true}', 'usr_admin_001'),
  ('rec_002', 'tbl_tasks', '{"fld_name":"Design database schema","fld_status":"opt_wip","fld_assign":"usr_admin_001","fld_due":"2026-02-22","fld_done":false}', 'usr_admin_001'),
  ('rec_003', 'tbl_tasks', '{"fld_name":"Build API endpoints","fld_status":"opt_todo","fld_assign":null,"fld_due":"2026-02-25","fld_done":false}', 'usr_admin_001'),
  ('rec_004', 'tbl_tasks', '{"fld_name":"Write documentation","fld_status":"opt_todo","fld_assign":null,"fld_due":"2026-03-01","fld_done":false}', 'usr_admin_001'),
  ('rec_005', 'tbl_tasks', '{"fld_name":"Deploy to production","fld_status":"opt_todo","fld_assign":null,"fld_due":"2026-03-05","fld_done":false}', 'usr_admin_001');

-- Usage counter init
INSERT OR IGNORE INTO usage_counters (date, metric, count) VALUES
  (date('now'), 'd1_reads', 0),
  (date('now'), 'd1_writes', 0),
  (date('now'), 'requests', 0);
