import clsx from 'clsx';
import { ChevronRight, TrendingUp } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { formatRupee } from '../../../../utils/formatters';
import './EstimatedProfitCard.css';

export interface EstimatedProfitCardProps {
  netProfit: number;
  profitMarginPct: number;
  grossCommission: number;
  pickupNet: number;
  operatingExpenses: number;
  periodLabel?: string;
  cumulativeProfit?: number;
  onClick?: () => void;
  className?: string;
}

export const EstimatedProfitCard: React.FC<EstimatedProfitCardProps> = ({
  netProfit,
  profitMarginPct,
  grossCommission,
  pickupNet,
  operatingExpenses,
  periodLabel,
  cumulativeProfit,
  onClick,
  className,
}) => {
  const isPositive = netProfit >= 0;

  return (
    <Card
      variant="filled"
      clickable={Boolean(onClick)}
      onClick={onClick}
      className={clsx(
        'hs-estimated-profit-card',
        isPositive
          ? 'hs-estimated-profit-card--positive'
          : 'hs-estimated-profit-card--negative',
        className,
      )}
    >
      <Card.Content>
        {/* Header */}
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="sm">
            <div
              className={clsx(
                'hs-estimated-profit-card__icon-wrapper',
                isPositive
                  ? 'hs-estimated-profit-card__icon-wrapper--positive'
                  : 'hs-estimated-profit-card__icon-wrapper--negative',
              )}
            >
              <TrendingUp className="hs-estimated-profit-card__icon" />
            </div>
            <div>
              <Flex align="center" gap="xs">
                <span className="hs-estimated-profit-card__tag">
                  Estimated Net Profit
                </span>
                {onClick && (
                  <ChevronRight className="hs-estimated-profit-card__chevron" />
                )}
              </Flex>
              <span className="hs-estimated-profit-card__subtitle">
                {periodLabel || 'Period'} Trading Profit
              </span>
            </div>
          </Flex>

          <Badge
            sentiment={profitMarginPct >= 0 ? 'positive' : 'negative'}
            size="sm"
          >
            {profitMarginPct.toFixed(1)}% Margin
          </Badge>
        </Flex>

        {/* Profit Headline */}
        <div
          className={clsx(
            'hs-estimated-profit-card__headline',
            isPositive
              ? 'hs-estimated-profit-card__headline--positive'
              : 'hs-estimated-profit-card__headline--negative',
          )}
        >
          {formatRupee(netProfit)}
        </div>

        {cumulativeProfit !== undefined && (
          <div className="hs-estimated-profit-card__cumulative">
            Balance Sheet Cumulative: {formatRupee(cumulativeProfit)}
          </div>
        )}

        {/* 3-Column Breakdown Sub-Pills */}
        <Grid columns={3} gap="xs" className="hs-estimated-profit-card__pills">
          {/* 1. Trading Margin */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--margin">
              <span className="hs-profit-pill__label">Trading Margin</span>
              <span className="hs-profit-pill__val">
                +{formatRupee(grossCommission)}
              </span>
              <span className="hs-profit-pill__caption">Crop margin</span>
            </div>
          </Grid.Item>

          {/* 2. Pickup Net */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--service">
              <span className="hs-profit-pill__label">Pickup Net</span>
              <span className="hs-profit-pill__val">
                +{formatRupee(pickupNet)}
              </span>
              <span className="hs-profit-pill__caption">Pickup service</span>
            </div>
          </Grid.Item>

          {/* 3. Expenses */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--expense">
              <span className="hs-profit-pill__label">Expenses</span>
              <span className="hs-profit-pill__val">
                -{formatRupee(operatingExpenses)}
              </span>
              <span className="hs-profit-pill__caption">Operating costs</span>
            </div>
          </Grid.Item>
        </Grid>
      </Card.Content>
    </Card>
  );
};

export default EstimatedProfitCard;
