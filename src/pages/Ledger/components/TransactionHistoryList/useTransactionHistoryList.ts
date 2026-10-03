import { useMemo, useState } from 'react';
import { CustomerTransactionData, isPaymentTransaction, isSaleTransaction, isServiceTransaction, isOpeningDueTransaction } from '../../../../models';

export type TxFilterType = 'ALL' | 'SALE' | 'SERVICE' | 'PAYMENT' | 'OPENING_DUE';

export interface UseTransactionHistoryListProps {
  transactions: CustomerTransactionData[];
}

export function useTransactionHistoryList({
  transactions,
}: UseTransactionHistoryListProps) {
  const [filterType, setFilterType] = useState<TxFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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
  const sortedTransactions = useMemo(() => {
    return [...uniqueTxs].sort((a, b) =>
      (b.date || '').localeCompare(a.date || ''),
    );
  }, [uniqueTxs]);

  // 3. Compute running balance chronologically to detect zero-due cleared milestones
  const clearedTxIds = useMemo(() => {
    const chronological = [...sortedTransactions].reverse();
    const cleared = new Set<string>();
    let runningDue = 0;

    chronological.forEach((tx) => {
      if (isPaymentTransaction(tx)) {
        runningDue -= (Number(tx.amount) || 0) + (Number(tx.discount) || 0);
      } else {
        const amt = Number(tx.amount) || 0;
        const cash = Number(tx.cashPaid) || 0;
        const rem =
          tx.remainingDue !== undefined ? Number(tx.remainingDue) : amt - cash;
        runningDue += rem;
      }

      if (runningDue <= 0 && tx.id) {
        cleared.add(tx.id);
        runningDue = 0;
      }
    });

    return cleared;
  }, [sortedTransactions]);

  // 4. Apply type filter and query filter
  const filteredTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return sortedTransactions.filter((tx) => {
      // Type matching
      if (filterType === 'SALE' && !isSaleTransaction(tx)) return false;
      if (filterType === 'SERVICE' && !isServiceTransaction(tx)) return false;
      if (filterType === 'PAYMENT' && !isPaymentTransaction(tx)) return false;
      if (filterType === 'OPENING_DUE' && !isOpeningDueTransaction(tx)) return false;

      // Query matching
      if (q) {
        const cat =
          'category' in tx && typeof tx.category === 'string'
            ? tx.category.toLowerCase()
            : '';
        const note = (tx.note || '').toLowerCase();
        const date = (tx.date || '').toLowerCase();
        const amt = String(tx.amount || '');
        const match =
          cat.includes(q) ||
          note.includes(q) ||
          date.includes(q) ||
          amt.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [sortedTransactions, filterType, searchQuery]);

  return {
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    sortedTransactions,
    filteredTransactions,
    clearedTxIds,
  };
}
