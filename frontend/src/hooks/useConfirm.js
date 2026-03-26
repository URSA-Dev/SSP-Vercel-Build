import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState({ isOpen: false, resolve: null });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({ isOpen: true, resolve, ...options });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(s => ({ ...s, isOpen: false }));
  }, [state.resolve]);

  const handleClose = useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, isOpen: false }));
  }, [state.resolve]);

  return { ...state, confirm, handleConfirm, handleClose };
}
