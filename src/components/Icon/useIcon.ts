export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

export type IconSentiment =
  'positive' | 'negative' | 'warning' | 'info' | 'accent' | 'neutral';

export const ICON_SIZE_MAP: Record<string, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
};

export function resolveIconPixelSize(size: IconSize = 'md'): number {
  if (typeof size === 'number') {
    return size;
  }
  return ICON_SIZE_MAP[size] ?? 16;
}

export interface UseIconProps {
  size?: IconSize;
  sentiment?: IconSentiment;
  color?: string;
}

export const useIcon = ({ size = 'md', sentiment }: UseIconProps = {}) => {
  const pixelSize = resolveIconPixelSize(size);
  const sizeClass = typeof size === 'string' ? `hs-icon--${size}` : undefined;
  const sentimentClass = sentiment ? `hs-icon--${sentiment}` : undefined;

  return {
    pixelSize,
    sizeClass,
    sentimentClass,
  };
};

export default useIcon;
