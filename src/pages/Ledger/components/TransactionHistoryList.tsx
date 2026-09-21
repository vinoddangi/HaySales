import React from 'react';
import { Badge, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { Transaction } from '../../../types';
import { parseTransactionDate } from '../../../utils/formatters';
import { TransactionHistoryItem } from './TransactionHistoryItem';

export interface TransactionHistoryListProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  isLoading,
}) => {
  // 1. Deduplicate by unique transaction ID and by signature (type + date + amount + paymentAmount)
  const seenIds = new Set<string>();
  const seenSignatures = new Set<string>();
  const uniqueTransactions = transactions.filter((tx) => {
    if (tx.id) {
      if (seenIds.has(tx.id)) return false;
      seenIds.add(tx.id);
    }
    const sig = `${tx.type}_${tx.date || ''}_${tx.amount || 0}_${tx.paymentAmount || 0}_${tx.remainingDue || 0}_${tx.item || ''}_${tx.customerId || ''}`;
    if (seenSignatures.has(sig)) return false;
    seenSignatures.add(sig);
    return true;
  });

  // 2. Sort transactions strictly descending by date (Newest / Most Recent first)
  const sortedTransactions = [...uniqueTransactions].sort((a, b) => {
    const timeA = parseTransactionDate(a.date)?.getTime() || 0;
    const timeB = parseTransactionDate(b.date)?.getTime() || 0;
    return timeB - timeA;
  });

  // 2. Compute running balance chronologically (from oldest to newest) to detect which transactions hit 0 balance
  const chronological = [...sortedTransactions].reverse();
  const clearedTxIds = new Set<string>();
  let runningDue = 0;

  chronological.forEach((tx) => {
    if (tx.type === 'PAYMENT') {
      const pAmt = Number(tx.paymentAmount) || Number(tx.amount) || 0;
      runningDue -= pAmt;
    } else {
      const credit =
        tx.remainingDue !== undefined
          ? Number(tx.remainingDue) || 0
          : (Number(tx.amount) || 0) - (Number(tx.cashPaid) || 0);
      runningDue += credit;
    }

    if (runningDue <= 0 && tx.id) {
      clearedTxIds.add(tx.id);
      runningDue = 0; // prevent negative skew
    }
  });

  return (
    <div className="flex flex-1 flex-col space-y-3 overflow-hidden pt-1">
      <Flex align="center" justify="between" fullWidth>
        <Text styleAs="label" appearance="secondary" uppercase>
          Transaction History ({sortedTransactions.length})
        </Text>
        <Badge sentiment="positive" size="sm">
          Settled Milestones Highlighted
        </Badge>
      </Flex>

      {isLoading ? (
        <Text
          styleAs="body-sm"
          appearance="secondary"
          align="center"
          className="block py-6"
        >
          Loading history...
        </Text>
      ) : sortedTransactions.length === 0 ? (
        <Text
          styleAs="body-sm"
          appearance="secondary"
          align="center"
          className="block py-6"
        >
          No transactions found.
        </Text>
      ) : (
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {sortedTransactions.map((tx) => (
            <TransactionHistoryItem
              key={tx.id || Math.random().toString()}
              transaction={tx}
              isCleared={tx.id ? clearedTxIds.has(tx.id) : false}
            />
          ))}
        </div>
      )}
    </div>
  );
};
