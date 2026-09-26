import { CheckCircle2 } from 'lucide-react';
import React from 'react';
import { Badge } from '../../../../components/Badge';
import {
  CustomerTransactionData,
  getRate,
  isPaymentTransaction,
  isSaleTransaction,
  isServiceTransaction,
} from '../../../../models';
import { cn } from '../../../../utils/cn';
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

  const isFullCashSale = isSale && tx.remainingDue === 0 && tx.cashPaid > 0;
  const isPartialCash = isSale && tx.cashPaid > 0 && tx.remainingDue > 0;

  const title = isPayment
    ? 'Payment Received'
    : isService
      ? `Service: ${tx.category}`
      : isFullCashSale
        ? `Cash Sale: ${tx.category}`
        : `Sale: ${tx.category}`;

  const formattedDate = formatDate(tx.date);
  const derivedRate = getRate(tx);

  const subtitle =
    isSale && tx.weight > 0
      ? `${formatWeight(tx.weight)} @ ${derivedRate ? `${formatRupee(derivedRate)}/kg` : ''} • ${formattedDate}`
      : formattedDate;

  return (
    <div
      className={cn(
        'hs-tx-history-item',
        isCleared && 'hs-tx-history-item--cleared',
        !isCleared && isPayment && 'hs-tx-history-item--payment',
        !isCleared && isService && 'hs-tx-history-item--service',
      )}
    >
      {/* 1. Left Details */}
      <div className="hs-tx-history-item__left">
        <div className="hs-tx-history-item__title-row">
          <span className="hs-tx-history-item__title">{title}</span>

          {isPayment && (
            <Badge sentiment="positive" appearance="subtle">
              Cash In
            </Badge>
          )}
          {isService && (
            <Badge sentiment="service" appearance="subtle">
              Service
            </Badge>
          )}
          {isFullCashSale && (
            <Badge sentiment="positive" appearance="subtle">
              100% Cash
            </Badge>
          )}
          {isPartialCash && (
            <Badge sentiment="warning" appearance="subtle">
              Part-Cash
            </Badge>
          )}
          {isSale && !isFullCashSale && !isPartialCash && (
            <Badge sentiment="neutral" appearance="subtle">
              Credit Invoice
            </Badge>
          )}

          {isCleared && (
            <Badge sentiment="positive" appearance="solid">
              <CheckCircle2 className="mr-0.5 h-3 w-3" />0 DUE
            </Badge>
          )}
        </div>

        <span className="hs-tx-history-item__subtitle">{subtitle}</span>
      </div>

      {/* 2. Right Amounts */}
      <div className="hs-tx-history-item__right">
        {isPayment ? (
          <>
            <span className="hs-tx-history-item__amount hs-tx-history-item__amount--green">
              -{formatRupee(tx.amount)}
            </span>
            {tx.discount && tx.discount > 0 && (
              <span className="hs-tx-history-item__meta">
                Disc: {formatRupee(tx.discount)}
              </span>
            )}
          </>
        ) : isFullCashSale ? (
          <>
            <span className="hs-tx-history-item__amount hs-tx-history-item__amount--green">
              {formatRupee(tx.amount)}
            </span>
            <span className="hs-tx-history-item__meta">Paid in Full</span>
          </>
        ) : (
          <>
            <span className="hs-tx-history-item__amount hs-tx-history-item__amount--red">
              {formatRupee(tx.amount)}
            </span>
            {tx.cashPaid > 0 && (
              <span className="hs-tx-history-item__meta">
                Cash: {formatRupee(tx.cashPaid)}
              </span>
            )}
            {tx.remainingDue > 0 && (
              <span className="hs-tx-history-item__meta">
                Due: {formatRupee(tx.remainingDue)}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};
