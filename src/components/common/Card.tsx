import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'filled' | 'outlined';
  clickable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'filled',
  clickable = false,
  className,
  ...props
}) => {
  const baseStyles =
    'rounded-m3-lg transition-all duration-200 overflow-hidden';

  const variantStyles = {
    elevated: 'bg-m3-surface-container-low text-m3-on-surface shadow-m3-1',
    filled: 'bg-m3-surface-container-highest text-m3-on-surface',
    outlined:
      'bg-m3-surface border border-m3-outline-variant text-m3-on-surface',
  };

  const clickableStyles = clickable
    ? 'cursor-pointer active:scale-[0.99] hover:shadow-m3-2 m3-state-layer'
    : '';

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        clickableStyles,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
