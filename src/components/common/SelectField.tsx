import React from 'react';
import { cn } from '../../utils/cn';
import { Text } from './Text';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  required?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  error,
  required,
  children,
  className,
  id,
  ...props
}) => {
  const selectId =
    id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex w-full flex-col gap-1 text-left">
      {label && (
        <Text
          as="label"
          htmlFor={selectId}
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
      <select
        id={selectId}
        required={required}
        className={cn(
          'w-full rounded-m3-sm border border-m3-outline bg-m3-surface px-3 py-2.5 text-sm font-bold text-m3-on-surface transition-colors focus:border-m3-primary focus:outline-none focus:ring-1 focus:ring-m3-primary',
          error && 'border-m3-error focus:border-m3-error focus:ring-m3-error',
          className,
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <Text styleAs="caption" sentiment="negative" weight="medium">
          {error}
        </Text>
      )}
    </div>
  );
};
