import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideSnackbar } from '../../store/slices/uiSlice';

export const Snackbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { snackbar } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (snackbar.isOpen) {
      const timer = setTimeout(() => {
        dispatch(hideSnackbar());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.isOpen, dispatch]);

  if (!snackbar.isOpen) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-4 right-4 z-50 flex animate-slide-up justify-center">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-m3-xs bg-m3-inverse-surface px-4 py-3 text-m3-inverse-on-surface shadow-m3-3">
        <span className="line-clamp-2 text-sm">{snackbar.message}</span>
        {snackbar.actionLabel && (
          <button
            onClick={() => dispatch(hideSnackbar())}
            className="shrink-0 px-2 py-1 text-xs font-bold uppercase tracking-wider text-m3-inverse-primary transition-opacity hover:opacity-80"
          >
            {snackbar.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
