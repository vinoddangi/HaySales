import React from 'react';
import {
  Card,
  FlexLayout,
  GridLayout,
  GridItem,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { clsx } from 'clsx';
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
    <Card className={clsx('hs-activity-metrics-card', className)}>
      <StackLayout gap={1.5}>
        {/* Header */}
        <FlexLayout align="center" justify="space-between">
          <div>
            <Text styleAs="label">
              <b>Activity Summary • {categoryLabel}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Period: <b>{periodLabel}</b>
            </Text>
          </div>
          <Text styleAs="h3">
            <b>
              {totalCount} {totalCount === 1 ? 'Record' : 'Records'}
            </b>
          </Text>
        </FlexLayout>

        {/* Grid Stats */}
        <GridLayout
          columns={2}
          gap={1}
          className="hs-activity-metrics-card__grid"
        >
          <GridItem>
            <div className="hs-activity-metrics-item hs-activity-metrics-item--accent">
              <Text styleAs="notation" color="secondary">
                Total Volume (₹)
              </Text>
              <Text styleAs="h2">
                <b>{formatRupee(totalAmount)}</b>
              </Text>
            </div>
          </GridItem>

          <GridItem>
            <div className="hs-activity-metrics-item">
              <Text styleAs="notation" color="secondary">
                Total Weight (kg)
              </Text>
              <Text styleAs="h2">
                <b>{formatWeight(totalWeight)}</b>
              </Text>
            </div>
          </GridItem>
        </GridLayout>

        {/* Footer Breakdown (Cash vs Credit) */}
        {(cashAmount > 0 || creditAmount > 0) && (
          <FlexLayout
            align="center"
            justify="space-between"
            className="hs-activity-metrics-card__footer"
          >
            <FlexLayout align="center" gap={0.5}>
              <Text styleAs="notation" color="secondary">
                Cash Paid:
              </Text>
              <Text styleAs="notation" color="success">
                <b>{formatRupee(cashAmount)}</b>
              </Text>
            </FlexLayout>
            <FlexLayout align="center" gap={0.5}>
              <Text styleAs="notation" color="secondary">
                Remaining Due:
              </Text>
              <Text styleAs="notation" color="warning">
                <b>{formatRupee(creditAmount)}</b>
              </Text>
            </FlexLayout>
          </FlexLayout>
        )}
      </StackLayout>
    </Card>
  );
};

export default ActivityMetricsCard;
