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
        <div
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#1e1e2e] to-slate-900 text-slate-200 font-sans p-6 z-[99999]"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-6xl mb-4" aria-hidden="true">⚠️</div>
          <h1 className="text-2xl font-bold mb-2">Κάτι πήγε στραβά</h1>
          <p className="text-sm text-slate-400 text-center max-w-[420px] mb-6 leading-relaxed">
            Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκιμάστε να ξαναφορτώσετε τη σελίδα.
            Αν το πρόβλημα παραμένει, επικοινωνήστε με τον διαχειριστή.
          </p>
          <div className="flex gap-3">
            <button
              className="px-6 py-3 rounded-xl border-none cursor-pointer font-semibold text-sm transition-all duration-200 bg-gradient-to-br from-blue-500 to-indigo-500 text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
              onClick={this.handleReload}
            >
              <span aria-hidden="true">🔄 </span>Ξαναφόρτωση
            </button>
            <button
              className="px-6 py-3 rounded-xl border border-slate-600/15 cursor-pointer font-semibold text-sm transition-all duration-200 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
              onClick={this.handleReset}
            >
              Δοκιμή ξανά
            </button>
            <button
              className="px-6 py-3 rounded-xl border border-slate-600/15 cursor-pointer font-semibold text-sm transition-all duration-200 bg-slate-700/50 text-slate-200 hover:bg-slate-600/50 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2"
              onClick={this.handleClearData}
            >
              Καθαρισμός δεδομένων
            </button>
          </div>
          {this.state.error && (
            <pre className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-red-500/20 max-w-[500px] max-h-[200px] overflow-auto text-xs font-mono text-red-400 whitespace-pre-wrap break-words">
              {this.state.error.name}: {this.state.error.message}
              {this.state.errorInfo?.componentStack && (
                <>
                  {'\n\nComponent Stack:'}
                  {this.state.errorInfo.componentStack}
                </>
              )}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
