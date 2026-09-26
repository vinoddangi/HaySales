import '@material/web/chips/assist-chip.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/input-chip.js';
import '@material/web/chips/suggestion-chip.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Chip.css';

export type ChipVariant = 'filter' | 'assist' | 'input' | 'suggestion';

export interface ChipProps {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  disabled?: boolean;
  elevated?: boolean;
  removable?: boolean;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onSelectedChange?: (_selected: boolean) => void;
  onRemove?: () => void;
}

/**
 * React component wrapping Google Material Design 3 Chip Web Components
 * Supporting all 4 official M3 chip types: assist, filter, input, and suggestion.
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'filter',
  selected = false,
  disabled = false,
  elevated = false,
  removable = false,
  icon,
  className = '',
  onClick,
  onSelectedChange,
  onRemove,
}) => {
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

  const content = icon ? <span slot="icon">{icon}</span> : null;

  switch (variant) {
    case 'assist':
      return (
        <md-assist-chip
          ref={ref}
          label={label}
          disabled={disabled}
          elevated={elevated}
          className={clsx('hs-chip', className)}
        >
          {content}
        </md-assist-chip>
      );
    case 'input':
      return (
        <md-input-chip
          ref={ref}
          label={label}
          selected={selected}
          disabled={disabled}
          elevated={elevated}
          removable={removable}
          className={clsx('hs-chip', className)}
        >
          {content}
        </md-input-chip>
      );
    case 'suggestion':
      return (
        <md-suggestion-chip
          ref={ref}
          label={label}
          disabled={disabled}
          elevated={elevated}
          className={clsx('hs-chip', className)}
        >
          {content}
        </md-suggestion-chip>
      );
    case 'filter':
    default:
      return (
        <md-filter-chip
          ref={ref}
          label={label}
          selected={selected}
          disabled={disabled}
          elevated={elevated}
          className={clsx('hs-chip', className)}
        >
          {content}
        </md-filter-chip>
      );
  }
};

export const ChipSet: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <md-chip-set className={clsx('hs-chip-set', className)}>
      {children}
    </md-chip-set>
  );
};

export default Chip;
