import React from 'react';
import { cn } from '../../utils/cn';

export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label?: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  size?: 'sm' | 'md' | 'lg';
}

export const Fab: React.FC<FabProps> = ({
  icon,
  label,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  const variantStyles = {
    primary:
      'bg-m3-primary-container text-m3-on-primary-container hover:bg-m3-primary/20',
    secondary:
      'bg-m3-secondary-container text-m3-on-secondary-container hover:bg-m3-secondary/20',
    tertiary:
      'bg-m3-tertiary-container text-m3-on-tertiary-container hover:bg-m3-tertiary/20',
    surface:
      'bg-m3-surface-container-high text-m3-primary hover:bg-m3-surface-container-highest',
  };

  const sizeStyles = {
    sm: 'h-10 px-3 rounded-m3-md gap-2 text-xs',
    md: 'h-14 px-4 rounded-m3-lg gap-3 text-sm',
    lg: 'h-24 px-6 rounded-m3-xl gap-4 text-base',
  };

  const isExtended = Boolean(label);

  return (
    <button
      className={cn(
        'm3-state-layer inline-flex items-center justify-center font-medium shadow-m3-3 transition-all duration-200 hover:shadow-m3-4 active:scale-95 active:shadow-m3-2',
        variantStyles[variant],
        sizeStyles[size],
        !isExtended && size === 'sm' && 'w-10 p-0',
        !isExtended && size === 'md' && 'w-14 p-0',
        !isExtended && size === 'lg' && 'w-24 p-0',
        className,
      )}
      {...props}
    >
      <span className="shrink-0">{icon}</span>
      {isExtended && <span className="font-medium tracking-wide">{label}</span>}
    </button>
  );
};
