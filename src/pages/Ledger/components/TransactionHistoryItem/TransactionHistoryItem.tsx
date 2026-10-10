import React from 'react';
import { FlexLayout, Pill, Text } from '@salt-ds/core';
import { clsx } from 'clsx';
import { CheckCircle2 } from 'lucide-react';
import {
  CustomerTransactionData,
  getRate,
  isOpeningDueTransaction,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
} from '../../../../models';
import {
  formatDate,
  formatRupee,
  formatWeight,
} from '../../../../utils/formatters';
import './TransactionHistoryItem.css';

export interface TransactionHistoryItemProps {
  transaction: CustomerTransactionData;
  isCleared: boolean;
}

export const TransactionHistoryItem: React.FC<TransactionHistoryItemProps> = ({
  transaction: tx,
  isCleared,
}) => {
  const isPayment = isPaymentTransaction(tx);
  const isService = isServiceTransaction(tx);
  const isSale = isSaleTransaction(tx);
  const isOpeningDue = isOpeningDueTransaction(tx);

  const isFullCashSale = isSale && tx.remainingDue === 0 && tx.cashPaid > 0;
  const isPartialCash = isSale && tx.cashPaid > 0 && tx.remainingDue > 0;

  const title = isPayment
    ? 'Payment Received'
    : isService
      ? `Service: ${tx.category}`
      : isOpeningDue
        ? 'Opening Due'
        : isFullCashSale
          ? `Cash Sale: ${tx.category}`
          : isSale
            ? `Sale: ${tx.category}`
            : 'Transaction';

  const formattedDate = formatDate(tx.date);
  const derivedRate = getRate(tx);

  const subtitle =
    isSale && tx.weight > 0
      ? `${formatWeight(tx.weight)} @ ${derivedRate ? `${formatRupee(derivedRate)}/kg` : ''} • ${formattedDate}`
      : formattedDate;

  return (
    <div
      className={clsx(
        'hs-tx-history-item',
        isCleared && 'hs-tx-history-item--cleared',
        !isCleared && isPayment && 'hs-tx-history-item--payment',
        !isCleared && isService && 'hs-tx-history-item--service',
        !isCleared && isOpeningDue && 'hs-tx-history-item--opening-due',
      )}
    >
      {/* 1. Left Details */}
      <div className="hs-tx-history-item__left">
        <div className="hs-tx-history-item__title-row">
          <Text>
            <b>{title}</b>
          </Text>

          {isOpeningDue && <Pill>Opening Due</Pill>}
          {isPayment && <Pill>Cash In</Pill>}
          {isService && <Pill>Service</Pill>}
          {isFullCashSale && <Pill>100% Cash</Pill>}
          {isPartialCash && <Pill>Part-Cash</Pill>}
          {isSale && !isFullCashSale && !isPartialCash && (
            <Pill>Credit Invoice</Pill>
          )}

          {isCleared && (
            <Pill>
              <FlexLayout align="center" gap={0.5}>
                <CheckCircle2 size={12} />
                <span>0 DUE</span>
              </FlexLayout>
            </Pill>
          )}
        </div>

        <Text styleAs="notation" color="secondary">
          {subtitle}
        </Text>
      </div>

      {/* 2. Right Amounts */}
      <div className="hs-tx-history-item__right">
        {isOpeningDue ? (
          <>
            <Text color="error">
              <b>{formatRupee(tx.amount)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Opening Balance
            </Text>
          </>
        ) : isPayment ? (
          <>
            <Text color="success">
              <b>-{formatRupee(tx.amount)}</b>
            </Text>
            {tx.discount && tx.discount > 0 && (
              <Text styleAs="notation" color="secondary">
                Disc: {formatRupee(tx.discount)}
              </Text>
            )}
          </>
        ) : isFullCashSale ? (
          <>
            <Text color="success">
              <b>{formatRupee(tx.amount)}</b>
            </Text>
            <Text styleAs="notation" color="secondary">
              Paid in Full
            </Text>
          </>
        ) : (
          <>
            <Text color="error">
              <b>{formatRupee(tx.amount)}</b>
            </Text>
            {tx.cashPaid > 0 && (
              <Text styleAs="notation" color="secondary">
                Cash: {formatRupee(tx.cashPaid)}
              </Text>
            )}
            {tx.remainingDue > 0 && (
              <Text styleAs="notation" color="secondary">
                Due: {formatRupee(tx.remainingDue)}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionHistoryItem;
