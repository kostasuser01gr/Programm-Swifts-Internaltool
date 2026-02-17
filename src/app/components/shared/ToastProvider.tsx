import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// ─── Toast Notification System ───────────────────────────────
// Lightweight, accessible toast notifications. No external deps.
// Supports: success, error, warning, info. Auto-dismiss.

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = persistent
  action?: { label: string; onClick: () => void };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => string;
  error: (title: string, message?: string) => string;
  warning: (title: string, message?: string) => string;
  info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: '✅' },
  error:   { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⚠️' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: 'ℹ️' },
};

const ts: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', top: 16, right: 16, left: 16,
    display: 'flex', flexDirection: 'column', gap: 8,
    alignItems: 'flex-end', zIndex: 99999,
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 16px', borderRadius: 14, maxWidth: 400, width: '100%',
    backdropFilter: 'blur(20px)', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
    pointerEvents: 'auto', cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  icon: {
    fontSize: 18, flexShrink: 0, marginTop: 1,
  },
  content: {
    flex: 1, minWidth: 0,
  },
  title: {
    fontSize: 14, fontWeight: 600, color: '#f1f5f9',
  },
  message: {
    fontSize: 12, color: '#94a3b8', marginTop: 2, lineHeight: 1.4,
  },
  close: {
    background: 'none', border: 'none', color: '#64748b',
    cursor: 'pointer', fontSize: 14, padding: '2px 4px',
    flexShrink: 0,
  },
  action: {
    marginTop: 6, padding: '4px 10px', borderRadius: 6,
    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
    color: '#60a5fa', fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    if (toast.duration === 0) return; // persistent
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      style={{
        ...ts.toast,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
      role="alert"
      aria-live="polite"
      onClick={() => onRemove(toast.id)}
    >
      <span style={ts.icon}>{colors.icon}</span>
      <div style={ts.content}>
        <div style={ts.title}>{toast.title}</div>
        {toast.message && <div style={ts.message}>{toast.message}</div>}
        {toast.action && (
          <button
            style={ts.action}
            onClick={e => {
              e.stopPropagation();
              toast.action!.onClick();
              onRemove(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        style={ts.close}
        onClick={e => { e.stopPropagation(); onRemove(toast.id); }}
        aria-label="Κλείσιμο"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }].slice(-5)); // max 5 visible
    return id;
  }, []);

  const success = useCallback((title: string, message?: string) =>
    addToast({ type: 'success', title, message }), [addToast]);
  const error = useCallback((title: string, message?: string) =>
    addToast({ type: 'error', title, message }), [addToast]);
  const warning = useCallback((title: string, message?: string) =>
    addToast({ type: 'warning', title, message }), [addToast]);
  const info = useCallback((title: string, message?: string) =>
    addToast({ type: 'info', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <div style={ts.container} aria-label="Ειδοποιήσεις">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
