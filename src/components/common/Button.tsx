import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:opacity-38 disabled:pointer-events-none rounded-m3-full m3-state-layer';

  const sizeStyles = {
    sm: 'h-9 px-4 text-xs gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  const variantStyles = {
    filled:
      'bg-m3-primary text-m3-on-primary shadow-sm hover:shadow-m3-1 active:shadow-none',
    tonal:
      'bg-m3-secondary-container text-m3-on-secondary-container hover:shadow-m3-1 active:shadow-none',
    outlined:
      'border border-m3-outline text-m3-primary hover:bg-m3-primary/8 active:bg-m3-primary/12',
    text: 'text-m3-primary hover:bg-m3-primary/8 active:bg-m3-primary/12 px-3',
    elevated:
      'bg-m3-surface-container-low text-m3-primary shadow-m3-1 hover:shadow-m3-2 active:shadow-m3-1',
  };

  return (
    <button
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};
