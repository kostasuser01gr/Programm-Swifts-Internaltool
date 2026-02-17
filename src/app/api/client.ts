// ─── API Client for DataOS Worker Backend ───────────────────
// Zero-dependency fetch wrapper with error handling, auth, and types

const API_BASE = import.meta.env.VITE_API_URL || '';

// ─── Types ──────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
  meta?: { total?: number; page?: number; limit?: number };
}

export interface ApiUser {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'user' | 'viewer';
  avatar_url?: string | null;
}

export interface ApiWorkspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
  bases?: ApiBase[];
  memberRole?: string;
}

export interface ApiBase {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface ApiTable {
  id: string;
  base_id: string;
  name: string;
  description: string | null;
  position: number;
  fields?: ApiField[];
  views?: ApiView[];
}

export interface ApiField {
  id: string;
  table_id: string;
  name: string;
  type: string;
  options: string | null;
  is_primary: boolean;
  required: boolean;
  description: string | null;
  position: number;
}

export interface ApiView {
  id: string;
  table_id: string;
  name: string;
  type: 'grid' | 'kanban' | 'calendar' | 'gallery' | 'timeline' | 'form';
  config: string;
  is_default: boolean;
  is_locked: boolean;
  position: number;
}

export interface ApiRecord {
  id: string;
  table_id: string;
  data: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  user_id: string | null;
  user_name?: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface UsageSummary {
  [metric: string]: {
    current: number;
    limit: number;
    percent: number;
  };
}

export interface AdminStats {
  users: number;
  workspaces: number;
  tables: number;
  records: number;
  active_sessions: number;
  limits: {
    max_users: number;
    max_records_per_table: number;
    max_tables_per_base: number;
  };
}

// ─── HTTP Client ────────────────────────────────────────────

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('dataos_token', token);
  } else {
    localStorage.removeItem('dataos_token');
  }
}

export function getAuthToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem('dataos_token');
  }
  return authToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const data: ApiResponse<T> = await res.json();

    if (res.status === 401) {
      // Session expired
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return data;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}

// ─── Auth API ───────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, display_name: string) =>
    request<{ user: ApiUser; token: string }>('POST', '/api/auth/register', {
      email,
      password,
      display_name,
    }),

  login: (email: string, password: string) =>
    request<{ user: ApiUser; token: string }>('POST', '/api/auth/login', {
      email,
      password,
    }),

  logout: () => request('POST', '/api/auth/logout'),

  me: () => request<ApiUser>('GET', '/api/auth/me'),
};

// ─── Workspace API ──────────────────────────────────────────

export const workspaceApi = {
  list: () => request<ApiWorkspace[]>('GET', '/api/workspaces'),

  get: (id: string) => request<ApiWorkspace>('GET', `/api/workspaces/${id}`),

  create: (data: { name: string; description?: string; icon?: string; color?: string }) =>
    request<ApiWorkspace>('POST', '/api/workspaces', data),

  delete: (id: string) => request('DELETE', `/api/workspaces/${id}`),
};

// ─── Table API ──────────────────────────────────────────────

export const tableApi = {
  get: (tableId: string) => request<ApiTable>('GET', `/api/tables/${tableId}`),

  getRecords: (tableId: string, page = 1, limit = 50) =>
    request<ApiRecord[]>('GET', `/api/tables/${tableId}/records?page=${page}&limit=${limit}`),

  createRecord: (tableId: string, data: Record<string, unknown>) =>
    request<ApiRecord>('POST', `/api/tables/${tableId}/records`, { data }),

  updateRecord: (tableId: string, recordId: string, data: Record<string, unknown>) =>
    request<ApiRecord>('PATCH', `/api/tables/${tableId}/records/${recordId}`, { data }),

  deleteRecord: (tableId: string, recordId: string) =>
    request('DELETE', `/api/tables/${tableId}/records/${recordId}`),

  bulkDeleteRecords: (tableId: string, ids: string[]) =>
    request<{ deleted: number }>('POST', `/api/tables/${tableId}/records/bulk-delete`, { ids }),
};

// ─── Admin API ──────────────────────────────────────────────

export const adminApi = {
  getUsers: () => request<ApiUser[]>('GET', '/api/admin/users'),

  updateUser: (id: string, data: { role?: string; is_active?: boolean; display_name?: string }) =>
    request('PATCH', `/api/admin/users/${id}`, data),

  getAuditLog: (limit = 50, offset = 0) =>
    request<AuditEntry[]>('GET', `/api/admin/audit-log?limit=${limit}&offset=${offset}`),

  getUsage: () => request<UsageSummary>('GET', '/api/admin/usage'),

  getStats: () => request<AdminStats>('GET', '/api/admin/stats'),
};

// ─── Health API ─────────────────────────────────────────────

export const healthApi = {
  check: () => request<{ status: string; timestamp: string }>('GET', '/health'),
};
