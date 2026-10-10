import clsx from 'clsx';
import React from 'react';
import {
  Card,
  FlexLayout,
  GridItem,
  GridLayout,
  StackLayout,
  Text,
} from '@salt-ds/core';
import { Landmark } from 'lucide-react';
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
    <Card className={clsx('hs-cash-in-hand-card', className)}>
      <StackLayout gap={1}>
        {/* Header */}
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <div className="hs-cash-in-hand-card__icon-wrapper">
              <Landmark size={18} />
            </div>
            <div>
              <Text styleAs="label" color="primary">
                <b>Cash in Hand</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Current Net Liquid Balance
              </Text>
            </div>
          </FlexLayout>

          <div className="hs-cash-in-hand-card__header-right">
            <Text styleAs="h2" color="primary">
              <b>{formatRupee(cashInHand)}</b>
            </Text>
            <Text
              styleAs="notation"
              color={
                cashAdjustment > 0
                  ? 'success'
                  : cashAdjustment < 0
                    ? 'error'
                    : 'secondary'
              }
            >
              <b>
                {cashAdjustment > 0
                  ? `${formatRupee(cashAdjustment)} vs last period`
                  : cashAdjustment < 0
                    ? `-${formatRupee(Math.abs(cashAdjustment))} vs last period`
                    : '₹0.00 vs last period'}
              </b>
            </Text>
          </div>
        </FlexLayout>

        {/* 2 Sub-Cards: Total Assets & Total Liabilities */}
        <GridLayout
          columns={2}
          gap={1}
          className="hs-cash-in-hand-card__sub-cards"
        >
          {/* Sub-Card 1: Total Assets */}
          <GridItem>
            <div
              className="hs-balance-subcard hs-balance-subcard--assets"
              onClick={onNavigateBalanceSheet}
              role={onNavigateBalanceSheet ? 'button' : undefined}
              tabIndex={onNavigateBalanceSheet ? 0 : undefined}
            >
              <div className="hs-balance-subcard__header">
                <Text styleAs="label" color="success">
                  <b>Total Assets</b>
                </Text>
                <Text styleAs="h4" color="success">
                  <b>{formatRupee(totalAssets)}</b>
                </Text>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Cash:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(cashInHand)}</b>
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Receivables:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(customerReceivables)}</b>
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Crop Stock:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(closingStockValue)}</b>
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Fixed Assets:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(fixedAssetsValue)}</b>
                  </Text>
                </div>
              </div>
            </div>
          </GridItem>

          {/* Sub-Card 2: Total Liabilities & Capital */}
          <GridItem>
            <div
              className="hs-balance-subcard hs-balance-subcard--liabilities"
              onClick={onNavigateBalanceSheet}
              role={onNavigateBalanceSheet ? 'button' : undefined}
              tabIndex={onNavigateBalanceSheet ? 0 : undefined}
            >
              <div className="hs-balance-subcard__header">
                <Text styleAs="label" color="info">
                  <b>Liabilities &amp; Capital</b>
                </Text>
                <Text styleAs="h4" color="info">
                  <b>{formatRupee(totalAssets)}</b>
                </Text>
              </div>
              <div className="hs-balance-subcard__rows">
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Partner Loan / Payables:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(totalLiabilities)}</b>
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Partner Capital:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(partnerCapital)}</b>
                  </Text>
                </div>
                <div className="hs-balance-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Retained Profit:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(retainedProfit)}</b>
                  </Text>
                </div>
              </div>
            </div>
          </GridItem>
        </GridLayout>
      </StackLayout>
    </Card>
  );
};

export default CashInHandCard;
