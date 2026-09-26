import React from 'react';

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

export interface UseBadgeOptions {
  sentiment?: BadgeSentiment;
  variant?: BadgeSentiment;
  size?: BadgeSize;
  dot?: boolean;
  children?: React.ReactNode;
}

export const useBadge = ({
  sentiment,
  variant,
  size = 'sm',
  dot = false,
  children,
}: UseBadgeOptions) => {
  const resolvedSentiment = sentiment || variant || 'neutral';
  const resolvedSize = dot || !children ? 'dot' : size;

  return {
    resolvedSentiment,
    resolvedSize,
  };
};
