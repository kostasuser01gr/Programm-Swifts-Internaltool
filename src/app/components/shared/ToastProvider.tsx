import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';

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
  success: { bg: 'bg-green-500/[0.12]', border: 'border-green-500/30', icon: '✅' },
  error:   { bg: 'bg-red-500/[0.12]', border: 'border-red-500/30', icon: '❌' },
  warning: { bg: 'bg-amber-500/[0.12]', border: 'border-amber-500/30', icon: '⚠️' },
  info:    { bg: 'bg-blue-500/[0.12]', border: 'border-blue-500/30', icon: 'ℹ️' },
};

// Tailwind classes used directly in JSX

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    if (toast.duration === 0) return; // persistent
    const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={`flex items-start gap-2.5 py-3 px-4 rounded-[14px] max-w-[400px] w-full backdrop-blur-[20px] font-sans shadow-[0_8px_30px_rgba(0,0,0,0.3)] pointer-events-auto cursor-pointer transition-all duration-300 ease-in-out border ${colors.bg} ${colors.border}`}
      role="alert"
      aria-live="polite"
      onClick={() => onRemove(toast.id)}
    >
      <span className="text-lg shrink-0 mt-px" aria-hidden="true">{colors.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-slate-100">{toast.title}</div>
        {toast.message && <div className="text-xs text-slate-400 mt-0.5 leading-[1.4]">{toast.message}</div>}
        {toast.action && (
          <button
            className="mt-1.5 py-1 px-2.5 rounded-md bg-blue-500/[0.15] border border-blue-500/30 text-blue-400 text-xs font-semibold cursor-pointer"
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
        className="bg-transparent border-none text-slate-500 cursor-pointer text-sm py-0.5 px-1 shrink-0"
        onClick={e => { e.stopPropagation(); onRemove(toast.id); }}
        aria-label="Κλείσιμο"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
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
      <div className="fixed top-4 right-4 left-4 flex flex-col gap-2 items-end z-[99999] pointer-events-none" role="region" aria-label="Ειδοποιήσεις">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
