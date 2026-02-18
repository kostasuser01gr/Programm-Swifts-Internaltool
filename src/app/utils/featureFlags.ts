// ── Feature Flags ──────────────────────────────────────────
// All features are OFF by default. Enable via VITE_FEATURE_* env vars.
// This ensures the app runs perfectly without any paid services.

export interface FeatureFlags {
  /** AI-powered assistant (may use external APIs) */
  ai: boolean;
  /** Real-time collaboration (WebSocket/SSE) */
  realtime: boolean;
  /** File uploads (may use storage services) */
  fileUploads: boolean;
  /** Analytics dashboard (may use third-party analytics) */
  analytics: boolean;
  /** External auth providers (OAuth, SSO) */
  externalAuth: boolean;
}

function envBool(key: string): boolean {
  const v = import.meta.env[key];
  return v === 'true' || v === '1';
}

export const featureFlags: FeatureFlags = {
  ai: envBool('VITE_FEATURE_AI'),
  realtime: envBool('VITE_FEATURE_REALTIME'),
  fileUploads: envBool('VITE_FEATURE_FILE_UPLOADS'),
  analytics: envBool('VITE_FEATURE_ANALYTICS'),
  externalAuth: envBool('VITE_FEATURE_EXTERNAL_AUTH'),
};

/** Check if a specific feature is enabled */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag];
}

/** Validate env vars at startup and log warnings */
export function validateEnv(): void {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    console.info(
      '[DataOS] VITE_API_URL is not set — running in local mock mode. ' +
      'Set it in .env to connect to the Cloudflare Worker API.',
    );
  }

  // Log active feature flags
  const active = Object.entries(featureFlags)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (active.length > 0) {
    console.info('[DataOS] Active feature flags:', active.join(', '));
  }
}
