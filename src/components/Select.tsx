import '@material/web/select/filled-select.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Select.css';

export type SelectVariant = 'outlined' | 'filled';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  value?: string;
  options: SelectOption[];
  variant?: SelectVariant;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  className?: string;
  onChange?: (_value: string) => void;
}

/**
 * React component wrapping Google Material Design 3 Select Web Components
 * Supporting both outlined and filled M3 flavors.
 */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  variant = 'outlined',
  disabled = false,
  required = false,
  error = false,
  errorText,
  supportingText,
  className = '',
  onChange,
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onChange) return;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onChange(target.value ?? '');
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [onChange]);

  useEffect(() => {
    if (ref.current && value !== undefined && ref.current.value !== value) {
      ref.current.value = value;
    }
  }, [value]);

  const optionElements = options.map((opt) => (
    <md-select-option
      key={opt.value}
      value={opt.value}
      disabled={opt.disabled}
      selected={opt.value === value}
    >
      <div slot="headline">{opt.label}</div>
    </md-select-option>
  ));

  const props = {
    ref,
    label,
    value,
    disabled,
    required,
    error,
    errorText,
    supportingText,
    className: clsx('hs-select', className),
  };

  if (variant === 'filled') {
    return <md-filled-select {...props}>{optionElements}</md-filled-select>;
  }

  return <md-outlined-select {...props}>{optionElements}</md-outlined-select>;
};

export default Select;
