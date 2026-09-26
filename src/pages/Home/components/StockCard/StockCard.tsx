import clsx from 'clsx';
import { ChevronRight, Package } from 'lucide-react';
import React from 'react';
import { CropCommissionProfitResult } from '../../../../business';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
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
      variant="filled"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx('hs-stock-card', className)}
    >
      <Card.Content>
        {/* 1. Header */}
        <Flex
          align="center"
          justify="between"
          fullWidth
          className="hs-stock-card__header"
        >
          <Flex align="center" gap="sm">
            <div className="hs-stock-card__icon-wrapper">
              <Package className="hs-stock-card__icon" />
            </div>
            <div>
              <Flex align="center" gap="xs">
                <span className="hs-stock-card__tag">
                  Crop Stock &amp; Valuation
                </span>
                {onClick && <ChevronRight className="hs-stock-card__chevron" />}
              </Flex>
              <span className="hs-stock-card__subtitle">
                {periodLabel || 'Period'} Inventory &amp; Margins
              </span>
            </div>
          </Flex>

          <Badge
            sentiment={totalClosingStock.weight > 0 ? 'info' : 'neutral'}
            size="sm"
          >
            {formatWeight(totalClosingStock.weight)} In Stock
          </Badge>
        </Flex>

        {/* 2. Amount Headline (Closing Stock Valuation) */}
        <div className="hs-stock-card__amount-row">
          <div className="hs-stock-card__headline">
            {formatRupee(totalClosingStock.amount)}
          </div>
          <div className="hs-stock-card__headline-sub">
            {formatWeight(totalClosingStock.weight)} Total Stock
          </div>
        </div>

        <div className="hs-stock-card__meta">
          Available: {formatWeight(totalAvailableWeight)} • Margin: +
          {formatRupee(totalGrossCommissionProfit)}
        </div>

        {/* 3. Top 3 Summary Sub-Pills */}
        <Grid columns={3} gap="xs" className="hs-stock-card__pills">
          {/* Opening Stock (Previous Month Closing) */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--opening">
              <span className="hs-stock-pill__label">Prev Closing</span>
              <span className="hs-stock-pill__val">
                {formatWeight(totalOpeningStock.weight)}
              </span>
              <span className="hs-stock-pill__caption">
                {openingAvgRate > 0
                  ? `₹${openingAvgRate.toFixed(2)}/kg`
                  : formatRupee(totalOpeningStock.amount)}
              </span>
            </div>
          </Grid.Item>

          {/* Current Purchases */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--buying">
              <span className="hs-stock-pill__label">Purchases</span>
              <span className="hs-stock-pill__val">
                {formatWeight(totalPurchases.weight)}
              </span>
              <span className="hs-stock-pill__caption">
                Avg ₹{totalPurchases.rate.toFixed(2)}/kg
              </span>
            </div>
          </Grid.Item>

          {/* Mean Buying Rate */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--mean">
              <span className="hs-stock-pill__label">Mean Buy Rate</span>
              <span className="hs-stock-pill__val">
                ₹{overallMeanBuyingRate.toFixed(2)}/kg
              </span>
              <span className="hs-stock-pill__caption">Blended mean cost</span>
            </div>
          </Grid.Item>
        </Grid>

        {/* 4. Crop Line Items Breakdown */}
        {cropItems.length > 0 ? (
          <div className="hs-stock-card__crops-section">
            <div className="hs-stock-card__crops-header">
              <span className="hs-stock-card__crops-title">
                Crop Realization &amp; Margin Breakdown
              </span>
              <span className="hs-stock-card__meta">
                {cropItems.length} active crop
                {cropItems.length === 1 ? '' : 's'}
              </span>
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
                      <Flex align="center" gap="xs">
                        <span className="hs-stock-crop-row__title">
                          {crop.category}
                        </span>
                        <Badge
                          sentiment={stockWeight > 0 ? 'info' : 'neutral'}
                          size="sm"
                        >
                          {stockWeight > 0
                            ? `Stock: ${formatWeight(stockWeight)}`
                            : 'Sold Out'}
                        </Badge>
                        {stockWeight > 0 && (
                          <span className="hs-stock-crop-row__val-tag">
                            ({formatRupee(crop.closingStock.amount)})
                          </span>
                        )}
                      </Flex>

                      <div className="hs-stock-crop-row__profit-badge">
                        <span
                          className={clsx(
                            'hs-stock-crop-row__profit-val',
                            isProfitPos
                              ? 'hs-stock-crop-row__profit-val--pos'
                              : 'hs-stock-crop-row__profit-val--neg',
                          )}
                        >
                          {isProfitPos ? '+' : ''}
                          {formatRupee(crop.grossCommissionProfit)}
                        </span>
                      </div>
                    </div>

                    {/* Middle: 3-Column Metrics Grid */}
                    <Grid
                      columns={3}
                      gap="xs"
                      className="hs-stock-crop-row__grid"
                    >
                      {/* 1. Mean Buying Rate Column */}
                      <Grid.Item>
                        <div className="hs-stock-crop-row__col hs-stock-crop-row__col--buy">
                          <span className="hs-stock-crop-row__label">
                            Mean Buy Rate
                          </span>
                          <span className="hs-stock-crop-row__val">
                            ₹{crop.totalAvailableStock.weightedRate.toFixed(2)}
                            /kg
                          </span>
                          <div className="hs-stock-crop-row__sub-list">
                            {hasOpen && (
                              <span className="hs-stock-crop-row__sub">
                                Prev: ₹{crop.openingStock.rate.toFixed(2)}/kg
                              </span>
                            )}
                            {hasBuy && (
                              <span className="hs-stock-crop-row__sub">
                                Buy: ₹{crop.purchases.rate.toFixed(2)}/kg
                              </span>
                            )}
                            {!hasOpen && !hasBuy && (
                              <span className="hs-stock-crop-row__sub">
                                Rate: ₹
                                {crop.totalAvailableStock.weightedRate.toFixed(
                                  2,
                                )}
                                /kg
                              </span>
                            )}
                          </div>
                        </div>
                      </Grid.Item>

                      {/* 2. Selling Rate Column */}
                      <Grid.Item>
                        <div className="hs-stock-crop-row__col hs-stock-crop-row__col--sell">
                          <span className="hs-stock-crop-row__label">
                            Selling Rate
                          </span>
                          <span className="hs-stock-crop-row__val">
                            {crop.sales.avgRate > 0
                              ? `₹${crop.sales.avgRate.toFixed(2)}/kg`
                              : '—'}
                          </span>
                          <div className="hs-stock-crop-row__sub-list">
                            <span className="hs-stock-crop-row__sub">
                              {soldWeight > 0
                                ? `Sold: ${formatWeight(soldWeight)}`
                                : 'No sales'}
                            </span>
                            {soldWeight > 0 && (
                              <span className="hs-stock-crop-row__sub">
                                Rev: {formatRupee(crop.sales.amount)}
                              </span>
                            )}
                          </div>
                        </div>
                      </Grid.Item>

                      {/* 3. Margin & Spread Column */}
                      <Grid.Item>
                        <div
                          className={clsx(
                            'hs-stock-crop-row__col',
                            isProfitPos
                              ? 'hs-stock-crop-row__col--margin'
                              : 'hs-stock-crop-row__col--margin-neg',
                          )}
                        >
                          <span className="hs-stock-crop-row__label">
                            Spread &amp; COGS
                          </span>
                          <span className="hs-stock-crop-row__val">
                            {crop.sales.avgRate > 0
                              ? `${unitSpread >= 0 ? '+' : ''}₹${unitSpread.toFixed(2)}/kg`
                              : '—'}
                          </span>
                          <div className="hs-stock-crop-row__sub-list">
                            <span className="hs-stock-crop-row__sub">
                              COGS: {formatRupee(crop.costOfGoodsSold)}
                            </span>
                            <span className="hs-stock-crop-row__sub">
                              Profit: {isProfitPos ? '+' : ''}
                              {formatRupee(crop.grossCommissionProfit)}
                            </span>
                          </div>
                        </div>
                      </Grid.Item>
                    </Grid>

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
                        <span className="hs-stock-crop-row__legend">
                          Sold {soldPct.toFixed(0)}% • Stock{' '}
                          {stockPct.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="hs-stock-card__empty">
            No inventory movements or closing stock for this period.
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default StockCard;
