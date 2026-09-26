import '@material/web/textfield/filled-text-field.js';
import '@material/web/textfield/outlined-text-field.js';
import clsx from 'clsx';
import React from 'react';
import './TextField.css';
import { useTextField } from './useTextField';

export interface TextFieldProps {
  label?: string;
  value?: string | number;
  placeholder?: string;
  type?: string;
  variant?: 'outlined' | 'filled';
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  prefixText?: string;
  suffixText?: string;
  rows?: number;
  className?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

/**
 * React component wrapping Google Material Design 3 Text Field Web Components
 */
export const TextField: React.FC<TextFieldProps> = ({
  label,
  value = '',
  placeholder,
  type = 'text',
  variant = 'outlined',
  disabled = false,
  required = false,
  error = false,
  errorText,
  supportingText,
  prefixText,
  suffixText,
  rows,
  className = '',
  onChange,
  onBlur,
  startAdornment,
  endAdornment,
}) => {
  const { ref } = useTextField({
    value,
    prefixText,
    suffixText,
    errorText,
    supportingText,
    onChange,
    onBlur,
  });

  const props: any = {
    ref,
    label,
    value: String(value ?? ''),
    placeholder,
    type,
    disabled: disabled || undefined,
    required: required || undefined,
    error: error || undefined,
    'error-text': errorText,
    'supporting-text': supportingText,
    'prefix-text': prefixText,
    'suffix-text': suffixText,
    rows,
    className: clsx('hs-text-field', className),
  };

  const content = (
    <>
      {startAdornment && <span slot="leading-icon">{startAdornment}</span>}
      {endAdornment && <span slot="trailing-icon">{endAdornment}</span>}
    </>
  );

  if (variant === 'filled') {
    return <md-filled-text-field {...props}>{content}</md-filled-text-field>;
  }

  return <md-outlined-text-field {...props}>{content}</md-outlined-text-field>;
};

export default TextField;
