import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { hideSnackbar } from '../store/slices/uiSlice';
import './Snackbar.css';

export const Snackbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { snackbar } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => {
      dispatch(hideSnackbar());
    }, 4000);
    return () => clearTimeout(timer);
  }, [snackbar.open, dispatch]);

  if (!snackbar.open) return null;

  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span>{snackbar.message}</span>
      {snackbar.actionLabel && (
        <button
          onClick={() => dispatch(hideSnackbar())}
          className="snackbar__action-btn"
          type="button"
        >
          {snackbar.actionLabel}
        </button>
      )}
    </div>
  );
};

export default Snackbar;
