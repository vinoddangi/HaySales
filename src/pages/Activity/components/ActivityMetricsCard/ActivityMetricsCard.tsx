import clsx from 'clsx';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Text } from '../../../../components/Text';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './ActivityMetricsCard.css';

export interface ActivityMetricsCardProps {
  totalCount: number;
  totalAmount: number;
  totalWeight: number;
  cashAmount: number;
  creditAmount: number;
  periodLabel: string;
  categoryLabel: string;
  className?: string;
}

export const ActivityMetricsCard: React.FC<ActivityMetricsCardProps> = ({
  totalCount,
  totalAmount,
  totalWeight,
  cashAmount,
  creditAmount,
  periodLabel,
  categoryLabel,
  className,
}) => {
  return (
    <Card
      variant="filled"
      className={clsx('hs-activity-metrics-card', className)}
    >
      <Card.Content>
        <Flex direction="column" gap="sm" fullWidth>
          {/* Header */}
          <Flex align="center" justify="between" fullWidth>
            <Flex direction="column" gap="none">
              <Text
                variant="label-sm"
                weight="bold"
                uppercase
                appearance="secondary"
              >
                Activity Summary • {categoryLabel}
              </Text>
              <Flex align="center" gap="xs">
                <Text variant="body-sm" appearance="secondary">
                  Period:
                </Text>
                <Text variant="body-sm" weight="bold">
                  {periodLabel}
                </Text>
              </Flex>
            </Flex>
            <Text variant="title-md" weight="bold" sentiment="accent">
              {totalCount} {totalCount === 1 ? 'Record' : 'Records'}
            </Text>
          </Flex>

          {/* Grid Stats */}
          <div className="hs-activity-metrics-card__grid">
            <div className="hs-activity-metrics-item hs-activity-metrics-item--accent">
              <Flex direction="column" gap="none">
                <Text
                  variant="label-sm"
                  weight="medium"
                  appearance="secondary"
                  uppercase
                >
                  Total Volume (₹)
                </Text>
                <Text variant="title-lg" weight="bold" sentiment="accent">
                  {formatRupee(totalAmount)}
                </Text>
              </Flex>
            </div>

            <div className="hs-activity-metrics-item">
              <Flex direction="column" gap="none">
                <Text
                  variant="label-sm"
                  weight="medium"
                  appearance="secondary"
                  uppercase
                >
                  Total Weight (Kg)
                </Text>
                <Text variant="title-lg" weight="bold" sentiment="neutral">
                  {formatWeight(totalWeight)}
                </Text>
              </Flex>
            </div>
          </div>

          {/* Footer Breakdown (Cash vs Credit) */}
          {(cashAmount > 0 || creditAmount > 0) && (
            <Flex
              align="center"
              justify="between"
              fullWidth
              className="hs-activity-metrics-card__footer"
            >
              <Flex align="center" gap="xs">
                <Text variant="label-sm" appearance="secondary">
                  Cash Paid:
                </Text>
                <Text variant="label-sm" weight="bold" sentiment="positive">
                  {formatRupee(cashAmount)}
                </Text>
              </Flex>
              <Flex align="center" gap="xs">
                <Text variant="label-sm" appearance="secondary">
                  Remaining Due:
                </Text>
                <Text variant="label-sm" weight="bold" sentiment="warning">
                  {formatRupee(creditAmount)}
                </Text>
              </Flex>
            </Flex>
          )}
        </Flex>
      </Card.Content>
    </Card>
  );
};

export default ActivityMetricsCard;
