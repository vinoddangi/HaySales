import { useEffect, useRef } from 'react';

export interface UseSwitchOptions {
  selected?: boolean;
  checked?: boolean;
  onChange?: (_selected: boolean) => void;
}

export const useSwitch = ({
  selected,
  checked,
  onChange,
}: UseSwitchOptions) => {
  const isSelected = selected !== undefined ? selected : Boolean(checked);
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !onChange) return;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onChange(Boolean(target.selected));
    };

    el.addEventListener('change', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
    };
  }, [onChange]);

  useEffect(() => {
    if (ref.current && ref.current.selected !== isSelected) {
      ref.current.selected = isSelected;
    }
  }, [isSelected]);

  return { ref, isSelected };
};
