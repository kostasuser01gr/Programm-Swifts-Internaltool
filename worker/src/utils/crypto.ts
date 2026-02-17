// ─── Cryptographic Utilities (Web Crypto API) ───────────────
// Zero-dependency, runs natively in Cloudflare Workers

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

/** Hash a password with PBKDF2-SHA256 + random salt */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const key = await deriveKey(password, salt);
  const hash = await crypto.subtle.exportKey('raw', key) as ArrayBuffer;
  const hashArr = new Uint8Array(hash);
  return `$pbkdf2$${PBKDF2_ITERATIONS}$${toBase64(salt)}$${toBase64(hashArr)}`;
}

/** Verify a password against a stored hash */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$');
  if (parts.length !== 5 || parts[1] !== 'pbkdf2') return false;
  const iterations = parseInt(parts[2], 10);
  const salt = fromBase64(parts[3]);
  const expectedHash = fromBase64(parts[4]);
  const key = await deriveKey(password, salt, iterations);
  const actualHash = new Uint8Array(await crypto.subtle.exportKey('raw', key) as ArrayBuffer);
  return timingSafeEqual(expectedHash, actualHash);
}

/** Generate a cryptographically secure session token */
export function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toHex(bytes);
}

/** Hash a session token for safe storage */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return toHex(new Uint8Array(hash));
}

/** Generate a unique ID with prefix */
export function generateId(prefix: string): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  return `${prefix}_${timestamp}${toHex(random).slice(0, 8)}`;
}

// ─── Internal helpers ───────────────────────────────────────

async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations = PBKDF2_ITERATIONS
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: HASH_LENGTH * 8 },
    true,
    ['encrypt']
  );
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }
  return result === 0;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(str: string): Uint8Array {
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
