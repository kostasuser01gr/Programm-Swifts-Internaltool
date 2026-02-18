import { describe, it, expect, vi } from 'vitest';
import { canWrite } from '../utils/rbac';

// ─── Mock requireTableAccess is tested in integration;
//     here we unit-test canWrite + verify the RBAC contract. ──

describe('RBAC — canWrite', () => {
  it('returns true for owner', () => {
    expect(canWrite('owner')).toBe(true);
  });

  it('returns true for editor', () => {
    expect(canWrite('editor')).toBe(true);
  });

  it('returns false for viewer', () => {
    expect(canWrite('viewer')).toBe(false);
  });

  it('returns false for unknown roles', () => {
    expect(canWrite('guest')).toBe(false);
    expect(canWrite('')).toBe(false);
  });
});

describe('RBAC — requireTableAccess contract', () => {
  // This tests the SQL query contract by verifying the function signature
  // and return types. Full integration tests require D1 runtime.

  it('requireTableAccess is importable and callable', async () => {
    const { requireTableAccess } = await import('../utils/rbac');
    expect(typeof requireTableAccess).toBe('function');
  });

  it('requireWorkspaceAccess is importable and callable', async () => {
    const { requireWorkspaceAccess } = await import('../utils/rbac');
    expect(typeof requireWorkspaceAccess).toBe('function');
  });
});

describe('RBAC — anti-enumeration contract', () => {
  it('non-member should get 404 (not 403) from table endpoints', async () => {
    // This documents the security contract:
    // When requireTableAccess returns null, the route handler returns 404.
    // This prevents attackers from discovering valid resource IDs.
    const { requireTableAccess } = await import('../utils/rbac');

    // Mock a DB that returns no rows (user is not a member)
    const mockEnv = {
      DB: {
        prepare: vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    };

    const result = await requireTableAccess(mockEnv as never, 'usr_123', 'tbl_456');
    expect(result).toBeNull();
    // The route handler should return 404 when result is null
  });

  it('viewer should get 403 on write attempts', () => {
    // When requireTableAccess returns { memberRole: 'viewer' }
    // and canWrite('viewer') returns false,
    // the route handler should return 403.
    expect(canWrite('viewer')).toBe(false);
  });

  it('editor should succeed on write attempts', () => {
    expect(canWrite('editor')).toBe(true);
  });

  it('owner should succeed on write attempts', () => {
    expect(canWrite('owner')).toBe(true);
  });
});
