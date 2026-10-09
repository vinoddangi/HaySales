import React from 'react';
import {
  IconCoins,
  IconLayers,
  IconPackagePlus,
  IconReceipt,
} from '../../../../components/Icon';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
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
    <Grid columns={2} gap="sm" fullWidth>
      {/* 1. Stock Purchases */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--purchases">
          <div className="hs-purchases-metrics-card__header">
            <Text
              variant="label-sm"
              weight="bold"
              uppercase
              className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--purchases"
            >
              Purchases
            </Text>
            <IconPackagePlus
              size="md"
              className="hs-purchases-metrics-card__icon hs-purchases-metrics-card__icon--purchases"
            />
          </div>
          <Text
            variant="title-md"
            weight="bold"
            as="div"
            className="hs-purchases-metrics-card__value"
          >
            {formatRupee(totalPurchaseAmount)}
          </Text>
          <Text variant="body-sm" appearance="secondary">
            {formatWeight(totalPurchaseWeight)}
          </Text>
        </div>
      </Grid.Item>

      {/* 2. Expenses */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--expenses">
          <div className="hs-purchases-metrics-card__header">
            <Text
              variant="label-sm"
              weight="bold"
              uppercase
              className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--expenses"
            >
              Expenses
            </Text>
            <IconReceipt
              size="md"
              className="hs-purchases-metrics-card__icon hs-purchases-metrics-card__icon--expenses"
            />
          </div>
          <Text
            variant="title-md"
            weight="bold"
            as="div"
            className="hs-purchases-metrics-card__value"
          >
            {formatRupee(totalExpenseAmount)}
          </Text>
          <Text variant="body-sm" appearance="secondary">
            Operational Outflow
          </Text>
        </div>
      </Grid.Item>

      {/* 3. Stock In Hand */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--stock">
          <div className="hs-purchases-metrics-card__header">
            <Text
              variant="label-sm"
              weight="bold"
              uppercase
              className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--stock"
            >
              Stock In Hand
            </Text>
            <IconLayers
              size="md"
              className="hs-purchases-metrics-card__icon hs-purchases-metrics-card__icon--stock"
            />
          </div>
          <Text
            variant="title-md"
            weight="bold"
            as="div"
            className="hs-purchases-metrics-card__value"
          >
            {formatWeight(currentStock)}
          </Text>
          <Text variant="body-sm" appearance="secondary">
            Sold: {formatWeight(totalSoldWeight)}
          </Text>
        </div>
      </Grid.Item>

      {/* 4. Avg Buying Rate */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--rate">
          <div className="hs-purchases-metrics-card__header">
            <Text
              variant="label-sm"
              weight="bold"
              uppercase
              className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--rate"
            >
              Avg Buying Rate
            </Text>
            <IconCoins
              size="md"
              className="hs-purchases-metrics-card__icon hs-purchases-metrics-card__icon--rate"
            />
          </div>
          <div className="hs-purchases-metrics-card__value-row">
            <Text
              variant="title-md"
              weight="bold"
              as="span"
              className="hs-purchases-metrics-card__value"
            >
              {formatRupee(avgBuyRate)}
            </Text>
            <Text
              variant="label-md"
              appearance="secondary"
              as="span"
              className="hs-purchases-metrics-card__unit"
            >
              /kg
            </Text>
          </div>
          <Text variant="body-sm" appearance="secondary">
            Weighted Average Cost
          </Text>
        </div>
      </Grid.Item>
    </Grid>
  );
};
