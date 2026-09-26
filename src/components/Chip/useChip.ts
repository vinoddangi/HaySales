import { useEffect, useRef } from 'react';

export type ChipVariant = 'filter' | 'assist' | 'input' | 'suggestion';

export interface UseChipOptions {
  variant?: ChipVariant;
  selected?: boolean;
  onClick?: () => void;
  onSelectedChange?: (_selected: boolean) => void;
  onRemove?: () => void;
}

export const useChip = ({
  variant = 'filter',
  selected = false,
  onClick,
  onSelectedChange,
  onRemove,
}: UseChipOptions) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClick = () => {
      onClick?.();
    };

    const handleChange = (e: Event) => {
      const target = e.target as any;
      onSelectedChange?.(Boolean(target.selected));
    };

    const handleRemove = () => {
      onRemove?.();
    };

    el.addEventListener('click', handleClick);
    el.addEventListener('change', handleChange);
    el.addEventListener('remove', handleRemove);

    return () => {
      el.removeEventListener('click', handleClick);
      el.removeEventListener('change', handleChange);
      el.removeEventListener('remove', handleRemove);
    };
  }, [onClick, onSelectedChange, onRemove]);

  useEffect(() => {
    if (
      ref.current &&
      (variant === 'filter' || variant === 'input') &&
      ref.current.selected !== selected
    ) {
      ref.current.selected = selected;
    }
  }, [selected, variant]);

  return { ref };
};
