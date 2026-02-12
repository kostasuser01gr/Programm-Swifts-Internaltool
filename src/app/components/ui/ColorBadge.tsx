import { useRef, useLayoutEffect, type ReactNode } from 'react';

function resolveColor(raw: string): string {
  return raw === '#gray' ? '#9CA3AF' : raw;
}

interface ColorBadgeProps {
  color: string;
  children: ReactNode;
  className?: string;
  bgOpacity?: string;
}

/** Renders a colored badge using imperative style assignment (avoids inline style attributes). */
export function ColorBadge({ color, children, className = '', bgOpacity = '20' }: ColorBadgeProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.backgroundColor = `${resolveColor(color)}${bgOpacity}`;
    el.style.color = color === '#gray' ? '#4B5563' : color;
  }, [color, bgOpacity]);
  return <span ref={ref} className={className}>{children}</span>;
}

/** Renders a small colored dot using imperative style assignment. */
export function ColorDot({ color, className = '' }: { color: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.backgroundColor = resolveColor(color);
  }, [color]);
  return <div ref={ref} className={className} />;
}
