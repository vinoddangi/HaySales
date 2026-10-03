import '@material/web/button/elevated-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import clsx from 'clsx';
import React from 'react';
import './Button.css';
import { ButtonSize, ButtonVariant, useButton } from './useButton';

export type { ButtonSize, ButtonVariant };

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
  const { ref, resolvedSize } = useButton({ disabled, type, onClick, size });

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
