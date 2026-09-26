import '@material/web/select/filled-select.js';
import '@material/web/select/outlined-select.js';
import '@material/web/select/select-option.js';
import clsx from 'clsx';
import React from 'react';
import './Select.css';
import { useSelect } from './useSelect';

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
 * Supporting both outlined and filled M3 flavors with guaranteed 100% container width.
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
  const { ref } = useSelect({ value, onChange });

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

  const props: any = {
    ref,
    label,
    value,
    disabled: disabled ? true : undefined,
    required: required ? true : undefined,
    error: error ? true : undefined,
    'error-text': errorText,
    'supporting-text': supportingText,
    className: clsx('hs-select', className),
    style: { width: '100%', minWidth: 0, display: 'flex' },
  };

  if (variant === 'filled') {
    return <md-filled-select {...props}>{optionElements}</md-filled-select>;
  }

  return <md-outlined-select {...props}>{optionElements}</md-outlined-select>;
};

export default Select;
