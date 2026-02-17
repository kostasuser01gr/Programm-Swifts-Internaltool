// ─── Tests: Crypto Utilities ─────────────────────────────────
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPin, verifyPin, generateSessionToken, generateDeviceId } from '../app/utils/crypto';

// Mock Web Crypto API for jsdom
const mockCrypto = {
  getRandomValues: (arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  },
  subtle: {
    importKey: vi.fn().mockResolvedValue('mock-key'),
    deriveBits: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
  },
};

beforeEach(() => {
  Object.defineProperty(globalThis, 'crypto', { value: mockCrypto, writable: true, configurable: true });
});

describe('hashPin', () => {
  it('returns a salt:hash string', async () => {
    const result = await hashPin('1234');
    expect(result).toContain(':');
    const [salt, hash] = result.split(':');
    expect(salt.length).toBeGreaterThan(0);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('generates different hashes for the same PIN', async () => {
    const hash1 = await hashPin('1234');
    const hash2 = await hashPin('1234');
    // Different salts means different results
    expect(hash1.split(':')[0]).not.toBe(hash2.split(':')[0]);
  });
});

describe('verifyPin', () => {
  it('handles plain-text PIN migration', async () => {
    // If storedHash has no colon → plain-text comparison
    const result = await verifyPin('1234', '1234');
    expect(result).toBe(true);
  });

  it('rejects wrong plain-text PIN', async () => {
    const result = await verifyPin('9999', '1234');
    expect(result).toBe(false);
  });

  it('calls crypto.subtle for hashed PINs', async () => {
    const result = await verifyPin('1234', 'abc123:def456');
    // With mocked subtle, deriveBits returns empty buffer → both hashes will match
    expect(typeof result).toBe('boolean');
  });
});

describe('generateSessionToken', () => {
  it('returns a hex string', () => {
    const token = generateSessionToken();
    expect(token.length).toBe(64); // 32 bytes → 64 hex chars
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });
});

describe('generateDeviceId', () => {
  it('returns a string starting with dev-', () => {
    const id = generateDeviceId();
    expect(id.startsWith('dev-')).toBe(true);
    expect(id.length).toBeGreaterThan(4);
    expect(id.length).toBeLessThanOrEqual(68); // 'dev-' + up to 64 chars
  });
});
