import { useEffect, useRef } from 'react';

export interface UseDialogOptions {
  open: boolean;
  onClose: () => void;
}

export const useDialog = ({ open, onClose }: UseDialogOptions) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      el.show?.();
    } else {
      el.close?.();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClosed = () => {
      onClose();
    };

    el.addEventListener('closed', handleClosed);
    return () => {
      el.removeEventListener('closed', handleClosed);
    };
  }, [onClose]);

  return { ref };
};
