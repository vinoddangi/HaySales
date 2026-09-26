import '@material/web/switch/switch.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Switch.css';

export interface SwitchProps {
  selected?: boolean;
  checked?: boolean; // alias for selected
  disabled?: boolean;
  icons?: boolean;
  showOnlySelectedIcon?: boolean;
  label?: string;
  className?: string;
  onChange?: (_selected: boolean) => void;
}

/**
 * React component wrapping Google Material Design 3 Switch Web Component
 */
export const Switch: React.FC<SwitchProps> = ({
  selected,
  checked,
  disabled = false,
  icons = true,
  showOnlySelectedIcon = true,
  label,
  className = '',
  onChange,
}) => {
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

  const switchEl = (
    <md-switch
      ref={ref}
      selected={isSelected}
      disabled={disabled}
      icons={icons}
      showOnlySelectedIcon={showOnlySelectedIcon}
      className={clsx(!label && className)}
    />
  );

  if (label) {
    return (
      <label
        className={clsx(
          'hs-switch-wrapper',
          disabled && 'hs-switch-wrapper--disabled',
          className,
        )}
      >
        {switchEl}
        <span className="hs-switch-label">{label}</span>
      </label>
    );
  }

  return switchEl;
};

export default Switch;
