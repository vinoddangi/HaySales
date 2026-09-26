import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import './Button.css';

export type ButtonVariant =
  'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'filled-tonal';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (_e: React.MouseEvent<HTMLElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

/**
 * React component wrapping Google Material Design 3 Button Web Components
 * Supporting all 5 official M3 button flavors: filled, outlined, text, elevated, and tonal.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'filled',
  size = 'md',
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  style,
  icon,
  trailingIcon,
  fullWidth = false,
}) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.disabled = Boolean(disabled);
  }, [disabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleClick = (e: MouseEvent) => {
      if (disabled) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      if (onClick) {
        onClick(e as unknown as React.MouseEvent<HTMLElement>);
      }

      if (type === 'submit' && !e.defaultPrevented) {
        const form = el.closest('form');
        if (form) {
          form.requestSubmit();
        }
      }
    };

    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('click', handleClick);
    };
  }, [onClick, disabled, type]);

  const resolvedSize =
    size === 'sm' || size === 'small'
      ? 'sm'
      : size === 'lg' || size === 'large'
        ? 'lg'
        : 'md';

  const resolvedClassName = clsx(
    'hs-btn',
    `hs-btn--${resolvedSize}`,
    fullWidth && 'hs-btn--full-width',
    className,
  );

  const props = {
    ref,
    disabled: disabled ? true : undefined,
    type,
    className: resolvedClassName,
    style,
  };

  const content = (
    <>
      {icon && <span slot="icon">{icon}</span>}
      {children}
      {trailingIcon && <span slot="trailing-icon">{trailingIcon}</span>}
    </>
  );

  switch (variant) {
    case 'outlined':
      return <md-outlined-button {...props}>{content}</md-outlined-button>;
    case 'text':
      return <md-text-button {...props}>{content}</md-text-button>;
    case 'elevated':
      return <md-elevated-button {...props}>{content}</md-elevated-button>;
    case 'tonal':
    case 'filled-tonal':
      return (
        <md-filled-tonal-button {...props}>{content}</md-filled-tonal-button>
      );
    case 'filled':
    default:
      return <md-filled-button {...props}>{content}</md-filled-button>;
  }
};

export default Button;
