import { useEffect, useRef } from 'react';

export interface UseSelectOptions {
  value?: string;
  onChange?: (_value: string) => void;
}

export const useSelect = ({ value, onChange }: UseSelectOptions) => {
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

  return { ref };
};
