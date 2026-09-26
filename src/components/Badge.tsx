import clsx from 'clsx';
import React from 'react';
import './Badge.css';

export type BadgeSentiment =
  | 'positive'
  | 'negative'
  | 'warning'
  | 'info'
  | 'accent'
  | 'neutral'
  | 'cash'
  | 'credit'
  | 'service'
  | 'purchase'
  | 'expense';

export type BadgeAppearance = 'subtle' | 'solid';
export type BadgeSize = 'sm' | 'md' | 'dot';

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
  const resolvedSentiment = sentiment || variant || 'neutral';
  const resolvedSize = dot || !children ? 'dot' : size;

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
