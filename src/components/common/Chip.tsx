import { Check } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
  showCheckmark?: boolean;
  variant?: 'filter' | 'assist' | 'suggestion';
}

export const Chip: React.FC<ChipProps> = ({
  children,
  selected = false,
  icon,
  showCheckmark = true,
  className,
  ...props
}) => {
  return (
    <button
      type="button"
      className={cn(
        'm3-state-layer inline-flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-m3-sm px-3 text-xs font-medium transition-colors',
        selected
          ? 'shadow-xs bg-m3-secondary-container text-m3-on-secondary-container'
          : 'hover:bg-m3-on-surface/8 border border-m3-outline bg-transparent text-m3-on-surface-variant',
        className,
      )}
      {...props}
    >
      {selected && showCheckmark ? (
        <Check className="h-3.5 w-3.5 animate-fade-in text-m3-on-secondary-container" />
      ) : (
        icon && <span className="h-3.5 w-3.5 shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
