// ─── Barrel export for API layer ────────────────────────────

export {
  authApi,
  workspaceApi,
  tableApi,
  adminApi,
  healthApi,
  setAuthToken,
  getAuthToken,
} from './client';

export type {
  ApiResponse,
  ApiUser,
  ApiWorkspace,
  ApiBase,
  ApiTable,
  ApiField,
  ApiView,
  ApiRecord,
  AuditEntry,
  UsageSummary,
  AdminStats,
} from './client';

export { useAuthStore } from './useAuth';

export {
  useWorkspaces,
  useWorkspace,
  useCreateWorkspace,
  useTable,
  useRecords,
  useAdminUsers,
  useAuditLog,
  useUsageDashboard,
} from './useData';
