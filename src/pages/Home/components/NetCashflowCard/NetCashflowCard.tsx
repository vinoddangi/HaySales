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
import { Wallet } from 'lucide-react';
import { formatRupee } from '../../../../utils/formatters';
import './NetCashflowCard.css';

export interface NetCashflowCardProps {
  netCashflow: number;
  totalCashIn: number;
  paymentsReceived: number;
  salesOnCash: number;
  servicesReceived: number;
  totalCashOut: number;
  purchaseOnCash: number;
  expensesOnCash: number;
  onCashInClick?: () => void;
  onCashOutClick?: () => void;
  className?: string;
}

export const NetCashflowCard: React.FC<NetCashflowCardProps> = ({
  netCashflow,
  totalCashIn,
  paymentsReceived,
  salesOnCash,
  servicesReceived,
  totalCashOut,
  purchaseOnCash,
  expensesOnCash,
  onCashInClick,
  onCashOutClick,
  className,
}) => {
  const isPositive = netCashflow >= 0;

  return (
    <Card className={clsx('hs-net-cashflow-card', className)}>
      <StackLayout gap={1}>
        {/* Header */}
        <FlexLayout direction="row" align="center" justify="space-between">
          <FlexLayout direction="row" align="center" gap={1}>
            <div className="hs-net-cashflow-card__icon-wrapper">
              <Wallet size={18} />
            </div>
            <div>
              <Text styleAs="label" color="primary">
                <b>Net Cashflow</b>
              </Text>
              <Text styleAs="notation" color="secondary">
                Cash In − Cash Out
              </Text>
            </div>
          </FlexLayout>

          <Text styleAs="h2" color={isPositive ? 'success' : 'error'}>
            <b>{formatRupee(netCashflow)}</b>
          </Text>
        </FlexLayout>

        {/* 2 Sub-Cards: Cash In & Cash Out */}
        <GridLayout
          columns={2}
          gap={1}
          className="hs-net-cashflow-card__sub-cards"
        >
          {/* Cash In Details */}
          <GridItem>
            <div
              className="hs-cashflow-subcard hs-cashflow-subcard--in"
              onClick={onCashInClick}
              role={onCashInClick ? 'button' : undefined}
              tabIndex={onCashInClick ? 0 : undefined}
            >
              <div className="hs-cashflow-subcard__header">
                <Text styleAs="label" color="success">
                  <b>Cash In</b>
                </Text>
                <Text styleAs="h4" color="success">
                  <b>{formatRupee(totalCashIn)}</b>
                </Text>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Recvd:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(paymentsReceived)}</b>
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Cash Sales:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(salesOnCash)}</b>
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Service:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(servicesReceived)}</b>
                  </Text>
                </div>
              </div>
            </div>
          </GridItem>

          {/* Cash Out Details */}
          <GridItem>
            <div
              className="hs-cashflow-subcard hs-cashflow-subcard--out"
              onClick={onCashOutClick}
              role={onCashOutClick ? 'button' : undefined}
              tabIndex={onCashOutClick ? 0 : undefined}
            >
              <div className="hs-cashflow-subcard__header">
                <Text styleAs="label" color="warning">
                  <b>Cash Out</b>
                </Text>
                <Text styleAs="h4" color="warning">
                  <b>{formatRupee(totalCashOut)}</b>
                </Text>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Purchase:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(purchaseOnCash)}</b>
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text styleAs="notation" color="secondary">
                    Expense:
                  </Text>
                  <Text styleAs="notation">
                    <b>{formatRupee(expensesOnCash)}</b>
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

export default NetCashflowCard;
