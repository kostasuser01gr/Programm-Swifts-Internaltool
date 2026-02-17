// ─── Error Pages ────────────────────────────────────────────
// Premium 404 and 500 pages with consistent branding.

import { useNavigate } from 'react-router';
import { Home, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { Button } from '../ui/button';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-8">
          <span className="text-[120px] sm:text-[160px] font-bold leading-none text-muted/40 select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-12 h-12 text-muted-foreground/60" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
          Check the URL or head back to the dashboard.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" /> Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ErrorPage({ error, onRetry }: { error?: Error; onRetry?: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>

        <h1 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          An unexpected error occurred. If this keeps happening, please contact support.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-muted/50 border border-border">
            <code className="text-xs text-destructive break-all font-mono">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={onRetry ?? (() => window.location.reload())} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
