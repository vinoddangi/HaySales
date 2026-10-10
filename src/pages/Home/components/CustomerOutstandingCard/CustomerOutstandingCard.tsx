import clsx from 'clsx';
import React from 'react';
import {
  Card,
  FlexLayout,
  GridItem,
  GridLayout,
  Pill,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { ChevronRight, Users } from 'lucide-react';
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
      onClick={onClick}
      className={clsx('hs-customer-outstanding-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        {/* Header */}
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <div className="hs-customer-outstanding-card__icon-wrapper">
              <Users size={18} />
            </div>
            <div>
              <FlexLayout direction="row" align="center" gap={1}>
                <Text styleAs="label" color="warning">
                  <b>Customer Outstanding</b>
                </Text>
                {onClick && (
                  <ChevronRight
                    size={14}
                    className="hs-customer-outstanding-card__chevron"
                  />
                )}
              </FlexLayout>
              <Text styleAs="notation" color="secondary">
                {periodLabel || 'Period'} Receivables
              </Text>
            </div>
          </FlexLayout>

          <Pill>{customersWithDuesCount} Due</Pill>
        </FlexLayout>

        {/* Amount Headline with Tenor Comparison */}
        <div className="hs-customer-outstanding-card__amount-container">
          <Text styleAs="h1" color="warning">
            <b>{formatRupee(totalOutstanding)}</b>
          </Text>
          {previousOutstanding !== undefined && (
            <div className="hs-customer-outstanding-card__comparison">
              <Text styleAs="notation" color="secondary">
                Prev: {formatRupee(previousOutstanding)}
              </Text>
              <span className="hs-customer-outstanding-card__comparison-dot">
                •
              </span>
              <Text
                styleAs="notation"
                color={
                  (tenorDifference ?? netChange) > 0
                    ? 'warning'
                    : (tenorDifference ?? netChange) < 0
                      ? 'success'
                      : 'secondary'
                }
              >
                <b>
                  {(tenorDifference ?? netChange) > 0
                    ? `${formatRupee(tenorDifference ?? netChange)}`
                    : (tenorDifference ?? netChange) < 0
                      ? `-${formatRupee(Math.abs(tenorDifference ?? netChange))}`
                      : '₹0.00'}
                  {previousTenorLabel ? ` (${previousTenorLabel})` : ''}
                </b>
              </Text>
            </div>
          )}
        </div>

        {/* 3-Column Breakdown Sub-Pills */}
        <GridLayout
          columns={3}
          gap={1}
          className="hs-customer-outstanding-card__pills"
        >
          {/* 1. Credit Added */}
          <GridItem>
            <div className="hs-outstanding-pill hs-outstanding-pill--credit">
              <Text styleAs="notation" color="warning">
                <b>Credit Added</b>
              </Text>
              <Text styleAs="h4" color="warning">
                <b>{formatRupee(periodCreditAdded)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Sales & dues
              </Text>
            </div>
          </GridItem>

          {/* 2. Collected */}
          <GridItem>
            <div className="hs-outstanding-pill hs-outstanding-pill--collected">
              <Text styleAs="notation" color="success">
                <b>Collected</b>
              </Text>
              <Text styleAs="h4" color="success">
                <b>{formatRupee(periodCollections)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Payments
              </Text>
            </div>
          </GridItem>

          {/* 3. Net Change */}
          <GridItem>
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
                styleAs="notation"
                color={
                  netChange > 0
                    ? 'warning'
                    : netChange < 0
                      ? 'success'
                      : 'secondary'
                }
              >
                <b>Net Change</b>
              </Text>
              <Text
                styleAs="h4"
                color={
                  netChange > 0
                    ? 'warning'
                    : netChange < 0
                      ? 'success'
                      : 'secondary'
                }
              >
                <b>
                  {netChange > 0
                    ? `${formatRupee(netChange)}`
                    : netChange < 0
                      ? `-${formatRupee(Math.abs(netChange))}`
                      : '₹0.00'}
                </b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Period net
              </Text>
            </div>
          </GridItem>
        </GridLayout>
      </StackLayout>
    </Card>
  );
};

export default CustomerOutstandingCard;
