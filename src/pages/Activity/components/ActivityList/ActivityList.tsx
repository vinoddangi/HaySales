import clsx from 'clsx';
import { FileSearch } from 'lucide-react';
import React from 'react';
import { Flex } from '../../../../components/layouts/Flex';
import { Progress } from '../../../../components/Progress';
import { Text } from '../../../../components/Text';
import { Transaction } from '../../../../models';
import { ActivityItemCard } from '../ActivityItemCard';
import './ActivityList.css';

export interface ActivityListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onSelectTransaction?: (_tx: Transaction) => void;
  className?: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  transactions,
  isLoading,
  onSelectTransaction,
  className,
}) => {
  if (isLoading && transactions.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        padding="xl"
        fullWidth
      >
        <Progress type="circular" indeterminate fourColor />
        <Text variant="body-sm" appearance="secondary" className="mt-4">
          Loading activity log...
        </Text>
      </Flex>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={clsx('hs-activity-list__empty', className)}>
        <FileSearch className="hs-activity-list__empty-icon" />
        <Flex direction="column" gap="none" align="center">
          <Text variant="title-sm" weight="bold">
            No Transactions Found
          </Text>
          <Text variant="body-sm" appearance="secondary">
            No registered activity matches your active search and filter
            criteria.
          </Text>
        </Flex>
      </div>
    );
  }

  return (
    <div className={clsx('hs-activity-list', className)}>
      <Flex direction="column" gap="sm" fullWidth>
        {transactions.map((tx, idx) => (
          <ActivityItemCard
            key={tx.id || `activity-tx-${idx}`}
            transaction={tx}
            onClick={onSelectTransaction}
          />
        ))}
      </Flex>
    </div>
  );
};

export default ActivityList;
