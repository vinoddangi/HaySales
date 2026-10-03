import React from 'react';
import './Snackbar.css';
import { useSnackbar } from './useSnackbar';

export const Snackbar: React.FC = () => {
  const { isOpen, message, actionLabel, handleDismiss } = useSnackbar();

  if (!isOpen) return null;

  return (
    <div className="snackbar" role="status" aria-live="polite">
      <span>{message}</span>
      {actionLabel && (
        <button
          onClick={handleDismiss}
          className="snackbar__action-btn"
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Snackbar;
