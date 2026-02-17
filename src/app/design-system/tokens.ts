// ─── Design System Tokens ────────────────────────────────────
// Single source of truth for spacing, typography, radii, shadows, and motion.
// These map to CSS custom properties set by ThemeProvider.

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.8125rem',   // 13px
  base: '0.875rem',  // 14px
  md: '0.9375rem',   // 15px
  lg: '1rem',        // 16px
  xl: '1.125rem',    // 18px
  '2xl': '1.25rem',  // 20px
  '3xl': '1.5rem',   // 24px
  '4xl': '2rem',     // 32px
} as const;

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const lineHeight = {
  tight: '1.25',
  normal: '1.5',
  relaxed: '1.625',
} as const;

export const radii = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px 0 rgba(0,0,0,0.05)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  glow: {
    blue: '0 0 20px rgba(59,130,246,0.15)',
    green: '0 0 20px rgba(34,197,94,0.15)',
    red: '0 0 20px rgba(239,68,68,0.15)',
    purple: '0 0 20px rgba(168,85,247,0.15)',
  },
} as const;

export const motion = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    lazy: '500ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  overlay: 200,
  modal: 300,
  popover: 400,
  toast: 500,
  tooltip: 600,
  max: 9999,
} as const;

// ─── Color primitives (reference CSS variables from ThemeProvider) ──
export const colors = {
  bg: {
    primary: 'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary: 'var(--bg-tertiary)',
    card: 'var(--bg-card)',
    input: 'var(--bg-input)',
    overlay: 'var(--bg-overlay)',
  },
  text: {
    primary: 'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    tertiary: 'var(--text-tertiary)',
    muted: 'var(--text-muted)',
  },
  accent: {
    blue: 'var(--accent-blue)',
    green: 'var(--accent-green)',
    red: 'var(--accent-red)',
    yellow: 'var(--accent-yellow)',
    purple: 'var(--accent-purple)',
    cyan: 'var(--accent-cyan)',
  },
  border: {
    primary: 'var(--border-primary)',
    secondary: 'var(--border-secondary)',
  },
  glass: {
    bg: 'var(--glass-bg)',
    border: 'var(--glass-border)',
  },
} as const;
