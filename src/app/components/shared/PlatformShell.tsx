import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '../../store/authStore';
import { PinLogin } from '../auth/PinLogin';
import { NavBar } from './NavBar';
import { QuickActions } from './QuickActions';

// ─── Platform Shell ──────────────────────────────────────────
// Wraps the entire app with auth gate and navigation.
// When not authenticated, shows PIN login.
// When authenticated, shows content + bottom nav + quick actions.

interface Props {
  children: React.ReactNode;
}

export function PlatformShell({ children }: Props) {
  const { isAuthenticated, currentProfile, checkSessionExpiry, session } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionWarning, setSessionWarning] = useState(false);

  // ── Session expiry enforcement (check every 30s) ──
  useEffect(() => {
    if (!isAuthenticated || !session) return;
    const interval = setInterval(() => {
      const expired = checkSessionExpiry();
      if (expired) { navigate('/'); return; }
      // Warn when < 15 minutes remain
      const remaining = new Date(session.expiresAt).getTime() - Date.now();
      setSessionWarning(remaining > 0 && remaining < 15 * 60 * 1000);
    }, 30_000);
    return () => clearInterval(interval);
  }, [isAuthenticated, session, checkSessionExpiry, navigate]);

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

  if (!isAuthenticated) {
    return <PinLogin onLogin={handleLogin} />;
  }

  // Full-screen pages that handle their own navigation
  const isFullScreenRoute = ['/washer'].includes(location.pathname);

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
      <QuickActions onAction={handleQuickAction} />
    </>
  );
}

export default PlatformShell;
