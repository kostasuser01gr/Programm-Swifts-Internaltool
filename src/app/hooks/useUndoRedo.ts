import { useState, useCallback, useRef } from 'react';
import type { UndoAction } from '../types';

const MAX_HISTORY = 50;

export function useUndoRedo() {
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [redoStack, setRedoStack] = useState<UndoAction[]>([]);
  const idCounter = useRef(0);

  const pushAction = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const fullAction: UndoAction = {
      ...action,
      id: `undo-${++idCounter.current}`,
      timestamp: Date.now(),
    };
    setUndoStack((prev) => [...prev.slice(-MAX_HISTORY + 1), fullAction]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      action.undo();
      setRedoStack((r) => [...r, action]);
      return prev.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const action = prev[prev.length - 1];
      action.redo();
      setUndoStack((u) => [...u, action]);
      return prev.slice(0, -1);
    });
  }, []);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    pushAction,
    undo,
    redo,
    clear,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    lastAction: undoStack[undoStack.length - 1] || null,
  };
}
