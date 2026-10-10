import React from 'react';
import { FlexLayout, Spinner, StackLayout, Text } from '@salt-ds/core';
import { clsx } from 'clsx';
import { FileSearch } from 'lucide-react';
import { Transaction } from '../../../../models';
import { EmptyState } from '../../../../views/EmptyState';
import { ActivityItemCard } from '../ActivityItemCard';
import './ActivityList.css';

export interface ActivityListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onSelectTransaction?: (_tx: Transaction) => void;
  onEditTransaction?: (_tx: Transaction) => void;
  className?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  transactions,
  isLoading,
  onSelectTransaction,
  onEditTransaction,
  className,
}) => {
  if (isLoading && transactions.length === 0) {
    return (
      <FlexLayout
        direction="column"
        align="center"
        justify="center"
        style={{ padding: 'var(--salt-spacing-300)', width: '100%' }}
      >
        <Spinner size="medium" />
        <Text
          styleAs="notation"
          color="secondary"
          style={{ marginTop: '16px' }}
        >
          Loading activity log...
        </Text>
      </FlexLayout>
    );
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<FileSearch size={36} />}
        headline="No Transactions Found"
        body="No registered activity matches your active search and filter criteria."
        className={className}
      />
    );
  }

  return (
    <div className={clsx('hs-activity-list', className)}>
      <StackLayout gap={1}>
        {transactions.map((tx, idx) => (
          <ActivityItemCard
            key={tx.id || `activity-tx-${idx}`}
            transaction={tx}
            onClick={onSelectTransaction}
            onEdit={onEditTransaction}
          />
        ))}
      </StackLayout>
    </div>
  );
};

export default ActivityList;
