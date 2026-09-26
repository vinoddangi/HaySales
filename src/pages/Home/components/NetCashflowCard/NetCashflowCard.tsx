import clsx from 'clsx';
import { Wallet } from 'lucide-react';
import React from 'react';
import { Card } from '../../../../components/Card';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
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
    <Card variant="filled" className={clsx('hs-net-cashflow-card', className)}>
      <Card.Content>
        {/* Header */}
        <Flex align="center" justify="between" fullWidth>
          <Flex align="center" gap="sm">
            <div className="hs-net-cashflow-card__icon-wrapper">
              <Wallet className="hs-net-cashflow-card__icon" />
            </div>
            <div>
              <span className="hs-net-cashflow-card__tag">Net Cashflow</span>
              <span className="hs-net-cashflow-card__subtitle">
                Cash In − Cash Out
              </span>
            </div>
          </Flex>

          <div
            className={clsx(
              'hs-net-cashflow-card__amount',
              isPositive
                ? 'hs-net-cashflow-card__amount--positive'
                : 'hs-net-cashflow-card__amount--negative',
            )}
          >
            {formatRupee(netCashflow)}
          </div>
        </Flex>

        {/* 2 Sub-Cards: Cash In & Cash Out */}
        <Grid columns={2} gap="sm" className="hs-net-cashflow-card__sub-cards">
          {/* Cash In Details */}
          <Grid.Item>
            <div
              className="hs-cashflow-subcard hs-cashflow-subcard--in"
              onClick={onCashInClick}
              role={onCashInClick ? 'button' : undefined}
              tabIndex={onCashInClick ? 0 : undefined}
            >
              <div className="hs-cashflow-subcard__header">
                <span className="hs-cashflow-subcard__title hs-cashflow-subcard__title--emerald">
                  Cash In
                </span>
                <span className="hs-cashflow-subcard__val hs-cashflow-subcard__val--emerald">
                  {formatRupee(totalCashIn)}
                </span>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <span>Recvd:</span>
                  <span className="hs-cashflow-subcard__row-val">
                    {formatRupee(paymentsReceived)}
                  </span>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <span>Cash Sales:</span>
                  <span className="hs-cashflow-subcard__row-val">
                    {formatRupee(salesOnCash)}
                  </span>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <span>Service:</span>
                  <span className="hs-cashflow-subcard__row-val">
                    {formatRupee(servicesReceived)}
                  </span>
                </div>
              </div>
            </div>
          </Grid.Item>

          {/* Cash Out Details */}
          <Grid.Item>
            <div
              className="hs-cashflow-subcard hs-cashflow-subcard--out"
              onClick={onCashOutClick}
              role={onCashOutClick ? 'button' : undefined}
              tabIndex={onCashOutClick ? 0 : undefined}
            >
              <div className="hs-cashflow-subcard__header">
                <span className="hs-cashflow-subcard__title hs-cashflow-subcard__title--amber">
                  Cash Out
                </span>
                <span className="hs-cashflow-subcard__val hs-cashflow-subcard__val--amber">
                  {formatRupee(totalCashOut)}
                </span>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <span>Purchase:</span>
                  <span className="hs-cashflow-subcard__row-val">
                    {formatRupee(purchaseOnCash)}
                  </span>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <span>Expense:</span>
                  <span className="hs-cashflow-subcard__row-val">
                    {formatRupee(expensesOnCash)}
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

export default NetCashflowCard;
