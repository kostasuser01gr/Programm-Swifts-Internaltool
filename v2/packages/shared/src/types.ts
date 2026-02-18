// ─── Shared types for DataOS V2 ─────────────────────────────

// ─── Roles ──────────────────────────────────────────────────
export type GlobalRole = 'admin' | 'user';
export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

// ─── User ───────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  display_name: string;
  role: GlobalRole;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Pick<User, 'id' | 'email' | 'display_name' | 'role' | 'avatar_url'>;

// ─── Session ────────────────────────────────────────────────
export interface Session {
  id: string;
  user_id: string;
  token_hash: string;
  ip_address: string;
  user_agent: string;
  expires_at: string;
  created_at: string;
}

// ─── Workspace ──────────────────────────────────────────────
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

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface WorkspaceWithRole extends Workspace {
  member_role: WorkspaceRole;
}

// ─── Base ───────────────────────────────────────────────────
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

// ─── Table ──────────────────────────────────────────────────
export interface Table {
  id: string;
  base_id: string;
  name: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// ─── Field ──────────────────────────────────────────────────
export type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'multi_select' | 'user';

export interface Field {
  id: string;
  table_id: string;
  name: string;
  type: FieldType;
  options: string | null;
  is_primary: boolean;
  required: boolean;
  description: string | null;
  position: number;
  created_at: string;
}

// ─── Record ─────────────────────────────────────────────────
export interface DataRecord {
  id: string;
  table_id: string;
  data: { [key: string]: unknown };
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── API Envelope ───────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: {
    total?: number;
  };
}

// ─── Auth Responses ─────────────────────────────────────────
export interface LoginResponse {
  user: PublicUser;
  token: string;
}

export interface MeResponse {
  user: PublicUser;
}
