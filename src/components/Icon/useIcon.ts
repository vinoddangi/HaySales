import type { CSSProperties } from 'react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export interface UseIconProps {
  size?: IconSize;
}

export const useIcon = ({ size = 'md' }: UseIconProps = {}) => {
  const isNamedSize = typeof size === 'string';
  const sizeClass = isNamedSize ? `hs-icon--${size}` : undefined;
  const customStyle =
    typeof size === 'number'
      ? ({
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size}px`,
          '--md-icon-size': `${size}px`,
        } as CSSProperties)
      : undefined;

  return {
    sizeClass,
    customStyle,
  };
};
