import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';

// ─── Theme System ────────────────────────────────────────────
// CSS-variable-based theme with dark (default), light, and system auto.

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: 'dark' | 'light';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// CSS custom properties for each theme
const darkVars: Record<string, string> = {
  '--bg-primary': '#0f172a',
  '--bg-secondary': '#1e293b',
  '--bg-tertiary': '#334155',
  '--bg-card': 'rgba(30,41,59,0.4)',
  '--bg-input': 'rgba(15,23,42,0.5)',
  '--bg-overlay': 'rgba(0,0,0,0.6)',
  '--text-primary': '#e2e8f0',
  '--text-secondary': '#94a3b8',
  '--text-tertiary': '#64748b',
  '--text-muted': '#475569',
  '--border-primary': 'rgba(148,163,184,0.12)',
  '--border-secondary': 'rgba(148,163,184,0.06)',
  '--accent-blue': '#3b82f6',
  '--accent-green': '#22c55e',
  '--accent-red': '#ef4444',
  '--accent-yellow': '#f59e0b',
  '--accent-purple': '#a855f7',
  '--accent-cyan': '#06b6d4',
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.3)',
  '--shadow-md': '0 4px 6px rgba(0,0,0,0.4)',
  '--shadow-lg': '0 10px 15px rgba(0,0,0,0.5)',
  '--glass-bg': 'rgba(15,23,42,0.7)',
  '--glass-border': 'rgba(148,163,184,0.08)',
};

const lightVars: Record<string, string> = {
  '--bg-primary': '#f8fafc',
  '--bg-secondary': '#ffffff',
  '--bg-tertiary': '#f1f5f9',
  '--bg-card': 'rgba(255,255,255,0.8)',
  '--bg-input': 'rgba(241,245,249,0.8)',
  '--bg-overlay': 'rgba(0,0,0,0.3)',
  '--text-primary': '#0f172a',
  '--text-secondary': '#475569',
  '--text-tertiary': '#94a3b8',
  '--text-muted': '#cbd5e1',
  '--border-primary': 'rgba(15,23,42,0.1)',
  '--border-secondary': 'rgba(15,23,42,0.05)',
  '--accent-blue': '#2563eb',
  '--accent-green': '#16a34a',
  '--accent-red': '#dc2626',
  '--accent-yellow': '#d97706',
  '--accent-purple': '#9333ea',
  '--accent-cyan': '#0891b2',
  '--shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
  '--shadow-md': '0 4px 6px rgba(0,0,0,0.07)',
  '--shadow-lg': '0 10px 15px rgba(0,0,0,0.1)',
  '--glass-bg': 'rgba(255,255,255,0.85)',
  '--glass-border': 'rgba(15,23,42,0.06)',
};

function applyThemeVars(resolved: 'dark' | 'light') {
  const vars = resolved === 'dark' ? darkVars : lightVars;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', resolved);
}

function getSystemPreference(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, updateSettings } = useSettingsStore();
  const mode: ThemeMode = settings.themeMode || 'dark';

  const resolved: 'dark' | 'light' = useMemo(() => {
    if (mode === 'system') return getSystemPreference();
    return mode;
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    updateSettings({ themeMode: m });
  }, [updateSettings]);

  // Apply CSS vars on mount and when resolved changes
  useEffect(() => {
    applyThemeVars(resolved);
  }, [resolved]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeVars(getSystemPreference());
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const value = useMemo(() => ({ mode, resolved, setMode }), [mode, resolved, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme state.
 *
 * Usage:
 * ```tsx
 * const { mode, resolved, setMode } = useTheme();
 * ```
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
