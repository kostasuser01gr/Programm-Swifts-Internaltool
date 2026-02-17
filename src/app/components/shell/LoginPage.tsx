// ─── Premium Login Page ─────────────────────────────────────
// Full-screen login/register with theme-token styling.
// Replaces the inline-style ApiLoginScreen from AuthGate.

import React, { useState, useCallback } from 'react';
import { Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { cn } from '../ui/utils';

interface LoginPageProps {
  onSubmit: (data: { email: string; password: string; displayName?: string; mode: 'login' | 'signup' }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginPage({ onSubmit, isLoading, error }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ email, password, displayName: mode === 'signup' ? displayName : undefined, mode });
  }, [email, password, displayName, mode, onSubmit]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      {/* Background aurora */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-info/5 blur-[100px]" />
      </div>

      {/* Brand */}
      <div className="relative z-10 flex flex-col items-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <span className="text-primary-foreground text-xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">DataOS</h1>
        <p className="text-sm text-muted-foreground mt-1">Enterprise Data Platform</p>
      </div>

      {/* Card */}
      <Card className="relative z-10 w-[400px] max-w-[92vw] shadow-2xl border border-border/50">
        <CardContent className="p-6">
          {/* Tab switcher */}
          <div className="flex rounded-lg bg-muted p-1 mb-6">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                mode === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-all',
                mode === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (signup only) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Display Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-input-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 transition"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoComplete="email"
                  className="w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-input-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-input-background text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive text-center py-1">{error}</p>
            )}

            {/* Submit */}
            <Button type="submit" className="w-full h-10" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          {/* Forgot password hint */}
          {mode === 'login' && (
            <p className="text-center text-xs text-muted-foreground mt-4">
              Forgot your password? Contact your admin.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="relative z-10 text-[11px] text-muted-foreground/50 mt-6">
        DataOS v2.0 — Zero-cost deployment
      </p>
    </div>
  );
}

export default LoginPage;
