import React from 'react';
import { Badge } from '../../../../components/Badge';
import { IconCheckCircle2 } from '../../../../components/Icon';
import { Text } from '../../../../components/Text';
import {
  CustomerTransactionData,
  getRate,
  isOpeningDueTransaction,
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
      className={cn(
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
          <Text variant="body-md" weight="bold" as="span">
            {title}
          </Text>

          {isOpeningDue && (
            <Badge sentiment="warning" appearance="subtle">
              Opening Due
            </Badge>
          )}
          {isPayment && (
            <Badge sentiment="positive" appearance="subtle">
              Cash In
            </Badge>
          )}
          {isService && (
            <Badge sentiment="neutral" appearance="subtle">
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
              <IconCheckCircle2
                size="xs"
                className="hs-tx-history-item__badge-icon"
              />
              0 DUE
            </Badge>
          )}
        </div>

        <Text variant="body-sm" appearance="secondary" as="span">
          {subtitle}
        </Text>
      </div>

      {/* 2. Right Amounts */}
      <div className="hs-tx-history-item__right">
        {isOpeningDue ? (
          <>
            <Text
              variant="label-lg"
              weight="bold"
              sentiment="negative"
              as="span"
            >
              {formatRupee(tx.amount)}
            </Text>
            <Text variant="body-sm" appearance="secondary" as="span">
              Opening Balance
            </Text>
          </>
        ) : isPayment ? (
          <>
            <Text
              variant="label-lg"
              weight="bold"
              sentiment="positive"
              as="span"
            >
              -{formatRupee(tx.amount)}
            </Text>
            {tx.discount && tx.discount > 0 && (
              <Text variant="body-sm" appearance="secondary" as="span">
                Disc: {formatRupee(tx.discount)}
              </Text>
            )}
          </>
        ) : isFullCashSale ? (
          <>
            <Text
              variant="label-lg"
              weight="bold"
              sentiment="positive"
              as="span"
            >
              {formatRupee(tx.amount)}
            </Text>
            <Text variant="body-sm" appearance="secondary" as="span">
              Paid in Full
            </Text>
          </>
        ) : (
          <>
            <Text
              variant="label-lg"
              weight="bold"
              sentiment="negative"
              as="span"
            >
              {formatRupee(tx.amount)}
            </Text>
            {tx.cashPaid > 0 && (
              <Text variant="body-sm" appearance="secondary" as="span">
                Cash: {formatRupee(tx.cashPaid)}
              </Text>
            )}
            {tx.remainingDue > 0 && (
              <Text variant="body-sm" appearance="secondary" as="span">
                Due: {formatRupee(tx.remainingDue)}
              </Text>
            )}
          </>
        )}
      </div>
    </div>
  );
};
