import '@material/web/elevation/elevation.js';
import clsx from 'clsx';
import React from 'react';
import './Card.css';

/* -------------------------------------------------------------------------- */
/* Main Card Root Component                                                   */
/* -------------------------------------------------------------------------- */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined';
  sentiment?: 'neutral' | 'primary' | 'positive' | 'warning' | 'negative';
  corner?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const CardRoot: React.FC<CardProps> = ({
  children,
  variant = 'filled',
  sentiment = 'neutral',
  corner,
  clickable = false,
  padding = 'none',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'hs-card',
        `hs-card--${variant}`,
        corner && `hs-card--corner-${corner}`,
        sentiment !== 'neutral' && `hs-card--sentiment-${sentiment}`,
        `hs-card--p-${padding}`,
        clickable && 'hs-card--clickable',
        className,
      )}
      {...props}
    >
      {variant === 'elevated' && <md-elevation />}
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardHeader Component                                                       */
/* -------------------------------------------------------------------------- */

export interface CardHeaderProps {
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  avatar,
  title,
  subtitle,
  action,
  className,
}) => {
  return (
    <div className={clsx('hs-card__header', className)}>
      <div className="hs-card__header-main">
        {avatar && <div className="hs-card__header-avatar">{avatar}</div>}
        {icon && !avatar && <div className="hs-card__header-icon">{icon}</div>}
        <div className="hs-card__header-titles">
          {typeof title === 'string' ? (
            <h3 className="hs-card__title">{title}</h3>
          ) : (
            title
          )}
          {subtitle &&
            (typeof subtitle === 'string' ? (
              <p className="hs-card__subtitle">{subtitle}</p>
            ) : (
              subtitle
            ))}
        </div>
      </div>
      {action && <div className="hs-card__header-action">{action}</div>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardContent Component                                                      */
/* -------------------------------------------------------------------------- */

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  noPadding?: boolean;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  noPadding = false,
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'hs-card__content',
        noPadding && 'hs-card__content--no-padding',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardActions Component                                                      */
/* -------------------------------------------------------------------------- */

export interface CardActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end' | 'between';
  className?: string;
}

export const CardActions: React.FC<CardActionsProps> = ({
  children,
  align = 'end',
  className,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'hs-card__actions',
        `hs-card__actions--align-${align}`,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardDivider Component                                                      */
/* -------------------------------------------------------------------------- */

export const CardDivider: React.FC<{ className?: string }> = ({
  className,
}) => <hr className={clsx('hs-card__divider', className)} />;

/* -------------------------------------------------------------------------- */
/* CardMetric Component (Prespecified Metric / KPI / Stat Structure)          */
/* -------------------------------------------------------------------------- */

export interface CardMetricProps {
  icon?: React.ReactNode;
  value: React.ReactNode;
  label: React.ReactNode;
  subtitle?: React.ReactNode;
  trend?: {
    value: string | number;
    direction?: 'up' | 'down' | 'neutral';
    label?: string;
  };
  badge?: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  onClick?: () => void;
}

export const CardMetric: React.FC<CardMetricProps> = ({
  icon,
  value,
  label,
  subtitle,
  trend,
  badge,
  align = 'left',
  className,
  onClick,
}) => {
  return (
    <div
      className={clsx(
        'hs-card__metric',
        align !== 'left' && `hs-card__metric--align-${align}`,
        onClick && 'hs-card__metric--clickable',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {icon && <div className="hs-card__metric-icon">{icon}</div>}
      <div className="hs-card__metric-body">
        <div className="hs-card__metric-value">{value}</div>
        <div className="hs-card__metric-label">{label}</div>
        {subtitle && <div className="hs-card__metric-subtitle">{subtitle}</div>}
        {trend && (
          <div
            className={clsx(
              'hs-card__metric-trend',
              `hs-card__metric-trend--${trend.direction || 'neutral'}`,
            )}
          >
            {trend.value} {trend.label && <span>{trend.label}</span>}
          </div>
        )}
        {badge && <div className="hs-card__metric-badge">{badge}</div>}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardSubCard Component (Prespecified Nested Sub-Card / Pill Container)      */
/* -------------------------------------------------------------------------- */

export interface CardSubCardProps {
  title: React.ReactNode;
  value?: React.ReactNode;
  sentiment?: 'neutral' | 'positive' | 'negative' | 'warning' | 'purple';
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export const CardSubCard: React.FC<CardSubCardProps> = ({
  title,
  value,
  sentiment = 'neutral',
  onClick,
  children,
  className,
}) => {
  return (
    <div
      className={clsx(
        'hs-card__sub-card',
        sentiment !== 'neutral' && `hs-card__sub-card--${sentiment}`,
        onClick && 'hs-card__sub-card--clickable',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="hs-card__sub-card-header">
        <span className="hs-card__sub-card-title">{title}</span>
        {value !== undefined && (
          <span className="hs-card__sub-card-value">{value}</span>
        )}
      </div>
      {children && <div className="hs-card__sub-card-body">{children}</div>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardRow Component (Prespecified Key-Value or List Row)                     */
/* -------------------------------------------------------------------------- */

export interface CardRowProps {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  bold?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CardRow: React.FC<CardRowProps> = ({
  label,
  value,
  icon,
  bold = false,
  onClick,
  className,
}) => {
  return (
    <div
      className={clsx(
        'hs-card__row',
        bold && 'hs-card__row--bold',
        onClick && 'hs-card__row--clickable',
        className,
      )}
      onClick={onClick}
    >
      <div className="hs-card__row-main">
        {icon && <span className="hs-card__row-icon">{icon}</span>}
        <span className="hs-card__row-label">{label}</span>
      </div>
      <span className="hs-card__row-value">{value}</span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CardActionItem Component (Prespecified Action Item inside Card)            */
/* -------------------------------------------------------------------------- */

export interface CardActionItemProps {
  icon?: React.ReactNode;
  label: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const CardActionItem: React.FC<CardActionItemProps> = ({
  icon,
  label,
  onClick,
  className,
}) => {
  return (
    <button
      type="button"
      className={clsx('hs-card__action-item', className)}
      onClick={onClick}
    >
      {icon && <span className="hs-card__action-item-icon">{icon}</span>}
      <span className="hs-card__action-item-label">{label}</span>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* Compound Card Export                                                       */
/* -------------------------------------------------------------------------- */

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Content: CardContent,
  Actions: CardActions,
  Divider: CardDivider,
  Metric: CardMetric,
  SubCard: CardSubCard,
  Row: CardRow,
  ActionItem: CardActionItem,
});

export default Card;
