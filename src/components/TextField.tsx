import '@material/web/textfield/filled-text-field.js';
import '@material/web/textfield/outlined-text-field.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './TextField.css';

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
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleInput = (e: Event) => {
      const target = e.target as any;
      if (onChange) {
        onChange(target.value ?? '');
      }
    };

    const handleBlurEvent = () => {
      if (onBlur) {
        onBlur();
      }
    };

    el.addEventListener('input', handleInput);
    el.addEventListener('change', handleInput);
    el.addEventListener('blur', handleBlurEvent);
    return () => {
      el.removeEventListener('input', handleInput);
      el.removeEventListener('change', handleInput);
      el.removeEventListener('blur', handleBlurEvent);
    };
  }, [onChange, onBlur]);

  // Sync value and web component properties
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (el.value !== String(value ?? '')) {
      el.value = String(value ?? '');
    }
    if (prefixText !== undefined) el.prefixText = prefixText;
    if (suffixText !== undefined) el.suffixText = suffixText;
    if (errorText !== undefined) el.errorText = errorText;
    if (supportingText !== undefined) el.supportingText = supportingText;
  }, [value, prefixText, suffixText, errorText, supportingText]);

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
