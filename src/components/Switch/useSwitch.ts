import { useEffect, useRef } from 'react';

export interface UseSwitchOptions {
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (_selected: boolean) => void;
}

export const useSwitch = ({
  selected,
  checked,
  disabled,
  onChange,
}: UseSwitchOptions) => {
  const isSelected = selected !== undefined ? selected : Boolean(checked);
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.disabled = Boolean(disabled);
    el.selected = isSelected;

    if (!onChange) return;

    const handleChange = (e: Event) => {
      const target = e.target as any;
      const nextVal =
        target.selected !== undefined ? Boolean(target.selected) : !isSelected;
      onChange(nextVal);
    };

    el.addEventListener('change', handleChange);
    el.addEventListener('input', handleChange);
    return () => {
      el.removeEventListener('change', handleChange);
      el.removeEventListener('input', handleChange);
    };
  }, [onChange, isSelected, disabled]);

  useEffect(() => {
    if (ref.current) {
      ref.current.selected = isSelected;
      ref.current.disabled = Boolean(disabled);
    }
  }, [isSelected, disabled]);

  return { ref, isSelected };
};
