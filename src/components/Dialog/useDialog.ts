import { useEffect, useRef } from 'react';

export interface UseDialogOptions {
  open: boolean;
  onClose: () => void;
}

export const useDialog = ({ open, onClose }: UseDialogOptions) => {
  const ref = useRef<any>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      if (!el.open) {
        el.show?.();
      }
    } else {
      if (el.open) {
        el.close?.();
      }
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClosed = () => {
      onCloseRef.current?.();
    };

    el.addEventListener('closed', handleClosed);
    return () => {
      el.removeEventListener('closed', handleClosed);
    };
  }, []);

  return { ref };
};
