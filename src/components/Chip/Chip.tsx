import '@material/web/chips/assist-chip.js';
import '@material/web/chips/chip-set.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/input-chip.js';
import '@material/web/chips/suggestion-chip.js';
import clsx from 'clsx';
import React from 'react';
import './Chip.css';
import { ChipVariant, useChip } from './useChip';

export type { ChipVariant };

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
  const { ref } = useChip({
    variant,
    selected,
    onClick,
    onSelectedChange,
    onRemove,
  });

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
