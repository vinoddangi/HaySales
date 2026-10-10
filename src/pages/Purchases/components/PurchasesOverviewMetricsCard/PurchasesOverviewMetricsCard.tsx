import React from 'react';
import { Card, GridLayout, GridItem, StackLayout, Text } from '@salt-ds/core';
import { Coins, Layers, PackagePlus, Receipt } from 'lucide-react';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './PurchasesOverviewMetricsCard.css';

export interface PurchasesOverviewMetricsCardProps {
  totalPurchaseAmount: number;
  totalPurchaseWeight: number;
  totalExpenseAmount: number;
  totalSoldWeight: number;
  currentStock: number;
  avgBuyRate: number;
}

export const PurchasesOverviewMetricsCard: React.FC<
  PurchasesOverviewMetricsCardProps
> = ({
  totalPurchaseAmount,
  totalPurchaseWeight,
  totalExpenseAmount,
  totalSoldWeight,
  currentStock,
  avgBuyRate,
}) => {
  return (
    <GridLayout columns={2} gap={1} className="hs-purchases-overview-metrics">
      {/* 1. Stock Purchases */}
      <GridItem>
        <Card className="hs-purchases-metrics-card hs-purchases-metrics-card--purchases">
          <StackLayout gap={0.5}>
            <div className="hs-purchases-metrics-card__header">
              <Text styleAs="label">
                <b>Purchases</b>
              </Text>
              <PackagePlus size={16} />
            </div>
            <Text styleAs="h3">
              <b>{formatRupee(totalPurchaseAmount)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              {formatWeight(totalPurchaseWeight)}
            </Text>
          </StackLayout>
        </Card>
      </GridItem>

      {/* 2. Expenses */}
      <GridItem>
        <Card className="hs-purchases-metrics-card hs-purchases-metrics-card--expenses">
          <StackLayout gap={0.5}>
            <div className="hs-purchases-metrics-card__header">
              <Text styleAs="label">
                <b>Expenses</b>
              </Text>
              <Receipt size={16} />
            </div>
            <Text styleAs="h3">
              <b>{formatRupee(totalExpenseAmount)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Operational Outflow
            </Text>
          </StackLayout>
        </Card>
      </GridItem>

      {/* 3. Stock In Hand */}
      <GridItem>
        <Card className="hs-purchases-metrics-card hs-purchases-metrics-card--stock">
          <StackLayout gap={0.5}>
            <div className="hs-purchases-metrics-card__header">
              <Text styleAs="label">
                <b>Stock in Hand</b>
              </Text>
              <Layers size={16} />
            </div>
            <Text styleAs="h3">
              <b>{formatWeight(currentStock)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Sold: {formatWeight(totalSoldWeight)}
            </Text>
          </StackLayout>
        </Card>
      </GridItem>

      {/* 4. Avg Buying Rate */}
      <GridItem>
        <Card className="hs-purchases-metrics-card hs-purchases-metrics-card--rate">
          <StackLayout gap={0.5}>
            <div className="hs-purchases-metrics-card__header">
              <Text styleAs="label">
                <b>Avg Buying Rate</b>
              </Text>
              <Coins size={16} />
            </div>
            <Text styleAs="h3">
              <b>
                {formatRupee(avgBuyRate)}{' '}
                <span style={{ fontSize: '12px', fontWeight: 'normal' }}>
                  /kg
                </span>
              </b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Weighted Average Cost
            </Text>
          </StackLayout>
        </Card>
      </GridItem>
    </GridLayout>
  );
};
