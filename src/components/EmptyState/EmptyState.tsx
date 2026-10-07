import clsx from 'clsx';
import React from 'react';
import { Text } from '../Text';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  headline: string;
  body?: string;
  action?: React.ReactNode;
  /** Controls vertical spacing and centering */
  fill?: boolean;
  className?: string;
}

/**
 * M3 Empty State — centered icon + headline + optional body + optional CTA.
 * Use inside list/ledger/search screens when no data is available.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  body,
  action,
  fill = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        'hs-empty-state',
        fill && 'hs-empty-state--fill',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {icon && <div className="hs-empty-state__icon">{icon}</div>}
      <Text
        as="h3"
        variant="title-md"
        align="center"
        className="hs-empty-state__headline"
      >
        {headline}
      </Text>
      {body && (
        <Text
          variant="body-md"
          appearance="secondary"
          align="center"
          className="hs-empty-state__body"
        >
          {body}
        </Text>
      )}
      {action && <div className="hs-empty-state__action">{action}</div>}
    </div>
  );
};

export default EmptyState;
