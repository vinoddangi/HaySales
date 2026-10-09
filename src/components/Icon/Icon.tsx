import '@material/web/icon/icon.js';
import clsx from 'clsx';
import React from 'react';
import './Icon.css';
import { IconSize, useIcon } from './useIcon';

export interface IconProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  size?: IconSize;
  className?: string;
  slot?: string;
}

/**
 * Material Design 3 Icon Component.
 * Supports standard semantic sizes: 'xs' (12px), 'sm' (14px), 'md' (16px), 'lg' (20px), 'xl' (24px), '2xl' (32px),
 * or numeric pixel values (e.g. size={18}).
 * Wraps Lucide SVG icons or standard M3 icon font characters.
 */
export const Icon: React.FC<IconProps> = ({
  children,
  size = 'md',
  className = '',
  slot,
  style,
  ...props
}) => {
  const { sizeClass, customStyle } = useIcon({ size });

  return (
    <md-icon
      slot={slot}
      className={clsx('hs-icon', sizeClass, className)}
      style={{
        ...customStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </md-icon>
  );
};

export default Icon;
