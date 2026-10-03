import { Coins, Layers, PackagePlus, Receipt } from 'lucide-react';
import React from 'react';
import { Grid } from '../../../../components/layouts/Grid';
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
            <span className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--purchases">
              Purchases
            </span>
            <PackagePlus className="h-4 w-4 text-amber-600" />
          </div>
          <div className="hs-purchases-metrics-card__value">
            {formatRupee(totalPurchaseAmount)}
          </div>
          <div className="hs-purchases-metrics-card__caption">
            {formatWeight(totalPurchaseWeight)}
          </div>
        </div>
      </Grid.Item>

      {/* 2. Expenses */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--expenses">
          <div className="hs-purchases-metrics-card__header">
            <span className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--expenses">
              Expenses
            </span>
            <Receipt className="h-4 w-4 text-rose-600" />
          </div>
          <div className="hs-purchases-metrics-card__value">
            {formatRupee(totalExpenseAmount)}
          </div>
          <div className="hs-purchases-metrics-card__caption">
            Operational Outflow
          </div>
        </div>
      </Grid.Item>

      {/* 3. Stock In Hand */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--stock">
          <div className="hs-purchases-metrics-card__header">
            <span className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--stock">
              Stock In Hand
            </span>
            <Layers className="h-4 w-4 text-blue-600" />
          </div>
          <div className="hs-purchases-metrics-card__value">
            {formatWeight(currentStock)}
          </div>
          <div className="hs-purchases-metrics-card__caption">
            Sold: {formatWeight(totalSoldWeight)}
          </div>
        </div>
      </Grid.Item>

      {/* 4. Avg Buying Rate */}
      <Grid.Item>
        <div className="hs-purchases-metrics-card hs-purchases-metrics-card--rate">
          <div className="hs-purchases-metrics-card__header">
            <span className="hs-purchases-metrics-card__title hs-purchases-metrics-card__title--rate">
              Avg Buying Rate
            </span>
            <Coins className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="hs-purchases-metrics-card__value">
            {formatRupee(avgBuyRate)}
            <span className="hs-purchases-metrics-card__unit">/kg</span>
          </div>
          <div className="hs-purchases-metrics-card__caption">
            Weighted Average Cost
          </div>
        </div>
      </Grid.Item>
    </Grid>
  );
};
