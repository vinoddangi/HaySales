import clsx from 'clsx';
import React from 'react';
import { CropCommissionProfitResult } from '../../../../business';
import {
  Card,
  FlexLayout,
  GridItem,
  GridLayout,
  Pill,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { ChevronRight, Package } from 'lucide-react';
import { formatRupee, formatWeight } from '../../../../utils/formatters';
import './StockCard.css';

export interface StockCardProps {
  totalClosingStock: {
    weight: number;
    amount: number;
  };
  totalOpeningStock?: {
    weight: number;
    amount: number;
  };
  totalPurchases?: {
    weight: number;
    rate: number;
    amount: number;
  };
  totalSales?: {
    weight: number;
    avgRate: number;
    amount: number;
  };
  totalGrossCommissionProfit?: number;
  totalCostOfGoodsSold?: number;
  cropItems: CropCommissionProfitResult[];
  periodLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const StockCard: React.FC<StockCardProps> = ({
  totalClosingStock,
  totalOpeningStock = { weight: 0, amount: 0 },
  totalPurchases = { weight: 0, rate: 0, amount: 0 },
  totalGrossCommissionProfit = 0,
  cropItems,
  periodLabel,
  onClick,
  className,
}) => {
  const totalAvailableWeight = totalOpeningStock.weight + totalPurchases.weight;
  const totalAvailableAmount = totalOpeningStock.amount + totalPurchases.amount;
  const overallMeanBuyingRate =
    totalAvailableWeight > 0 ? totalAvailableAmount / totalAvailableWeight : 0;

  const openingAvgRate =
    totalOpeningStock.weight > 0
      ? totalOpeningStock.amount / totalOpeningStock.weight
      : 0;

  return (
    <Card
      onClick={onClick}
      className={clsx('hs-stock-card', className)}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        {/* 1. Header */}
        <FlexLayout
          direction="row"
          align="center"
          justify="space-between"
          className="hs-stock-card__header"
        >
          <FlexLayout direction="row" align="center" gap={1}>
            <div className="hs-stock-card__icon-wrapper">
              <Package size={18} />
            </div>
            <div>
              <FlexLayout direction="row" align="center" gap={1}>
                <Text styleAs="label">
                  <b>Crop Stock & Valuation</b>
                </Text>
                {onClick && (
                  <ChevronRight size={14} className="hs-stock-card__chevron" />
                )}
              </FlexLayout>
              <Text styleAs="notation" color="secondary">
                {periodLabel || 'Period'} Inventory &amp; Margins
              </Text>
            </div>
          </FlexLayout>

          <Pill>{formatWeight(totalClosingStock.weight)} In Stock</Pill>
        </FlexLayout>

        {/* 2. Amount Headline (Closing Stock Valuation) */}
        <div className="hs-stock-card__amount-row">
          <Text styleAs="h1" color="info">
            <b>{formatRupee(totalClosingStock.amount)}</b>
          </Text>
          <Text color="secondary">
            <b>{formatWeight(totalClosingStock.weight)} Total Stock</b>
          </Text>
        </div>

        <Text styleAs="notation" color="secondary">
          Available: {formatWeight(totalAvailableWeight)} • Margin:{' '}
          {formatRupee(totalGrossCommissionProfit)}
        </Text>

        {/* 3. Top 3 Summary Sub-Pills */}
        <GridLayout columns={3} gap={1} className="hs-stock-card__pills">
          {/* Opening Stock (Previous Month Closing) */}
          <GridItem>
            <div className="hs-stock-pill hs-stock-pill--opening">
              <Text styleAs="notation" color="info">
                <b>Prev Closing</b>
              </Text>
              <Text color="info">
                <b>{formatWeight(totalOpeningStock.weight)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                {openingAvgRate > 0
                  ? `₹${openingAvgRate.toFixed(2)}/kg`
                  : formatRupee(totalOpeningStock.amount)}
              </Text>
            </div>
          </GridItem>

          {/* Current Purchases */}
          <GridItem>
            <div className="hs-stock-pill hs-stock-pill--buying">
              <Text styleAs="notation" color="warning">
                <b>Purchases</b>
              </Text>
              <Text color="warning">
                <b>{formatWeight(totalPurchases.weight)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Avg ₹{totalPurchases.rate.toFixed(2)}/kg
              </Text>
            </div>
          </GridItem>

          {/* Mean Buying Rate */}
          <GridItem>
            <div className="hs-stock-pill hs-stock-pill--mean">
              <Text styleAs="notation" color="info">
                <b>Mean Buy Rate</b>
              </Text>
              <Text color="info">
                <b>₹{overallMeanBuyingRate.toFixed(2)}/kg</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Blended mean cost
              </Text>
            </div>
          </GridItem>
        </GridLayout>

        {/* 4. Crop Line Items Breakdown */}
        {cropItems.length > 0 ? (
          <div className="hs-stock-card__crops-section">
            <div className="hs-stock-card__crops-header">
              <Text styleAs="label" color="secondary">
                Crop Realization &amp; Margin Breakdown
              </Text>
              <Text styleAs="notation" color="secondary">
                {cropItems.length} active crop
                {cropItems.length === 1 ? '' : 's'}
              </Text>
            </div>

            <div className="hs-stock-card__crop-list">
              {cropItems.map((crop) => {
                const availWeight = crop.totalAvailableStock.weight;
                const soldWeight = crop.sales.weight;
                const stockWeight = crop.closingStock.weight;

                const soldPct =
                  availWeight > 0 ? (soldWeight / availWeight) * 100 : 0;
                const stockPct =
                  availWeight > 0 ? (stockWeight / availWeight) * 100 : 0;

                const isProfitPos = crop.grossCommissionProfit >= 0;
                const unitSpread =
                  crop.sales.avgRate > 0
                    ? crop.sales.avgRate - crop.totalAvailableStock.weightedRate
                    : 0;

                const hasOpen = crop.openingStock.weight > 0;
                const hasBuy = crop.purchases.weight > 0;

                return (
                  <div key={crop.category} className="hs-stock-crop-row">
                    {/* Top Row: Crop Name, In-Stock Badge & Valuation, Margin Badge */}
                    <div className="hs-stock-crop-row__top">
                      <FlexLayout direction="row" align="center" gap={1}>
                        <Text styleAs="h4">
                          <b>{crop.category}</b>
                        </Text>
                        <Pill>
                          {stockWeight > 0
                            ? `Stock: ${formatWeight(stockWeight)}`
                            : 'Sold Out'}
                        </Pill>
                        {stockWeight > 0 && (
                          <Text styleAs="notation" color="secondary">
                            ({formatRupee(crop.closingStock.amount)})
                          </Text>
                        )}
                      </FlexLayout>

                      <div className="hs-stock-crop-row__profit-badge">
                        <Text color={isProfitPos ? 'success' : 'error'}>
                          <b>{formatRupee(crop.grossCommissionProfit)}</b>
                        </Text>
                      </div>
                    </div>

                    {/* Middle: 3-Column Metrics Grid */}
                    <GridLayout
                      columns={3}
                      gap={1}
                      className="hs-stock-crop-row__grid"
                    >
                      {/* 1. Mean Buying Rate Column */}
                      <GridItem>
                        <div className="hs-stock-crop-row__col hs-stock-crop-row__col--buy">
                          <Text styleAs="notation" color="secondary">
                            <b>MEAN BUY RATE</b>
                          </Text>
                          <Text>
                            <b>
                              ₹
                              {crop.totalAvailableStock.weightedRate.toFixed(2)}
                              /kg
                            </b>
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            {hasOpen && (
                              <Text styleAs="notation" color="secondary">
                                Prev: ₹{crop.openingStock.rate.toFixed(2)}/kg
                              </Text>
                            )}
                            {hasBuy && (
                              <Text styleAs="notation" color="secondary">
                                Buy: ₹{crop.purchases.rate.toFixed(2)}/kg
                              </Text>
                            )}
                            {!hasOpen && !hasBuy && (
                              <Text styleAs="notation" color="secondary">
                                Rate: ₹
                                {crop.totalAvailableStock.weightedRate.toFixed(
                                  2,
                                )}
                                /kg
                              </Text>
                            )}
                          </div>
                        </div>
                      </GridItem>

                      {/* 2. Selling Rate Column */}
                      <GridItem>
                        <div className="hs-stock-crop-row__col hs-stock-crop-row__col--sell">
                          <Text styleAs="notation" color="secondary">
                            <b>SELLING RATE</b>
                          </Text>
                          <Text>
                            <b>
                              {crop.sales.avgRate > 0
                                ? `₹${crop.sales.avgRate.toFixed(2)}/kg`
                                : '—'}
                            </b>
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            <Text styleAs="notation" color="secondary">
                              {soldWeight > 0
                                ? `Sold: ${formatWeight(soldWeight)}`
                                : 'No sales'}
                            </Text>
                            {soldWeight > 0 && (
                              <Text styleAs="notation" color="secondary">
                                Rev: {formatRupee(crop.sales.amount)}
                              </Text>
                            )}
                          </div>
                        </div>
                      </GridItem>

                      {/* 3. Margin & Spread Column */}
                      <GridItem>
                        <div
                          className={clsx(
                            'hs-stock-crop-row__col',
                            isProfitPos
                              ? 'hs-stock-crop-row__col--margin'
                              : 'hs-stock-crop-row__col--margin-neg',
                          )}
                        >
                          <Text styleAs="notation" color="secondary">
                            <b>SPREAD &amp; COGS</b>
                          </Text>
                          <Text>
                            <b>
                              {crop.sales.avgRate > 0
                                ? `₹${unitSpread.toFixed(2)}/kg`
                                : '—'}
                            </b>
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            <Text styleAs="notation" color="secondary">
                              COGS: {formatRupee(crop.costOfGoodsSold)}
                            </Text>
                            <Text styleAs="notation" color="secondary">
                              Profit: {formatRupee(crop.grossCommissionProfit)}
                            </Text>
                          </div>
                        </div>
                      </GridItem>
                    </GridLayout>

                    {/* Progress Bar & Legend */}
                    {availWeight > 0 && (
                      <div className="hs-stock-crop-row__footer">
                        <div className="hs-stock-crop-row__progress">
                          <div
                            className="hs-stock-crop-row__progress-sold"
                            style={{ width: `${soldPct}%` }}
                            title={`Sold: ${soldPct.toFixed(1)}%`}
                          />
                          <div
                            className="hs-stock-crop-row__progress-stock"
                            style={{ width: `${stockPct}%` }}
                            title={`In Stock: ${stockPct.toFixed(1)}%`}
                          />
                        </div>
                        <Text styleAs="notation" color="secondary">
                          Sold {soldPct.toFixed(0)}% • Stock{' '}
                          {stockPct.toFixed(0)}%
                        </Text>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="hs-stock-card__empty">
            <Text color="secondary">
              No inventory movements or closing stock for this period.
            </Text>
          </div>
        )}
      </StackLayout>
    </Card>
  );
};

export default StockCard;
