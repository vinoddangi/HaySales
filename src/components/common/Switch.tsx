import { Check } from 'lucide-react';
import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}) => {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-3',
        disabled && 'opacity-38 pointer-events-none cursor-not-allowed',
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
        {/* Track */}
        <div
          className={cn(
            'w-13 h-8 rounded-full border-2 transition-all duration-200',
            checked
              ? 'border-m3-primary bg-m3-primary'
              : 'border-m3-outline bg-m3-surface-container-highest',
          )}
        />
        {/* Thumb */}
        <div
          className={cn(
            'absolute left-1 top-1 flex items-center justify-center rounded-full shadow-sm transition-all duration-200',
            checked
              ? 'h-6 w-6 translate-x-5 bg-m3-on-primary'
              : 'my-1 h-4 w-4 translate-x-0.5 bg-m3-outline',
          )}
        >
          {checked && (
            <Check className="h-3.5 w-3.5 stroke-[3] text-m3-primary" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm font-medium text-m3-on-surface">{label}</span>
      )}
    </label>
  );
};
