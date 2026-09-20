import { Check } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  activeColor?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  activeColor,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-2.5',
        disabled && 'pointer-events-none cursor-not-allowed opacity-40',
        className,
      )}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {/* Track - width 52px (w-[52px]), height 32px (h-8) with clear borders and background */}
        <div
          className={cn(
            'h-8 w-[52px] rounded-full border-2 shadow-inner transition-all duration-200',
            checked
              ? activeColor || 'border-m3-primary bg-m3-primary'
              : 'border-m3-outline/60 bg-m3-surface-container-highest dark:bg-neutral-800',
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            'absolute flex items-center justify-center rounded-full shadow-md transition-all duration-200',
            checked
              ? 'left-1 top-1 h-6 w-6 translate-x-5 bg-white text-m3-primary'
              : 'left-1.5 top-1.5 h-5 w-5 translate-x-0 bg-m3-outline dark:bg-neutral-400',
          )}
        >
          {checked && <Check className="h-3.5 w-3.5 stroke-[3] text-current" />}
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold text-m3-on-surface">
          {label}
        </span>
      )}
    </label>
  );
};
