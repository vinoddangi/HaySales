import '@material/web/icon/icon.js';
import clsx from 'clsx';
import React from 'react';
import './Icon.css';

export interface IconProps {
  children: React.ReactNode;
  className?: string;
  slot?: string;
}

/**
 * React component wrapping Google Material Design 3 Icon Web Component
 */
export const Icon: React.FC<IconProps> = ({
  children,
  className = '',
  slot,
}) => {
  return (
    <md-icon slot={slot} className={clsx('hs-icon', className)}>
      {children}
    </md-icon>
  );
};

export default Icon;
