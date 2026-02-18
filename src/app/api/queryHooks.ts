// ── TanStack Query Hooks ──────────────────────────────────
// Server-state hooks with pagination, caching, and retries.
// Wraps the existing api/client.ts functions.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workspaceApi, tableApi, adminApi, healthApi } from './client';

// ── Query Keys ────────────────────────────────────────────

export const queryKeys = {
  health: ['health'] as const,
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspaces', id] as const,
  table: (tableId: string) => ['tables', tableId] as const,
  records: (tableId: string, page?: number) => ['records', tableId, page ?? 1] as const,
  adminUsers: ['admin', 'users'] as const,
  auditLog: (page?: number) => ['admin', 'audit', page ?? 1] as const,
  usage: ['admin', 'usage'] as const,
  stats: ['admin', 'stats'] as const,
};

// ── Health ────────────────────────────────────────────────

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.check(),
    staleTime: 60_000,
    retry: 1,
  });
}

// ── Workspaces ────────────────────────────────────────────

export function useWorkspaces() {
  return useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: () => workspaceApi.list(),
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: queryKeys.workspace(id),
    queryFn: () => workspaceApi.get(id),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      workspaceApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

export function useDeleteWorkspace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspaceApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workspaces });
    },
  });
}

// ── Tables & Records ──────────────────────────────────────

export function useTable(tableId: string) {
  return useQuery({
    queryKey: queryKeys.table(tableId),
    queryFn: () => tableApi.get(tableId),
    enabled: !!tableId,
  });
}

export function useRecords(tableId: string, page = 1) {
  return useQuery({
    queryKey: queryKeys.records(tableId, page),
    queryFn: () => tableApi.getRecords(tableId, page),
    enabled: !!tableId,
    placeholderData: (prev) => prev, // keep previous data while fetching next page
  });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, data }: { tableId: string; data: Record<string, unknown> }) =>
      tableApi.createRecord(tableId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.records(vars.tableId) });
    },
  });
}

export function useUpdateRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, recordId, data }: { tableId: string; recordId: string; data: Record<string, unknown> }) =>
      tableApi.updateRecord(tableId, recordId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.records(vars.tableId) });
    },
  });
}

export function useDeleteRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tableId, recordId }: { tableId: string; recordId: string }) =>
      tableApi.deleteRecord(tableId, recordId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.records(vars.tableId) });
    },
  });
}

// ── Admin ─────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: () => adminApi.getUsers(),
  });
}

export function useAuditLog(page = 1) {
  return useQuery({
    queryKey: queryKeys.auditLog(page),
    queryFn: () => adminApi.getAuditLog(page),
    placeholderData: (prev) => prev,
  });
}

export function useUsageDashboard() {
  return useQuery({
    queryKey: queryKeys.usage,
    queryFn: () => adminApi.getUsage(),
    staleTime: 60_000,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => adminApi.getStats(),
    staleTime: 60_000,
  });
}
