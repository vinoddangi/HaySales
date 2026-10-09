import clsx from 'clsx';
import React from 'react';
import { Card } from '../../../../components/Card';
import { IconWallet } from '../../../../components/Icon';
import { Flex } from '../../../../components/layouts/Flex';
import { Grid } from '../../../../components/layouts/Grid';
import { Text } from '../../../../components/Text';
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
              <IconWallet size={18} />
            </div>
            <div>
              <Text
                as="div"
                variant="label-sm"
                uppercase
                weight="bold"
                sentiment="accent"
              >
                Net Cashflow
              </Text>
              <Text variant="body-sm" appearance="secondary">
                Cash In − Cash Out
              </Text>
            </div>
          </Flex>

          <Text
            as="div"
            variant="headline-sm"
            weight="bold"
            sentiment={isPositive ? 'positive' : 'negative'}
          >
            {formatRupee(netCashflow)}
          </Text>
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
                <Text
                  variant="caption"
                  uppercase
                  weight="bold"
                  sentiment="positive"
                >
                  Cash In
                </Text>
                <Text variant="label-md" weight="bold" sentiment="positive">
                  {formatRupee(totalCashIn)}
                </Text>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Recvd:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(paymentsReceived)}
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Cash Sales:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(salesOnCash)}
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Service:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(servicesReceived)}
                  </Text>
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
                <Text
                  variant="caption"
                  uppercase
                  weight="bold"
                  sentiment="warning"
                >
                  Cash Out
                </Text>
                <Text variant="label-md" weight="bold" sentiment="warning">
                  {formatRupee(totalCashOut)}
                </Text>
              </div>
              <div className="hs-cashflow-subcard__rows">
                <div className="hs-cashflow-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Purchase:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(purchaseOnCash)}
                  </Text>
                </div>
                <div className="hs-cashflow-subcard__row">
                  <Text variant="caption" appearance="secondary">
                    Expense:
                  </Text>
                  <Text variant="caption" weight="medium">
                    {formatRupee(expensesOnCash)}
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

export default NetCashflowCard;
