import clsx from 'clsx';
import { Landmark } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
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
              <span className="hs-cash-in-hand-card__tag">Cash in Hand</span>
              <span className="hs-cash-in-hand-card__subtitle">
                Current Net Liquid Balance
              </span>
            </div>
          </Flex>

          <div className="hs-cash-in-hand-card__header-right">
            <div className="hs-cash-in-hand-card__amount">
              {formatRupee(cashInHand)}
            </div>
            <div
              className={clsx(
                'hs-cash-in-hand-card__adj',
                cashAdjustment > 0
                  ? 'hs-cash-in-hand-card__adj--up'
                  : cashAdjustment < 0
                    ? 'hs-cash-in-hand-card__adj--down'
                    : 'hs-cash-in-hand-card__adj--neutral',
              )}
            >
              {cashAdjustment > 0
                ? `+${formatRupee(cashAdjustment)} vs last period`
                : cashAdjustment < 0
                  ? `-${formatRupee(Math.abs(cashAdjustment))} vs last period`
                  : '₹0.00 vs last period'}
            </div>
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
                <span className="hs-balance-subcard__title hs-balance-subcard__title--emerald">
                  Total Assets
                </span>
                <span className="hs-balance-subcard__val hs-balance-subcard__val--emerald">
                  {formatRupee(totalAssets)}
                </span>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <span>Cash:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(cashInHand)}
                  </span>
                </div>
                <div className="hs-balance-subcard__row">
                  <span>Receivables:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(customerReceivables)}
                  </span>
                </div>
                <div className="hs-balance-subcard__row">
                  <span>Crop Stock:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(closingStockValue)}
                  </span>
                </div>
                <div className="hs-balance-subcard__row">
                  <span>Fixed Assets:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(fixedAssetsValue)}
                  </span>
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
                <span className="hs-balance-subcard__title hs-balance-subcard__title--purple">
                  Liabilities &amp; Capital
                </span>
                <span className="hs-balance-subcard__val hs-balance-subcard__val--purple">
                  {formatRupee(totalAssets)}
                </span>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <span>Payables:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(totalLiabilities)}
                  </span>
                </div>
                <div className="hs-balance-subcard__row">
                  <span>Partner Capital:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(partnerCapital)}
                  </span>
                </div>
                <div className="hs-balance-subcard__row">
                  <span>Retained Profit:</span>
                  <span className="hs-balance-subcard__row-val">
                    {formatRupee(retainedProfit)}
                  </span>
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
