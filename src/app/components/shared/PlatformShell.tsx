import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { useDataMode } from '../../store/dataMode';
import { PinLogin } from '../auth/PinLogin';
import { AuthGate } from '../auth/AuthGate';
import { NavBar } from './NavBar';
import { QuickActions } from './QuickActions';
import { DataModeIndicator } from '../../design-system';

// ─── Platform Shell ──────────────────────────────────────────
// Wraps the entire app with auth gate and navigation.
// When API is available, uses email/password auth via AuthGate.
// When in demo/mock mode, uses PIN login.
// When authenticated, shows content + bottom nav + quick actions.

interface Props {
  children: React.ReactNode;
}

export function PlatformShell({ children }: Props) {
  const { isAuthenticated, currentProfile, checkSessionExpiry, session } = useAuthStore();
  const dataMode = useDataMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionWarning, setSessionWarning] = useState(false);

  // ── Session expiry enforcement (check every 30s) — only for mock/PIN mode ──
  useEffect(() => {
    if (dataMode.mode === 'api') return; // API mode handles its own sessions
    if (!isAuthenticated || !session) return;
    const interval = setInterval(() => {
      const expired = checkSessionExpiry();
      if (expired) { navigate('/'); return; }
      // Warn when < 15 minutes remain
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      setSessionWarning(remaining > 0 && remaining < 15 * 60 * 1000);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, session, checkSessionExpiry, navigate, dataMode.mode]);

  const handleLogin = useCallback(() => {
    // After login, navigate to user's preferred default view
    const prefs = useAuthStore.getState().currentProfile?.preferences;
    if (prefs?.defaultView === 'chat') navigate('/chat');
    else if (prefs?.defaultView === 'fleet') navigate('/fleet');
    else if (prefs?.defaultView === 'washer') navigate('/washer');
    // else stay on current route
  }, [navigate]);

  const handleQuickAction = useCallback((actionId: string) => {
    switch (actionId) {
      case 'open_chat': navigate('/chat'); break;
      case 'request_shift_swap': navigate('/'); break;
      case 'report_damage': navigate('/fleet'); break;
      case 'add_to_wash_queue': navigate('/washer'); break;
      case 'change_status': navigate('/chat'); break;
      case 'search_plate': navigate('/fleet'); break;
      case 'add_fleet_note': navigate('/fleet'); break;
      case 'car_ready': navigate('/washer'); break;
      case 'send_urgent': navigate('/chat'); break;
      case 'take_photo': navigate('/fleet'); break;
      default: break;
    }
  }, [navigate]);

  if (!isAuthenticated && dataMode.mode === 'mock') {
    return <PinLogin onLogin={handleLogin} />;
  }

  // In API mode, use the AuthGate for authentication
  if (dataMode.mode === 'api' || dataMode.mode === 'checking') {
    return (
      <AuthGate
        fallbackLogin={<PinLogin onLogin={handleLogin} />}
        onLogin={handleLogin}
      >
        <ShellContent
          sessionWarning={sessionWarning}
          isFullScreenRoute={['/washer'].includes(location.pathname)}
          dataMode={dataMode.mode}
          onAction={handleQuickAction}
        >
          {children}
        </ShellContent>
      </AuthGate>
    );
  }

  // Full-screen pages that handle their own navigation
  const isFullScreenRoute = ['/washer'].includes(location.pathname);

  return (
    <ShellContent
      sessionWarning={sessionWarning}
      isFullScreenRoute={isFullScreenRoute}
      dataMode={dataMode.mode}
      onAction={handleQuickAction}
    >
      {children}
    </ShellContent>
  );
}

// ─── Shell Content (shared between API and mock modes) ──────

function ShellContent({ children, sessionWarning, isFullScreenRoute, dataMode, onAction }: {
  children: React.ReactNode;
  sessionWarning: boolean;
  isFullScreenRoute: boolean;
  dataMode: 'api' | 'mock' | 'checking';
  onAction: (id: string) => void;
}) {
  return (
    <>
      {sessionWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9500,
          background: 'rgba(245,158,11,0.95)', color: '#000', textAlign: 'center',
          padding: '8px 16px', fontSize: 13, fontWeight: 600,
          backdropFilter: 'blur(4px)',
        }}>
          ⚠️ Η συνεδρία σας λήγει σύντομα — αποθηκεύστε τις αλλαγές σας
        </div>
      )}
      <div style={{ paddingBottom: isFullScreenRoute ? 0 : 72, paddingTop: sessionWarning ? 36 : 0 }}>
        {children}
      </div>
      {!isFullScreenRoute && <NavBar />}
      <QuickActions onAction={onAction} />
      {/* Data mode indicator */}
      <div style={{ position: 'fixed', bottom: 76, left: 12, zIndex: 100 }}>
        <DataModeIndicator mode={dataMode} />
      </div>
    </>
  );
}

export default PlatformShell;
