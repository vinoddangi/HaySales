import clsx from 'clsx';
import { Landmark } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
import { formatRupee } from '../../../../utils/formatters';
import './CashInHandCard.css';

export interface CashInHandCardProps {
  cashInHand: number;
  cashAdjustment: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssetsValue: number;
  totalAssets: number;
  totalLiabilities: number;
  partnerCapital: number;
  retainedProfit: number;
  onNavigateBalanceSheet?: () => void;
  className?: string;
}

export const CashInHandCard: React.FC<CashInHandCardProps> = ({
  cashInHand,
  cashAdjustment,
  customerReceivables,
  closingStockValue,
  fixedAssetsValue,
  totalAssets,
  totalLiabilities,
  partnerCapital,
  retainedProfit,
  onNavigateBalanceSheet,
  className,
}) => {
  return (
    <Card variant="filled" className={clsx('hs-cash-in-hand-card', className)}>
      <Card.Content>
        {/* Header */}
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="sm">
            <div className="hs-cash-in-hand-card__icon-wrapper">
              <Landmark className="hs-cash-in-hand-card__icon" />
            </div>
            <div>
              <Text
                as="div"
                variant="label-sm"
                uppercase
                weight="bold"
                sentiment="accent"
              >
                Cash in Hand
              </Text>
              <Text variant="body-sm" appearance="secondary">
                Current Net Liquid Balance
              </Text>
            </div>
          </Flex>

          <div className="hs-cash-in-hand-card__header-right">
            <Text
              as="div"
              variant="headline-sm"
              weight="bold"
              sentiment="accent"
            >
              {formatRupee(cashInHand)}
            </Text>
            <Text
              as="div"
              variant="caption"
              weight="bold"
              sentiment={
                cashAdjustment > 0
                  ? 'positive'
                  : cashAdjustment < 0
                    ? 'negative'
                    : 'neutral'
              }
            >
              {cashAdjustment > 0
                ? `${formatRupee(cashAdjustment)} vs last period`
                : cashAdjustment < 0
                  ? `-${formatRupee(Math.abs(cashAdjustment))} vs last period`
                  : '₹0.00 vs last period'}
            </Text>
          </div>
        </Flex>

        {/* 2 Sub-Cards: Total Assets & Total Liabilities */}
        <Grid columns={2} gap="sm" className="hs-cash-in-hand-card__sub-cards">
          {/* Sub-Card 1: Total Assets */}
          <Grid.Item>
            <div
              className="hs-balance-subcard hs-balance-subcard--assets"
              onClick={onNavigateBalanceSheet}
              role={onNavigateBalanceSheet ? 'button' : undefined}
              tabIndex={onNavigateBalanceSheet ? 0 : undefined}
            >
              <div className="hs-balance-subcard__header">
                <Text
                  variant="caption"
                  uppercase
                  weight="bold"
                  sentiment="positive"
                >
                  Total Assets
                </Text>
                <Text variant="label-md" weight="bold" sentiment="positive">
                  {formatRupee(totalAssets)}
                </Text>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Cash:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(cashInHand)}
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Receivables:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(customerReceivables)}
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Crop Stock:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(closingStockValue)}
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Fixed Assets:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(fixedAssetsValue)}
                  </Text>
                </div>
              </div>
            </div>
          </Grid.Item>

          {/* Sub-Card 2: Total Liabilities & Capital */}
          <Grid.Item>
            <div
              className="hs-balance-subcard hs-balance-subcard--liabilities"
              onClick={onNavigateBalanceSheet}
              role={onNavigateBalanceSheet ? 'button' : undefined}
              tabIndex={onNavigateBalanceSheet ? 0 : undefined}
            >
              <div className="hs-balance-subcard__header">
                <Text
                  variant="caption"
                  uppercase
                  weight="bold"
                  sentiment="info"
                >
                  Liabilities &amp; Capital
                </Text>
                <Text variant="label-md" weight="bold" sentiment="info">
                  {formatRupee(totalAssets)}
                </Text>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Partner Loan / Payables:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(totalLiabilities)}
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Partner Capital:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(partnerCapital)}
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Retained Profit:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(retainedProfit)}
                  </Text>
                </div>
              </div>
            </div>
          </Grid.Item>
        </Grid>
      </Card.Content>
    </Card>
  );
};

export default CashInHandCard;
