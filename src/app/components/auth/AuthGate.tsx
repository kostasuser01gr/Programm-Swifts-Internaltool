// ─── Auth Gate ─────────────────────────────────────────────
// Unified auth entry point. Routes to:
// - Real API login (email/password) when VITE_API_URL is configured
// - Demo PIN login when no API is available
// Shows a loading state while checking API availability.

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore as useApiAuth } from '../../api/useAuth';
import { useDataMode } from '../../store/dataMode';
import { LoginPage } from '../shell/LoginPage';

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
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-4">
          <span className="text-primary-foreground text-lg font-bold">D</span>
        </div>
        <h1 className="text-xl font-bold text-foreground mb-3">DataOS</h1>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Connecting to server...</span>
        </div>
      </div>
    );
  }

  // If in API mode and authenticated, show the app
  if (dataMode.mode === 'api' && apiAuth.isAuthenticated) {
    return <>{children}</>;
  }

  // If in API mode but not authenticated, show premium API login
  if (dataMode.mode === 'api') {
    return <ApiLoginWrapper onLogin={onLogin} />;
  }

  // Mock mode: use the existing PIN login flow
  return <>{fallbackLogin}</>;
}

// ─── Premium API Login Wrapper ──────────────────────────────

function ApiLoginWrapper({ onLogin }: { onLogin?: () => void }) {
  const { login, register, isLoading, error, clearError } = useApiAuth();

  const handleSubmit = useCallback(async (data: { email: string; password: string; displayName?: string; mode: 'login' | 'signup' }) => {
    clearError();
    let success: boolean;

    if (data.mode === 'login') {
      success = await login(data.email, data.password);
    } else {
      success = await register(data.email, data.password, data.displayName || '');
    }

    if (success && onLogin) onLogin();
  }, [login, register, clearError, onLogin]);

  return (
    <LoginPage
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
