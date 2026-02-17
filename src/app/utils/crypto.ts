// ─── PIN Hashing with Web Crypto API ─────────────────────────
// Uses PBKDF2 with SHA-256 for secure PIN storage.
// No external dependencies — pure browser Web Crypto.

const ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a PIN using PBKDF2 with a random salt.
 * Returns a string in format: `salt:hash` (hex-encoded).
 */
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return `${bufferToHex(salt.buffer as ArrayBuffer)}:${bufferToHex(derivedBits)}`;
}

/**
 * Verify a PIN against a stored hash string (`salt:hash`).
 * Falls back to plain-text comparison for migration from unhashed PINs.
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Migration: if stored hash doesn't contain ':', it's a plain-text PIN
  if (!storedHash.includes(':')) {
    return pin === storedHash;
  }

  const [saltHex, hashHex] = storedHash.split(':');
  const encoder = new TextEncoder();
  const salt = hexToBuffer(saltHex);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  return bufferToHex(derivedBits) === hashHex;
}

/**
 * Generate a cryptographically secure session token.
 */
export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bufferToHex(bytes.buffer);
}

/**
 * Generate a device fingerprint from available browser APIs.
 */
export function generateDeviceId(): string {
  const parts = [
    navigator.userAgent.slice(0, 50),
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    Date.now().toString(36),
    crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
  ];
  return `dev-${parts.join('-').replace(/[^a-zA-Z0-9-]/g, '').slice(0, 64)}`;
}
