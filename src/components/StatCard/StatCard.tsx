import clsx from 'clsx';
import React from 'react';
import { Badge } from '../Badge';
import { Card } from '../Card';
import { Text } from '../Text';
import './StatCard.css';

export type StatCardSentiment =
  'neutral' | 'positive' | 'negative' | 'warning' | 'info';

export interface StatCardTrend {
  value: string | number;
  direction?: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface StatCardProps {
  /** Icon displayed at top-left */
  icon?: React.ReactNode;
  /** Large primary metric value */
  value: React.ReactNode;
  /** Short label below the value */
  label: string;
  /** Optional secondary supporting text */
  subtitle?: string;
  /** Optional trend indicator */
  trend?: StatCardTrend;
  /** Optional badge in top-right corner */
  badge?: React.ReactNode;
  /** Drives the card's background + border tint */
  sentiment?: StatCardSentiment;
  /** Card variant */
  variant?: 'filled' | 'outlined' | 'elevated' | 'tonal';
  /** Makes the card clickable */
  onClick?: () => void;
  className?: string;
}

const TREND_SENTIMENT: Record<
  NonNullable<StatCardTrend['direction']>,
  'positive' | 'negative' | 'neutral'
> = {
  up: 'positive',
  down: 'negative',
  neutral: 'neutral',
};

/**
 * Composite StatCard — a Card preset for a single KPI/metric.
 * Wraps Card + icon + large value + label + optional trend badge.
 * Driven entirely by M3 sentiment tokens.
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  subtitle,
  trend,
  badge,
  sentiment = 'neutral',
  variant = 'filled',
  onClick,
  className,
}) => {
  return (
    <Card
      variant={variant}
      sentiment={sentiment !== 'neutral' ? sentiment : undefined}
      clickable={!!onClick}
      onClick={onClick}
      className={clsx('hs-stat-card', className)}
    >
      <div className="hs-stat-card__header">
        {icon && <div className="hs-stat-card__icon">{icon}</div>}
        {badge && <div className="hs-stat-card__badge">{badge}</div>}
      </div>

      <div className="hs-stat-card__body">
        <Text
          as="p"
          variant="headline-sm"
          weight="bold"
          className="hs-stat-card__value"
          truncate
        >
          {value}
        </Text>
        <Text
          variant="label-md"
          appearance="secondary"
          className="hs-stat-card__label"
          truncate
        >
          {label}
        </Text>
        {subtitle && (
          <Text
            variant="caption"
            appearance="disabled"
            className="hs-stat-card__subtitle"
          >
            {subtitle}
          </Text>
        )}
        {trend && (
          <div className="hs-stat-card__trend">
            <Badge
              sentiment={TREND_SENTIMENT[trend.direction || 'neutral']}
              appearance="subtle"
            >
              {trend.value}
              {trend.label ? ` ${trend.label}` : ''}
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
