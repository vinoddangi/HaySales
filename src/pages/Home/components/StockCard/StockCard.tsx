import clsx from 'clsx';
import { ChevronRight, Package } from 'lucide-react';
import React from 'react';
import { CropCommissionProfitResult } from '../../../../business';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
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
            <Flex direction="column">
              <Flex align="center" gap="xs">
                <Text variant="label-sm" weight="bold" uppercase>
                  Crop Stock &amp; Valuation
                </Text>
                {onClick && <ChevronRight className="hs-stock-card__chevron" />}
              </Flex>
              <Text variant="caption" appearance="secondary">
                {periodLabel || 'Period'} Inventory &amp; Margins
              </Text>
            </Flex>
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
          <Text variant="headline-md" weight="bold" sentiment="info">
            {formatRupee(totalClosingStock.amount)}
          </Text>
          <Text variant="body-sm" weight="bold" appearance="secondary">
            {formatWeight(totalClosingStock.weight)} Total Stock
          </Text>
        </div>

        <Text variant="caption" appearance="secondary">
          Available: {formatWeight(totalAvailableWeight)} • Margin:{' '}
          {formatRupee(totalGrossCommissionProfit)}
        </Text>

        {/* 3. Top 3 Summary Sub-Pills */}
        <Grid columns={3} gap="xs" className="hs-stock-card__pills">
          {/* Opening Stock (Previous Month Closing) */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--opening">
              <Text variant="caption" weight="bold" uppercase sentiment="info">
                Prev Closing
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="info">
                {formatWeight(totalOpeningStock.weight)}
              </Text>
              <Text variant="caption" appearance="secondary">
                {openingAvgRate > 0
                  ? `₹${openingAvgRate.toFixed(2)}/kg`
                  : formatRupee(totalOpeningStock.amount)}
              </Text>
            </div>
          </Grid.Item>

          {/* Current Purchases */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--buying">
              <Text
                variant="caption"
                weight="bold"
                uppercase
                sentiment="warning"
              >
                Purchases
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="warning">
                {formatWeight(totalPurchases.weight)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Avg ₹{totalPurchases.rate.toFixed(2)}/kg
              </Text>
            </div>
          </Grid.Item>

          {/* Mean Buying Rate */}
          <Grid.Item>
            <div className="hs-stock-pill hs-stock-pill--mean">
              <Text variant="caption" weight="bold" uppercase sentiment="info">
                Mean Buy Rate
              </Text>
              <Text variant="body-sm" weight="bold" sentiment="info">
                ₹{overallMeanBuyingRate.toFixed(2)}/kg
              </Text>
              <Text variant="caption" appearance="secondary">
                Blended mean cost
              </Text>
            </div>
          </Grid.Item>
        </Grid>

        {/* 4. Crop Line Items Breakdown */}
        {cropItems.length > 0 ? (
          <div className="hs-stock-card__crops-section">
            <div className="hs-stock-card__crops-header">
              <Text
                variant="label-sm"
                weight="bold"
                uppercase
                appearance="secondary"
              >
                Crop Realization &amp; Margin Breakdown
              </Text>
              <Text variant="caption" appearance="secondary">
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
                      <Flex align="center" gap="xs">
                        <Text variant="body-sm" weight="bold">
                          {crop.category}
                        </Text>
                        <Badge
                          sentiment={stockWeight > 0 ? 'info' : 'neutral'}
                          size="sm"
                        >
                          {stockWeight > 0
                            ? `Stock: ${formatWeight(stockWeight)}`
                            : 'Sold Out'}
                        </Badge>
                        {stockWeight > 0 && (
                          <Text variant="caption" appearance="secondary">
                            ({formatRupee(crop.closingStock.amount)})
                          </Text>
                        )}
                      </Flex>

                      <div className="hs-stock-crop-row__profit-badge">
                        <Text
                          variant="body-sm"
                          weight="bold"
                          sentiment={isProfitPos ? 'positive' : 'negative'}
                        >
                          {formatRupee(crop.grossCommissionProfit)}
                        </Text>
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
                          <Text
                            variant="caption"
                            weight="bold"
                            uppercase
                            appearance="secondary"
                          >
                            Mean Buy Rate
                          </Text>
                          <Text variant="body-sm" weight="bold">
                            ₹{crop.totalAvailableStock.weightedRate.toFixed(2)}
                            /kg
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            {hasOpen && (
                              <Text variant="caption" appearance="secondary">
                                Prev: ₹{crop.openingStock.rate.toFixed(2)}/kg
                              </Text>
                            )}
                            {hasBuy && (
                              <Text variant="caption" appearance="secondary">
                                Buy: ₹{crop.purchases.rate.toFixed(2)}/kg
                              </Text>
                            )}
                            {!hasOpen && !hasBuy && (
                              <Text variant="caption" appearance="secondary">
                                Rate: ₹
                                {crop.totalAvailableStock.weightedRate.toFixed(
                                  2,
                                )}
                                /kg
                              </Text>
                            )}
                          </div>
                        </div>
                      </Grid.Item>

                      {/* 2. Selling Rate Column */}
                      <Grid.Item>
                        <div className="hs-stock-crop-row__col hs-stock-crop-row__col--sell">
                          <Text
                            variant="caption"
                            weight="bold"
                            uppercase
                            appearance="secondary"
                          >
                            Selling Rate
                          </Text>
                          <Text variant="body-sm" weight="bold">
                            {crop.sales.avgRate > 0
                              ? `₹${crop.sales.avgRate.toFixed(2)}/kg`
                              : '—'}
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            <Text variant="caption" appearance="secondary">
                              {soldWeight > 0
                                ? `Sold: ${formatWeight(soldWeight)}`
                                : 'No sales'}
                            </Text>
                            {soldWeight > 0 && (
                              <Text variant="caption" appearance="secondary">
                                Rev: {formatRupee(crop.sales.amount)}
                              </Text>
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
                          <Text
                            variant="caption"
                            weight="bold"
                            uppercase
                            appearance="secondary"
                          >
                            Spread &amp; COGS
                          </Text>
                          <Text variant="body-sm" weight="bold">
                            {crop.sales.avgRate > 0
                              ? `₹${unitSpread.toFixed(2)}/kg`
                              : '—'}
                          </Text>
                          <div className="hs-stock-crop-row__sub-list">
                            <Text variant="caption" appearance="secondary">
                              COGS: {formatRupee(crop.costOfGoodsSold)}
                            </Text>
                            <Text variant="caption" appearance="secondary">
                              Profit: {formatRupee(crop.grossCommissionProfit)}
                            </Text>
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
                        <Text variant="caption" appearance="secondary">
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
            <Text variant="body-sm" appearance="secondary">
              No inventory movements or closing stock for this period.
            </Text>
          </div>
        )}
      </Card.Content>
    </Card>
  );
};

export default StockCard;
