import React from 'react';
import { Badge } from '../../../../components/Badge';
import { Progress } from '../../../../components/Progress';
import { CustomerTransactionData } from '../../../../models';
import { parseTransactionDate } from '../../../../utils';
import { TransactionHistoryItem } from '../TransactionHistoryItem';
import './TransactionHistoryList.css';

export interface TransactionHistoryListProps {
  transactions: CustomerTransactionData[];
  isLoading?: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  isLoading,
}) => {
  // 1. Deduplicate by unique id
  const seenIds = new Set<string>();
  const uniqueTxs = transactions.filter((tx) => {
    if (tx.id) {
      if (seenIds.has(tx.id)) return false;
      seenIds.add(tx.id);
    }
    return true;
  });

  // 2. Sort descending by date (newest first)
  const sortedTransactions = [...uniqueTxs].sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
  });

  // 3. Compute running balance chronologically (oldest to newest) to detect zero balance milestones
  const chronological = [...sortedTransactions].reverse();
  const clearedTxIds = new Set<string>();
  let runningDue = 0;

  chronological.forEach((tx) => {
    if (tx.type === 'PAYMENT') {
      runningDue -= (Number(tx.amount) || 0) + (Number(tx.discount) || 0);
    } else {
      const amt = Number(tx.amount) || 0;
      const cash = Number(tx.cashPaid) || 0;
      const rem =
        tx.remainingDue !== undefined ? Number(tx.remainingDue) : amt - cash;
      runningDue += rem;
    }

    if (runningDue <= 0 && tx.id) {
      clearedTxIds.add(tx.id);
      runningDue = 0;
    }
  });

  return (
    <div className="hs-tx-history-list">
      <div className="hs-tx-history-list__header">
        <span className="hs-tx-history-list__title">
          Transaction Statement ({sortedTransactions.length})
        </span>
        <Badge sentiment="positive" appearance="subtle">
          Settled Highlighted
        </Badge>
      </div>

      {isLoading ? (
        <div className="hs-tx-history-list__empty">
          <Progress type="circular" indeterminate fourColor />
        </div>
      ) : sortedTransactions.length === 0 ? (
        <div className="hs-tx-history-list__empty">
          No transactions recorded for this customer.
        </div>
      ) : (
        <div className="hs-tx-history-list__items">
          {sortedTransactions.map((tx, index) => (
            <TransactionHistoryItem
              key={tx.id || `${tx.customerId || 'tx'}-${tx.date}-${index}`}
              transaction={tx}
              isCleared={Boolean(tx.id && clearedTxIds.has(tx.id))}
            />
          ))}
        </div>
      )}
    </div>
  );
};
