import '@material/web/fab/fab.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Fab.css';

export interface FabProps {
  label?: string;
  variant?: 'surface' | 'primary' | 'secondary' | 'tertiary';
  size?: 'medium' | 'small' | 'large' | 'sm' | 'md' | 'lg';
  lowered?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: (_e: React.MouseEvent<HTMLElement>) => void;
}

/**
 * React component wrapping Google Material Design 3 FAB (Floating Action Button)
 */
export const Fab: React.FC<FabProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  lowered = false,
  icon,
  className = '',
  onClick,
}) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onClick) return;

    const handleClick = (e: Event) => {
      onClick(e as unknown as React.MouseEvent<HTMLElement>);
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [onClick]);

  const resolvedSize =
    size === 'sm' || size === 'small'
      ? 'small'
      : size === 'lg' || size === 'large'
        ? 'large'
        : 'medium';

  return (
    <md-fab
      ref={ref}
      variant={variant}
      size={resolvedSize}
      label={label}
      lowered={lowered}
      className={clsx('hs-fab', className)}
      onClick={onClick}
    >
      {icon && <span slot="icon">{icon}</span>}
    </md-fab>
  );
};

export default Fab;
