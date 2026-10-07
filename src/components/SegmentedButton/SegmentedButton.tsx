import clsx from 'clsx';
import React from 'react';
import { Text } from '../Text';
import './SegmentedButton.css';
import { SegmentItem, useSegmentedButton } from './useSegmentedButton';

export type { SegmentItem };

export interface SegmentedButtonProps {
  segments: SegmentItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * M3 Segmented Button — pill-style toggle group for mutually exclusive options.
 * Replaces PeriodFilterBar's custom implementation with a proper M3 component.
 * Each segment renders with M3 typescale label tokens.
 */
export const SegmentedButton: React.FC<SegmentedButtonProps> = ({
  segments,
  value,
  onChange,
  className,
}) => {
  const { handleKeyDown } = useSegmentedButton({ segments, value, onChange });

  return (
    <div
      role="group"
      aria-label="Segmented button"
      className={clsx('hs-segmented-btn', className)}
    >
      {segments.map((seg) => {
        const isActive = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={clsx(
              'hs-segmented-btn__item',
              isActive && 'hs-segmented-btn__item--active',
              seg.disabled && 'hs-segmented-btn__item--disabled',
            )}
            disabled={seg.disabled}
            onClick={() => !seg.disabled && onChange(seg.value)}
            onKeyDown={(e) => handleKeyDown(e, seg.value)}
          >
            {seg.icon && (
              <span className="hs-segmented-btn__icon">{seg.icon}</span>
            )}
            <Text
              variant="label-md"
              weight={isActive ? 'semibold' : 'medium'}
              sentiment={isActive ? 'accent' : undefined}
              appearance={isActive ? undefined : 'secondary'}
            >
              {seg.label}
            </Text>
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedButton;
