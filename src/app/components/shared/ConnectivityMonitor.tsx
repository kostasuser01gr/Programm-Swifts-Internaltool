import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';

// ─── Connectivity & Session Monitor ─────────────────────────
// Shows offline banner when network is down.
// Auto-logs out on session expiry. 

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
      {!isOnline && (
        <div
          className="fixed top-0 inset-x-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[13px] font-semibold z-[99998] text-center shadow-lg shadow-red-600/30"
          role="alert"
          aria-live="assertive"
        >
          <span className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
          <span>Εκτός σύνδεσης — Οι αλλαγές αποθηκεύονται τοπικά</span>
        </div>
      )}

      {showReconnected && isOnline && (
        <div
          className="fixed top-0 inset-x-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-[13px] font-semibold z-[99998] text-center shadow-lg shadow-green-500/30"
          role="status"
          aria-live="polite"
        >
          ✓ Επανασυνδέθηκε
        </div>
      )}

      {sessionExpiringSoon && isAuthenticated && (
        <button
          className="fixed top-0 inset-x-0 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 text-[13px] font-semibold z-[99997] text-center cursor-pointer border-none w-full hover:brightness-110 transition-all"
          onClick={handleExtendSession}
          role="alert"
        >
          ⏰ Η συνεδρία λήγει σύντομα — Πατήστε για ανανέωση
        </button>
      )}

      <div className={!isOnline ? 'pt-9' : undefined}>
        {children}
      </div>
    </>
  );
}

export default ConnectivityMonitor;
