import clsx from 'clsx';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Card } from '../../../../components/Card';
import { IconChevronRight, IconTrendingUp } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
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
              <IconTrendingUp size={18} />
            </div>
            <div>
              <Flex align="center" gap="xs">
                <Text variant="label-sm" uppercase weight="bold">
                  Estimated Net Profit
                </Text>
                {onClick && (
                  <IconChevronRight
                    size={14}
                    className="hs-estimated-profit-card__chevron"
                  />
                )}
              </Flex>
              <Text variant="body-sm" appearance="secondary">
                {periodLabel || 'Period'} Trading Profit
              </Text>
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
        <Text
          as="div"
          variant="headline-md"
          weight="bold"
          sentiment={isPositive ? 'positive' : 'negative'}
        >
          {formatRupee(netProfit)}
        </Text>

        {cumulativeProfit !== undefined && (
          <Text variant="caption" appearance="secondary">
            Balance Sheet Cumulative: {formatRupee(cumulativeProfit)}
          </Text>
        )}

        {/* 3-Column Breakdown Sub-Pills */}
        <Grid columns={3} gap="xs" className="hs-estimated-profit-card__pills">
          {/* 1. Trading Margin */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--margin">
              <Text
                variant="caption"
                uppercase
                weight="bold"
                sentiment="positive"
              >
                Trading Margin
              </Text>
              <Text variant="label-md" weight="bold" sentiment="positive">
                {formatRupee(grossCommission)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Crop margin
              </Text>
            </div>
          </Grid.Item>

          {/* 2. Service Net */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--service">
              <Text variant="caption" uppercase weight="bold" sentiment="info">
                Service Net
              </Text>
              <Text variant="label-md" weight="bold" sentiment="info">
                {formatRupee(pickupNet)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Net service
              </Text>
            </div>
          </Grid.Item>

          {/* 3. Expenses */}
          <Grid.Item>
            <div className="hs-profit-pill hs-profit-pill--expense">
              <Text
                variant="caption"
                uppercase
                weight="bold"
                sentiment="negative"
              >
                Expenses
              </Text>
              <Text variant="label-md" weight="bold" sentiment="negative">
                -{formatRupee(operatingExpenses)}
              </Text>
              <Text variant="caption" appearance="secondary">
                Operating costs
              </Text>
            </div>
          </Grid.Item>
        </Grid>
      </Card.Content>
    </Card>
  );
};

export default EstimatedProfitCard;
