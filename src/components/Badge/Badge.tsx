import clsx from 'clsx';
import React from 'react';
import './Badge.css';
import {
  BadgeAppearance,
  BadgeSentiment,
  BadgeSize,
  useBadge,
} from './useBadge';

export type { BadgeAppearance, BadgeSentiment, BadgeSize };

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  sentiment?: BadgeSentiment;
  variant?: BadgeSentiment;
  appearance?: BadgeAppearance;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  sentiment,
  variant,
  appearance = 'subtle',
  size = 'sm',
  dot = false,
  children,
  className,
  ...props
}) => {
  const { resolvedSentiment, resolvedSize } = useBadge({
    sentiment,
    variant,
    size,
    dot,
    children,
  });

  return (
    <span
      className={clsx(
        'hs-badge',
        `hs-badge--${resolvedSize}`,
        `hs-badge--${appearance}-${resolvedSentiment}`,
        className,
      )}
      {...props}
    >
      {!dot && children}
    </span>
  );
};

export default Badge;
