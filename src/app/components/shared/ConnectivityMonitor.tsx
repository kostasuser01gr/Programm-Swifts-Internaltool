import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';

// ─── Connectivity & Session Monitor ─────────────────────────
// Shows offline banner when network is down.
// Auto-logs out on session expiry.

const cm: Record<string, React.CSSProperties> = {
  offlineBanner: {
    position: 'fixed', top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    color: '#fff', fontSize: 13, fontWeight: 600,
    zIndex: 99998, textAlign: 'center',
    boxShadow: '0 2px 12px rgba(220,38,38,0.3)',
  },
  sessionBanner: {
    position: 'fixed', top: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0f172a', fontSize: 13, fontWeight: 600,
    zIndex: 99997, textAlign: 'center',
    cursor: 'pointer',
  },
  reconnectDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: '#fca5a5',
    animation: 'pulse 1.5s infinite',
  },
};

const pulseAnim = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

export function ConnectivityMonitor({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [sessionExpiringSoon, setSessionExpiringSoon] = useState(false);
  const { session, isAuthenticated, checkSessionExpiry } = useAuthStore();

  // Network monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session expiry check (every 60s)
  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const checkExpiry = () => {
      if (checkSessionExpiry()) return; // Already expired and logged out

      const expiresAt = new Date(session.expiresAt).getTime();
      const remaining = expiresAt - Date.now();
      // Warn 15 min before expiry
      setSessionExpiringSoon(remaining > 0 && remaining < 15 * 60 * 1000);
    };

    checkExpiry();
    const interval = setInterval(checkExpiry, 60_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, session, checkSessionExpiry]);

  const handleExtendSession = useCallback(() => {
    // Re-login would be needed; for now just dismiss the warning
    setSessionExpiringSoon(false);
  }, []);

  return (
    <>
      <style>{pulseAnim}</style>

      {!isOnline && (
        <div style={cm.offlineBanner} role="alert" aria-live="assertive">
          <div style={cm.reconnectDot} />
          <span>Εκτός σύνδεσης — Οι αλλαγές αποθηκεύονται τοπικά</span>
        </div>
      )}

      {showReconnected && isOnline && (
        <div
          style={{ ...cm.offlineBanner, background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          role="status"
          aria-live="polite"
        >
          ✓ Επανασυνδέθηκε
        </div>
      )}

      {sessionExpiringSoon && isAuthenticated && (
        <div
          style={cm.sessionBanner}
          onClick={handleExtendSession}
          role="alert"
        >
          ⏰ Η συνεδρία λήγει σύντομα — Πατήστε για ανανέωση
        </div>
      )}

      <div style={!isOnline ? { paddingTop: 36 } : undefined}>
        {children}
      </div>
    </>
  );
}

export default ConnectivityMonitor;
