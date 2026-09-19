import React from 'react';
import { cn } from '../../utils/cn';

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

export type BadgeAppearance = 'subtle' | 'solid' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'small' | 'medium';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  sentiment?: BadgeSentiment;
  variant?: BadgeSentiment; // alias for sentiment
  appearance?: BadgeAppearance;
  size?: BadgeSize;
  children: React.ReactNode;
}

const subtleSentimentStyles: Record<BadgeSentiment, string> = {
  positive:
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  cash: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  credit:
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  warning:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  purchase:
    'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  service:
    'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
  negative:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  expense:
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  accent: 'bg-m3-primary/10 text-m3-primary border border-m3-primary/20',
  neutral:
    'bg-m3-surface-variant text-m3-on-surface-variant border border-m3-outline/30',
};

const solidSentimentStyles: Record<BadgeSentiment, string> = {
  positive: 'bg-emerald-600 text-white',
  cash: 'bg-emerald-600 text-white',
  credit: 'bg-purple-600 text-white',
  warning: 'bg-amber-600 text-white',
  purchase: 'bg-amber-600 text-white',
  service: 'bg-sky-600 text-white',
  info: 'bg-sky-600 text-white',
  negative: 'bg-rose-600 text-white',
  expense: 'bg-rose-600 text-white',
  accent: 'bg-m3-primary text-m3-on-primary',
  neutral: 'bg-m3-on-surface-variant text-m3-surface',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[9px]',
  small: 'px-1.5 py-0.5 text-[9px]',
  md: 'px-2 py-0.5 text-[11px]',
  medium: 'px-2 py-0.5 text-[11px]',
};

export const Badge: React.FC<BadgeProps> = ({
  sentiment,
  variant,
  appearance = 'subtle',
  size = 'sm',
  children,
  className,
  ...props
}) => {
  const resolvedSentiment = sentiment || variant || 'neutral';
  const styleMap =
    appearance === 'solid' ? solidSentimentStyles : subtleSentimentStyles;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded font-bold uppercase tracking-wider',
        styleMap[resolvedSentiment],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
