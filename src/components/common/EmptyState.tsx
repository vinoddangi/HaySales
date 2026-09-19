import React from 'react';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-2 py-10 text-center ${className}`}
    >
      {icon && (
        <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-m3-surface-container-highest text-m3-on-surface-variant">
          {icon}
        </div>
      )}
      <Text styleAs="h4" appearance="primary" weight="bold">
        {title}
      </Text>
      {description && (
        <Text
          styleAs="body-sm"
          appearance="secondary"
          className="block max-w-xs"
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="tonal" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
