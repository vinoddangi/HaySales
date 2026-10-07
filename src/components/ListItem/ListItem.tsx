import clsx from 'clsx';
import React from 'react';
import { Text } from '../Text';
import './ListItem.css';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Leading icon, avatar, or image */
  leading?: React.ReactNode;
  /** Main headline text */
  headline: React.ReactNode;
  /** Optional supporting / sub text */
  supporting?: React.ReactNode;
  /** Optional trailing element — icon, badge, text */
  trailing?: React.ReactNode;
  /** Renders as a clickable item */
  clickable?: boolean;
  /** Adds a bottom divider */
  divider?: boolean;
  /** Visual size / density */
  size?: 'compact' | 'default' | 'comfortable';
  className?: string;
  onClick?: () => void;
}

/**
 * M3 List Item — reusable building block for list, ledger, and menu surfaces.
 * Uses standard M3 list anatomy: leading · headline · supporting · trailing.
 */
export const ListItem: React.FC<ListItemProps> = ({
  leading,
  headline,
  supporting,
  trailing,
  clickable = false,
  divider = false,
  size = 'default',
  className,
  onClick,
  ...props
}) => {
  return (
    <div
      className={clsx(
        'hs-list-item',
        `hs-list-item--${size}`,
        clickable && 'hs-list-item--clickable',
        divider && 'hs-list-item--divider',
        className,
      )}
      onClick={onClick}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      {...props}
    >
      {leading && <div className="hs-list-item__leading">{leading}</div>}
      <div className="hs-list-item__body">
        {typeof headline === 'string' ? (
          <Text variant="body-lg" className="hs-list-item__headline" truncate>
            {headline}
          </Text>
        ) : (
          headline
        )}
        {supporting &&
          (typeof supporting === 'string' ? (
            <Text
              variant="body-sm"
              appearance="secondary"
              className="hs-list-item__supporting"
              truncate
            >
              {supporting}
            </Text>
          ) : (
            supporting
          ))}
      </div>
      {trailing && <div className="hs-list-item__trailing">{trailing}</div>}
    </div>
  );
};

export default ListItem;
