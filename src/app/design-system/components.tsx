// ─── Design System: Skeleton & Loading Components ───────────
// Consistent loading patterns for async data states

import { type CSSProperties } from 'react';

const pulseKeyframes = `
@keyframes ds-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
`;

// Inject keyframes once
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseKeyframes;
  document.head.appendChild(style);
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({ width, height = 16, className = '', rounded = true, circle = false }: SkeletonProps) {
  const style: CSSProperties = {
    width: circle ? height : (width || '100%'),
    height,
    borderRadius: circle ? '50%' : (rounded ? 6 : 0),
    background: 'var(--bg-tertiary)',
    animation: 'ds-pulse 1.5s ease-in-out infinite',
  };

  return <div className={className} style={style} aria-hidden="true" />;
}

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? '60%' : '100%'}
        />
      ))}
    </div>
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div
      className={className}
      style={{
        padding: 16,
        borderRadius: 8,
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Skeleton circle height={40} />
        <div style={{ flex: 1 }}>
          <Skeleton height={14} width="40%" />
          <div style={{ height: 8 }} />
          <Skeleton height={12} width="25%" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={className} style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-primary)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} height={14} width={i === 0 ? '20%' : '15%'} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} height={14} width={col === 0 ? '20%' : '15%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        textAlign: 'center',
        minHeight: 300,
      }}
    >
      {icon && (
        <div style={{ marginBottom: 16, color: 'var(--text-tertiary)', opacity: 0.5 }}>
          {icon}
        </div>
      )}
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360, lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

// ─── Spinner ────────────────────────────────────────────────

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

export function Spinner({ size = 24, color = 'var(--accent-blue)', className = '' }: SpinnerProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}
      aria-label="Loading"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.2"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Status Badge ───────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
}

const badgeColors: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)', dot: 'var(--text-muted)' },
  success: { bg: 'rgba(34,197,94,0.1)', text: 'var(--accent-green)', dot: 'var(--accent-green)' },
  warning: { bg: 'rgba(245,158,11,0.1)', text: 'var(--accent-yellow)', dot: 'var(--accent-yellow)' },
  error: { bg: 'rgba(239,68,68,0.1)', text: 'var(--accent-red)', dot: 'var(--accent-red)' },
  info: { bg: 'rgba(59,130,246,0.1)', text: 'var(--accent-blue)', dot: 'var(--accent-blue)' },
};

export function StatusBadge({ label, variant = 'default', dot = true, className = '' }: StatusBadgeProps) {
  const c = badgeColors[variant];
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 500,
        background: c.bg,
        color: c.text,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: c.dot,
        }} />
      )}
      {label}
    </span>
  );
}

// ─── Data Mode Indicator ────────────────────────────────────

interface DataModeIndicatorProps {
  mode: 'api' | 'mock' | 'checking';
  className?: string;
}

export function DataModeIndicator({ mode, className = '' }: DataModeIndicatorProps) {
  const config = {
    api: { variant: 'success' as BadgeVariant, label: 'Connected' },
    mock: { variant: 'warning' as BadgeVariant, label: 'Demo Mode' },
    checking: { variant: 'info' as BadgeVariant, label: 'Connecting...' },
  };

  return <StatusBadge className={className} {...config[mode]} />;
}
