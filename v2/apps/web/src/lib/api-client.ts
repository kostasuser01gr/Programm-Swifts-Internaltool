import type { ApiResponse, PublicUser, LoginResponse, WorkspaceWithRole } from '@dataos/shared';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// ─── Core fetch wrapper ─────────────────────────────────────
// Always sends credentials (cookies). Never touches localStorage.

async function request<T>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok && !data.error) {
    data.ok = false;
    data.error = `HTTP ${res.status}`;
  }

  return data;
}

// ─── Auth ───────────────────────────────────────────────────

export async function login(email: string, password: string) {
  return request<LoginResponse>('POST', '/api/auth/login', { email, password });
}

export async function register(email: string, password: string, display_name: string) {
  return request<LoginResponse>('POST', '/api/auth/register', { email, password, display_name });
}

export async function logout() {
  return request<null>('POST', '/api/auth/logout');
}

export async function getMe() {
  return request<{ user: PublicUser }>('GET', '/api/auth/me');
}

// ─── Workspaces ─────────────────────────────────────────────

export async function listWorkspaces() {
  return request<WorkspaceWithRole[]>('GET', '/api/workspaces');
}

export async function getWorkspace(id: string) {
  return request<WorkspaceWithRole & { bases: Array<{ id: string; name: string; description: string | null }> }>('GET', `/api/workspaces/${id}`);
}

export async function createWorkspace(data: { name: string; description?: string }) {
  return request<{ id: string; name: string; base_id: string }>('POST', '/api/workspaces', data);
}

// ─── Tables ─────────────────────────────────────────────────

export async function listTables(baseId: string) {
  return request<Array<{ id: string; name: string; description: string | null; position: number }>>('GET', `/api/tables/by-base/${baseId}`);
}

export async function getTable(id: string) {
  return request<{
    id: string;
    name: string;
    member_role: string;
    fields: Array<{ id: string; name: string; type: string; is_primary: number }>;
    records: Array<{ id: string; data: Record<string, unknown>; created_at: string; updated_at: string }>;
  }>('GET', `/api/tables/${id}`);
}

export async function createRecord(tableId: string, data: Record<string, unknown>) {
  return request<{ id: string }>('POST', `/api/tables/${tableId}/records`, { data });
}

export async function updateRecord(tableId: string, recordId: string, data: Record<string, unknown>) {
  return request<{ id: string; data: Record<string, unknown> }>('PATCH', `/api/tables/${tableId}/records/${recordId}`, { data });
}

export async function deleteRecord(tableId: string, recordId: string) {
  return request<null>('DELETE', `/api/tables/${tableId}/records/${recordId}`);
}

export const api = {
  login, register, logout, getMe,
  listWorkspaces, getWorkspace, createWorkspace,
  listTables, getTable, createRecord, updateRecord, deleteRecord,
};
