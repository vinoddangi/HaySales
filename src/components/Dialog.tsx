import '@material/web/dialog/dialog.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Dialog.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  headline?: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  type?: 'alert' | 'confirm';
  className?: string;
}

/**
 * React component wrapping Google Material Design 3 Dialog Web Component
 */
export const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  headline,
  children,
  actions,
  icon,
  type,
  className = '',
}) => {
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

  return (
    <md-dialog ref={ref} type={type} className={clsx('hs-dialog', className)}>
      {icon && <div slot="icon">{icon}</div>}
      {headline && <div slot="headline">{headline}</div>}
      <div slot="content">{children}</div>
      {actions && <div slot="actions">{actions}</div>}
    </md-dialog>
  );
};

export default Dialog;
