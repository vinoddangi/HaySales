import React from 'react';
import { cn } from '../../utils/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (_value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        'inline-flex w-full rounded-m3-full border border-m3-outline-variant/50 bg-m3-surface-container-highest p-1',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'm3-state-layer flex flex-1 items-center justify-center gap-1.5 rounded-m3-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
              isSelected
                ? 'shadow-xs bg-m3-secondary-container font-semibold text-m3-on-secondary-container'
                : 'text-m3-on-surface-variant hover:text-m3-on-surface',
            )}
          >
            {option.icon && (
              <span className="h-3.5 w-3.5 shrink-0">{option.icon}</span>
            )}
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
