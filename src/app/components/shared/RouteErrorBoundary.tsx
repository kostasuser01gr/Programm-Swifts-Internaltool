// ── Route Error Boundary ──────────────────────────────────
// Wraps individual routes with error boundaries that show
// user-friendly error messages without crashing the entire app.

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[RouteErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {this.props.fallbackTitle || 'Something went wrong'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Widget Error Boundary ─────────────────────────────────
// Lighter error boundary for dashboard widgets/cards.

export class WidgetErrorBoundary extends Component<
  { children: ReactNode; name?: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; name?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[Widget: ${this.props.name || 'unknown'}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-6 rounded-xl border border-border bg-muted/30 text-muted-foreground text-sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          {this.props.name ? `${this.props.name} failed to load` : 'Widget failed to load'}
          <button
            onClick={() => this.setState({ hasError: false })}
            className="ml-3 text-primary hover:underline text-xs"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
