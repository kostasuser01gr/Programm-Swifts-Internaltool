// ─── React hooks for data operations ────────────────────────
// Workspace, table, and record CRUD with loading/error state

import { useCallback, useEffect, useState } from 'react';
import {
  workspaceApi,
  tableApi,
  adminApi,
  type ApiWorkspace,
  type ApiTable,
  type ApiRecord,
  type ApiUser,
  type AuditEntry,
  type UsageSummary,
  type AdminStats,
} from './client';

// ─── Generic async hook ─────────────────────────────────────

function useAsync<T>(fn: () => Promise<{ ok: boolean; data?: T; error?: string }>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fn();
    if (res.ok && res.data !== undefined) {
      setData(res.data);
    } else {
      setError(res.error || 'Request failed');
    }
    setLoading(false);
    return res;
  }, [fn]);

  return { data, loading, error, execute, setData };
}

// ─── Workspaces ─────────────────────────────────────────────

export function useWorkspaces() {
  const { data, loading, error, execute } = useAsync(() => workspaceApi.list());

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    workspaces: data || [],
    loading,
    error,
    refetch: execute,
  };
}

export function useWorkspace(id: string | null) {
  const { data, loading, error, execute } = useAsync(() => {
    if (!id) return Promise.resolve({ ok: false, error: 'No workspace ID' });
    return workspaceApi.get(id);
  });

  useEffect(() => {
    if (id) execute();
  }, [id, execute]);

  return { workspace: data, loading, error, refetch: execute };
}

export function useCreateWorkspace() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (data: { name: string; description?: string; icon?: string; color?: string }) => {
      setLoading(true);
      setError(null);
      const res = await workspaceApi.create(data);
      setLoading(false);
      if (!res.ok) setError(res.error || 'Failed to create workspace');
      return res;
    },
    []
  );

  return { create, loading, error };
}

// ─── Tables ─────────────────────────────────────────────────

export function useTable(tableId: string | null) {
  const { data, loading, error, execute } = useAsync(() => {
    if (!tableId) return Promise.resolve({ ok: false, error: 'No table ID' });
    return tableApi.get(tableId);
  });

  useEffect(() => {
    if (tableId) execute();
  }, [tableId, execute]);

  return { table: data, loading, error, refetch: execute };
}

// ─── Records ────────────────────────────────────────────────

export function useRecords(tableId: string | null, page = 1, limit = 50) {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async () => {
    if (!tableId) return;
    setLoading(true);
    setError(null);
    const res = await tableApi.getRecords(tableId, page, limit);
    if (res.ok && res.data) {
      setRecords(res.data);
      setTotal(res.meta?.total || res.data.length);
    } else {
      setError(res.error || 'Failed to fetch records');
    }
    setLoading(false);
  }, [tableId, page, limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const createRecord = useCallback(
    async (data: Record<string, unknown>) => {
      if (!tableId) return null;
      const res = await tableApi.createRecord(tableId, data);
      if (res.ok) await fetch();
      return res;
    },
    [tableId, fetch]
  );

  const updateRecord = useCallback(
    async (recordId: string, data: Record<string, unknown>) => {
      if (!tableId) return null;
      const res = await tableApi.updateRecord(tableId, recordId, data);
      if (res.ok) {
        setRecords((prev) =>
          prev.map((r) => (r.id === recordId && res.data ? res.data : r))
        );
      }
      return res;
    },
    [tableId]
  );

  const deleteRecord = useCallback(
    async (recordId: string) => {
      if (!tableId) return null;
      const res = await tableApi.deleteRecord(tableId, recordId);
      if (res.ok) {
        setRecords((prev) => prev.filter((r) => r.id !== recordId));
        setTotal((t) => t - 1);
      }
      return res;
    },
    [tableId]
  );

  const bulkDelete = useCallback(
    async (ids: string[]) => {
      if (!tableId) return null;
      const res = await tableApi.bulkDeleteRecords(tableId, ids);
      if (res.ok) await fetch();
      return res;
    },
    [tableId, fetch]
  );

  return {
    records,
    total,
    loading,
    error,
    refetch: fetch,
    createRecord,
    updateRecord,
    deleteRecord,
    bulkDelete,
  };
}

// ─── Admin ──────────────────────────────────────────────────

export function useAdminUsers() {
  const { data, loading, error, execute } = useAsync(() => adminApi.getUsers());
  useEffect(() => { execute(); }, [execute]);
  return { users: data || [], loading, error, refetch: execute };
}

export function useAuditLog(limit = 50) {
  const { data, loading, error, execute } = useAsync(() => adminApi.getAuditLog(limit));
  useEffect(() => { execute(); }, [execute]);
  return { entries: data || [], loading, error, refetch: execute };
}

export function useUsageDashboard() {
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [u, s] = await Promise.all([adminApi.getUsage(), adminApi.getStats()]);
    if (u.ok && u.data) setUsage(u.data);
    if (s.ok && s.data) setStats(s.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { usage, stats, loading, refetch: fetch };
}
