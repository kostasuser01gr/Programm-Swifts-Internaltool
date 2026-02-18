// ─── Service Worker Registration ────────────────────────────
// Moved out of index.html inline script to comply with CSP
// (script-src 'self' — no inline scripts allowed)

export function registerSW(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });
    });
  }
}
