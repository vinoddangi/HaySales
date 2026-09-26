import clsx from 'clsx';
import { ChevronRight, Users } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
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
                <span className="hs-customer-outstanding-card__tag">
                  Customer Outstanding
                </span>
                {onClick && (
                  <ChevronRight className="hs-customer-outstanding-card__chevron" />
                )}
              </Flex>
              <span className="hs-customer-outstanding-card__subtitle">
                {periodLabel || 'Period'} Receivables
              </span>
            </div>
          </Flex>

          <Badge sentiment="warning" size="sm">
            {customersWithDuesCount} Due
          </Badge>
        </Flex>

        {/* Amount Headline with Tenor Comparison */}
        <div className="hs-customer-outstanding-card__amount-container">
          <div className="hs-customer-outstanding-card__amount">
            {formatRupee(totalOutstanding)}
          </div>
          {previousOutstanding !== undefined && (
            <div className="hs-customer-outstanding-card__comparison">
              <span className="hs-customer-outstanding-card__comparison-prev">
                Prev: {formatRupee(previousOutstanding)}
              </span>
              <span className="hs-customer-outstanding-card__comparison-dot">
                •
              </span>
              <span
                className={clsx(
                  'hs-customer-outstanding-card__comparison-diff',
                  (tenorDifference ?? netChange) > 0
                    ? 'hs-customer-outstanding-card__comparison-diff--up'
                    : (tenorDifference ?? netChange) < 0
                      ? 'hs-customer-outstanding-card__comparison-diff--down'
                      : 'hs-customer-outstanding-card__comparison-diff--neutral',
                )}
              >
                {(tenorDifference ?? netChange) > 0
                  ? `+${formatRupee(tenorDifference ?? netChange)}`
                  : (tenorDifference ?? netChange) < 0
                    ? `-${formatRupee(Math.abs(tenorDifference ?? netChange))}`
                    : '₹0.00'}
                {previousTenorLabel ? ` (${previousTenorLabel})` : ''}
              </span>
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
              <span className="hs-outstanding-pill__label">Credit Added</span>
              <span className="hs-outstanding-pill__val">
                +{formatRupee(periodCreditAdded)}
              </span>
              <span className="hs-outstanding-pill__caption">Sales & dues</span>
            </div>
          </Grid.Item>

          {/* 2. Collected */}
          <Grid.Item>
            <div className="hs-outstanding-pill hs-outstanding-pill--collected">
              <span className="hs-outstanding-pill__label">Collected</span>
              <span className="hs-outstanding-pill__val">
                {formatRupee(periodCollections)}
              </span>
              <span className="hs-outstanding-pill__caption">Payments</span>
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
              <span className="hs-outstanding-pill__label">Net Change</span>
              <span className="hs-outstanding-pill__val">
                {netChange > 0
                  ? `+${formatRupee(netChange)}`
                  : netChange < 0
                    ? `-${formatRupee(Math.abs(netChange))}`
                    : '₹0.00'}
              </span>
              <span className="hs-outstanding-pill__caption">Period net</span>
            </div>
          </Grid.Item>
        </Grid>
      </Card.Content>
    </Card>
  );
};

export default CustomerOutstandingCard;
