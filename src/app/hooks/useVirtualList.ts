import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── Virtual Scrolling Hook ─────────────────────────────────
// Lightweight virtualization for large lists.
// Renders only visible items + overscan buffer.

interface UseVirtualListOptions {
  itemCount: number;
  itemHeight: number;        // fixed item height in px
  overscan?: number;         // extra items to render above/below viewport
  containerHeight?: number;  // if not provided, uses ref measurement
}

interface VirtualItem {
  index: number;
  start: number;             // top offset in px
  end: number;               // bottom offset in px
}

export function useVirtualList({
  itemCount,
  itemHeight,
  overscan = 5,
  containerHeight: fixedHeight,
}: UseVirtualListOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(fixedHeight || 600);

  // Measure container
  useEffect(() => {
    if (fixedHeight) {
      setContainerHeight(fixedHeight);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedHeight]);

  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const { virtualItems, totalHeight, startIndex, endIndex } = useMemo(() => {
    const totalHeight = itemCount * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const endIndex = Math.min(itemCount - 1, startIndex + visibleCount + overscan * 2);

    const virtualItems: VirtualItem[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      virtualItems.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
      });
    }

    return { virtualItems, totalHeight, startIndex, endIndex };
  }, [itemCount, itemHeight, scrollTop, containerHeight, overscan]);

  // Scroll to index
  const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: index * itemHeight, behavior });
  }, [itemHeight]);

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    scrollToIndex(itemCount - 1, behavior);
  }, [scrollToIndex, itemCount]);

  return {
    containerRef,
    containerProps: {
      ref: containerRef,
      onScroll: handleScroll,
      style: {
        height: fixedHeight || '100%',
        overflow: 'auto' as const,
        position: 'relative' as const,
      },
    },
    innerProps: {
      style: {
        height: totalHeight,
        position: 'relative' as const,
        width: '100%',
      },
    },
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    scrollToIndex,
    scrollToBottom,
    isAtBottom: scrollTop + containerHeight >= totalHeight - itemHeight * 2,
  };
}

export default useVirtualList;
