// ─── Tests: Virtual List Hook ────────────────────────────────
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useVirtualList } from '../app/hooks/useVirtualList';

describe('useVirtualList', () => {
  it('returns expected shape', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 100, itemHeight: 40, overscan: 3 })
    );

    expect(result.current).toHaveProperty('containerProps');
    expect(result.current).toHaveProperty('innerProps');
    expect(result.current).toHaveProperty('virtualItems');
    expect(result.current).toHaveProperty('scrollToIndex');
    expect(result.current).toHaveProperty('scrollToBottom');
    expect(result.current).toHaveProperty('isAtBottom');
  });

  it('calculates inner height from itemCount × itemHeight', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 50, itemHeight: 30, overscan: 2 })
    );

    // innerProps style should have height = 50 * 30 = 1500
    expect(result.current.innerProps.style.height).toBe(1500);
  });

  it('returns empty virtualItems when itemCount is 0', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 0, itemHeight: 40, overscan: 3 })
    );

    expect(result.current.virtualItems).toHaveLength(0);
  });

  it('containerProps has overflow auto', () => {
    const { result } = renderHook(() =>
      useVirtualList({ itemCount: 10, itemHeight: 40, overscan: 3 })
    );

    expect(result.current.containerProps.style.overflow).toBe('auto');
  });
});
