import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { hideSnackbar } from '../../store/slices/uiSlice';

export const useSnackbar = () => {
  const dispatch = useAppDispatch();
  const { snackbar } = useAppSelector((state) => state.ui);

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => {
      dispatch(hideSnackbar());
    }, 4000);
    return () => clearTimeout(timer);
  }, [snackbar.open, dispatch]);

  const handleDismiss = () => {
    dispatch(hideSnackbar());
  };

  return {
    isOpen: snackbar.open,
    message: snackbar.message,
    actionLabel: snackbar.actionLabel,
    handleDismiss,
  };
};
