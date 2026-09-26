import { useEffect, useRef } from 'react';

export interface UseCheckboxOptions {
  checked?: boolean;
  onChange?: (_checked: boolean) => void;
}

export const useCheckbox = ({
  checked = false,
  onChange,
}: UseCheckboxOptions) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onChange) return;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onChange(Boolean(target.checked));
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [onChange]);

  useEffect(() => {
    if (ref.current && ref.current.checked !== checked) {
      ref.current.checked = checked;
    }
  }, [checked]);

  return { ref };
};
