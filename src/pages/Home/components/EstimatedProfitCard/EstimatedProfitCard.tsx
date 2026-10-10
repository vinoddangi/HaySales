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
import { ChevronRight, TrendingUp } from 'lucide-react';
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
      onClick={onClick}
      className={clsx(
        'hs-estimated-profit-card',
        isPositive
          ? 'hs-estimated-profit-card--positive'
          : 'hs-estimated-profit-card--negative',
        className,
      )}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      <StackLayout gap={1}>
        {/* Header */}
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <div
              className={clsx(
                'hs-estimated-profit-card__icon-wrapper',
                isPositive
                  ? 'hs-estimated-profit-card__icon-wrapper--positive'
                  : 'hs-estimated-profit-card__icon-wrapper--negative',
              )}
            >
              <TrendingUp size={18} />
            </div>
            <div>
              <FlexLayout direction="row" align="center" gap={1}>
                <Text styleAs="label">
                  <b>Estimated Net Profit</b>
                </Text>
                {onClick && (
                  <ChevronRight
                    size={14}
                    className="hs-estimated-profit-card__chevron"
                  />
                )}
              </FlexLayout>
              <Text styleAs="notation" color="secondary">
                {periodLabel || 'Period'} Trading Profit
              </Text>
            </div>
          </FlexLayout>

          <Pill>{profitMarginPct.toFixed(1)}% Margin</Pill>
        </FlexLayout>

        {/* Profit Headline */}
        <Text styleAs="h1" color={isPositive ? 'success' : 'error'}>
          <b>{formatRupee(netProfit)}</b>
        </Text>

        {cumulativeProfit !== undefined && (
          <Text styleAs="notation" color="secondary">
            Balance Sheet Cumulative: {formatRupee(cumulativeProfit)}
          </Text>
        )}

        {/* 3-Column Breakdown Sub-Pills */}
        <GridLayout
          columns={3}
          gap={1}
          className="hs-estimated-profit-card__pills"
        >
          {/* 1. Trading Margin */}
          <GridItem>
            <div className="hs-profit-pill hs-profit-pill--margin">
              <Text styleAs="notation" color="success">
                <b>Trading Margin</b>
              </Text>
              <Text styleAs="h4" color="success">
                <b>{formatRupee(grossCommission)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Crop margin
              </Text>
            </div>
          </GridItem>

          {/* 2. Service Net */}
          <GridItem>
            <div className="hs-profit-pill hs-profit-pill--service">
              <Text styleAs="notation" color="info">
                <b>Service Net</b>
              </Text>
              <Text styleAs="h4" color="info">
                <b>{formatRupee(pickupNet)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Net service
              </Text>
            </div>
          </GridItem>

          {/* 3. Expenses */}
          <GridItem>
            <div className="hs-profit-pill hs-profit-pill--expense">
              <Text styleAs="notation" color="error">
                <b>Expenses</b>
              </Text>
              <Text styleAs="h4" color="error">
                <b>-{formatRupee(operatingExpenses)}</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Operating costs
              </Text>
            </div>
          </GridItem>
        </GridLayout>
      </StackLayout>
    </Card>
  );
};

export default EstimatedProfitCard;
