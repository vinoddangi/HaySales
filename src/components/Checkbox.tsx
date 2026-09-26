import '@material/web/checkbox/checkbox.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Checkbox.css';

export interface CheckboxProps {
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  onChange?: (_checked: boolean) => void;
}

/**
 * React component wrapping Google Material Design 3 Checkbox Web Component
 */
export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  indeterminate = false,
  disabled = false,
  label,
  className = '',
  onChange,
}) => {
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

  const checkboxEl = (
    <md-checkbox
      ref={ref}
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      className={clsx(!label && className)}
    />
  );

  if (label) {
    return (
      <label
        className={clsx(
          'hs-checkbox-wrapper',
          disabled && 'hs-checkbox-wrapper--disabled',
          className,
        )}
      >
        {checkboxEl}
        <span className="hs-checkbox-label">{label}</span>
      </label>
    );
  }

  return checkboxEl;
};

export default Checkbox;
