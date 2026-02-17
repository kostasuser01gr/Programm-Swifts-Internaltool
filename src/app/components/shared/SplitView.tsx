import { useState, useCallback } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '../ui/resizable';
import { cn } from '../ui/utils';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// ─── SplitView ──────────────────────────────────────────────
// A reusable split-pane layout for main + detail panels.
// Wraps shadcn/ui ResizablePanelGroup with collapse toggle.

interface SplitViewProps {
  /** Primary (left/top) panel content */
  children: React.ReactNode;
  /** Secondary (right/bottom) detail panel */
  detail?: React.ReactNode;
  /** Direction for panel layout */
  direction?: 'horizontal' | 'vertical';
  /** Default size of detail panel (percentage, 1-50) */
  defaultDetailSize?: number;
  /** Minimum detail panel size (percentage) */
  minDetailSize?: number;
  /** Whether detail panel is collapsible */
  collapsible?: boolean;
  /** CSS class */
  className?: string;
}

export function SplitView({
  children,
  detail,
  direction = 'horizontal',
  defaultDetailSize = 35,
  minDetailSize = 20,
  collapsible = true,
  className,
}: SplitViewProps) {
  const [detailOpen, setDetailOpen] = useState(!!detail);

  const toggleDetail = useCallback(() => {
    setDetailOpen(prev => !prev);
  }, []);

  // No detail content → just render main panel
  if (!detail) {
    return <div className={cn('h-full w-full', className)}>{children}</div>;
  }

  return (
    <div className={cn('relative h-full w-full', className)}>
      {collapsible && (
        <button
          onClick={toggleDetail}
          className="absolute top-2 right-2 z-10 p-1.5 rounded-md bg-card/80 border border-border/40 text-muted-foreground hover:text-foreground hover:bg-card transition-colors backdrop-blur-sm"
          title={detailOpen ? 'Close detail panel' : 'Open detail panel'}
        >
          {detailOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </button>
      )}

      {detailOpen ? (
        <ResizablePanelGroup direction={direction} className="h-full">
          <ResizablePanel defaultSize={100 - defaultDetailSize} minSize={30}>
            {children}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={defaultDetailSize} minSize={minDetailSize}>
            {detail}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="h-full w-full">{children}</div>
      )}
    </div>
  );
}

export default SplitView;
