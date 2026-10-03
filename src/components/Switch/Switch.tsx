import '@material/web/switch/switch.js';
import clsx from 'clsx';
import React from 'react';
import './Switch.css';
import { useSwitch } from './useSwitch';

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
  const { ref, isSelected } = useSwitch({
    selected,
    checked,
    disabled,
    onChange,
  });

  const switchEl = (
    <md-switch
      ref={ref}
      selected={isSelected ? true : undefined}
      disabled={disabled ? true : undefined}
      icons={icons ? true : undefined}
      showOnlySelectedIcon={showOnlySelectedIcon ? true : undefined}
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
