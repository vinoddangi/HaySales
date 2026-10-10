import React from 'react';
import { StackLayout, Text } from '@salt-ds/core';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  headline: string;
  body?: string;
  action?: React.ReactNode;
  fill?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  headline,
  body,
  action,
  className,
}) => {
  return (
    <StackLayout
      align="center"
      gap={2}
      className={className}
      style={{ padding: 'var(--salt-spacing-400)', textAlign: 'center' }}
    >
      {icon && <div>{icon}</div>}
      <Text styleAs="h3" color="primary">
        <b>{headline}</b>
      </Text>
      {body && <Text color="secondary">{body}</Text>}
      {action && <div>{action}</div>}
    </StackLayout>
  );
};

export default EmptyState;
