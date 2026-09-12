import React from 'react';
import { cn } from '../../utils/cn';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  supportingText?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconClick?: () => void;
  variant?: 'outlined' | 'filled';
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  supportingText,
  error,
  leadingIcon,
  trailingIcon,
  onTrailingIconClick,
  variant = 'outlined',
  className,
  id,
  ...props
}) => {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'px-1 text-xs font-medium transition-colors',
            error ? 'text-m3-error' : 'text-m3-on-surface-variant',
          )}
        >
          {label}
        </label>
      )}

      <div className="relative flex w-full items-center">
        {leadingIcon && (
          <div className="pointer-events-none absolute left-3 flex items-center text-m3-on-surface-variant">
            {leadingIcon}
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'h-12 w-full text-sm text-m3-on-surface transition-all placeholder:text-m3-on-surface-variant/60 focus:outline-none',
            variant === 'outlined'
              ? 'rounded-m3-xs border bg-transparent px-4 focus:ring-2 focus:ring-m3-primary/30'
              : 'rounded-t-m3-xs border-b-2 border-m3-outline bg-m3-surface-container-highest px-4 focus:border-m3-primary',
            error
              ? 'border-m3-error focus:border-m3-error focus:ring-m3-error/30'
              : 'border-m3-outline focus:border-m3-primary',
            leadingIcon && 'pl-10',
            trailingIcon && 'pr-10',
            className,
          )}
          {...props}
        />

        {trailingIcon && (
          <button
            type="button"
            onClick={onTrailingIconClick}
            className={cn(
              'absolute right-3 flex items-center text-m3-on-surface-variant transition-colors hover:text-m3-on-surface',
              !onTrailingIconClick && 'pointer-events-none',
            )}
          >
            {trailingIcon}
          </button>
        )}
      </div>

      {(error || supportingText) && (
        <span
          className={cn(
            'px-1 text-[11px] transition-colors',
            error ? 'font-medium text-m3-error' : 'text-m3-on-surface-variant',
          )}
        >
          {error || supportingText}
        </span>
      )}
    </div>
  );
};
