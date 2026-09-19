import React from 'react';
import { cn } from '../../utils/cn';
import { Text } from './Text';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  className,
  id,
  ...props
}) => {
  const inputId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1 text-left">
      {label && (
        <Text
          as="label"
          htmlFor={inputId}
          styleAs="label"
          appearance="secondary"
          uppercase
        >
          {label}
          {required && (
            <span className="ml-0.5 font-bold text-m3-error">*</span>
          )}
        </Text>
      )}
      <input
        id={inputId}
        required={required}
        className={cn(
          'w-full rounded-lg border border-m3-outline bg-m3-surface p-2 text-xs text-m3-on-surface transition-colors placeholder:text-m3-on-surface-variant/50 focus:border-m3-primary focus:outline-none',
          error && 'border-m3-error focus:border-m3-error',
          className,
        )}
        {...props}
      />
      {error && (
        <Text styleAs="caption" sentiment="negative" weight="medium">
          {error}
        </Text>
      )}
    </div>
  );
};
