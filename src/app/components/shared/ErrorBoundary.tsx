import React, { Component, type ErrorInfo, type ReactNode } from 'react';

// ─── Error Boundary ──────────────────────────────────────────
// Catches unhandled errors and shows a recovery UI.
// Reports errors to console (swap with Sentry in production).

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const eb: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1e2e 50%, #0f172a 100%)',
    color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: 24, zIndex: 99999,
  },
  icon: {
    fontSize: 64, marginBottom: 16,
  },
  title: {
    fontSize: 24, fontWeight: 700, marginBottom: 8,
  },
  message: {
    fontSize: 14, color: '#94a3b8', textAlign: 'center' as const,
    maxWidth: 420, marginBottom: 24, lineHeight: 1.6,
  },
  actions: {
    display: 'flex', gap: 12,
  },
  btn: {
    padding: '12px 24px', borderRadius: 12,
    border: 'none', cursor: 'pointer', fontWeight: 600,
    fontSize: 14, transition: 'all 0.2s',
  },
  btnPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
    color: '#fff',
  },
  btnSecondary: {
    background: 'rgba(51, 65, 85, 0.5)',
    border: '1px solid rgba(148,163,184,0.15)',
    color: '#e2e8f0',
  },
  details: {
    marginTop: 24, padding: 16, borderRadius: 12,
    background: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    maxWidth: 500, maxHeight: 200, overflow: 'auto',
    fontSize: 12, fontFamily: 'monospace', color: '#f87171',
    whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
  },
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // TODO: Report to Sentry when integrated
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleClearData = () => {
    if (window.confirm('Αυτό θα διαγράψει όλα τα τοπικά δεδομένα. Σίγουρα;')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div style={eb.container} role="alert">
          <div style={eb.icon}>⚠️</div>
          <h1 style={eb.title}>Κάτι πήγε στραβά</h1>
          <p style={eb.message}>
            Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκιμάστε να ξαναφορτώσετε τη σελίδα.
            Αν το πρόβλημα παραμένει, επικοινωνήστε με τον διαχειριστή.
          </p>
          <div style={eb.actions}>
            <button
              style={{ ...eb.btn, ...eb.btnPrimary }}
              onClick={this.handleReload}
            >
              🔄 Ξαναφόρτωση
            </button>
            <button
              style={{ ...eb.btn, ...eb.btnSecondary }}
              onClick={this.handleReset}
            >
              Δοκιμή ξανά
            </button>
            <button
              style={{ ...eb.btn, ...eb.btnSecondary }}
              onClick={this.handleClearData}
            >
              Καθαρισμός δεδομένων
            </button>
          </div>
          {this.state.error && (
            <div style={eb.details}>
              {this.state.error.name}: {this.state.error.message}
              {this.state.errorInfo?.componentStack && (
                <>
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
