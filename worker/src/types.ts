// ─── Cloudflare Worker Environment Bindings ─────────────────
export interface Env {
  DB: D1Database;
  KV: KVNamespace;
  ENVIRONMENT: string;
  CORS_ORIGIN: string;
  MAX_UPLOAD_SIZE_BYTES: string;
  RATE_LIMIT_REQUESTS_PER_MINUTE: string;
  RATE_LIMIT_AUTH_PER_MINUTE: string;
  SESSION_TTL_SECONDS: string;
  MAX_USERS: string;
  MAX_RECORDS_PER_TABLE: string;
  MAX_TABLES_PER_BASE: string;
  FAIL_CLOSED_D1_DAILY_READS: string;
  FAIL_CLOSED_D1_DAILY_WRITES: string;
  FAIL_CLOSED_KV_DAILY_READS: string;
}

// ─── API Response Types ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// ─── User Types ─────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// ─── Data Types ─────────────────────────────────────────────
export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Base {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  base_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  table_id: string;
  name: string;
  type: string;
  options: string | null;
  is_primary: boolean;
  required: boolean;
  description: string | null;
  position: number;
  created_at: string;
}

export interface Record {
  id: string;
  table_id: string;
  data: string; // JSON
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface View {
  id: string;
  table_id: string;
  name: string;
  type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'timeline' | 'form';
  config: string; // JSON
  is_default: boolean;
  is_locked: boolean;
  position: number;
  created_by: string | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

// ─── Auth Context ───────────────────────────────────────────
export interface AuthContext {
  user: User;
  session: Session;
}
