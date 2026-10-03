import React, { useEffect, useRef } from 'react';

export type ButtonVariant =
  'filled' | 'outlined' | 'text' | 'elevated' | 'tonal' | 'filled-tonal';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'small' | 'medium' | 'large';

export interface UseButtonOptions {
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (_e: React.MouseEvent<HTMLElement>) => void;
  size?: ButtonSize;
}

export const useButton = ({
  disabled = false,
  type = 'button',
  onClick,
  size = 'md',
}: UseButtonOptions) => {
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

  return {
    ref,
    resolvedSize,
  };
};
