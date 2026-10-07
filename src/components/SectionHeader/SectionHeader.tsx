import clsx from 'clsx';
import React from 'react';
import { Text } from '../Text';
import './SectionHeader.css';

export interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Add bottom padding/spacing before content */
  spaceBelow?: boolean;
  className?: string;
}

/**
 * M3 Section Header — reusable title row with optional action slot.
 * Used to label card sections, page sections, or list groups.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  action,
  spaceBelow = false,
  className,
}) => {
  return (
    <div
      className={clsx(
        'hs-section-header',
        spaceBelow && 'hs-section-header--space-below',
        className,
      )}
    >
      <div className="hs-section-header__text">
        {typeof title === 'string' ? (
          <Text as="h2" variant="title-md" className="hs-section-header__title">
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle &&
          (typeof subtitle === 'string' ? (
            <Text
              variant="body-sm"
              appearance="secondary"
              className="hs-section-header__subtitle"
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          ))}
      </div>
      {action && <div className="hs-section-header__action">{action}</div>}
    </div>
  );
};

export default SectionHeader;
