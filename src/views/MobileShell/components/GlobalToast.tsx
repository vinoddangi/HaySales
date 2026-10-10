import React, { useEffect } from 'react';
import { Button, Toast, ToastContent } from '@salt-ds/core';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { hideSnackbar } from '../../../store/slices/uiSlice';

export const GlobalToast: React.FC = () => {
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
    <div
      style={{
        position: 'fixed',
        bottom: 70,
        left: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Toast>
        <ToastContent>{snackbar.message}</ToastContent>
        {snackbar.actionLabel && (
          <Button
            onClick={() => dispatch(hideSnackbar())}
            style={{ marginLeft: 8 }}
          >
            {snackbar.actionLabel}
          </Button>
        )}
      </Toast>
    </div>
  );
};

export default GlobalToast;
