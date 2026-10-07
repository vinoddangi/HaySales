import clsx from 'clsx';
import React from 'react';
import './Divider.css';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  inset?: boolean | 'start' | 'end';
  className?: string;
}

/**
 * M3 Divider — thin separator using outline-variant token.
 * Supports horizontal/vertical orientation and inset modes.
 */
export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  inset = false,
  className,
}) => {
  return (
    <hr
      role="separator"
      aria-orientation={orientation}
      className={clsx(
        'hs-divider',
        `hs-divider--${orientation}`,
        inset === true && 'hs-divider--inset',
        inset === 'start' && 'hs-divider--inset-start',
        inset === 'end' && 'hs-divider--inset-end',
        className,
      )}
    />
  );
};

export default Divider;
