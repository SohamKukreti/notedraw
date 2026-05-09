import { useState, useCallback } from 'react';

export function useUndoRedo(initialValue) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialValue);
  const [future, setFuture] = useState([]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);
    setPast(newPast);
    setPresent(previous);
    setFuture(f => [present, ...f]);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setFuture(newFuture);
    setPresent(next);
    setPast(p => [...p, present]);
  }, [future, present]);

  const set = useCallback((newValue) => {
    setPresent(prevPresent => {
      const resolved = typeof newValue === 'function' ? newValue(prevPresent) : newValue;
      setPast(p => [...p, prevPresent]);
      setFuture([]);
      return resolved;
    });
  }, []);

  const clear = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return { past, present, future, set, undo, redo, canUndo, canRedo, clear };
}
