import { useEffect, useRef } from 'react';

export interface UseTextFieldOptions {
  value?: string | number;
  prefixText?: string;
  suffixText?: string;
  errorText?: string;
  supportingText?: string;
  onChange?: (_value: string) => void;
  onBlur?: () => void;
}

export const useTextField = ({
  value = '',
  prefixText,
  suffixText,
  errorText,
  supportingText,
  onChange,
  onBlur,
}: UseTextFieldOptions) => {
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

  return { ref };
};
