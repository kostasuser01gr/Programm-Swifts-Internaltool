import { useEffect, useCallback } from 'react';

interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = buildKeyString(e);
      if (shortcuts[key]) {
        // Don't trigger shortcuts when typing in inputs
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        // Allow some shortcuts even in inputs
        const alwaysAllow = ['mod+z', 'mod+shift+z', 'mod+k', 'escape'];
        if (isInput && !alwaysAllow.includes(key)) return;

        e.preventDefault();
        e.stopPropagation();
        shortcuts[key]();
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function buildKeyString(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('mod');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');

  const key = e.key.toLowerCase();
  if (!['control', 'meta', 'shift', 'alt'].includes(key)) {
    parts.push(key);
  }

  return parts.join('+');
}

// Common shortcut labels for display
export const SHORTCUT_LABELS: Record<string, string> = {
  'mod+z': '⌘Z',
  'mod+shift+z': '⌘⇧Z',
  'mod+k': '⌘K',
  'mod+n': '⌘N',
  'mod+s': '⌘S',
  'mod+f': '⌘F',
  'mod+shift+f': '⌘⇧F',
  'mod+d': '⌘D',
  'mod+backspace': '⌘⌫',
  'mod+shift+e': '⌘⇧E',
  'mod+shift+n': '⌘⇧N',
  'escape': 'Esc',
};
