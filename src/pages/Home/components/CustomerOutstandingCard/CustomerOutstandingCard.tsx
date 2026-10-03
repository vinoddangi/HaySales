import clsx from 'clsx';
import { ChevronRight, Users } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
import { formatRupee } from '../../../../utils/formatters';
import './CustomerOutstandingCard.css';

export interface CustomerOutstandingCardProps {
  totalOutstanding: number;
  customersWithDuesCount: number;
  periodCreditAdded: number;
  periodCollections: number;
  netChange: number;
  previousOutstanding?: number;
  tenorDifference?: number;
  previousTenorLabel?: string;
  periodLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const CustomerOutstandingCard: React.FC<
  CustomerOutstandingCardProps
> = ({
  totalOutstanding,
  customersWithDuesCount,
  periodCreditAdded,
  periodCollections,
  netChange,
  previousOutstanding,
  tenorDifference,
  previousTenorLabel,
  periodLabel,
  onClick,
  className,
}) => {
  return (
    <Card
      variant="filled"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-customer-outstanding-card', className)}
    >
      <Card.Content>
        {/* Header */}
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="sm">
            <div className="hs-customer-outstanding-card__icon-wrapper">
              <Users className="hs-customer-outstanding-card__icon" />
            </div>
            <div>
              <Flex align="center" gap="xs">
                <Text
                  variant="label-sm"
                  uppercase
                  weight="bold"
                  sentiment="negative"
                >
                  Customer Outstanding
                </Text>
                {onClick && (
                  <ChevronRight className="hs-customer-outstanding-card__chevron" />
                )}
              </Flex>
              <Text variant="body-sm" appearance="secondary">
                {periodLabel || 'Period'} Receivables
              </Text>
            </div>
          </Flex>

          <Badge sentiment="warning" size="sm">
            {customersWithDuesCount} Due
          </Badge>
        </Flex>

        {/* Amount Headline with Tenor Comparison */}
        <div className="hs-customer-outstanding-card__amount-container">
          <Text
            as="div"
            variant="headline-md"
            weight="bold"
            sentiment="negative"
          >
            {formatRupee(totalOutstanding)}
          </Text>
          {previousOutstanding !== undefined && (
            <div className="hs-customer-outstanding-card__comparison">
              <Text variant="body-sm" appearance="secondary">
                Prev: {formatRupee(previousOutstanding)}
              </Text>
              <span className="hs-customer-outstanding-card__comparison-dot">
                •
              </span>
              <Text
                variant="body-sm"
                weight="bold"
                sentiment={
                  (tenorDifference ?? netChange) > 0
                    ? 'warning'
                    : (tenorDifference ?? netChange) < 0
                      ? 'positive'
                      : 'neutral'
                }
              >
                {(tenorDifference ?? netChange) > 0
                  ? `${formatRupee(tenorDifference ?? netChange)}`
                  : (tenorDifference ?? netChange) < 0
                    ? `-${formatRupee(Math.abs(tenorDifference ?? netChange))}`
                    : '₹0.00'}
                {previousTenorLabel ? ` (${previousTenorLabel})` : ''}
              </Text>
            </div>
          )}
        </div>

        {/* 3-Column Breakdown Sub-Pills */}
        <Grid
          columns={3}
          gap="xs"
          className="hs-customer-outstanding-card__pills"
        >
          {/* 1. Credit Added */}
          <Grid.Item>
            <div className="hs-outstanding-pill hs-outstanding-pill--credit">
              <Text
                variant="caption"
                uppercase
                weight="bold"
                sentiment="warning"
              >
                Credit Added
              </Text>
              <Text variant="label-md" weight="bold" sentiment="warning">
                {formatRupee(periodCreditAdded)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Sales & dues
              </Text>
            </div>
          </Grid.Item>

          {/* 2. Collected */}
          <Grid.Item>
            <div className="hs-outstanding-pill hs-outstanding-pill--collected">
              <Text
                variant="caption"
                uppercase
                weight="bold"
                sentiment="positive"
              >
                Collected
              </Text>
              <Text variant="label-md" weight="bold" sentiment="positive">
                {formatRupee(periodCollections)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Payments
              </Text>
            </div>
          </Grid.Item>

          {/* 3. Net Change */}
          <Grid.Item>
            <div
              className={clsx(
                'hs-outstanding-pill',
                netChange > 0
                  ? 'hs-outstanding-pill--change-up'
                  : netChange < 0
                    ? 'hs-outstanding-pill--change-down'
                    : 'hs-outstanding-pill--change-neutral',
              )}
            >
              <Text
                variant="caption"
                uppercase
                weight="bold"
                sentiment={
                  netChange > 0
                    ? 'warning'
                    : netChange < 0
                      ? 'positive'
                      : 'neutral'
                }
              >
                Net Change
              </Text>
              <Text
                variant="label-md"
                weight="bold"
                sentiment={
                  netChange > 0
                    ? 'warning'
                    : netChange < 0
                      ? 'positive'
                      : 'neutral'
                }
              >
                {netChange > 0
                  ? `${formatRupee(netChange)}`
                  : netChange < 0
                    ? `-${formatRupee(Math.abs(netChange))}`
                    : '₹0.00'}
              </Text>
              <Text variant="caption" appearance="secondary">
                Period net
              </Text>
            </div>
          </Grid.Item>
        </Grid>
      </Card.Content>
    </Card>
  );
};

export default CustomerOutstandingCard;
