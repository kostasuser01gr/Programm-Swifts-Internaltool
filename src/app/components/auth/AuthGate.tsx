// ─── Auth Gate ─────────────────────────────────────────────
// Unified auth entry point. Routes to:
// - Real API login (email/password) when VITE_API_URL is configured
// - Demo PIN login when no API is available
// Shows a loading state while checking API availability.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore as useApiAuth } from '../../api/useAuth';
import { useDataMode } from '../../store/dataMode';
import { Spinner, DataModeIndicator } from '../../design-system';

interface AuthGateProps {
  children: React.ReactNode;
  fallbackLogin: React.ReactNode; // The existing PinLogin for demo mode
  onLogin?: () => void;
}

export function AuthGate({ children, fallbackLogin, onLogin }: AuthGateProps) {
  const dataMode = useDataMode();
  const apiAuth = useApiAuth();

  // Check API on mount
  useEffect(() => {
    dataMode.checkApi();
  }, []);

  // If we're checking API availability, show a splash
  if (dataMode.mode === 'checking') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: '#e2e8f0',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚂</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>DataOS</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Spinner size={20} />
          <span style={{ color: '#94a3b8', fontSize: 14 }}>Connecting to server...</span>
        </div>
      </div>
    );
  }

  // If in API mode and authenticated, show the app
  if (dataMode.mode === 'api' && apiAuth.isAuthenticated) {
    return <>{children}</>;
  }

  // If in API mode but not authenticated, show API login
  if (dataMode.mode === 'api') {
    return <ApiLoginScreen onLogin={onLogin} />;
  }

  // Mock mode: use the existing PIN login flow
  return <>{fallbackLogin}</>;
}

// ─── API Login Screen ───────────────────────────────────────

function ApiLoginScreen({ onLogin }: { onLogin?: () => void }) {
  const { login, register, isLoading, error, clearError } = useApiAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let success: boolean;
    if (mode === 'login') {
      success = await login(email, password);
    } else {
      success = await register(email, password, displayName);
    }

    if (success && onLogin) onLogin();
  }, [mode, email, password, displayName, login, register, clearError, onLogin]);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#e2e8f0',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🚂</div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>DataOS</h1>
      <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24 }}>Station Management Platform</p>

      <DataModeIndicator mode="api" />

      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: 24,
          background: 'rgba(30, 41, 59, 0.8)',
          borderRadius: 24,
          border: '1px solid rgba(148, 163, 184, 0.1)',
          backdropFilter: 'blur(20px)',
          padding: '32px 28px',
          width: 380,
          maxWidth: '92vw',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
        }}
      >
        {/* Tab switcher */}
        <div style={{
          display: 'flex', marginBottom: 24, borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.15)',
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); clearError(); }}
            style={{
              flex: 1, padding: '12px 16px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', border: 'none', textAlign: 'center',
              color: mode === 'login' ? '#e2e8f0' : '#94a3b8',
              background: mode === 'login' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            Σύνδεση
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); clearError(); }}
            style={{
              flex: 1, padding: '12px 16px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', border: 'none', textAlign: 'center',
              color: mode === 'signup' ? '#e2e8f0' : '#94a3b8',
              background: mode === 'signup' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            Εγγραφή
          </button>
        </div>

        {mode === 'signup' && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
              Όνομα
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="π.χ. Γιάννης Π."
              required
              style={inputStyle}
            />
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@station.gr"
            required
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'block' }}>
            Κωδικός
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            style={inputStyle}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: 'none', fontSize: 15, fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            background: isLoading ? '#334155' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: '#fff',
            boxShadow: isLoading ? 'none' : '0 4px 15px rgba(59,130,246,0.3)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isLoading && <Spinner size={16} color="#fff" />}
          {mode === 'login' ? 'Σύνδεση' : 'Δημιουργία Λογαριασμού'}
        </button>
      </form>

      <p style={{
        position: 'fixed', bottom: 16, fontSize: 11, color: '#475569',
      }}>
        DataOS v2.0 — Station Management Platform
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.15)',
  background: 'rgba(15, 23, 42, 0.5)',
  color: '#e2e8f0',
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
};
